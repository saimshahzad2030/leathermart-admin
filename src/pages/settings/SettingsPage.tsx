import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { SiteSetting, MegaMenuPayload } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { FormSettingsSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { useToast } from '@/context/ToastContext';
import {
  Settings,
  BellRing,
  Truck,
  Footprints,
  Search,
  Save,
  Plus,
  Trash2,
  Navigation,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'announcement' | 'shipping' | 'footer' | 'search' | 'menu'>('announcement');

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

  // Footer state
  const [certificationLine, setCertificationLine] = useState('');
  const [atelierAddress, setAtelierAddress] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('@ATELIERVALENTI');
  const [copyrightText, setCopyrightText] = useState('');

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
      if (settings.footer) {
        setCertificationLine(settings.footer.certificationLine || '');
        setAtelierAddress(settings.footer.atelierAddress || '');
        setInstagramHandle(settings.footer.instagramHandle || '');
        setCopyrightText(settings.footer.copyrightText || '');
      }
      if (settings.searchKeywords) {
        setKeywords(settings.searchKeywords);
      }
    }
  }, [settings]);

  // Save Settings Mutation
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
        footer: {
          certificationLine,
          atelierAddress,
          instagramHandle,
          copyrightText,
          cities: settings?.footer?.cities || ['MILANO', 'PARIS', 'ZURICH'],
          columns: settings?.footer?.columns || [],
        },
      };

      return settingsApi.updateSettings(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Store configuration updated successfully.');
    },
    onError: () => toast.error('Failed to update store settings.'),
  });

  // Save Keywords Mutation
  const saveKeywordsMutation = useMutation({
    mutationFn: () => settingsApi.updateSearchKeywords(keywords),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast.success('Search suggestion keywords saved.');
    },
    onError: () => toast.error('Failed to update search keywords.'),
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Store Configuration & Settings
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure global announcements, European shipping zones, REACH certifications, and search chips
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={async () => {
              await Promise.allSettled([refetchSettings(), refetchMenus()]);
            }}
            isRefreshing={isSettingsFetching || isMenusFetching}
            title="Refresh store configuration"
          />

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
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('announcement')}
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
          onClick={() => setActiveTab('shipping')}
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
          onClick={() => setActiveTab('footer')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'footer'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Footprints className="w-4 h-4" />
          Footer & Certifications
        </button>

        <button
          onClick={() => setActiveTab('search')}
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

      {isLoading ? (
        <FormSettingsSkeleton />
      ) : (
        <>
          {/* Tab 1: Announcement Bar */}
      {activeTab === 'announcement' && (
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4 max-w-2xl">
          <Switch
            label="Display Top Announcement Banner"
            description="Broadcast complimentary shipping notices or private atelier invitations."
            checked={announcementEnabled}
            onChange={setAnnouncementEnabled}
          />

          <div className="grid grid-cols-2 gap-4 pt-2">
            <FormField label="Kicker Badge">
              <Input
                placeholder="e.g. Milano Atelier"
                value={announcementBadge}
                onChange={(e) => setAnnouncementBadge(e.target.value)}
              />
            </FormField>

            <FormField label="European Country Notice">
              <Input
                placeholder="e.g. IT • DE • FR • CH • UK"
                value={countryNotice}
                onChange={(e) => setCountryNotice(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Main Announcement Message">
            <Textarea
              rows={2}
              placeholder="e.g. Complimentary Express European Delivery on All Orders Over €250"
              value={announcementMessage}
              onChange={(e) => setAnnouncementMessage(e.target.value)}
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Link Text">
              <Input
                placeholder="e.g. EXPLORE BESPOKE"
                value={announcementLinkText}
                onChange={(e) => setAnnouncementLinkText(e.target.value)}
              />
            </FormField>

            <FormField label="Link Destination">
              <Input
                placeholder="e.g. /customize"
                value={announcementLinkHref}
                onChange={(e) => setAnnouncementLinkHref(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      )}

      {/* Tab 2: European Shipping */}
      {activeTab === 'shipping' && (
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6 max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Free Delivery Threshold (€ EUR)">
              <Input
                type="number"
                value={freeShippingThreshold}
                onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
              />
            </FormField>

            <FormField label="Standard Shipping Cost (€ EUR)">
              <Input
                type="number"
                value={standardShippingCost}
                onChange={(e) => setStandardShippingCost(Number(e.target.value))}
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

      {/* Tab 3: Footer & Certifications */}
      {activeTab === 'footer' && (
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4 max-w-2xl">
          <FormField label="EU Compliance & Certification Line">
            <Input
              placeholder="e.g. ✔️ AZO-Free Leather · ✔️ EU REACH Compliant"
              value={certificationLine}
              onChange={(e) => setCertificationLine(e.target.value)}
            />
          </FormField>

          <FormField label="Milan Atelier Flagship Address">
            <Input
              placeholder="e.g. Via Montenapoleone, 27, 20121 Milano, Italy"
              value={atelierAddress}
              onChange={(e) => setAtelierAddress(e.target.value)}
            />
          </FormField>

          <FormField label="Official Instagram Handle">
            <Input
              placeholder="@ATELIERVALENTI"
              value={instagramHandle}
              onChange={(e) => setInstagramHandle(e.target.value)}
            />
          </FormField>

          <FormField label="Copyright Notice">
            <Input
              placeholder="© 2026 Atelier Valenti Milano. All rights reserved."
              value={copyrightText}
              onChange={(e) => setCopyrightText(e.target.value)}
            />
          </FormField>
        </div>
      )}

      {/* Tab 4: Search Suggestion Chips */}
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
                  className="text-muted hover:text-rose-500 font-bold"
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
