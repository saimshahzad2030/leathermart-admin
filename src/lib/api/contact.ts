import { apiClient } from './client';
import { ContactMessage, ContactQueryParams } from '@/types';

export interface ContactListResult {
  data: ContactMessage[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

export const contactApi = {
  listMessages: async (params: ContactQueryParams = {}): Promise<ContactListResult> => {
    const res = await apiClient.get('/admin/contact-messages', { params });
    return res.data;
  },

  getMessage: async (id: string): Promise<ContactMessage> => {
    const res = await apiClient.get(`/admin/contact-messages/${id}`);
    return res.data.data;
  },

  updateMessage: async (
    id: string,
    payload: { status?: string; adminNotes?: string }
  ): Promise<ContactMessage> => {
    const res = await apiClient.patch(`/admin/contact-messages/${id}`, payload);
    return res.data.data;
  },

  deleteMessage: async (id: string): Promise<{ id: string }> => {
    const res = await apiClient.delete(`/admin/contact-messages/${id}`);
    return res.data.data;
  },
};
