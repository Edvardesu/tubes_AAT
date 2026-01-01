import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// Internal endpoint to invalidate cache (called by other services)
router.post('/cache/invalidate', analyticsController.invalidateCache.bind(analyticsController));

export { router as internalRoutes };
