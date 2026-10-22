import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { PlatformBranding } from '@/types';
import { useBranding } from '@/context/BrandingContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { FormSettingsSkeleton } from '@/components/common/Skeleton';
import {
  Sparkles,
  Save,
  RotateCcw,
  Globe,
  Image as ImageIcon,
  Moon,
  Sun,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  ExternalLink,
  Shield,
  Eye,
  Search,
  ShoppingBag,
  Menu,
} from 'lucide-react';

interface PlatformBrandingTabProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

export const PlatformBrandingTab: React.FC<PlatformBrandingTabProps> = ({ onDirtyChange }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { updateBrandingState } = useBranding();

  // Load current branding from backend
  const {
    data: brandingData,
    isLoading,
    isFetching,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ['admin-branding'],
    queryFn: () => settingsApi.getBranding(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Baseline state representing last saved/loaded data
  const [baseline, setBaseline] = useState<PlatformBranding | null>(null);

  // Editable Form State
  const [platformName, setPlatformName] = useState('');
  const [platformShortName, setPlatformShortName] = useState('');
  const [browserTitle, setBrowserTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [logoDarkUrl, setLogoDarkUrl] = useState('');
  const [logoLightUrl, setLogoLightUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('');

  // Validation & Error State
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  // Populate form when data is loaded
  useEffect(() => {
    if (brandingData) {
      setBaseline(brandingData);
      setPlatformName(brandingData.platformName || '');
      setPlatformShortName(brandingData.platformShortName || '');
      setBrowserTitle(brandingData.browserTitle || '');
      setMetaDescription(brandingData.metaDescription || '');
      setLogoUrl(brandingData.logoUrl || '');
      setLogoDarkUrl(brandingData.logoDarkUrl || '');
      setLogoLightUrl(brandingData.logoLightUrl || '');
      setFaviconUrl(brandingData.faviconUrl || '');
      setFieldErrors({});
      setGeneralError('');
    }
  }, [brandingData]);

  // Compute dirty state (has the user modified anything compared to baseline?)
  const isDirty = useMemo(() => {
    if (!baseline) return false;
    return (
      platformName.trim() !== (baseline.platformName || '').trim() ||
      platformShortName.trim() !== (baseline.platformShortName || '').trim() ||
      browserTitle.trim() !== (baseline.browserTitle || '').trim() ||
      metaDescription.trim() !== (baseline.metaDescription || '').trim() ||
      (logoUrl || '').trim() !== (baseline.logoUrl || '').trim() ||
      (logoDarkUrl || '').trim() !== (baseline.logoDarkUrl || '').trim() ||
      (logoLightUrl || '').trim() !== (baseline.logoLightUrl || '').trim() ||
      (faviconUrl || '').trim() !== (baseline.faviconUrl || '').trim()
    );
  }, [
    baseline,
    platformName,
    platformShortName,
    browserTitle,
    metaDescription,
    logoUrl,
    logoDarkUrl,
    logoLightUrl,
    faviconUrl,
  ]);

  // Notify parent of dirty change
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(isDirty);
    }
  }, [isDirty, onDirtyChange]);

  // Warn about unsaved changes on browser tab close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Client-side pre-validation
  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    const trimmedName = platformName.trim();
    if (!trimmedName) {
      errors.platformName = ['Platform name is required.'];
    } else if (trimmedName.length > 150) {
      errors.platformName = ['Platform name cannot exceed 150 characters.'];
    }

    const trimmedShortName = platformShortName.trim();
    if (trimmedShortName && trimmedShortName.length > 50) {
      errors.platformShortName = ['Short name cannot exceed 50 characters.'];
    }

    const trimmedTitle = browserTitle.trim();
    if (!trimmedTitle) {
      errors.browserTitle = ['Browser tab title is required.'];
    } else if (trimmedTitle.length > 200) {
      errors.browserTitle = ['Browser title cannot exceed 200 characters.'];
    }

    const trimmedMeta = metaDescription.trim();
    if (trimmedMeta && trimmedMeta.length > 1000) {
      errors.metaDescription = ['Meta description cannot exceed 1000 characters.'];
    }

    // Validate URLs if present
    const urlPattern = /^(https?:\/\/|\/)/;
    if (logoUrl.trim() && !urlPattern.test(logoUrl.trim())) {
      errors.logoUrl = ['Must be a valid URL starting with http://, https://, or /'];
    }
    if (logoDarkUrl.trim() && !urlPattern.test(logoDarkUrl.trim())) {
      errors.logoDarkUrl = ['Must be a valid URL starting with http://, https://, or /'];
    }
    if (logoLightUrl.trim() && !urlPattern.test(logoLightUrl.trim())) {
      errors.logoLightUrl = ['Must be a valid URL starting with http://, https://, or /'];
    }
    if (faviconUrl.trim() && !urlPattern.test(faviconUrl.trim())) {
      errors.faviconUrl = ['Must be a valid URL starting with http://, https://, or /'];
    }

    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setGeneralError('Please correct the validation errors below before saving.');
      toast.error('Validation failed. Please review the highlighted fields.');
      return false;
    }

    setGeneralError('');
    return true;
  };

  // Discard / Reset changes back to baseline
  const handleDiscardChanges = () => {
    if (!baseline) return;
    setPlatformName(baseline.platformName || '');
    setPlatformShortName(baseline.platformShortName || '');
    setBrowserTitle(baseline.browserTitle || '');
    setMetaDescription(baseline.metaDescription || '');
    setLogoUrl(baseline.logoUrl || '');
    setLogoDarkUrl(baseline.logoDarkUrl || '');
    setLogoLightUrl(baseline.logoLightUrl || '');
    setFaviconUrl(baseline.faviconUrl || '');
    setFieldErrors({});
    setGeneralError('');
    toast.info('Discarded unsaved branding modifications.');
  };

  // Save Branding Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build clean payload preserving baseline for omitted fields
      const payload: Partial<PlatformBranding> = {
        platformName: platformName.trim(),
        platformShortName: platformShortName.trim() || null,
        browserTitle: browserTitle.trim(),
        metaDescription: metaDescription.trim() || null,
        logoUrl: logoUrl.trim() || null,
        logoDarkUrl: logoDarkUrl.trim() || null,
        logoLightUrl: logoLightUrl.trim() || null,
        faviconUrl: faviconUrl.trim() || null,
      };

      return settingsApi.updateBranding(payload);
    },
    onSuccess: (updatedData) => {
      setBaseline(updatedData);
      setFieldErrors({});
      setGeneralError('');
      // Update BrandingContext immediately
      updateBrandingState(updatedData);
      toast.success('Platform branding updated and published dynamically.');
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update platform branding.');
      setFieldErrors(parsed.fieldErrors);
      setGeneralError(parsed.message);
      toast.error(parsed.message);
      // User's modifications remain intact in the form!
    },
  });

  const handleSave = () => {
    if (!validateForm()) return;
    saveMutation.mutate();
  };

  // Active logos for live preview calculation
  const previewFavicon = faviconUrl || '/favicon.ico';
  const previewTitle = browserTitle.trim() || platformName.trim() || 'Atelier Valenti Milano';
  const previewShortName =
    platformShortName.trim() ||
    (platformName.trim() ? platformName.trim().slice(0, 2).toUpperCase() : 'AV');

  if (isLoading && !baseline) {
    return <FormSettingsSkeleton />;
  }

  if (loadError && !baseline) {
    return (
      <div className="p-8 rounded-2xl bg-surface border border-rose-500/20 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
        <h3 className="text-base font-bold text-primary">Failed to load platform branding</h3>
        <p className="text-xs text-muted max-w-md mx-auto">
          Could not communicate with the branding settings API. Please verify backend connectivity.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} leftIcon={<RotateCcw className="w-4 h-4" />}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Action Bar & Sync Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-theme shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-primary">Platform Branding & Identity</h2>
              {isDirty ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[10px] font-semibold uppercase tracking-wider">
                  <AlertTriangle className="w-3 h-3" /> Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-semibold uppercase tracking-wider">
                  <CheckCircle2 className="w-3 h-3" /> Synchronized
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Customize platform name, typography, dark/light logos, and browser titles.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDiscardChanges}
            disabled={!isDirty || saveMutation.isPending}
            leftIcon={<RotateCcw className="w-4 h-4" />}
          >
            Discard
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={!isDirty || saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Changes
          </Button>
        </div>
      </div>

      {generalError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2.5 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span className="font-medium">{generalError}</span>
        </div>
      )}

      {/* Main Grid: Settings on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form Fields */}
        <div className="lg:col-span-7 space-y-6">
          {/* Section 1: General Branding */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-theme">
              <Globe className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                General Brand Identity
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2">
                <FormField
                  label="Platform Name"
                  required
                  description="Primary brand name displayed on storefront, emails, and header."
                  error={getFieldError(fieldErrors, 'platformName', 'platform_name')}
                  id="platformName"
                >
                  <Input
                    id="platformName"
                    placeholder="e.g. Atelier Valenti Milano"
                    value={platformName}
                    maxLength={150}
                    onChange={(e) => {
                      setPlatformName(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'platformName', 'platform_name'));
                    }}
                    rightIcon={
                      <span className="text-[10px] text-muted font-mono">{platformName.length}/150</span>
                    }
                  />
                </FormField>
              </div>

              <div>
                <FormField
                  label="Short Name"
                  description="Used in compact views and badges."
                  error={getFieldError(fieldErrors, 'platformShortName', 'platform_short_name')}
                  id="platformShortName"
                >
                  <Input
                    id="platformShortName"
                    placeholder="e.g. AVM"
                    value={platformShortName}
                    maxLength={50}
                    onChange={(e) => {
                      setPlatformShortName(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'platformShortName', 'platform_short_name'));
                    }}
                    rightIcon={
                      <span className="text-[10px] text-muted font-mono">{platformShortName.length}/50</span>
                    }
                  />
                </FormField>
              </div>
            </div>

            <FormField
              label="Browser Tab Title"
              required
              description="Appears in browser tabs and search engine title tags."
              error={getFieldError(fieldErrors, 'browserTitle', 'browser_title')}
              id="browserTitle"
            >
              <Input
                id="browserTitle"
                placeholder="e.g. Atelier Valenti Milano — Handcrafted European Leather Outerwear"
                value={browserTitle}
                maxLength={200}
                onChange={(e) => {
                  setBrowserTitle(e.target.value);
                  setFieldErrors((prev) => clearFieldError(prev, 'browserTitle', 'browser_title'));
                }}
                rightIcon={
                  <span className="text-[10px] text-muted font-mono">{browserTitle.length}/200</span>
                }
              />
            </FormField>

            <FormField
              label="Meta Description"
              description="Summary used by search engines (Google) and social media link previews."
              error={getFieldError(fieldErrors, 'metaDescription', 'meta_description')}
              id="metaDescription"
            >
              <Textarea
                id="metaDescription"
                rows={3}
                placeholder="e.g. Luxury Italian calfskin and lambskin outerwear crafted by hand in our Milanese atelier..."
                value={metaDescription}
                maxLength={1000}
                onChange={(e) => {
                  setMetaDescription(e.target.value);
                  setFieldErrors((prev) => clearFieldError(prev, 'metaDescription', 'meta_description'));
                }}
              />
              <div className="flex justify-end pt-1">
                <span className="text-[10px] text-muted font-mono">{metaDescription.length}/1000</span>
              </div>
            </FormField>
          </div>

          {/* Section 2: Logo & Visual Assets */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6">
            <div className="flex items-center gap-2 pb-3 border-b border-theme">
              <ImageIcon className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Logo & Visual Assets
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Primary Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Primary Logo
                  </span>
                  <span className="text-[10px] text-muted">Universal Brand Mark</span>
                </div>
                <ImageUploader
                  value={logoUrl}
                  onChange={(url) => {
                    setLogoUrl(url);
                    setFieldErrors((prev) => clearFieldError(prev, 'logoUrl', 'logo_url'));
                  }}
                  folder="branding"
                  label="Primary Logo"
                  fit="contain"
                  previewBg="checker"
                  heightClass="h-40"
                  helperText="SVG, PNG, or WebP with transparent background"
                />
                {fieldErrors.logoUrl && (
                  <p className="text-xs text-rose-500 font-medium">{fieldErrors.logoUrl.join(', ')}</p>
                )}
              </div>

              {/* Favicon */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-secondary">
                    Browser Favicon
                  </span>
                  <span className="text-[10px] text-muted">1:1 Square Icon</span>
                </div>
                <ImageUploader
                  value={faviconUrl}
                  onChange={(url) => {
                    setFaviconUrl(url);
                    setFieldErrors((prev) => clearFieldError(prev, 'faviconUrl', 'favicon_url'));
                  }}
                  folder="branding"
                  label="Browser Favicon"
                  fit="contain"
                  previewBg="checker"
                  heightClass="h-40"
                  helperText="ICO, PNG, or SVG (32×32 or 64×64 recommended)"
                />
                {fieldErrors.faviconUrl && (
                  <p className="text-xs text-rose-500 font-medium">{fieldErrors.faviconUrl.join(', ')}</p>
                )}
              </div>

              {/* Dark-Mode Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
                    <Moon className="w-3.5 h-3.5 text-amber-400" />
                    <span>Dark-Mode Logo</span>
                  </div>
                  <span className="text-[10px] text-muted">Dark Surface Contrast</span>
                </div>
                <ImageUploader
                  value={logoDarkUrl}
                  onChange={(url) => {
                    setLogoDarkUrl(url);
                    setFieldErrors((prev) => clearFieldError(prev, 'logoDarkUrl', 'logo_dark_url'));
                  }}
                  folder="branding"
                  label="Dark-Mode Logo"
                  fit="contain"
                  previewBg="dark"
                  heightClass="h-40"
                  helperText="Light/metallic graphics on transparent background"
                />
                {fieldErrors.logoDarkUrl && (
                  <p className="text-xs text-rose-500 font-medium">{fieldErrors.logoDarkUrl.join(', ')}</p>
                )}
              </div>

              {/* Light-Mode Logo */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-secondary">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>Light-Mode Logo</span>
                  </div>
                  <span className="text-[10px] text-muted">Light Surface Contrast</span>
                </div>
                <ImageUploader
                  value={logoLightUrl}
                  onChange={(url) => {
                    setLogoLightUrl(url);
                    setFieldErrors((prev) => clearFieldError(prev, 'logoLightUrl', 'logo_light_url'));
                  }}
                  folder="branding"
                  label="Light-Mode Logo"
                  fit="contain"
                  previewBg="light"
                  heightClass="h-40"
                  helperText="Dark graphics on transparent background"
                />
                {fieldErrors.logoLightUrl && (
                  <p className="text-xs text-rose-500 font-medium">{fieldErrors.logoLightUrl.join(', ')}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Interactive Real-Time Live Preview */}
        <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-20">
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Real-Time Live Preview
                </h3>
              </div>
              <span className="text-[10px] text-muted font-mono">Updates Instantly</span>
            </div>

            {/* 1. Simulated Browser Tab */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                Simulated Browser Window & Tab
              </span>
              <div className="rounded-xl border border-theme bg-zinc-950 overflow-hidden shadow-md">
                {/* Browser Title Bar & Tab */}
                <div className="bg-zinc-900 px-3 pt-2 pb-1.5 flex items-center gap-3 border-b border-zinc-800">
                  {/* Window Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                  </div>

                  {/* Active Tab */}
                  <div className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-t-lg border-t border-x border-zinc-800 text-xs max-w-[260px] truncate shadow-inner">
                    {previewFavicon ? (
                      <img
                        src={previewFavicon}
                        alt="Favicon Preview"
                        className="w-3.5 h-3.5 object-contain shrink-0 rounded-xs"
                        onError={(e) => {
                          (e.currentTarget as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <Globe className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    )}
                    <span className="text-[11px] font-medium text-zinc-200 truncate">
                      {previewTitle}
                    </span>
                    <span className="text-zinc-500 hover:text-zinc-300 ml-auto cursor-pointer text-xs">
                      ×
                    </span>
                  </div>
                </div>

                {/* Simulated URL Bar */}
                <div className="bg-zinc-950 px-3 py-1.5 flex items-center gap-2 border-b border-zinc-900">
                  <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800/80 text-[10px] text-zinc-400 font-mono w-full truncate">
                    <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span className="text-zinc-500">https://</span>
                    <span className="text-zinc-300">
                      {platformName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'ateliervalenti'}.com
                    </span>
                  </div>
                </div>

                {/* Browser Viewport: Storefront Header Simulation */}
                <div className="bg-zinc-950 p-4 space-y-3">
                  {/* Announcement Bar */}
                  <div className="bg-amber-500/10 border-b border-amber-500/20 py-1 px-3 text-[10px] text-center text-amber-400 font-mono tracking-wider">
                    COMPLIMENTARY EUROPEAN EXPRESS DELIVERY OVER €250
                  </div>

                  {/* Storefront Nav Header */}
                  <div className="flex items-center justify-between px-2 py-2 border-b border-zinc-900 gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Menu className="w-4 h-4 text-zinc-400 sm:hidden shrink-0" />
                      <div className="flex items-center gap-2 min-w-0">
                        {logoDarkUrl || logoUrl ? (
                          <img
                            src={logoDarkUrl || logoUrl}
                            alt="Logo preview"
                            className="h-6 w-auto max-w-[100px] object-contain shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-md bg-zinc-900 border border-amber-500/30 flex items-center justify-center shrink-0">
                            <span className="font-serif-luxury font-bold text-amber-500 text-[10px]">
                              {previewShortName}
                            </span>
                          </div>
                        )}
                        <span className="font-serif-luxury font-bold text-xs tracking-wider text-zinc-100 truncate">
                          {platformName || 'ATELIER VALENTI MILANO'}
                        </span>
                      </div>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 text-[10px] text-zinc-400 tracking-widest font-mono shrink-0">
                      <span className="hover:text-amber-400 cursor-pointer">OUTERWEAR</span>
                      <span className="hover:text-amber-400 cursor-pointer">BESPOKE</span>
                    </div>

                    <div className="flex items-center gap-2 text-zinc-400 shrink-0">
                      <Search className="w-3.5 h-3.5" />
                      <ShoppingBag className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                  </div>

                  <p className="text-[11px] text-zinc-500 italic px-2">
                    {metaDescription ||
                      'Luxury Italian calfskin and lambskin outerwear crafted by hand in our Milanese atelier.'}
                  </p>
                </div>
              </div>
            </div>

            {/* 2. Theme Contrast Previews (Dark vs Light) */}
            <div className="space-y-3 pt-2">
              <span className="text-[11px] font-semibold text-secondary uppercase tracking-wider">
                Surface Contrast Tests
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dark Background Contrast */}
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col items-center justify-center text-center gap-2 shadow-xs">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                    <Moon className="w-3 h-3 text-amber-400" /> Dark Surface
                  </div>
                  <div className="h-14 w-full flex items-center justify-center p-1">
                    {logoDarkUrl || logoUrl ? (
                      <img
                        src={logoDarkUrl || logoUrl}
                        alt="Dark logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 border border-amber-500/40 flex items-center justify-center">
                        <span className="font-serif-luxury font-bold text-amber-500 text-base">
                          {previewShortName}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-serif-luxury font-bold text-zinc-200 tracking-wider">
                    {platformName || 'ATELIER VALENTI'}
                  </span>
                </div>

                {/* Light Background Contrast */}
                <div className="rounded-xl border border-zinc-300 bg-zinc-100 p-4 flex flex-col items-center justify-center text-center gap-2 shadow-xs">
                  <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-mono text-zinc-500">
                    <Sun className="w-3 h-3 text-amber-600" /> Light Surface
                  </div>
                  <div className="h-14 w-full flex items-center justify-center p-1">
                    {logoLightUrl || logoUrl ? (
                      <img
                        src={logoLightUrl || logoUrl}
                        alt="Light logo preview"
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-zinc-200 border border-zinc-400 flex items-center justify-center">
                        <span className="font-serif-luxury font-bold text-zinc-800 text-base">
                          {previewShortName}
                        </span>
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-serif-luxury font-bold text-zinc-900 tracking-wider">
                    {platformName || 'ATELIER VALENTI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
