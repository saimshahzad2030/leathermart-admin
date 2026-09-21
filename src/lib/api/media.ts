import { apiClient } from './client';
import { ApiResponse, MediaAsset, Pagination } from '@/types';

export interface MediaQueryParams {
  folder?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface MediaListResult {
  assets: MediaAsset[];
  pagination: Pagination;
}

export const mediaApi = {
  upload: async (file: File, folder: string = 'general', altText: string = ''): Promise<MediaAsset> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', folder);
    if (altText) {
      formData.append('altText', altText);
    }

    const res = await apiClient.post<ApiResponse<MediaAsset>>('/admin/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data.data;
  },

  listMedia: async (params: MediaQueryParams = {}): Promise<MediaListResult> => {
    const res = await apiClient.get<ApiResponse<MediaAsset[]>>('/admin/media', { params });
    return {
      assets: res.data.data || [],
      pagination: res.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: res.data.data?.length || 0,
        limit: params.limit || 24,
      },
    };
  },

  deleteMedia: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/media/${id}`);
  },
};
