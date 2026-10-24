import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { PlatformBranding } from '@/types';
import { BrandingBootstrapLoading } from '@/components/branding/BrandingBootstrapLoading';
import { BrandingBootstrapError } from '@/components/branding/BrandingBootstrapError';

export type BrandingLifecycleStatus = 'loading' | 'ready' | 'error';

export interface BrandingContextValue {
  branding: PlatformBranding;
  status: BrandingLifecycleStatus;
  isLoading: boolean;
  isReady: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<any> | void;
  retry: () => void;
  updateBrandingState: (newBranding: PlatformBranding) => void;
}

export const emptyBranding: PlatformBranding = {
  platformName: '',
  platformShortName: null,
  logoUrl: null,
  logoDarkUrl: null,
  logoLightUrl: null,
  faviconUrl: null,
  browserTitle: '',
  metaDescription: null,
};

// Maintained for backward compatibility, initialized with neutral values
export const defaultBranding: PlatformBranding = emptyBranding;

/**
 * Validates and normalizes raw platform branding payload.
 * Trims text fields, converts empty strings to null for optional assets,
 * and handles missing fields gracefully without fabricating identities.
 */
export function normalizeBranding(raw: any): PlatformBranding {
  if (!raw || typeof raw !== 'object') {
    throw new Error('Invalid platform configuration payload received.');
  }

  const source =
    raw && typeof raw === 'object' && 'data' in raw && raw.data && typeof raw.data === 'object'
      ? raw.data
      : raw;

  const platformName = typeof source.platformName === 'string' ? source.platformName.trim() : '';
  const platformShortName =
    typeof source.platformShortName === 'string' && source.platformShortName.trim()
      ? source.platformShortName.trim()
      : null;
  const logoUrl =
    typeof source.logoUrl === 'string' && source.logoUrl.trim()
      ? source.logoUrl.trim()
      : null;
  const logoDarkUrl =
    typeof source.logoDarkUrl === 'string' && source.logoDarkUrl.trim()
      ? source.logoDarkUrl.trim()
      : null;
  const logoLightUrl =
    typeof source.logoLightUrl === 'string' && source.logoLightUrl.trim()
      ? source.logoLightUrl.trim()
      : null;
  const faviconUrl =
    typeof source.faviconUrl === 'string' && source.faviconUrl.trim()
      ? source.faviconUrl.trim()
      : null;
  const browserTitle =
    typeof source.browserTitle === 'string' && source.browserTitle.trim()
      ? source.browserTitle.trim()
      : platformName
      ? `${platformName} | Executive Administration`
      : 'Executive Administration Console';
  const metaDescription =
    typeof source.metaDescription === 'string' && source.metaDescription.trim()
      ? source.metaDescription.trim()
      : null;

  return {
    platformName,
    platformShortName,
    logoUrl,
    logoDarkUrl,
    logoLightUrl,
    faviconUrl,
    browserTitle,
    metaDescription,
    updatedAt: source.updatedAt,
  };
}

const BrandingContext = createContext<BrandingContextValue>({
  branding: emptyBranding,
  status: 'loading',
  isLoading: true,
  isReady: false,
  isError: false,
  error: null,
  refetch: () => {},
  retry: () => {},
  updateBrandingState: () => {},
});

export const BrandingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = useQueryClient();
  const [overrideBranding, setOverrideBranding] = useState<PlatformBranding | null>(null);

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['public-branding'],
    queryFn: async () => {
      const raw = await settingsApi.getPublicBranding();
      return normalizeBranding(raw);
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
    retry: 1,
  });

  const activeBranding: PlatformBranding | null = overrideBranding || data || null;
  const hasFailed = isError && !activeBranding && !isFetching;
  const isInitialLoading = !activeBranding && !hasFailed;

  const status: BrandingLifecycleStatus = activeBranding
    ? 'ready'
    : hasFailed
    ? 'error'
    : 'loading';

  const updateBrandingState = useCallback(
    (newBranding: PlatformBranding) => {
      const normalized = normalizeBranding(newBranding);
      setOverrideBranding(normalized);
      queryClient.setQueryData(['public-branding'], normalized);
      queryClient.setQueryData(['admin-branding'], normalized);
      queryClient.invalidateQueries({ queryKey: ['admin-branding'] });
      queryClient.invalidateQueries({ queryKey: ['public-branding'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
    },
    [queryClient]
  );

  const handleRetry = useCallback(() => {
    refetch();
  }, [refetch]);

  // Dynamically update document title, meta description, and favicon once branding is ready
  useEffect(() => {
    if (!activeBranding) return;

    if (activeBranding.browserTitle) {
      document.title = activeBranding.browserTitle;
    } else if (activeBranding.platformName) {
      document.title = `${activeBranding.platformName} | Executive Administration`;
    }

    if (activeBranding.metaDescription) {
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', activeBranding.metaDescription);
      }
    }

    if (activeBranding.faviconUrl) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = activeBranding.faviconUrl;
    }
  }, [activeBranding]);

  const contextValue: BrandingContextValue = useMemo(
    () => ({
      branding: activeBranding || emptyBranding,
      status,
      isLoading: isInitialLoading || isFetching,
      isReady: status === 'ready',
      isError: status === 'error',
      error: (error as Error) || null,
      refetch,
      retry: handleRetry,
      updateBrandingState,
    }),
    [activeBranding, status, isInitialLoading, isFetching, error, refetch, handleRetry, updateBrandingState]
  );

  return (
    <BrandingContext.Provider value={contextValue}>
      {status === 'loading' ? (
        <BrandingBootstrapLoading />
      ) : status === 'error' ? (
        <BrandingBootstrapError onRetry={handleRetry} error={(error as Error) || null} />
      ) : (
        children
      )}
    </BrandingContext.Provider>
  );
};

export const useBranding = () => useContext(BrandingContext);
