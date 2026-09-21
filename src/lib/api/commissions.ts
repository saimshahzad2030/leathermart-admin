import { apiClient } from './client';
import {
  ApiResponse,
  CustomCommission,
  CommissionStatus,
  Pagination,
  CustomSilhouette,
  CustomLeather,
  CustomColor,
  CustomLining,
  CustomHardware,
} from '@/types';

export interface CommissionQueryParams {
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CommissionListResult {
  commissions: CustomCommission[];
  pagination: Pagination;
}

export const commissionsApi = {
  listCommissions: async (params: CommissionQueryParams = {}): Promise<CommissionListResult> => {
    const res = await apiClient.get<ApiResponse<CustomCommission[]>>('/admin/commissions', { params });
    return {
      commissions: res.data.data || [],
      pagination: res.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: res.data.data?.length || 0,
        limit: params.limit || 20,
      },
    };
  },

  getCommissionById: async (id: string): Promise<CustomCommission> => {
    const res = await apiClient.get<ApiResponse<CustomCommission>>(`/admin/commissions/${id}`);
    return res.data.data;
  },

  updateStatus: async (
    id: string,
    status: CommissionStatus,
    notes?: string
  ): Promise<CustomCommission> => {
    const res = await apiClient.patch<ApiResponse<CustomCommission>>(`/admin/commissions/${id}/status`, {
      status,
      notes,
    });
    return res.data.data;
  },

  bulkUpdateStatus: async (status: CommissionStatus, ids: string[]): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/admin/commissions/bulk-status', { status, ids });
  },

  // Bespoke Custom Studio Options
  getPublicOptions: async (): Promise<{
    silhouettes: CustomSilhouette[];
    leathers: CustomLeather[];
    colors: CustomColor[];
    linings: CustomLining[];
    hardware: CustomHardware[];
  }> => {
    const res = await apiClient.get<ApiResponse<any>>('/customization/options');
    return res.data.data;
  },

  // Silhouettes
  createSilhouette: async (data: Partial<CustomSilhouette>): Promise<CustomSilhouette> => {
    const res = await apiClient.post<ApiResponse<CustomSilhouette>>('/admin/customization/silhouettes', data);
    return res.data.data;
  },
  updateSilhouette: async (id: string, data: Partial<CustomSilhouette>): Promise<CustomSilhouette> => {
    const res = await apiClient.put<ApiResponse<CustomSilhouette>>(`/admin/customization/silhouettes/${id}`, data);
    return res.data.data;
  },
  deleteSilhouette: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/customization/silhouettes/${id}`);
  },

  // Leathers
  createLeather: async (data: Partial<CustomLeather>): Promise<CustomLeather> => {
    const res = await apiClient.post<ApiResponse<CustomLeather>>('/admin/customization/leathers', data);
    return res.data.data;
  },
  updateLeather: async (id: string, data: Partial<CustomLeather>): Promise<CustomLeather> => {
    const res = await apiClient.put<ApiResponse<CustomLeather>>(`/admin/customization/leathers/${id}`, data);
    return res.data.data;
  },
  deleteLeather: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/customization/leathers/${id}`);
  },

  // Colors
  createColor: async (data: Partial<CustomColor>): Promise<CustomColor> => {
    const res = await apiClient.post<ApiResponse<CustomColor>>('/admin/customization/colors', data);
    return res.data.data;
  },
  updateColor: async (id: string, data: Partial<CustomColor>): Promise<CustomColor> => {
    const res = await apiClient.put<ApiResponse<CustomColor>>(`/admin/customization/colors/${id}`, data);
    return res.data.data;
  },
  deleteColor: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/customization/colors/${id}`);
  },

  // Linings
  createLining: async (data: Partial<CustomLining>): Promise<CustomLining> => {
    const res = await apiClient.post<ApiResponse<CustomLining>>('/admin/customization/linings', data);
    return res.data.data;
  },
  updateLining: async (id: string, data: Partial<CustomLining>): Promise<CustomLining> => {
    const res = await apiClient.put<ApiResponse<CustomLining>>(`/admin/customization/linings/${id}`, data);
    return res.data.data;
  },
  deleteLining: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/customization/linings/${id}`);
  },

  // Hardware
  createHardware: async (data: Partial<CustomHardware>): Promise<CustomHardware> => {
    const res = await apiClient.post<ApiResponse<CustomHardware>>('/admin/customization/hardware', data);
    return res.data.data;
  },
  updateHardware: async (id: string, data: Partial<CustomHardware>): Promise<CustomHardware> => {
    const res = await apiClient.put<ApiResponse<CustomHardware>>(`/admin/customization/hardware/${id}`, data);
    return res.data.data;
  },
  deleteHardware: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/customization/hardware/${id}`);
  },
};
