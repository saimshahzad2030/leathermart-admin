import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { PlatformBranding } from '@/types';

export interface BrandingContextValue {
  branding: PlatformBranding;
  isLoading: boolean;
  refetch: () => void;
  updateBrandingState: (newBranding: PlatformBranding) => void;
}

export const defaultBranding: PlatformBranding = {
  platformName: 'Atelier Valenti Milano',
  platformShortName: 'AVM',
  logoUrl: null,
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  browserTitle: 'Atelier Valenti Milano — Handcrafted European Leather Outerwear',
  metaDescription: 'Luxury Italian calfskin and lambskin outerwear crafted by hand in our Milanese atelier.',
};

const BrandingContext = createContext<BrandingContextValue>({
  branding: defaultBranding,
  isLoading: false,
  refetch: () => {},
  updateBrandingState: () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [overrideBranding, setOverrideBranding] = useState<PlatformBranding | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['public-branding'],
    queryFn: () => settingsApi.getPublicBranding(),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });

  const branding: PlatformBranding = overrideBranding || data || defaultBranding;

  const updateBrandingState = useCallback(
    (newBranding: PlatformBranding) => {
      setOverrideBranding(newBranding);
      queryClient.setQueryData(['public-branding'], newBranding);
      queryClient.setQueryData(['admin-branding'], newBranding);
      queryClient.invalidateQueries({ queryKey: ['admin-branding'] });
      queryClient.invalidateQueries({ queryKey: ['public-branding'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    [queryClient]
  );

  // Dynamically update document title and favicon
  useEffect(() => {
    if (branding.browserTitle) {
      document.title = branding.browserTitle;
    } else {
      document.title = defaultBranding.browserTitle;
    }

    let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    if (branding.faviconUrl) {
      link.href = branding.faviconUrl;
    } else {
      link.href = '/favicon.ico';
    }
  }, [branding.browserTitle, branding.faviconUrl]);

  return (
    <BrandingContext.Provider value={{ branding, isLoading, refetch, updateBrandingState }}>
      {children}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
