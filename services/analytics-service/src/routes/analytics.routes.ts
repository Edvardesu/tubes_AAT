import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';

const router = Router();

// Dashboard stats
router.get('/dashboard', analyticsController.getDashboardStats.bind(analyticsController));

// Analytics stats with period
router.get('/stats', analyticsController.getAnalyticsStats.bind(analyticsController));

// Trends over time
router.get('/trends', analyticsController.getTrends.bind(analyticsController));

// Reports by category
router.get('/by-category', analyticsController.getByCategory.bind(analyticsController));

// Reports by status
router.get('/by-status', analyticsController.getByStatus.bind(analyticsController));

// Department performance
router.get('/departments', analyticsController.getDepartmentPerformance.bind(analyticsController));

export { router as analyticsRoutes };
