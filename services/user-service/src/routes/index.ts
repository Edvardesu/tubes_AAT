import { Router } from 'express';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import internalRoutes from './internal.routes';

const router = Router();

// Public auth routes
router.use('/auth', authRoutes);

// User routes (requires authentication)
router.use('/users', userRoutes);

// Internal routes (for service-to-service communication)
router.use('/internal', internalRoutes);

export default router;
