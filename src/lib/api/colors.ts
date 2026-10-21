import { apiClient } from './client';
import { ApiResponse, ProductColor } from '@/types';

export interface ColorQueryParams {
  status?: 'active' | 'inactive' | 'all';
  search?: string;
}

export const colorsApi = {
  listColors: async (params: ColorQueryParams = {}): Promise<ProductColor[]> => {
    const res = await apiClient.get<ApiResponse<ProductColor[]>>('/admin/colors', { params });
    return res.data.data || [];
  },

  getColor: async (id: string): Promise<ProductColor> => {
    const res = await apiClient.get<ApiResponse<ProductColor>>(`/admin/colors/${id}`);
    return res.data.data;
  },

  createColor: async (payload: {
    name: string;
    slug?: string;
    hex: string;
    sortOrder?: number;
    isActive?: boolean;
  }): Promise<ProductColor> => {
    const res = await apiClient.post<ApiResponse<ProductColor>>('/admin/colors', payload);
    return res.data.data;
  },

  updateColor: async (
    id: string,
    payload: {
      name?: string;
      slug?: string;
      hex?: string;
      sortOrder?: number;
      isActive?: boolean;
    }
  ): Promise<ProductColor> => {
    const res = await apiClient.put<ApiResponse<ProductColor>>(`/admin/colors/${id}`, payload);
    return res.data.data;
  },

  toggleActive: async (id: string): Promise<ProductColor> => {
    const res = await apiClient.post<ApiResponse<ProductColor>>(`/admin/colors/${id}/toggle-active`);
    return res.data.data;
  },

  deleteColor: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/colors/${id}`);
  },
};
