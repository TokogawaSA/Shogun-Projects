import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  listBookings,
  getBookingById,
  createBooking,
  updateBooking,
  deleteBooking,
  listBookingTypes,
  createBookingType,
  updateBookingType,
  deleteBookingType,
  getAvailability,
  updateAvailability,
  getPublicBookingTypeMeta,
  getPublicSlots,
  createPublicBooking,
} from '../controllers/bookingController.js';

// Rate limiter for public booking endpoints (prevents slot scraping & automated spam)
const publicBookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many booking requests from this IP address. Please wait 15 minutes before trying again.',
  },
});

// Authenticated Router
export const bookingRouter = Router();

// Bookings CRUD
bookingRouter.get('/', listBookings);
bookingRouter.post('/', createBooking);
bookingRouter.get('/types', listBookingTypes);
bookingRouter.post('/types', createBookingType);
bookingRouter.patch('/types/:id', updateBookingType);
bookingRouter.delete('/types/:id', deleteBookingType);
bookingRouter.get('/availability', getAvailability);
bookingRouter.put('/availability', updateAvailability);
bookingRouter.get('/:id', getBookingById);
bookingRouter.patch('/:id', updateBooking);
bookingRouter.delete('/:id', deleteBooking);

// Public Router (No auth middleware required)
export const publicBookingRouter = Router();

publicBookingRouter.get('/host/:hostId/type/:slug', publicBookingLimiter, getPublicBookingTypeMeta);
publicBookingRouter.get('/slots', publicBookingLimiter, getPublicSlots);
publicBookingRouter.post('/schedule', publicBookingLimiter, createPublicBooking);

