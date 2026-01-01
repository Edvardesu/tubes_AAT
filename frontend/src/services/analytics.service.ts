import { apiRequest } from '@/lib/api';
import type { ApiResponse, AnalyticsSummary, ReportStatus, ReportCategory } from '@/types';

export interface DashboardStats {
  totalReports: number;
  pendingReports: number;
  inProgressReports: number;
  resolvedReports: number;
  escalatedReports: number;
  todayReports: number;
  weekReports: number;
  monthReports: number;
}

export interface TrendData {
  date: string;
  count: number;
  resolved: number;
}

export interface CategoryStats {
  category: ReportCategory;
  count: number;
  percentage: number;
}

export interface DepartmentStats {
  departmentId: string;
  departmentName: string;
  total: number;
  pending: number;
  inProgress: number;
  resolved: number;
  avgResolutionTime: number;
}

export interface PerformanceMetrics {
  averageResolutionTime: number;
  resolutionRate: number;
  slaComplianceRate: number;
  escalationRate: number;
}

export interface AnalyticsStats {
  totalReports: number;
  newReports: number;
  totalGrowth: number;
  resolutionRate: number;
  avgResolutionTime: number;
  topLocations: { address: string; count: number }[];
}

export interface StatusDistribution {
  status: string;
  count: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export const analyticsService = {
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return apiRequest<DashboardStats>('GET', '/analytics/dashboard');
  },

  async getSummary(period?: 'day' | 'week' | 'month' | 'year'): Promise<ApiResponse<AnalyticsSummary>> {
    const params = period ? `?period=${period}` : '';
    return apiRequest<AnalyticsSummary>('GET', `/analytics/summary${params}`);
  },

  async getTrends(days = 30): Promise<ApiResponse<TrendData[]>> {
    return apiRequest<TrendData[]>('GET', `/analytics/trends?days=${days}`);
  },

  async getCategoryStats(): Promise<ApiResponse<CategoryStats[]>> {
    return apiRequest<CategoryStats[]>('GET', '/analytics/categories');
  },

  async getDepartmentStats(): Promise<ApiResponse<DepartmentStats[]>> {
    return apiRequest<DepartmentStats[]>('GET', '/analytics/departments');
  },

  async getStatusDistribution(): Promise<ApiResponse<Record<ReportStatus, number>>> {
    return apiRequest<Record<ReportStatus, number>>('GET', '/analytics/status');
  },

  async getPerformanceMetrics(): Promise<ApiResponse<PerformanceMetrics>> {
    return apiRequest<PerformanceMetrics>('GET', '/analytics/performance');
  },

  async getAnalyticsStats(period: string = '30d'): Promise<ApiResponse<AnalyticsStats>> {
    return apiRequest<AnalyticsStats>('GET', `/analytics/stats?period=${period}`);
  },

  async getByCategory(period: string = '30d'): Promise<ApiResponse<CategoryDistribution[]>> {
    return apiRequest<CategoryDistribution[]>('GET', `/analytics/by-category?period=${period}`);
  },

  async getByStatus(): Promise<ApiResponse<StatusDistribution[]>> {
    return apiRequest<StatusDistribution[]>('GET', '/analytics/by-status');
  },
};
