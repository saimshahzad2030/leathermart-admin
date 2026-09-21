import { apiClient } from './client';
import { ApiResponse, ProductReview, Pagination } from '@/types';

export interface ReviewQueryParams {
  isApproved?: boolean;
  productId?: string;
  page?: number;
  limit?: number;
}

export interface ReviewListResult {
  reviews: ProductReview[];
  pagination: Pagination;
}

export const reviewsApi = {
  listReviews: async (params: ReviewQueryParams = {}): Promise<ReviewListResult> => {
    const res = await apiClient.get<ApiResponse<{ reviews: ProductReview[]; pagination: Pagination }>>(
      '/admin/reviews',
      { params }
    );
    const data = res.data.data;
    return {
      reviews: data?.reviews || [],
      pagination: data?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: data?.reviews?.length || 0,
        limit: params.limit || 20,
      },
    };
  },

  moderateReview: async (id: string, isApproved: boolean): Promise<any> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/reviews/${id}/approve`, { isApproved });
    return res.data.data;
  },

  deleteReview: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/reviews/${id}`);
  },
};
