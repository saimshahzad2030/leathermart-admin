import { apiClient } from './client';
import { ApiResponse, CmsSection, Testimonial, SocialLook, NewsletterSubscriber } from '@/types';

export const cmsApi = {
  // CMS Homepage Sections
  getAllSections: async (): Promise<CmsSection[]> => {
    const res = await apiClient.get<ApiResponse<CmsSection[]>>('/admin/cms/sections');
    return res.data.data || [];
  },

  getSection: async (sectionKey: string): Promise<CmsSection> => {
    const res = await apiClient.get<ApiResponse<CmsSection>>(`/admin/cms/sections/${sectionKey}`);
    return res.data.data;
  },

  updateSection: async (sectionKey: string, payload: Partial<CmsSection>): Promise<CmsSection> => {
    const res = await apiClient.put<ApiResponse<CmsSection>>(`/admin/cms/sections/${sectionKey}`, payload);
    return res.data.data;
  },

  toggleVisibility: async (sectionKey: string, isVisible: boolean): Promise<any> => {
    const res = await apiClient.patch<ApiResponse<any>>(`/admin/cms/sections/${sectionKey}/visibility`, { isVisible });
    return res.data.data;
  },

  reorderSections: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.put<ApiResponse<null>>('/admin/cms/sections/reorder', { items });
  },

  // Testimonials
  listTestimonials: async (): Promise<Testimonial[]> => {
    const res = await apiClient.get<ApiResponse<Testimonial[]>>('/admin/testimonials');
    return res.data.data || [];
  },

  createTestimonial: async (payload: Partial<Testimonial>): Promise<Testimonial> => {
    const res = await apiClient.post<ApiResponse<Testimonial>>('/admin/testimonials', payload);
    return res.data.data;
  },

  updateTestimonial: async (id: string, payload: Partial<Testimonial>): Promise<Testimonial> => {
    const res = await apiClient.put<ApiResponse<Testimonial>>(`/admin/testimonials/${id}`, payload);
    return res.data.data;
  },

  deleteTestimonial: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/testimonials/${id}`);
  },

  reorderTestimonials: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.put<ApiResponse<null>>('/admin/testimonials/reorder', { items });
  },

  // Social Looks (Instagram Feed)
  listSocialLooks: async (): Promise<SocialLook[]> => {
    const res = await apiClient.get<ApiResponse<SocialLook[]>>('/admin/social-looks');
    return res.data.data || [];
  },

  createSocialLook: async (payload: Partial<SocialLook>): Promise<SocialLook> => {
    const res = await apiClient.post<ApiResponse<SocialLook>>('/admin/social-looks', payload);
    return res.data.data;
  },

  updateSocialLook: async (id: string, payload: Partial<SocialLook>): Promise<SocialLook> => {
    const res = await apiClient.put<ApiResponse<SocialLook>>(`/admin/social-looks/${id}`, payload);
    return res.data.data;
  },

  deleteSocialLook: async (id: string): Promise<void> => {
    await apiClient.delete<ApiResponse<null>>(`/admin/social-looks/${id}`);
  },

  reorderSocialLooks: async (items: Array<{ id: string; order: number }>): Promise<void> => {
    await apiClient.put<ApiResponse<null>>('/admin/social-looks/reorder', { items });
  },

  // Newsletter Subscribers
  listSubscribers: async (): Promise<NewsletterSubscriber[]> => {
    const res = await apiClient.get<ApiResponse<NewsletterSubscriber[]>>('/admin/subscribers');
    return res.data.data || [];
  },
};
