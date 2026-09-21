import { apiClient } from './client';
import { ApiResponse, AdminUser, AuthSession } from '@/types';

export const authApi = {
  login: async (credentials: { email: string; password: string }): Promise<AuthSession> => {
    const res = await apiClient.post<ApiResponse<AuthSession>>('/admin/auth/login', credentials);
    return res.data.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/admin/auth/logout');
  },

  getMe: async (): Promise<AdminUser> => {
    const res = await apiClient.get<ApiResponse<AdminUser>>('/admin/auth/me');
    return res.data.data;
  },

  changePassword: async (passwords: { currentPassword: string; newPassword: string }): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/admin/auth/change-password', passwords);
  },

  // Admin Users Management (Super Admin only)
  listUsers: async (): Promise<AdminUser[]> => {
    const res = await apiClient.get<ApiResponse<AdminUser[]>>('/admin/users');
    return res.data.data;
  },

  createUser: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions?: string[];
  }): Promise<AdminUser> => {
    const res = await apiClient.post<ApiResponse<AdminUser>>('/admin/users', userData);
    return res.data.data;
  },

  updateUser: async (id: string, updates: Partial<AdminUser>): Promise<AdminUser> => {
    const res = await apiClient.put<ApiResponse<AdminUser>>(`/admin/users/${id}`, updates);
    return res.data.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/users/${id}`);
  },
};
