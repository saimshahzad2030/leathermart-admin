import { apiClient } from './client';
import { ApiResponse, DepartmentNavData } from '@/types';

export const navigationApi = {
  // ==========================================
  // Mega Menu (Legacy & Unified JSON Workflow)
  // ==========================================

  /**
   * Fetch all navigation mega menus (Men & Women)
   * GET /api/v1/admin/navigation/mega-menu
   */
  getAllMenus: async (): Promise<{ men?: DepartmentNavData; women?: DepartmentNavData }> => {
    const res = await apiClient.get<ApiResponse<any>>('/admin/navigation/mega-menu');
    const data = res.data?.data;
    if (!data) return {};

    if (data.men || data.women) {
      return {
        men: data.men,
        women: data.women,
      };
    }

    if (Array.isArray(data)) {
      const men = data.find((item: any) => item?.id === 'men' || item?.key === 'men' || item?.department === 'men');
      const women = data.find((item: any) => item?.id === 'women' || item?.key === 'women' || item?.department === 'women');
      return { men, women };
    }

    return data;
  },

  /**
   * Fetch a specific department navigation menu
   * GET /api/v1/admin/navigation/mega-menu?menu=men|women
   */
  getMenu: async (menu: 'men' | 'women'): Promise<DepartmentNavData> => {
    const res = await apiClient.get<ApiResponse<any>>(
      `/admin/navigation/mega-menu?menu=${menu}`
    );
    const data = res.data?.data;
    if (data && data[menu]) {
      return data[menu];
    }
    return data;
  },

  /**
   * Save a complete department navigation menu
   * - Save Draft: PUT /api/v1/admin/navigation/mega-menu/:menuKey?draft=true
   * - Publish Live: PUT /api/v1/admin/navigation/mega-menu/:menuKey
   * Body: { payload: <DepartmentNavData> }
   */
  updateMenu: async (
    menuKey: 'men' | 'women',
    payload: DepartmentNavData,
    isDraft: boolean = false
  ): Promise<DepartmentNavData> => {
    const url = isDraft
      ? `/admin/navigation/mega-menu/${menuKey}?draft=true`
      : `/admin/navigation/mega-menu/${menuKey}`;

    const res = await apiClient.put<ApiResponse<any>>(url, { payload });
    const data = res.data?.data;
    if (data && data[menuKey]) {
      return data[menuKey];
    }
    return data;
  },

  /**
   * Verify public storefront navigation
   * GET /api/v1/content/navigation?department=men|women
   */
  getStorefrontNavigation: async (
    department: 'men' | 'women'
  ): Promise<DepartmentNavData | null> => {
    const res = await apiClient.get<ApiResponse<any>>(
      `/content/navigation?department=${department}`
    );
    const data = res.data?.data;
    if (data && data[department]) {
      return data[department];
    }
    return data || null;
  },
};
