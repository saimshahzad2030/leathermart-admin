import { apiClient } from './client';
import { ApiResponse, ProductPolicy } from '@/types';

export interface PolicyQueryParams {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

export const policiesApi = {
  listPolicies: async (params: PolicyQueryParams = {}): Promise<ProductPolicy[]> => {
    const res = await apiClient.get<ApiResponse<ProductPolicy[]>>('/admin/policies', { params });
    return res.data.data || [];
  },

  getPolicy: async (id: string): Promise<ProductPolicy> => {
    const res = await apiClient.get<ApiResponse<ProductPolicy>>(`/admin/policies/${id}`);
    return res.data.data;
  },

  createPolicy: async (payload: {
    name: string;
    slug?: string;
    description: string;
    bulletPoints?: string[];
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ProductPolicy> => {
    const res = await apiClient.post<ApiResponse<ProductPolicy>>('/admin/policies', payload);
    return res.data.data;
  },

  updatePolicy: async (
    id: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      bulletPoints?: string[];
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ProductPolicy> => {
    const res = await apiClient.put<ApiResponse<ProductPolicy>>(`/admin/policies/${id}`, payload);
    return res.data.data;
  },

  toggleActive: async (id: string): Promise<ProductPolicy> => {
    const res = await apiClient.post<ApiResponse<ProductPolicy>>(`/admin/policies/${id}/toggle-active`);
    return res.data.data;
  },

  deletePolicy: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/policies/${id}`);
  },
};
