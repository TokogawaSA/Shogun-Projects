import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateTenant } from '../middleware/auth.js';
import {
  getForms,
  getFormById,
  createForm,
  updateForm,
  deleteForm,
  getFormSubmissions,
  simulateFormRoute,
  getPublicForm,
  submitPublicForm,
} from '../controllers/formController.js';

export const formRouter = Router();

// Rate limiter for public form submissions (prevents automated spam & DoS)
const publicFormSubmissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 submissions per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many form submissions from this IP address. Please wait 15 minutes before submitting again.',
  },
});

// ==========================================
// Public Endpoints (Accessible by external clients/visitors)
// ==========================================
formRouter.get('/public/:slugOrId', getPublicForm);
formRouter.post('/public/:slugOrId/submit', publicFormSubmissionLimiter, submitPublicForm);

// ==========================================
// Protected Tenant Endpoints (Form Management & Routing Studio)
// ==========================================
formRouter.get('/', authenticateTenant, getForms);
formRouter.post('/', authenticateTenant, createForm);
formRouter.get('/:id', authenticateTenant, getFormById);
formRouter.put('/:id', authenticateTenant, updateForm);
formRouter.delete('/:id', authenticateTenant, deleteForm);
formRouter.get('/:id/submissions', authenticateTenant, getFormSubmissions);
formRouter.post('/:id/simulate-route', authenticateTenant, simulateFormRoute);

export default formRouter;
