import { apiRequest } from '@/lib/api';
import type { User, ApiResponse, PaginationMeta } from '@/types';

export interface StaffMember {
  id: string;
  userId: string;
  user: User;
  departmentId: string;
  department: {
    id: string;
    name: string;
    code: string;
  };
  position: string;
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  superiorId?: string;
  superior?: StaffMember;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  email?: string;
  phone?: string;
  parentId?: string;
  isActive: boolean;
}

export interface StaffFilters {
  page?: number;
  limit?: number;
  departmentId?: string;
  level?: string;
  search?: string;
}

export interface StaffResponse {
  staff: StaffMember[];
  meta: PaginationMeta;
}

export interface DepartmentsResponse {
  departments: Department[];
}

export interface CreateStaffData {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
  departmentId: string;
  position: string;
  level: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  superiorId?: string;
}

export interface UpdateStaffData {
  fullName?: string;
  phone?: string;
  departmentId?: string;
  position?: string;
  level?: 'LEVEL_1' | 'LEVEL_2' | 'LEVEL_3';
  superiorId?: string;
  isActive?: boolean;
}

export const staffService = {
  async getStaff(filters: StaffFilters = {}): Promise<ApiResponse<StaffResponse>> {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.departmentId) params.append('departmentId', filters.departmentId);
    if (filters.level) params.append('level', filters.level);
    if (filters.search) params.append('search', filters.search);

    return apiRequest<StaffResponse>('GET', `/admin/staff?${params.toString()}`);
  },

  async getStaffById(id: string): Promise<ApiResponse<StaffMember>> {
    return apiRequest<StaffMember>('GET', `/admin/staff/${id}`);
  },

  async createStaff(data: CreateStaffData): Promise<ApiResponse<StaffMember>> {
    return apiRequest<StaffMember>('POST', '/admin/staff', data);
  },

  async updateStaff(id: string, data: UpdateStaffData): Promise<ApiResponse<StaffMember>> {
    return apiRequest<StaffMember>('PATCH', `/admin/staff/${id}`, data);
  },

  async deleteStaff(id: string): Promise<ApiResponse<void>> {
    return apiRequest<void>('DELETE', `/admin/staff/${id}`);
  },

  async getDepartments(): Promise<ApiResponse<DepartmentsResponse>> {
    return apiRequest<DepartmentsResponse>('GET', '/departments');
  },

  async assignStaffToDepartment(
    staffId: string,
    departmentId: string
  ): Promise<ApiResponse<StaffMember>> {
    return apiRequest<StaffMember>('PATCH', `/admin/staff/${staffId}/department`, {
      departmentId,
    });
  },

  async getStaffByDepartment(departmentId: string): Promise<ApiResponse<StaffResponse>> {
    return apiRequest<StaffResponse>('GET', `/admin/staff?departmentId=${departmentId}`);
  },
};
