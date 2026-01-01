import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { logger } from '../utils/logger';

export class AnalyticsController {
  async getDashboardStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAnalyticsStats(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string) || '30d';
      const stats = await analyticsService.getAnalyticsStats(period);
      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTrends(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 30;
      const trends = await analyticsService.getTrends(Math.min(days, 365));
      res.json({
        success: true,
        data: trends,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByCategory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const period = (req.query.period as string) || '30d';
      const data = await analyticsService.getByCategory(period);
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getByStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getByStatus();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDepartmentPerformance(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await analyticsService.getDepartmentPerformance();
      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async invalidateCache(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await analyticsService.invalidateAllCaches();
      res.json({
        success: true,
        message: 'Cache invalidated',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const analyticsController = new AnalyticsController();
