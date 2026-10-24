import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { SiteSetting } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { FormSettingsSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { PlatformBrandingTab } from './components/PlatformBrandingTab';
import { FooterSettingsTab } from './components/FooterSettingsTab';
import {
  Sparkles,
  BellRing,
  Truck,
  Footprints,
  Search,
  Save,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'branding' | 'announcement' | 'shipping' | 'footer' | 'search'>('branding');
  const [isBrandingDirty, setIsBrandingDirty] = useState(false);
  const [isFooterDirty, setIsFooterDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [formError, setFormError] = useState('');

  const {
    data: settings,
    isLoading,
    isFetching: isSettingsFetching,
    refetch: refetchSettings,
  } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: () => settingsApi.getSettings(),
  });

  const {
    data: menus,
    isFetching: isMenusFetching,
    refetch: refetchMenus,
  } = useQuery({
    queryKey: ['admin-mega-menus'],
    queryFn: () => settingsApi.getNavigation(),
  });

  // Announcement state
  const [announcementEnabled, setAnnouncementEnabled] = useState(true);
  const [announcementBadge, setAnnouncementBadge] = useState('Milano Atelier');
  const [announcementMessage, setAnnouncementMessage] = useState('');
  const [announcementLinkText, setAnnouncementLinkText] = useState('EXPLORE BESPOKE');
  const [announcementLinkHref, setAnnouncementLinkHref] = useState('/customize');
  const [countryNotice, setCountryNotice] = useState('IT • DE • FR • CH • UK');

  // Shipping state
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(250);
  const [standardShippingCost, setStandardShippingCost] = useState<number>(15);
  const [countries, setCountries] = useState<Array<{ code: string; name: string; rate: number; days: string }>>([]);

  // Search Keywords state
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState('');

  // Populate from settings query
  useEffect(() => {
    if (settings) {
      if (settings.announcement) {
        setAnnouncementEnabled(settings.announcement.enabled);
        setAnnouncementBadge(settings.announcement.badge || '');
        setAnnouncementMessage(settings.announcement.message || '');
        setAnnouncementLinkText(settings.announcement.linkText || '');
        setAnnouncementLinkHref(settings.announcement.linkHref || '');
        setCountryNotice(settings.announcement.countryNotice || '');
      }
      if (settings.shipping) {
        setFreeShippingThreshold(settings.shipping.freeShippingThreshold || 250);
        setStandardShippingCost(settings.shipping.standardShippingCost || 15);
        setCountries(settings.shipping.countries || []);
      }
      if (settings.searchKeywords) {
        setKeywords(settings.searchKeywords);
      }
    }
  }, [settings]);

  // Save Settings Mutation (for announcement and shipping)
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<SiteSetting> = {
        announcement: {
          enabled: announcementEnabled,
          badge: announcementBadge,
          message: announcementMessage,
          linkText: announcementLinkText,
          linkHref: announcementLinkHref,
          countryNotice,
        },
        shipping: {
          freeShippingThreshold: Number(freeShippingThreshold),
          standardShippingCost: Number(standardShippingCost),
          countries,
        },
      };

      return settingsApi.updateSettings(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setFieldErrors({});
      setFormError('');
      toast.success('Store configuration updated successfully.');
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update store settings.');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      toast.error(parsed.message);
    },
  });

  // Save Keywords Mutation
  const saveKeywordsMutation = useMutation({
    mutationFn: () => settingsApi.updateSearchKeywords(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      setFieldErrors({});
      setFormError('');
      toast.success('Search suggestion keywords saved.');
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update search keywords.');
      setFieldErrors(parsed.fieldErrors);
      toast.error(parsed.message);
    },
  });

  const handleAddKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword('');
    }
  };

  const handleRemoveKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleTabChange = (tab: 'branding' | 'announcement' | 'shipping' | 'footer' | 'search') => {
    if (activeTab === 'branding' && tab !== 'branding' && isBrandingDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes in Platform Branding. Are you sure you want to discard them and leave this tab?'
      );
      if (!confirmLeave) return;
    }
    if (activeTab === 'footer' && tab !== 'footer' && isFooterDirty) {
      const confirmLeave = window.confirm(
        'You have unsaved changes in Footer Settings. Are you sure you want to discard them and leave this tab?'
      );
      if (!confirmLeave) return;
    }
    setActiveTab(tab);
    setFormError('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Store Configuration & Settings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure platform branding identity, global announcements, European shipping zones, and search chips
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={async () => {
              await Promise.allSettled([
                refetchSettings(),
                refetchMenus(),
                queryClient.invalidateQueries({ queryKey: ['admin-branding'] }),
                queryClient.invalidateQueries({ queryKey: ['admin-footer'] }),
              ]);
            }}
            isRefreshing={isSettingsFetching || isMenusFetching}
            title="Refresh store configuration"
          />

          {activeTab !== 'branding' && activeTab !== 'footer' && (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (activeTab === 'search') {
                  saveKeywordsMutation.mutate();
                } else {
                  saveSettingsMutation.mutate();
                }
              }}
              isLoading={saveSettingsMutation.isPending || saveKeywordsMutation.isPending}
              disabled={saveSettingsMutation.isPending || saveKeywordsMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Settings
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme pb-2">
        <button
          onClick={() => handleTabChange('branding')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'branding'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Platform Branding
        </button>

        <button
          onClick={() => handleTabChange('announcement')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'announcement'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <BellRing className="w-4 h-4" />
          Announcement Bar
        </button>

        <button
          onClick={() => handleTabChange('shipping')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'shipping'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Truck className="w-4 h-4" />
          European Shipping
        </button>

        <button
          onClick={() => handleTabChange('footer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Footprints className="w-4 h-4" />
          Footer & Navigation
        </button>

        <button
          onClick={() => handleTabChange('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'search'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Search className="w-4 h-4" />
          Search Suggestion Chips
        </button>
      </div>

      {formError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'branding' && (
        <PlatformBrandingTab onDirtyChange={setIsBrandingDirty} />
      )}

      {activeTab === 'footer' && (
        <FooterSettingsTab onDirtyChange={setIsFooterDirty} />
      )}

      {isLoading && activeTab !== 'branding' && activeTab !== 'footer' ? (
        <FormSettingsSkeleton />
      ) : (
        <>
          {/* Tab: Announcement Bar */}
          {activeTab === 'announcement' && (
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4 max-w-2xl">
              <Switch
                label="Display Top Announcement Banner"
                description="Broadcast complimentary shipping notices or private atelier invitations."
                checked={announcementEnabled}
                onChange={setAnnouncementEnabled}
              />

              <div className="grid grid-cols-2 gap-4 pt-2">
                <FormField label="Kicker Badge" error={getFieldError(fieldErrors, 'badge', 'announcement.badge')}>
                  <Input
                    placeholder="e.g. Milano Atelier"
                    value={announcementBadge}
                    onChange={(e) => {
                      setAnnouncementBadge(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'badge', 'announcement.badge'));
                    }}
                  />
                </FormField>

                <FormField label="European Country Notice" error={getFieldError(fieldErrors, 'countryNotice', 'country_notice', 'announcement.countryNotice')}>
                  <Input
                    placeholder="e.g. IT • DE • FR • CH • UK"
                    value={countryNotice}
                    onChange={(e) => {
                      setCountryNotice(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'countryNotice', 'country_notice', 'announcement.countryNotice'));
                    }}
                  />
                </FormField>
              </div>

              <FormField label="Main Announcement Message" error={getFieldError(fieldErrors, 'message', 'announcement.message')}>
                <Textarea
                  rows={2}
                  placeholder="e.g. Complimentary Express European Delivery on All Orders Over €250"
                  value={announcementMessage}
                  onChange={(e) => {
                    setAnnouncementMessage(e.target.value);
                    setFieldErrors((prev) => clearFieldError(prev, 'message', 'announcement.message'));
                  }}
                />
              </FormField>

              <div className="grid grid-cols-2 gap-4">
                <FormField label="Link Text" error={getFieldError(fieldErrors, 'linkText', 'link_text', 'announcement.linkText')}>
                  <Input
                    placeholder="e.g. EXPLORE BESPOKE"
                    value={announcementLinkText}
                    onChange={(e) => {
                      setAnnouncementLinkText(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'linkText', 'link_text', 'announcement.linkText'));
                    }}
                  />
                </FormField>

                <FormField label="Link Destination" error={getFieldError(fieldErrors, 'linkHref', 'link_href', 'announcement.linkHref')}>
                  <Input
                    placeholder="e.g. /customize"
                    value={announcementLinkHref}
                    onChange={(e) => {
                      setAnnouncementLinkHref(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'linkHref', 'link_href', 'announcement.linkHref'));
                    }}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* Tab: European Shipping */}
          {activeTab === 'shipping' && (
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6 max-w-3xl">
              <div className="grid grid-cols-2 gap-4">
                <FormField label="Free Delivery Threshold (€ EUR)" error={getFieldError(fieldErrors, 'freeShippingThreshold', 'free_shipping_threshold', 'shipping.freeShippingThreshold')}>
                  <Input
                    type="number"
                    value={freeShippingThreshold}
                    onChange={(e) => {
                      setFreeShippingThreshold(Number(e.target.value));
                      setFieldErrors((prev) => clearFieldError(prev, 'freeShippingThreshold', 'free_shipping_threshold', 'shipping.freeShippingThreshold'));
                    }}
                  />
                </FormField>

                <FormField label="Standard Shipping Cost (€ EUR)" error={getFieldError(fieldErrors, 'standardShippingCost', 'standard_shipping_cost', 'shipping.standardShippingCost')}>
                  <Input
                    type="number"
                    value={standardShippingCost}
                    onChange={(e) => {
                      setStandardShippingCost(Number(e.target.value));
                      setFieldErrors((prev) => clearFieldError(prev, 'standardShippingCost', 'standard_shipping_cost', 'shipping.standardShippingCost'));
                    }}
                  />
                </FormField>
              </div>

              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between pb-2 border-b border-theme">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                    European Delivery Zones & Transit Times
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setCountries([
                        ...countries,
                        { code: 'EU', name: 'European Union', rate: 15, days: '2–4 business days' },
                      ])
                    }
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" /> Add Country Zone
                  </Button>
                </div>

                {countries.map((c, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl border border-theme bg-surface-subtle/40 flex items-center gap-3 text-xs"
                  >
                    <div className="w-20">
                      <Input
                        placeholder="Code (e.g. IT)"
                        value={c.code}
                        onChange={(e) => {
                          const copy = [...countries];
                          copy[i].code = e.target.value.toUpperCase();
                          setCountries(copy);
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        placeholder="Country Name"
                        value={c.name}
                        onChange={(e) => {
                          const copy = [...countries];
                          copy[i].name = e.target.value;
                          setCountries(copy);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="w-24">
                      <Input
                        type="number"
                        placeholder="Rate (€)"
                        value={c.rate}
                        onChange={(e) => {
                          const copy = [...countries];
                          copy[i].rate = Number(e.target.value);
                          setCountries(copy);
                        }}
                        className="h-8 text-xs font-mono"
                      />
                    </div>
                    <div className="w-40">
                      <Input
                        placeholder="e.g. 1–2 days"
                        value={c.days}
                        onChange={(e) => {
                          const copy = [...countries];
                          copy[i].days = e.target.value;
                          setCountries(copy);
                        }}
                        className="h-8 text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCountries(countries.filter((_, idx) => idx !== i))}
                      className="p-1 text-muted hover:text-rose-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab: Search Suggestion Chips */}
          {activeTab === 'search' && (
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4 max-w-2xl">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary mb-1">
                  Storefront Search Chips
                </h3>
                <p className="text-xs text-muted">
                  These suggestions appear in the storefront search overlay to guide clients to top leather styles.
                </p>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add keyword (e.g. Shearling, Bomber, Suede)..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddKeyword())}
                />
                <Button variant="secondary" size="md" onClick={handleAddKeyword}>
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-subtle border border-theme text-xs font-medium text-primary"
                  >
                    <span>{kw}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(i)}
                      className="text-muted hover:text-rose-500 font-bold cursor-pointer"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
