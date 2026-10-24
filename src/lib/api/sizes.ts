import { apiClient } from './client';
import { ApiResponse, ProductSize } from '@/types';

export interface SizeQueryParams {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

export const sizesApi = {
  listSizes: async (params: SizeQueryParams = {}): Promise<ProductSize[]> => {
    const res = await apiClient.get<ApiResponse<ProductSize[]>>('/admin/sizes', { params });
    return res.data.data || [];
  },

  getSize: async (id: string): Promise<ProductSize> => {
    const res = await apiClient.get<ApiResponse<ProductSize>>(`/admin/sizes/${id}`);
    return res.data.data;
  },

  createSize: async (payload: {
    name: string;
    slug?: string;
    description?: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ProductSize> => {
    const res = await apiClient.post<ApiResponse<ProductSize>>('/admin/sizes', payload);
    return res.data.data;
  },

  updateSize: async (
    id: string,
    payload: {
      name?: string;
      slug?: string;
      description?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ProductSize> => {
    const res = await apiClient.put<ApiResponse<ProductSize>>(`/admin/sizes/${id}`, payload);
    return res.data.data;
  },

  toggleActive: async (id: string): Promise<ProductSize> => {
    const res = await apiClient.post<ApiResponse<ProductSize>>(`/admin/sizes/${id}/toggle-active`);
    return res.data.data;
  },

  deleteSize: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/sizes/${id}`);
  },
};
