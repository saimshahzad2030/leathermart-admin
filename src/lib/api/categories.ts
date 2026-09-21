import { apiClient } from './client';
import { ApiResponse, Category, Collection } from '@/types';

export const categoriesApi = {
  listCategories: async (): Promise<Category[]> => {
    const res = await apiClient.get<ApiResponse<Category[]>>('/admin/categories');
    return res.data.data || [];
  },

  createCategory: async (categoryData: Partial<Category>): Promise<Category> => {
    const res = await apiClient.post<ApiResponse<Category>>('/admin/categories', categoryData);
    return res.data.data;
  },

  updateCategory: async (id: string, updates: Partial<Category>): Promise<Category> => {
    const res = await apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, updates);
    return res.data.data;
  },

  deleteCategory: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`);
  },

  reorderCategories: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.put<ApiResponse<null>>('/admin/categories/reorder', { items });
  },

  // Capsule Collections
  listCollections: async (): Promise<Collection[]> => {
    const res = await apiClient.get<ApiResponse<Collection[]>>('/admin/collections');
    return res.data.data || [];
  },

  createCollection: async (collectionData: Partial<Collection>): Promise<Collection> => {
    const res = await apiClient.post<ApiResponse<Collection>>('/admin/collections', collectionData);
    return res.data.data;
  },

  updateCollection: async (id: string, updates: Partial<Collection>): Promise<Collection> => {
    const res = await apiClient.put<ApiResponse<Collection>>(`/admin/collections/${id}`, updates);
    return res.data.data;
  },

  deleteCollection: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/collections/${id}`);
  },
};
