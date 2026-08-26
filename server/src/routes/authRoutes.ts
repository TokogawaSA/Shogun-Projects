import { Router } from 'express';
import { register, login, getMe, inviteUser } from '../controllers/authController.js';
import { authenticateTenant, requireTenantAdmin } from '../middleware/auth.js';

export const authRouter = Router();

// Public authentication routes
authRouter.post('/register', register);
authRouter.post('/login', login);

// Authenticated session & profile route
authRouter.get('/me', authenticateTenant, getMe);

// Admin-only user management within tenant
authRouter.post('/users/invite', authenticateTenant, requireTenantAdmin, inviteUser);

export default authRouter;
