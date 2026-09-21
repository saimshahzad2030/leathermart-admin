import { apiClient } from './client';
import { ApiResponse, Product, Pagination } from '@/types';

export interface ProductQueryParams {
  page?: number;
  limit?: number;
  status?: 'published' | 'draft' | 'all';
  category?: string;
  gender?: 'men' | 'women' | 'unisex' | 'all';
  search?: string;
  sort?: 'featured' | 'newest' | 'price-asc' | 'price-desc' | 'rating';
  min_price?: number;
  max_price?: number;
  is_featured?: boolean;
  is_bestseller?: boolean;
  is_new?: boolean;
}

export interface ProductListResult {
  products: Product[];
  pagination: Pagination;
}

export const productsApi = {
  listProducts: async (params: ProductQueryParams = {}): Promise<ProductListResult> => {
    const res = await apiClient.get<ApiResponse<Product[]>>('/admin/products', { params });
    return {
      products: res.data.data || [],
      pagination: res.data.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalCount: res.data.data?.length || 0,
        limit: params.limit || 12,
      },
    };
  },

  getProductById: async (id: string): Promise<Product> => {
    const res = await apiClient.get<ApiResponse<Product>>(`/admin/products/${id}`);
    return res.data.data;
  },

  createProduct: async (payload: Partial<Product>): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>('/admin/products', payload);
    return res.data.data;
  },

  updateProduct: async (id: string, payload: Partial<Product>): Promise<Product> => {
    const res = await apiClient.put<ApiResponse<Product>>(`/admin/products/${id}`, payload);
    return res.data.data;
  },

  deleteProduct: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/products/${id}`);
  },

  togglePublish: async (id: string): Promise<{ id: string; isPublished: boolean }> => {
    const res = await apiClient.post<ApiResponse<{ id: string; isPublished: boolean }>>(`/admin/products/${id}/publish`);
    return res.data.data;
  },

  duplicateProduct: async (id: string): Promise<Product> => {
    const res = await apiClient.post<ApiResponse<Product>>(`/admin/products/${id}/duplicate`);
    return res.data.data;
  },

  bulkAction: async (action: 'publish' | 'unpublish' | 'delete', ids: string[]): Promise<void> => {
    await apiClient.post<ApiResponse<null>>('/admin/products/bulk', { action, ids });
  },

  reorderProducts: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.put<ApiResponse<null>>('/admin/products/reorder', { items });
  },
};
