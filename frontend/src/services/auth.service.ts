import { api, apiRequest } from '@/lib/api';
import type {
  User,
  LoginCredentials,
  RegisterData,
  AuthTokens,
  ApiResponse,
} from '@/types';

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<ApiResponse<LoginResponse>> {
    const response = await apiRequest<LoginResponse>('POST', '/auth/login', credentials);
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }
    return response;
  },

  async register(data: RegisterData): Promise<ApiResponse<LoginResponse>> {
    const response = await apiRequest<LoginResponse>('POST', '/auth/register', data);
    if (response.success && response.data) {
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
      localStorage.setItem('refreshToken', response.data.tokens.refreshToken);
    }
    return response;
  },

  async logout(): Promise<void> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await api.post('/auth/logout', { refreshToken });
      }
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest<User>('GET', '/auth/profile');
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest<User>('PUT', '/auth/profile', data);
  },

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<ApiResponse<void>> {
    return apiRequest<void>('PUT', '/auth/password', {
      oldPassword: data.currentPassword,
      newPassword: data.newPassword,
    });
  },

  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  },

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  },
};
