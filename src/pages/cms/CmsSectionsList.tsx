import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api/cms';
import { CmsSection } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { GridCardSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { Modal } from '@/components/common/Modal';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Sparkles, Edit2, Eye, EyeOff, LayoutTemplate, Link2, Loader2 } from 'lucide-react';

export const CmsSectionsList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: sections, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-cms-sections'],
    queryFn: () => cmsApi.getAllSections(),
  });

  const [editingSection, setEditingSection] = useState<CmsSection | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [eyebrow, setEyebrow] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [secondaryMediaUrl, setSecondaryMediaUrl] = useState('');
  const [primaryCtaLabel, setPrimaryCtaLabel] = useState('');
  const [primaryCtaHref, setPrimaryCtaHref] = useState('');
  const [secondaryCtaLabel, setSecondaryCtaLabel] = useState('');
  const [secondaryCtaHref, setSecondaryCtaHref] = useState('');
  const [isVisible, setIsVisible] = useState(true);

  // Visibility toggle mutation
  const toggleVisibilityMutation = useMutation({
    mutationFn: ({ sectionKey, isVisible }: { sectionKey: string; isVisible: boolean }) =>
      cmsApi.toggleVisibility(sectionKey, isVisible),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-sections'] });
      toast.success(`Section visibility updated to ${variables.isVisible ? 'Visible' : 'Hidden'}.`);
    },
    onError: () => toast.error('Failed to update section visibility.'),
  });

  // Update section mutation
  const updateSectionMutation = useMutation({
    mutationFn: async () => {
      if (!editingSection) return;
      const payload: Partial<CmsSection> = {
        title: title.trim(),
        subtitle: subtitle.trim(),
        eyebrow: eyebrow.trim(),
        mediaUrl: mediaUrl.trim(),
        secondaryMediaUrl: secondaryMediaUrl.trim(),
        primaryCta: primaryCtaLabel ? { label: primaryCtaLabel.trim(), href: primaryCtaHref.trim() } : undefined,
        secondaryCta: secondaryCtaLabel ? { label: secondaryCtaLabel.trim(), href: secondaryCtaHref.trim() } : undefined,
        isVisible,
      };
      return cmsApi.updateSection(editingSection.sectionKey, payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-cms-sections'] });
      toast.success(`Section '${data?.sectionKey || 'CMS'}' updated successfully.`);
      setEditingSection(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update section.');
    },
  });

  const openEdit = (sec: CmsSection) => {
    setEditingSection(sec);
    setTitle(sec.title || '');
    setSubtitle(sec.subtitle || '');
    setEyebrow(sec.eyebrow || '');
    setMediaUrl(sec.mediaUrl || '');
    setSecondaryMediaUrl(sec.secondaryMediaUrl || '');
    setPrimaryCtaLabel(sec.primaryCta?.label || '');
    setPrimaryCtaHref(sec.primaryCta?.href || '');
    setSecondaryCtaLabel(sec.secondaryCta?.label || '');
    setSecondaryCtaHref(sec.secondaryCta?.href || '');
    setIsVisible(sec.isVisible ?? true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Homepage Modular CMS
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Curate storefront homepage sections, editorial campaigns, hero photography, and calls-to-action
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh CMS sections"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </div>
      ) : sections?.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-theme p-6">
          <LayoutTemplate className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-primary font-serif-luxury">No sections available</h3>
          <p className="text-xs text-muted mt-1">Homepage CMS sections will appear here.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections?.map((sec) => {
            const isToggling =
              toggleVisibilityMutation.isPending &&
              toggleVisibilityMutation.variables?.sectionKey === sec.sectionKey;

            return (
              <div
                key={sec.sectionKey}
                className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col justify-between"
              >
            <div>
              {/* Media Preview Banner */}
              {sec.mediaUrl ? (
                <div className="h-40 relative bg-surface-subtle overflow-hidden">
                  <img
                    src={sec.mediaUrl}
                    alt={sec.title || sec.sectionKey}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      {sec.eyebrow && (
                        <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400">
                          {sec.eyebrow}
                        </span>
                      )}
                      <h3 className="text-sm font-bold font-serif-luxury text-white truncate">
                        {sec.title || sec.sectionKey.toUpperCase()}
                      </h3>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-surface-subtle/50 border-b border-theme flex items-center gap-2">
                  <LayoutTemplate className="w-4 h-4 text-amber-500" />
                  <span className="font-mono text-xs font-bold uppercase text-primary">
                    {sec.sectionKey}
                  </span>
                </div>
              )}

              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-muted uppercase">
                    Key: <strong className="text-primary">{sec.sectionKey}</strong>
                  </span>
                  <span className="text-xs text-muted font-mono">Order: #{sec.sortOrder}</span>
                </div>

                {sec.subtitle && (
                  <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                    {sec.subtitle}
                  </p>
                )}

                {(sec.primaryCta || sec.secondaryCta) && (
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    {sec.primaryCta && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-500 font-semibold text-[11px]">
                        {sec.primaryCta.label} → {sec.primaryCta.href}
                      </span>
                    )}
                    {sec.secondaryCta && (
                      <span className="px-2.5 py-1 rounded-lg bg-surface-subtle border border-theme text-secondary text-[11px]">
                        {sec.secondaryCta.label}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-theme flex items-center justify-between bg-surface-subtle/30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={() =>
                    toggleVisibilityMutation.mutate({
                      sectionKey: sec.sectionKey,
                      isVisible: !sec.isVisible,
                    })
                  }
                  className="cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
                  title="Toggle section visibility"
                >
                  {isToggling ? (
                    <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                  ) : (
                    <StatusBadge status={sec.isVisible ? 'published' : 'draft'} />
                  )}
                </button>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openEdit(sec)}
                leftIcon={<Edit2 className="w-3.5 h-3.5" />}
              >
                Edit Section
              </Button>
            </div>
          </div>
            );
          })}
        </div>
      )}

      {/* Edit Section Modal */}
      <Modal
        isOpen={!!editingSection}
        onClose={() => setEditingSection(null)}
        title={`Edit Section: ${editingSection?.sectionKey.toUpperCase()}`}
        subtitle="Manage heading, copy, photography, and primary CTA links"
        maxWidth="xl"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            updateSectionMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Eyebrow Kicker">
              <Input
                placeholder="e.g. AUTUMN / WINTER 2026"
                value={eyebrow}
                onChange={(e) => setEyebrow(e.target.value)}
              />
            </FormField>

            <FormField label="Main Headline / Title">
              <Input
                placeholder="e.g. ARCHITECTURAL LEATHER OUTERWEAR"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Subtitle / Narrative">
            <Textarea
              rows={3}
              placeholder="Section narrative or description..."
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
            />
          </FormField>

          {/* Primary CTA */}
          <div className="p-4 rounded-xl border border-theme bg-surface-subtle/40 space-y-3">
            <span className="text-xs font-semibold uppercase text-secondary">Primary Call-to-Action</span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Button Label (e.g. EXPLORE COLLECTION)"
                value={primaryCtaLabel}
                onChange={(e) => setPrimaryCtaLabel(e.target.value)}
                className="text-xs"
              />
              <Input
                placeholder="Button Link (e.g. /shop)"
                value={primaryCtaHref}
                onChange={(e) => setPrimaryCtaHref(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Secondary CTA */}
          <div className="p-4 rounded-xl border border-theme bg-surface-subtle/40 space-y-3">
            <span className="text-xs font-semibold uppercase text-secondary">Secondary Call-to-Action</span>
            <div className="grid grid-cols-2 gap-3">
              <Input
                placeholder="Button Label (e.g. BESPOKE ATELIER)"
                value={secondaryCtaLabel}
                onChange={(e) => setSecondaryCtaLabel(e.target.value)}
                className="text-xs"
              />
              <Input
                placeholder="Button Link (e.g. /customize)"
                value={secondaryCtaHref}
                onChange={(e) => setSecondaryCtaHref(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Media URL */}
          <FormField label="Primary Image URL">
            <ImageUploader
              folder="editorial"
              value={mediaUrl}
              onChange={setMediaUrl}
            />
          </FormField>

          <Switch
            label="Section Visible in Storefront"
            description="When toggled off, section is excluded from homepage layout."
            checked={isVisible}
            onChange={setIsVisible}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setEditingSection(null)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={updateSectionMutation.isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
