import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { updateDealWithEvents } from '../services/dealService.js';

// ============================================================================
// 1. LEADS CRUD & CONVERSION
// ============================================================================

export async function getLeads(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const leads = await prisma.lead.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: { select: { id: true, displayName: true, email: true } },
      },
    });
    res.json(leads);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch leads.', details: err.message });
  }
}

export async function getLeadById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
      include: {
        assignedUser: { select: { id: true, displayName: true, email: true } },
        createdBy: { select: { id: true, displayName: true, email: true } },
      },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    res.json(lead);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch lead.', details: err.message });
  }
}

export async function createLead(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const leadCount = await prisma.lead.count({ where: { tenantId } });
    const leadNumber = `LEA-${String(leadCount + 1001).padStart(5, '0')}`;

    const lead = await prisma.lead.create({
      data: {
        tenantId,
        leadNumber,
        salutation: data.salutation,
        firstName: data.firstName || '',
        lastName: data.lastName || 'Unknown',
        company: data.company || 'Individual',
        title: data.title,
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        phone: data.phone,
        mobile: data.mobile,
        website: data.website,
        leadSource: data.leadSource || 'web_site',
        leadStatus: data.leadStatus || 'unqualified',
        rating: data.rating || 'warm',
        industry: data.industry,
        annualRevenue: data.annualRevenue ? Number(data.annualRevenue) : null,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        description: data.description,
        assignedUserId: data.assignedUserId || userId,
        createdById: userId,
        customFields: data.customFields || {},
      },
    });

    res.status(201).json(lead);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create lead.', details: err.message });
  }
}

export async function updateLead(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    const updated = await prisma.lead.update({
      where: { id },
      data: {
        salutation: data.salutation,
        firstName: data.firstName,
        lastName: data.lastName,
        company: data.company,
        title: data.title,
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        phone: data.phone,
        mobile: data.mobile,
        website: data.website,
        leadSource: data.leadSource,
        leadStatus: data.leadStatus,
        rating: data.rating,
        industry: data.industry,
        annualRevenue: data.annualRevenue !== undefined ? Number(data.annualRevenue) : undefined,
        street: data.street,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        country: data.country,
        description: data.description,
        assignedUserId: data.assignedUserId,
        customFields: data.customFields,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update lead.', details: err.message });
  }
}

export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.lead.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    await prisma.lead.delete({ where: { id } });
    res.json({ message: 'Lead deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete lead.', details: err.message });
  }
}

/**
 * POST /api/crm/leads/:id/convert
 * Relational database transaction replacing Firebase convertLead Cloud Function.
 */
export async function convertLead(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { id } = req.params;
    const options = req.body || {};

    const lead = await prisma.lead.findFirst({
      where: { id, tenantId },
    });

    if (!lead) {
      res.status(404).json({ error: 'Lead not found.' });
      return;
    }

    if (lead.isConverted) {
      res.status(400).json({
        error: 'Lead has already been converted.',
        convertedAccountId: lead.convertedAccountId,
        convertedContactId: lead.convertedContactId,
        convertedDealId: lead.convertedDealId,
      });
      return;
    }

    // Execute atomic conversion transaction
    const conversionResult = await prisma.$transaction(async (tx) => {
      // 1. Account Creation / Lookup
      let accountId = options.existingAccountId;
      if (!accountId && options.createAccount !== false) {
        const accCount = await tx.account.count({ where: { tenantId } });
        const accountNumber = `ACC-${String(accCount + 1001).padStart(5, '0')}`;

        const account = await tx.account.create({
          data: {
            tenantId,
            accountNumber,
            accountName: options.accountName || lead.company || `${lead.firstName} ${lead.lastName}`,
            domain: lead.website || null,
            primaryPhone: lead.phone || null,
            email: lead.email || null,
            website: lead.website || null,
            industry: options.industry || lead.industry || 'Other',
            accountType: 'customer',
            rating: lead.rating || 'warm',
            annualRevenue: lead.annualRevenue || null,
            billingStreet: lead.street || null,
            billingCity: lead.city || null,
            billingState: lead.state || null,
            billingPostalCode: lead.postalCode || null,
            billingCountry: lead.country || null,
            description: lead.description || null,
            assignedUserId: lead.assignedUserId || userId,
            createdById: userId,
          },
        });
        accountId = account.id;
      }

      // 2. Contact Creation / Lookup
      let contactId = options.existingContactId;
      if (!contactId && options.createContact !== false) {
        const conCount = await tx.contact.count({ where: { tenantId } });
        const contactNumber = `CON-${String(conCount + 1001).padStart(5, '0')}`;

        const contact = await tx.contact.create({
          data: {
            tenantId,
            contactNumber,
            salutation: lead.salutation,
            firstName: lead.firstName,
            lastName: lead.lastName,
            accountId: accountId!,
            email: lead.email,
            secondaryEmail: lead.secondaryEmail,
            phone: lead.phone,
            mobile: lead.mobile,
            jobTitle: lead.title,
            department: options.department || 'Management',
            mailingStreet: lead.street,
            mailingCity: lead.city,
            mailingState: lead.state,
            mailingPostalCode: lead.postalCode,
            mailingCountry: lead.country,
            isPrimaryContact: options.isPrimaryContact !== undefined ? Boolean(options.isPrimaryContact) : true,
            description: lead.description,
            assignedUserId: lead.assignedUserId || userId,
            createdById: userId,
          },
        });
        contactId = contact.id;
      }

      // 3. Deal Creation (Conditional)
      let dealId: string | null = null;
      if (options.createDeal) {
        const dealCount = await tx.deal.count({ where: { tenantId } });
        const dealNumber = `OPP-${String(dealCount + 1001).padStart(5, '0')}`;

        const deal = await tx.deal.create({
          data: {
            tenantId,
            dealNumber,
            dealName: options.dealName || `${lead.company || lead.lastName} - Initial Opportunity`,
            accountId: accountId!,
            contactId: contactId || null,
            amount: options.dealAmount !== undefined ? Number(options.dealAmount) : 0,
            currency: options.currency || 'USD',
            closingDate: options.dealClosingDate ? new Date(options.dealClosingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            stage: options.dealStage || 'qualification',
            probability: options.probability !== undefined ? Number(options.probability) : 20,
            dealType: 'new_business',
            leadSource: lead.leadSource,
            assignedUserId: lead.assignedUserId || userId,
            createdById: userId,
          },
        });
        dealId = deal.id;
      }

      // 4. Update Lead Record
      const updatedLead = await tx.lead.update({
        where: { id: lead.id },
        data: {
          isConverted: true,
          leadStatus: 'converted',
          convertedAccountId: accountId || null,
          convertedContactId: contactId || null,
          convertedDealId: dealId || null,
          convertedAt: new Date(),
        },
      });

      // 5. Reassign Associated Tasks & Activities from Lead to New Contact/Account
      await tx.task.updateMany({
        where: {
          tenantId,
          relatedEntityType: 'lead',
          relatedEntityId: lead.id,
        },
        data: {
          relatedEntityType: 'contact',
          relatedEntityId: contactId || accountId,
        },
      });

      // 6. Record Activity Log
      await tx.entityActivityLog.create({
        data: {
          tenantId,
          moduleName: 'leads',
          entityId: lead.id,
          action: 'converted',
          userId,
          userName: req.user!.email,
          description: `Lead converted to Account (${accountId}), Contact (${contactId})${dealId ? `, Deal (${dealId})` : ''}.`,
          fieldChanges: {
            isConverted: { oldValue: false, newValue: true },
            leadStatus: { oldValue: lead.leadStatus, newValue: 'converted' },
          },
        },
      });

      return {
        lead: updatedLead,
        accountId,
        contactId,
        dealId,
      };
    });

    res.json({
      success: true,
      message: 'Lead successfully converted.',
      ...conversionResult,
    });
  } catch (err: any) {
    console.error('[Lead Convert Error]:', err);
    res.status(500).json({ error: 'Lead conversion failed.', details: err.message });
  }
}

// ============================================================================
// 2. ACCOUNTS CRUD
// ============================================================================

export async function getAccounts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const accounts = await prisma.account.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        assignedUser: { select: { id: true, displayName: true, email: true } },
        contacts: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    res.json(accounts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch accounts.', details: err.message });
  }
}

export async function getAccountById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const account = await prisma.account.findFirst({
      where: { id, tenantId },
      include: {
        assignedUser: { select: { id: true, displayName: true, email: true } },
        contacts: true,
        deals: true,
        projects: true,
      },
    });

    if (!account) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    res.json(account);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch account.', details: err.message });
  }
}

export async function createAccount(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const count = await prisma.account.count({ where: { tenantId } });
    const accountNumber = `ACC-${String(count + 1001).padStart(5, '0')}`;

    const account = await prisma.account.create({
      data: {
        tenantId,
        accountNumber,
        accountName: data.accountName,
        domain: data.domain,
        primaryPhone: data.primaryPhone,
        secondaryPhone: data.secondaryPhone,
        email: data.email,
        website: data.website,
        industry: data.industry || 'Other',
        accountType: data.accountType || 'prospect',
        rating: data.rating || 'warm',
        annualRevenue: data.annualRevenue ? Number(data.annualRevenue) : null,
        billingStreet: data.billingStreet,
        billingCity: data.billingCity,
        billingState: data.billingState,
        billingPostalCode: data.billingPostalCode,
        billingCountry: data.billingCountry,
        shippingStreet: data.shippingStreet,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        description: data.description,
        assignedUserId: data.assignedUserId || userId,
        createdById: userId,
        customFields: data.customFields || {},
      },
    });

    res.status(201).json(account);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create account.', details: err.message });
  }
}

export async function updateAccount(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.account.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    const updated = await prisma.account.update({
      where: { id },
      data: {
        accountName: data.accountName,
        domain: data.domain,
        primaryPhone: data.primaryPhone,
        secondaryPhone: data.secondaryPhone,
        email: data.email,
        website: data.website,
        industry: data.industry,
        accountType: data.accountType,
        rating: data.rating,
        annualRevenue: data.annualRevenue !== undefined ? Number(data.annualRevenue) : undefined,
        billingStreet: data.billingStreet,
        billingCity: data.billingCity,
        billingState: data.billingState,
        billingPostalCode: data.billingPostalCode,
        billingCountry: data.billingCountry,
        shippingStreet: data.shippingStreet,
        shippingCity: data.shippingCity,
        shippingState: data.shippingState,
        shippingPostalCode: data.shippingPostalCode,
        shippingCountry: data.shippingCountry,
        description: data.description,
        assignedUserId: data.assignedUserId,
        customFields: data.customFields,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update account.', details: err.message });
  }
}

export async function deleteAccount(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.account.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Account not found.' });
      return;
    }

    await prisma.account.delete({ where: { id } });
    res.json({ message: 'Account deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete account.', details: err.message });
  }
}

// ============================================================================
// 3. CONTACTS CRUD
// ============================================================================

export async function getContacts(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const contacts = await prisma.contact.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, accountName: true } },
        assignedUser: { select: { id: true, displayName: true, email: true } },
      },
    });
    res.json(contacts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contacts.', details: err.message });
  }
}

export async function getContactById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const contact = await prisma.contact.findFirst({
      where: { id, tenantId },
      include: {
        account: true,
        assignedUser: { select: { id: true, displayName: true, email: true } },
        reportsToContact: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    if (!contact) {
      res.status(404).json({ error: 'Contact not found.' });
      return;
    }

    res.json(contact);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch contact.', details: err.message });
  }
}

export async function createContact(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const count = await prisma.contact.count({ where: { tenantId } });
    const contactNumber = `CON-${String(count + 1001).padStart(5, '0')}`;

    const contact = await prisma.contact.create({
      data: {
        tenantId,
        contactNumber,
        salutation: data.salutation,
        firstName: data.firstName || '',
        lastName: data.lastName || 'Unknown',
        accountId: data.accountId,
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        phone: data.phone,
        mobile: data.mobile,
        jobTitle: data.jobTitle,
        department: data.department,
        reportsToContactId: data.reportsToContactId,
        mailingStreet: data.mailingStreet,
        mailingCity: data.mailingCity,
        mailingState: data.mailingState,
        mailingPostalCode: data.mailingPostalCode,
        mailingCountry: data.mailingCountry,
        isPrimaryContact: Boolean(data.isPrimaryContact),
        description: data.description,
        assignedUserId: data.assignedUserId || userId,
        createdById: userId,
        customFields: data.customFields || {},
      },
    });

    res.status(201).json(contact);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create contact.', details: err.message });
  }
}

export async function updateContact(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const data = req.body;

    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Contact not found.' });
      return;
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: {
        salutation: data.salutation,
        firstName: data.firstName,
        lastName: data.lastName,
        accountId: data.accountId,
        email: data.email,
        secondaryEmail: data.secondaryEmail,
        phone: data.phone,
        mobile: data.mobile,
        jobTitle: data.jobTitle,
        department: data.department,
        reportsToContactId: data.reportsToContactId,
        mailingStreet: data.mailingStreet,
        mailingCity: data.mailingCity,
        mailingState: data.mailingState,
        mailingPostalCode: data.mailingPostalCode,
        mailingCountry: data.mailingCountry,
        isPrimaryContact: data.isPrimaryContact !== undefined ? Boolean(data.isPrimaryContact) : undefined,
        description: data.description,
        assignedUserId: data.assignedUserId,
        customFields: data.customFields,
      },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update contact.', details: err.message });
  }
}

export async function deleteContact(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.contact.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Contact not found.' });
      return;
    }

    await prisma.contact.delete({ where: { id } });
    res.json({ message: 'Contact deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete contact.', details: err.message });
  }
}

// ============================================================================
// 4. DEALS CRUD
// ============================================================================

export async function getDeals(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const deals = await prisma.deal.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: {
        account: { select: { id: true, accountName: true } },
        contact: { select: { id: true, firstName: true, lastName: true } },
        assignedUser: { select: { id: true, displayName: true, email: true } },
      },
    });
    res.json(deals);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch deals.', details: err.message });
  }
}

export async function getDealById(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, tenantId },
      include: {
        account: true,
        contact: true,
        assignedUser: { select: { id: true, displayName: true, email: true } },
        projects: true,
        quotes: true,
      },
    });

    if (!deal) {
      res.status(404).json({ error: 'Deal not found.' });
      return;
    }

    res.json(deal);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch deal.', details: err.message });
  }
}

export async function createDeal(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const data = req.body;

    const count = await prisma.deal.count({ where: { tenantId } });
    const dealNumber = `OPP-${String(count + 1001).padStart(5, '0')}`;

    const deal = await prisma.deal.create({
      data: {
        tenantId,
        dealNumber,
        dealName: data.dealName,
        accountId: data.accountId,
        contactId: data.contactId || null,
        amount: data.amount !== undefined ? Number(data.amount) : 0,
        currency: data.currency || 'USD',
        closingDate: data.closingDate ? new Date(data.closingDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        stage: data.stage || 'prospecting',
        probability: data.probability !== undefined ? Number(data.probability) : 10,
        dealType: data.dealType || 'new_business',
        leadSource: data.leadSource,
        linkedProjectId: data.linkedProjectId,
        lostReason: data.lostReason,
        description: data.description,
        assignedUserId: data.assignedUserId || userId,
        createdById: userId,
        customFields: data.customFields || {},
      },
    });

    res.status(201).json(deal);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create deal.', details: err.message });
  }
}

export async function updateDeal(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const userId = req.user!.userId;
    const { id } = req.params;
    const data = req.body;

    const updated = await updateDealWithEvents(
      tenantId,
      id,
      {
        dealName: data.dealName,
        accountId: data.accountId,
        contactId: data.contactId,
        amount: data.amount !== undefined ? Number(data.amount) : undefined,
        currency: data.currency,
        closingDate: data.closingDate ? new Date(data.closingDate) : undefined,
        stage: data.stage,
        probability: data.probability !== undefined ? Number(data.probability) : undefined,
        dealType: data.dealType,
        leadSource: data.leadSource,
        linkedProjectId: data.linkedProjectId,
        lostReason: data.lostReason,
        description: data.description,
        assignedUserId: data.assignedUserId,
        customFields: data.customFields,
      },
      userId
    );

    res.json(updated);
  } catch (err: any) {
    if (err.message?.includes('not found')) {
      res.status(404).json({ error: err.message });
      return;
    }
    res.status(500).json({ error: 'Failed to update deal.', details: err.message });
  }
}

export async function deleteDeal(req: Request, res: Response): Promise<void> {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const existing = await prisma.deal.findFirst({ where: { id, tenantId } });
    if (!existing) {
      res.status(404).json({ error: 'Deal not found.' });
      return;
    }

    await prisma.deal.delete({ where: { id } });
    res.json({ message: 'Deal deleted successfully.', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete deal.', details: err.message });
  }
}
