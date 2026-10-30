import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { getAvailableSlots } from '../services/bookingSlotService.js';

// ==========================================
// Authenticated Booking Operations
// ==========================================

export const listBookings = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    if (!tenantId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
      return;
    }

    const {
      hostUserId,
      projectId,
      contactId,
      accountId,
      dealId,
      status,
      startDate,
      endDate,
    } = req.query;

    const whereClause: any = { tenantId };

    if (hostUserId) whereClause.hostUserId = String(hostUserId);
    if (projectId) whereClause.projectId = String(projectId);
    if (contactId) whereClause.contactId = String(contactId);
    if (accountId) whereClause.accountId = String(accountId);
    if (dealId) whereClause.dealId = String(dealId);
    if (status && status !== 'all') whereClause.status = String(status);

    if (startDate || endDate) {
      whereClause.startTime = {};
      if (startDate) whereClause.startTime.gte = new Date(String(startDate));
      if (endDate) whereClause.startTime.lte = new Date(String(endDate));
    }

    const bookings = await prisma.booking.findMany({
      where: whereClause,
      include: {
        bookingType: true,
        hostUser: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
        project: {
          select: { id: true, title: true, code: true },
        },
        contact: {
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        },
        account: {
          select: { id: true, accountName: true, domain: true },
        },
        deal: {
          select: { id: true, dealName: true, amount: true },
        },
      },
      orderBy: { startTime: 'asc' },
    });

    res.json(bookings);
  } catch (err: any) {
    console.error('[Booking Controller] listBookings error:', err);
    res.status(500).json({
      error: 'Failed to retrieve bookings',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const getBookingById = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const { id } = req.params;

    const booking = await prisma.booking.findFirst({
      where: { id, tenantId },
      include: {
        bookingType: true,
        hostUser: {
          select: { id: true, displayName: true, email: true, photoURL: true },
        },
        project: true,
        contact: true,
        account: true,
        deal: true,
      },
    });

    if (!booking) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    res.json(booking);
  } catch (err: any) {
    console.error('[Booking Controller] getBookingById error:', err);
    res.status(500).json({
      error: 'Failed to retrieve booking',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const createBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const currentUserId = (req.user || req.tenantContext)?.userId;
    if (!tenantId || !currentUserId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
      return;
    }

    const {
      title,
      description,
      startTime,
      endTime,
      durationMinutes,
      locationType = 'google_meet',
      locationUrl,
      guestName,
      guestEmail,
      guestPhone,
      guestNotes,
      bookingTypeId,
      projectId,
      contactId: explicitContactId,
      accountId: explicitAccountId,
      dealId,
      hostUserId = currentUserId,
      status = 'scheduled',
    } = req.body;

    if (!title || !startTime || !endTime || !guestName || !guestEmail) {
      res.status(400).json({
        error: 'Missing required fields: title, startTime, endTime, guestName, guestEmail',
      });
      return;
    }

    // Smart Match: Check if Contact / Account already exists by guestEmail if not explicitly passed
    let resolvedContactId = explicitContactId || null;
    let resolvedAccountId = explicitAccountId || null;

    if (!resolvedContactId && guestEmail) {
      const matchedContact = await prisma.contact.findFirst({
        where: {
          tenantId,
          email: { equals: guestEmail.trim(), mode: 'insensitive' },
        },
      });

      if (matchedContact) {
        resolvedContactId = matchedContact.id;
        resolvedAccountId = matchedContact.accountId;
      }
    }

    // Check project association if passed
    if (projectId) {
      const project = await prisma.project.findFirst({
        where: { id: projectId, tenantId },
      });
      if (project && !resolvedAccountId && project.accountId) {
        resolvedAccountId = project.accountId;
      }
    }

    const duration = durationMinutes || Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (60 * 1000));

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        hostUserId,
        bookingTypeId: bookingTypeId || null,
        title,
        description,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes: duration,
        locationType,
        locationUrl,
        guestName,
        guestEmail: guestEmail.trim(),
        guestPhone,
        guestNotes,
        projectId: projectId || null,
        contactId: resolvedContactId,
        accountId: resolvedAccountId,
        dealId: dealId || null,
        status,
      },
      include: {
        bookingType: true,
        hostUser: { select: { id: true, displayName: true, email: true } },
        project: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
        account: { select: { id: true, accountName: true } },
      },
    });

    // Activity Log
    try {
      if (projectId) {
        await prisma.entityActivityLog.create({
          data: {
            tenantId,
            moduleName: 'projects',
            entityId: projectId,
            action: 'meeting_scheduled',
            description: `Scheduled meeting "${title}" with ${guestName} (${guestEmail})`,
            userId: currentUserId,
            fieldChanges: { bookingId: booking.id, startTime, endTime },
          },
        });
      }
      if (resolvedContactId) {
        await prisma.entityActivityLog.create({
          data: {
            tenantId,
            moduleName: 'contacts',
            entityId: resolvedContactId,
            action: 'meeting_scheduled',
            description: `Scheduled meeting "${title}" with host`,
            userId: currentUserId,
            fieldChanges: { bookingId: booking.id, startTime, endTime },
          },
        });
      }
    } catch (logErr) {
      console.warn('[Booking Controller] Non-blocking activity log warning:', logErr);
    }

    res.status(201).json(booking);
  } catch (err: any) {
    console.error('[Booking Controller] createBooking error:', err);
    res.status(500).json({
      error: 'Failed to create booking',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const updateBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const currentUserId = (req.user || req.tenantContext)?.userId;
    const { id } = req.params;

    const existing = await prisma.booking.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    const {
      status,
      startTime,
      endTime,
      durationMinutes,
      cancellationReason,
      locationType,
      locationUrl,
      description,
      title,
      projectId,
      contactId,
      accountId,
    } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status;
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (locationType) updateData.locationType = locationType;
    if (locationUrl !== undefined) updateData.locationUrl = locationUrl;
    if (cancellationReason !== undefined) updateData.cancellationReason = cancellationReason;
    if (projectId !== undefined) updateData.projectId = projectId || null;
    if (contactId !== undefined) updateData.contactId = contactId || null;
    if (accountId !== undefined) updateData.accountId = accountId || null;

    if (startTime) updateData.startTime = new Date(startTime);
    if (endTime) updateData.endTime = new Date(endTime);
    if (durationMinutes) updateData.durationMinutes = durationMinutes;

    const updated = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: {
        bookingType: true,
        hostUser: { select: { id: true, displayName: true, email: true } },
        project: { select: { id: true, title: true } },
        contact: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });

    // Log Activity for status change
    if (status && status !== existing.status && currentUserId) {
      try {
        const targetEntity = existing.projectId ? { mod: 'projects', id: existing.projectId } : existing.contactId ? { mod: 'contacts', id: existing.contactId } : null;
        if (targetEntity) {
          await prisma.entityActivityLog.create({
            data: {
              tenantId: existing.tenantId,
              moduleName: targetEntity.mod,
              entityId: targetEntity.id,
              action: `meeting_${status}`,
              description: `Meeting "${existing.title}" marked as ${status}${cancellationReason ? ` (Reason: ${cancellationReason})` : ''}`,
              userId: currentUserId,
              fieldChanges: { bookingId: id, previousStatus: existing.status, newStatus: status },
            },
          });
        }
      } catch (logErr) {
        console.warn('[Booking Controller] Status log warning:', logErr);
      }
    }

    res.json(updated);
  } catch (err: any) {
    console.error('[Booking Controller] updateBooking error:', err);
    res.status(500).json({
      error: 'Failed to update booking',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const deleteBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const { id } = req.params;

    const existing = await prisma.booking.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Booking not found' });
      return;
    }

    await prisma.booking.delete({ where: { id } });
    res.json({ success: true, message: 'Booking deleted successfully' });
  } catch (err: any) {
    console.error('[Booking Controller] deleteBooking error:', err);
    res.status(500).json({
      error: 'Failed to delete booking',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

// ==========================================
// Booking Types Management
// ==========================================

export const listBookingTypes = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const userId = req.query.userId ? String(req.query.userId) : (req.user || req.tenantContext)?.userId;

    const bookingTypes = await prisma.bookingType.findMany({
      where: {
        tenantId,
        ...(userId ? { userId } : {}),
      },
      include: {
        user: { select: { id: true, displayName: true, email: true } },
        _count: { select: { bookings: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(bookingTypes);
  } catch (err: any) {
    console.error('[Booking Controller] listBookingTypes error:', err);
    res.status(500).json({
      error: 'Failed to list booking types',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const createBookingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const userId = (req.user || req.tenantContext)?.userId;
    if (!tenantId || !userId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
      return;
    }

    const {
      title,
      slug,
      description,
      durationMinutes = 30,
      locationType = 'google_meet',
      locationUrl,
      bufferBeforeMin = 0,
      bufferAfterMin = 10,
      color = '#6366f1',
      isActive = true,
      customQuestions,
    } = req.body;

    if (!title) {
      res.status(400).json({ error: 'Title is required' });
      return;
    }

    const safeSlug = (slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || `type-${Date.now()}`;

    const created = await prisma.bookingType.create({
      data: {
        tenantId,
        userId,
        title,
        slug: safeSlug,
        description,
        durationMinutes: Number(durationMinutes),
        locationType,
        locationUrl,
        bufferBeforeMin: Number(bufferBeforeMin),
        bufferAfterMin: Number(bufferAfterMin),
        color,
        isActive,
        customQuestions,
      },
    });

    res.status(201).json(created);
  } catch (err: any) {
    console.error('[Booking Controller] createBookingType error:', err);
    res.status(500).json({
      error: 'Failed to create booking type',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const updateBookingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const { id } = req.params;

    const existing = await prisma.bookingType.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Booking type not found' });
      return;
    }

    const {
      title,
      slug,
      description,
      durationMinutes,
      locationType,
      locationUrl,
      bufferBeforeMin,
      bufferAfterMin,
      color,
      isActive,
      customQuestions,
    } = req.body;

    const updated = await prisma.bookingType.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(slug !== undefined && { slug }),
        ...(description !== undefined && { description }),
        ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
        ...(locationType !== undefined && { locationType }),
        ...(locationUrl !== undefined && { locationUrl }),
        ...(bufferBeforeMin !== undefined && { bufferBeforeMin: Number(bufferBeforeMin) }),
        ...(bufferAfterMin !== undefined && { bufferAfterMin: Number(bufferAfterMin) }),
        ...(color !== undefined && { color }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(customQuestions !== undefined && { customQuestions }),
      },
    });

    res.json(updated);
  } catch (err: any) {
    console.error('[Booking Controller] updateBookingType error:', err);
    res.status(500).json({
      error: 'Failed to update booking type',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const deleteBookingType = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const { id } = req.params;

    const existing = await prisma.bookingType.findFirst({
      where: { id, tenantId },
    });

    if (!existing) {
      res.status(404).json({ error: 'Booking type not found' });
      return;
    }

    await prisma.bookingType.delete({ where: { id } });
    res.json({ success: true });
  } catch (err: any) {
    console.error('[Booking Controller] deleteBookingType error:', err);
    res.status(500).json({
      error: 'Failed to delete booking type',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

// ==========================================
// Host Availability Settings
// ==========================================

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const targetUserId = req.query.userId ? String(req.query.userId) : (req.user || req.tenantContext)?.userId;

    if (!targetUserId || !tenantId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    let avail = await prisma.userAvailability.findUnique({
      where: { userId: targetUserId },
    });

    if (!avail) {
      // Default availability
      avail = {
        id: 'default',
        tenantId,
        userId: targetUserId,
        timeZone: 'UTC',
        weeklySchedule: {
          monday: [{ start: '09:00', end: '17:00' }],
          tuesday: [{ start: '09:00', end: '17:00' }],
          wednesday: [{ start: '09:00', end: '17:00' }],
          thursday: [{ start: '09:00', end: '17:00' }],
          friday: [{ start: '09:00', end: '17:00' }],
          saturday: [],
          sunday: [],
        },
        slotStepMin: 30,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    res.json(avail);
  } catch (err: any) {
    console.error('[Booking Controller] getAvailability error:', err);
    res.status(500).json({
      error: 'Failed to retrieve availability',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantId = (req.user || req.tenantContext)?.tenantId;
    const userId = (req.user || req.tenantContext)?.userId;
    if (!tenantId || !userId) {
      res.status(401).json({ error: 'Unauthorized: Missing tenant context' });
      return;
    }

    const { timeZone = 'UTC', weeklySchedule, slotStepMin = 30 } = req.body;

    const upserted = await prisma.userAvailability.upsert({
      where: { userId },
      create: {
        tenantId,
        userId,
        timeZone,
        weeklySchedule,
        slotStepMin: Number(slotStepMin),
      },
      update: {
        timeZone,
        weeklySchedule,
        slotStepMin: Number(slotStepMin),
      },
    });

    res.json(upserted);
  } catch (err: any) {
    console.error('[Booking Controller] updateAvailability error:', err);
    res.status(500).json({
      error: 'Failed to update availability',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

// ==========================================
// Public Client-Facing Booking Endpoints
// ==========================================

export const getPublicBookingTypeMeta = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostId, slug } = req.params;

    const host = await prisma.user.findUnique({
      where: { id: hostId },
      select: {
        id: true,
        displayName: true,
        email: true,
        photoURL: true,
        tenantId: true,
      },
    });

    if (!host) {
      res.status(404).json({ error: 'Host user not found' });
      return;
    }

    const bookingType = await prisma.bookingType.findFirst({
      where: {
        userId: hostId,
        slug,
        isActive: true,
      },
    });

    if (!bookingType) {
      res.status(404).json({ error: 'Booking type not found or inactive' });
      return;
    }

    res.json({
      host: {
        id: host.id,
        displayName: host.displayName,
        photoURL: host.photoURL,
      },
      bookingType,
    });
  } catch (err: any) {
    console.error('[Booking Controller] getPublicBookingTypeMeta error:', err);
    res.status(500).json({
      error: 'Failed to retrieve booking type metadata',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const getPublicSlots = async (req: Request, res: Response): Promise<void> => {
  try {
    const { hostUserId, date, bookingTypeId } = req.query;

    if (!hostUserId || !date) {
      res.status(400).json({ error: 'hostUserId and date (YYYY-MM-DD) are required' });
      return;
    }

    const host = await prisma.user.findUnique({
      where: { id: String(hostUserId) },
      select: { tenantId: true },
    });

    if (!host) {
      res.status(404).json({ error: 'Host not found' });
      return;
    }

    const slots = await getAvailableSlots({
      tenantId: host.tenantId,
      hostUserId: String(hostUserId),
      targetDate: String(date),
      bookingTypeId: bookingTypeId ? String(bookingTypeId) : undefined,
    });

    res.json(slots);
  } catch (err: any) {
    console.error('[Booking Controller] getPublicSlots error:', err);
    res.status(500).json({
      error: 'Failed to compute slots',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};

export const createPublicBooking = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      hostUserId,
      bookingTypeId,
      startTime,
      endTime,
      guestName,
      guestEmail,
      guestPhone,
      guestNotes,
      customAnswers,
    } = req.body;

    if (!hostUserId || !startTime || !endTime || !guestName || !guestEmail) {
      res.status(400).json({
        error: 'Missing required booking details: hostUserId, startTime, endTime, guestName, guestEmail',
      });
      return;
    }

    const host = await prisma.user.findUnique({
      where: { id: hostUserId },
      select: { id: true, tenantId: true, displayName: true, email: true },
    });

    if (!host) {
      res.status(404).json({ error: 'Host user not found' });
      return;
    }

    const tenantId = host.tenantId;

    let title = `Meeting with ${guestName}`;
    let locationType = 'google_meet';
    let locationUrl: string | null = null;
    let durationMinutes = Math.round((new Date(endTime).getTime() - new Date(startTime).getTime()) / (60 * 1000));

    if (bookingTypeId) {
      const bType = await prisma.bookingType.findUnique({
        where: { id: bookingTypeId },
      });
      if (bType) {
        title = `${bType.title} with ${guestName}`;
        locationType = bType.locationType;
        locationUrl = bType.locationUrl;
        durationMinutes = bType.durationMinutes;
      }
    }

    // Smart Match against CRM: Match Contact by email
    let matchedContactId: string | null = null;
    let matchedAccountId: string | null = null;

    const matchedContact = await prisma.contact.findFirst({
      where: {
        tenantId,
        email: { equals: guestEmail.trim(), mode: 'insensitive' },
      },
    });

    if (matchedContact) {
      matchedContactId = matchedContact.id;
      matchedAccountId = matchedContact.accountId;
    }

    const booking = await prisma.booking.create({
      data: {
        tenantId,
        hostUserId,
        bookingTypeId: bookingTypeId || null,
        title,
        description: guestNotes || null,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        durationMinutes,
        locationType,
        locationUrl,
        guestName,
        guestEmail: guestEmail.trim(),
        guestPhone,
        guestNotes,
        customAnswers,
        contactId: matchedContactId,
        accountId: matchedAccountId,
        status: 'scheduled',
      },
      include: {
        hostUser: { select: { displayName: true, email: true } },
        bookingType: true,
      },
    });

    // Log Activity to CRM Contact if matched
    if (matchedContactId) {
      try {
        await prisma.entityActivityLog.create({
          data: {
            tenantId,
            moduleName: 'contacts',
            entityId: matchedContactId,
            action: 'client_booking_scheduled',
            description: `Client booked "${title}" via public booking link for ${new Date(startTime).toLocaleString()}`,
            userId: hostUserId,
            fieldChanges: { bookingId: booking.id, startTime, endTime },
          },
        });
      } catch (logErr) {
        console.warn('[Public Booking] Activity log warning:', logErr);
      }
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully',
      booking,
    });
  } catch (err: any) {
    console.error('[Booking Controller] createPublicBooking error:', err);
    res.status(500).json({
      error: 'Failed to schedule booking',
      ...(process.env.NODE_ENV === 'development' ? { details: err.message } : {}),
    });
  }
};
