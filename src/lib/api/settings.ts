import axios from 'axios';
import { apiClient, API_BASE_URL } from './client';
import { ApiResponse, SiteSetting, MegaMenuPayload, SystemHealth } from '@/types';

export const settingsApi = {
  getSettings: async (): Promise<SiteSetting> => {
    const res = await apiClient.get<ApiResponse<SiteSetting>>('/admin/settings');
    return res.data.data;
  },

  updateSettings: async (payload: Partial<SiteSetting>): Promise<SiteSetting> => {
    const res = await apiClient.patch<ApiResponse<SiteSetting>>('/admin/settings', payload);
    return res.data.data;
  },

  updateSearchKeywords: async (keywords: string[]): Promise<string[]> => {
    const res = await apiClient.put<ApiResponse<string[]>>('/admin/settings/search-keywords', { keywords });
    return res.data.data;
  },

  getNavigation: async (): Promise<Record<string, MegaMenuPayload>> => {
    const res = await apiClient.get<ApiResponse<Record<string, MegaMenuPayload>>>('/admin/navigation/mega-menu');
    return res.data.data;
  },

  updateNavigationMenu: async (menuKey: string, payload: MegaMenuPayload): Promise<any> => {
    const res = await apiClient.put<ApiResponse<any>>(`/admin/navigation/mega-menu/${menuKey}`, { payload });
    return res.data.data;
  },

  getHealth: async (): Promise<SystemHealth> => {
    // Health is served at /api/health directly
    const origin = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
    const res = await axios.get<ApiResponse<SystemHealth>>(`${origin}/api/health`, { timeout: 4000 });
    return res.data.data;
  },
};
