import { api, apiRequest } from '@/lib/api';
import type {
  Report,
  CreateReportData,
  UpdateReportStatusData,
  ApiResponse,
  PaginationMeta,
  ReportStatus,
  ReportCategory,
} from '@/types';

export interface ReportsResponse {
  reports: Report[];
  meta: PaginationMeta;
}

export interface ReportFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  category?: ReportCategory;
  departmentId?: string;
  search?: string;
  sort?: string; // Combined sort field (e.g., "createdAt:desc")
  sortBy?: 'createdAt' | 'updatedAt' | 'upvoteCount';
  sortOrder?: 'asc' | 'desc';
}

export const reportService = {
  async getReports(filters: ReportFilters = {}): Promise<ApiResponse<ReportsResponse>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.search) params.append('search', filters.search);
    if (filters.sort) {
      const [sortBy, sortOrder] = filters.sort.split(':');
      params.append('sortBy', sortBy);
      params.append('sortOrder', sortOrder || 'desc');
    } else {
      if (filters.sortBy) params.append('sortBy', filters.sortBy);
      if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    }

    return apiRequest<ReportsResponse>('GET', `/reports?${params.toString()}`);
  },

  async getPublicReports(filters: ReportFilters = {}): Promise<ApiResponse<ReportsResponse>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);

    return apiRequest<ReportsResponse>('GET', `/reports/public?${params.toString()}`);
  },

  async getMyReports(filters: ReportFilters = {}): Promise<ApiResponse<ReportsResponse>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.status) params.append('status', filters.status);

    return apiRequest<ReportsResponse>('GET', `/reports/my?${params.toString()}`);
  },

  async getReport(id: string): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('GET', `/reports/${id}`);
  },

  async getReportByReference(referenceNumber: string): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('GET', `/reports/track/${referenceNumber}`);
  },

  async createReport(data: CreateReportData): Promise<ApiResponse<Report>> {
    const formData = new FormData();
    formData.append('title', data.title);
    formData.append('description', data.description);
    formData.append('category', data.category);
    formData.append('type', data.type);

    if (data.locationLat) formData.append('locationLat', data.locationLat.toString());
    if (data.locationLng) formData.append('locationLng', data.locationLng.toString());
    if (data.locationAddress) formData.append('locationAddress', data.locationAddress);

    if (data.media) {
      data.media.forEach((file) => {
        formData.append('media', file);
      });
    }

    // Don't set Content-Type header manually - axios will set it automatically with correct boundary
    const response = await api.post<ApiResponse<Report>>('/reports', formData);
    return response.data;
  },

  async updateReportStatus(id: string, data: UpdateReportStatusData): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('PATCH', `/reports/${id}/status`, data);
  },

  async assignReport(id: string, staffId: string): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('PATCH', `/reports/${id}/assign`, { assignedToId: staffId });
  },

  async upvoteReport(id: string): Promise<ApiResponse<{ upvoteCount: number; hasUpvoted: boolean }>> {
    return apiRequest<{ upvoteCount: number; hasUpvoted: boolean }>('POST', `/reports/${id}/upvote`);
  },

  async removeUpvote(id: string): Promise<ApiResponse<{ upvoteCount: number; hasUpvoted: boolean }>> {
    return apiRequest<{ upvoteCount: number; hasUpvoted: boolean }>('DELETE', `/reports/${id}/upvote`);
  },

  async updateStatus(id: string, status: ReportStatus, note?: string): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('PATCH', `/reports/${id}/status`, { status, note });
  },

  async addComment(id: string, content: string): Promise<ApiResponse<Report>> {
    return apiRequest<Report>('POST', `/reports/${id}/comments`, { content });
  },

  async exportReports(filters: ReportFilters = {}): Promise<ApiResponse<{ url: string }>> {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.search) params.append('search', filters.search);

    return apiRequest<{ url: string }>('GET', `/reports/export?${params.toString()}`);
  },
};
