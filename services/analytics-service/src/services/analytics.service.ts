import { PrismaClient, ReportStatus, ReportCategory } from '@lapor-pakdhe/prisma-client';
import { startOfDay, subDays, format, startOfWeek, startOfMonth, endOfDay } from 'date-fns';
import { config } from '../config';
import { getCachedData, setCachedData } from '../utils/redis';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  rejectedReports: number;
  escalatedReports: number;
  todayReports: number;
  weekReports: number;
}

export interface AnalyticsStats {
  totalReports: number;
  newReports: number;
  resolutionRate: number;
  avgResolutionTime: number;
  totalGrowth: number;
  topLocations: Array<{ address: string; count: number }>;
}

export interface TrendData {
  date: string;
  created: number;
  resolved: number;
}

export interface CategoryData {
  category: string;
  count: number;
}

export interface StatusData {
  status: string;
  count: number;
}

export interface DepartmentPerformance {
  departmentId: string;
  departmentName: string;
  totalReports: number;
  resolvedReports: number;
  avgResolutionTime: number;
  resolutionRate: number;
}

class AnalyticsService {
  async getDashboardStats(): Promise<DashboardStats> {
    const cacheKey = 'analytics:dashboard';
    const cached = await getCachedData<DashboardStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const today = startOfDay(new Date());
    const weekAgo = subDays(today, 7);

    const [
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      escalatedReports,
      todayReports,
      weekReports,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { status: 'PENDING' } }),
      prisma.report.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.report.count({ where: { status: 'RESOLVED' } }),
      prisma.report.count({ where: { status: 'REJECTED' } }),
      prisma.report.count({ where: { status: 'ESCALATED' } }),
      prisma.report.count({ where: { createdAt: { gte: today } } }),
      prisma.report.count({ where: { createdAt: { gte: weekAgo } } }),
    ]);

    const stats: DashboardStats = {
      totalReports,
      pendingReports,
      inProgressReports,
      resolvedReports,
      rejectedReports,
      escalatedReports,
      todayReports,
      weekReports,
    };

    await setCachedData(cacheKey, stats, config.cache.statsExpiry);
    return stats;
  }

  async getAnalyticsStats(period: string): Promise<AnalyticsStats> {
    const cacheKey = `analytics:stats:${period}`;
    const cached = await getCachedData<AnalyticsStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = subDays(new Date(), days);
    const previousStartDate = subDays(startDate, days);

    const [
      totalReports,
      newReports,
      resolvedReports,
      previousPeriodReports,
      resolvedWithTime,
      topLocations,
    ] = await Promise.all([
      prisma.report.count(),
      prisma.report.count({ where: { createdAt: { gte: startDate } } }),
      prisma.report.count({ where: { status: 'RESOLVED', createdAt: { gte: startDate } } }),
      prisma.report.count({
        where: {
          createdAt: {
            gte: previousStartDate,
            lt: startDate
          }
        }
      }),
      prisma.report.findMany({
        where: {
          status: 'RESOLVED',
          resolvedAt: { not: null },
          createdAt: { gte: startDate }
        },
        select: { createdAt: true, resolvedAt: true },
      }),
      prisma.report.groupBy({
        by: ['locationAddress'],
        where: {
          locationAddress: { not: null },
          createdAt: { gte: startDate }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
    ]);

    // Calculate average resolution time in days
    let avgResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((acc, report) => {
        if (report.resolvedAt) {
          const diff = report.resolvedAt.getTime() - report.createdAt.getTime();
          return acc + diff / (1000 * 60 * 60 * 24); // Convert to days
        }
        return acc;
      }, 0);
      avgResolutionTime = totalTime / resolvedWithTime.length;
    }

    // Calculate resolution rate
    const resolutionRate = newReports > 0 ? (resolvedReports / newReports) * 100 : 0;

    // Calculate growth
    const totalGrowth = previousPeriodReports > 0
      ? ((newReports - previousPeriodReports) / previousPeriodReports) * 100
      : 0;

    const stats: AnalyticsStats = {
      totalReports,
      newReports,
      resolutionRate,
      avgResolutionTime,
      totalGrowth,
      topLocations: topLocations.map(loc => ({
        address: loc.locationAddress || 'Unknown',
        count: loc._count.id,
      })),
    };

    await setCachedData(cacheKey, stats, config.cache.statsExpiry);
    return stats;
  }

  async getTrends(days: number): Promise<TrendData[]> {
    const cacheKey = `analytics:trends:${days}`;
    const cached = await getCachedData<TrendData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const startDate = subDays(new Date(), days);
    const trends: TrendData[] = [];

    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), days - i - 1);
      const dayStart = startOfDay(date);
      const dayEnd = endOfDay(date);

      const [created, resolved] = await Promise.all([
        prisma.report.count({
          where: { createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.report.count({
          where: {
            status: 'RESOLVED',
            resolvedAt: { gte: dayStart, lte: dayEnd }
          },
        }),
      ]);

      trends.push({
        date: format(date, 'yyyy-MM-dd'),
        created,
        resolved,
      });
    }

    await setCachedData(cacheKey, trends, config.cache.trendsExpiry);
    return trends;
  }

  async getByCategory(period: string): Promise<CategoryData[]> {
    const cacheKey = `analytics:category:${period}`;
    const cached = await getCachedData<CategoryData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const days = parseInt(period.replace('d', '')) || 30;
    const startDate = subDays(new Date(), days);

    const data = await prisma.report.groupBy({
      by: ['category'],
      where: { createdAt: { gte: startDate } },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const result = data.map(item => ({
      category: item.category,
      count: item._count.id,
    }));

    await setCachedData(cacheKey, result, config.cache.statsExpiry);
    return result;
  }

  async getByStatus(): Promise<StatusData[]> {
    const cacheKey = 'analytics:status';
    const cached = await getCachedData<StatusData[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const data = await prisma.report.groupBy({
      by: ['status'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    const result = data.map(item => ({
      status: item.status,
      count: item._count.id,
    }));

    await setCachedData(cacheKey, result, config.cache.statsExpiry);
    return result;
  }

  async getDepartmentPerformance(): Promise<DepartmentPerformance[]> {
    const cacheKey = 'analytics:department-performance';
    const cached = await getCachedData<DepartmentPerformance[]>(cacheKey);
    if (cached) {
      return cached;
    }

    const departments = await prisma.department.findMany({
      where: { isActive: true },
      include: {
        reports: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            resolvedAt: true,
          },
        },
      },
    });

    const result = departments.map(dept => {
      const totalReports = dept.reports.length;
      const resolvedReports = dept.reports.filter(r => r.status === 'RESOLVED').length;

      // Calculate avg resolution time
      const resolvedWithTime = dept.reports.filter(r => r.status === 'RESOLVED' && r.resolvedAt);
      let avgResolutionTime = 0;
      if (resolvedWithTime.length > 0) {
        const totalTime = resolvedWithTime.reduce((acc, report) => {
          if (report.resolvedAt) {
            const diff = report.resolvedAt.getTime() - report.createdAt.getTime();
            return acc + diff / (1000 * 60 * 60 * 24);
          }
          return acc;
        }, 0);
        avgResolutionTime = totalTime / resolvedWithTime.length;
      }

      return {
        departmentId: dept.id,
        departmentName: dept.name,
        totalReports,
        resolvedReports,
        avgResolutionTime,
        resolutionRate: totalReports > 0 ? (resolvedReports / totalReports) * 100 : 0,
      };
    });

    await setCachedData(cacheKey, result, config.cache.statsExpiry);
    return result;
  }

  async invalidateAllCaches(): Promise<void> {
    try {
      const { invalidateCache } = await import('../utils/redis');
      await invalidateCache('analytics:*');
      logger.info('Analytics caches invalidated');
    } catch (error) {
      logger.error('Failed to invalidate caches:', error);
    }
  }
}

export const analyticsService = new AnalyticsService();
