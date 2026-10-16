import { Router } from 'express';
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

// ==========================================
// Public Endpoints (Accessible by external clients/visitors)
// ==========================================
formRouter.get('/public/:slugOrId', getPublicForm);
formRouter.post('/public/:slugOrId/submit', submitPublicForm);

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
