import { Router } from 'express';
import reportRoutes from './report.routes';
import staffRoutes from './staff.routes';
import userRoutes from './user.routes';
import internalRoutes from './internal.routes';

const router = Router();

// Public and authenticated report routes
router.use('/reports', reportRoutes);

// Staff routes
router.use('/staff', staffRoutes);

// User routes (for /users/me/reports)
router.use('/users', userRoutes);

// Internal routes (for service-to-service communication)
router.use('/internal', internalRoutes);

export default router;
