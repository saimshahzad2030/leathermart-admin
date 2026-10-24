import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '@/lib/api/settings';
import { FooterSettings, FooterColumn } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useBranding } from '@/context/BrandingContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { FormSettingsSkeleton } from '@/components/common/Skeleton';
import {
  Columns,
  Save,
  RotateCcw,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Shield,
  Eye,
  Share2,
  MapPin,
  Building2,
  Sparkles,
  Monitor,
  Smartphone,
  Lock,
  Globe,
  Tag,
  Check,
} from 'lucide-react';

interface FooterSettingsTabProps {
  onDirtyChange?: (isDirty: boolean) => void;
}

const SUPPORTED_SOCIAL_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/ateliervalenti' },
  { id: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/ateliervalenti' },
  { id: 'pinterest', label: 'Pinterest', placeholder: 'https://www.pinterest.com/ateliervalenti' },
  { id: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@ateliervalenti' },
  { id: 'youtube', label: 'YouTube', placeholder: 'https://www.youtube.com/@ateliervalenti' },
  { id: 'linkedin', label: 'LinkedIn', placeholder: 'https://www.linkedin.com/company/ateliervalenti' },
] as const;

export const FooterSettingsTab: React.FC<FooterSettingsTabProps> = ({ onDirtyChange }) => {
  const toast = useToast();
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const { branding } = useBranding();
  const canEdit = hasRole(['super_admin', 'store_manager']);

  // Fetch footer settings from backend API
  const {
    data: footerData,
    isLoading,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ['admin-footer'],
    queryFn: () => settingsApi.getFooterSettings(),
    staleTime: 1000 * 60 * 2,
  });

  // Baseline state representing last saved/loaded data
  const [baseline, setBaseline] = useState<FooterSettings | null>(null);

  // Editable form state
  const [certificationLine, setCertificationLine] = useState('');
  const [atelierAddress, setAtelierAddress] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [copyrightText, setCopyrightText] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [newCityInput, setNewCityInput] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({
    instagram: '',
    facebook: '',
    pinterest: '',
    tiktok: '',
    youtube: '',
    linkedin: '',
  });
  const [columns, setColumns] = useState<FooterColumn[]>([]);

  // Preview state
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [showPreview, setShowPreview] = useState(true);

  // Validation & Error states
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');

  // Populate form when data loads
  useEffect(() => {
    if (footerData) {
      setBaseline(footerData);
      setCertificationLine(footerData.certificationLine || '');
      setAtelierAddress(footerData.atelierAddress || '');
      setInstagramHandle(footerData.instagramHandle || '');
      setCopyrightText(footerData.copyrightText || '');
      setCities(Array.isArray(footerData.cities) ? [...footerData.cities] : ['MILANO', 'PARIS', 'ZURICH', 'MUNICH']);
      
      const loadedSocial: Record<string, string> = {
        instagram: '',
        facebook: '',
        pinterest: '',
        tiktok: '',
        youtube: '',
        linkedin: '',
      };
      if (footerData.socialLinks && typeof footerData.socialLinks === 'object') {
        Object.entries(footerData.socialLinks).forEach(([k, v]) => {
          if (typeof v === 'string') {
            loadedSocial[k] = v;
          }
        });
      }
      setSocialLinks(loadedSocial);

      if (Array.isArray(footerData.columns)) {
        setColumns(
          footerData.columns.map((c) => ({
            title: c.title || '',
            links: Array.isArray(c.links)
              ? c.links.map((l) => ({ label: l.label || '', href: l.href || '' }))
              : [],
          }))
        );
      } else {
        setColumns([]);
      }

      setFieldErrors({});
      setGeneralError('');
    }
  }, [footerData]);

  // Compute dirty state
  const isDirty = useMemo(() => {
    if (!baseline) return false;

    const certChanged = certificationLine.trim() !== (baseline.certificationLine || '').trim();
    const addrChanged = atelierAddress.trim() !== (baseline.atelierAddress || '').trim();
    const instaChanged = instagramHandle.trim() !== (baseline.instagramHandle || '').trim();
    const copyChanged = copyrightText.trim() !== (baseline.copyrightText || '').trim();

    const baselineCities = baseline.cities || [];
    const citiesChanged =
      cities.length !== baselineCities.length ||
      cities.some((c, i) => c.trim() !== (baselineCities[i] || '').trim());

    const baselineSocial = baseline.socialLinks || {};
    const socialChanged = SUPPORTED_SOCIAL_PLATFORMS.some((p) => {
      const currentVal = (socialLinks[p.id] || '').trim();
      const baseVal = ((baselineSocial as any)?.[p.id] || '').trim();
      return currentVal !== baseVal;
    });

    const baselineCols = baseline.columns || [];
    const colsChanged =
      JSON.stringify(columns) !==
      JSON.stringify(
        baselineCols.map((c) => ({
          title: c.title || '',
          links: (c.links || []).map((l) => ({ label: l.label || '', href: l.href || '' })),
        }))
      );

    return certChanged || addrChanged || instaChanged || copyChanged || citiesChanged || socialChanged || colsChanged;
  }, [baseline, certificationLine, atelierAddress, instagramHandle, copyrightText, cities, socialLinks, columns]);

  // Notify parent of dirty changes
  useEffect(() => {
    onDirtyChange?.(isDirty);
  }, [isDirty, onDirtyChange]);

  // Warn about unsaved changes on window unload
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

  // Check if Contact Us link exists in columns
  const contactLinkStatus = useMemo(() => {
    let exists = false;
    let columnIndex = -1;
    let linkIndex = -1;

    for (let cIdx = 0; cIdx < columns.length; cIdx++) {
      const col = columns[cIdx];
      for (let lIdx = 0; lIdx < col.links.length; lIdx++) {
        const link = col.links[lIdx];
        if (link.href === '/contact' || link.href === '/contact/') {
          exists = true;
          columnIndex = cIdx;
          linkIndex = lIdx;
          break;
        }
      }
      if (exists) break;
    }

    return { exists, columnIndex, linkIndex };
  }, [columns]);

  // Helper to ensure Contact Us link is present
  const handleEnsureContactLink = () => {
    if (contactLinkStatus.exists) {
      toast.info('Contact Us link is already configured and points to /contact.');
      return;
    }

    const contactLink = {
      label: 'Client Concierge & Contact Us',
      href: '/contact',
    };

    // Find Client Care or Support column if exists
    let targetColIdx = columns.findIndex((c) =>
      /care|client|concierge|support|help|service/i.test(c.title)
    );

    if (targetColIdx !== -1) {
      const updated = [...columns];
      updated[targetColIdx] = {
        ...updated[targetColIdx],
        links: [...updated[targetColIdx].links, contactLink],
      };
      setColumns(updated);
      toast.success(`Added Contact Us link to column "${columns[targetColIdx].title}".`);
    } else if (columns.length > 0) {
      // Append to the last or second column
      const idx = columns.length > 1 ? 1 : 0;
      const updated = [...columns];
      updated[idx] = {
        ...updated[idx],
        links: [...updated[idx].links, contactLink],
      };
      setColumns(updated);
      toast.success(`Added Contact Us link to column "${columns[idx].title}".`);
    } else {
      // Create Client Care column with Contact Us
      setColumns([
        {
          title: 'Client Care',
          links: [contactLink],
        },
      ]);
      toast.success('Created "Client Care" column with Contact Us link.');
    }
  };

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string[]> = {};

    if (certificationLine.trim().length > 300) {
      errors.certificationLine = ['Certification badge line must not exceed 300 characters.'];
    }

    if (atelierAddress.trim().length > 500) {
      errors.atelierAddress = ['Atelier address must not exceed 500 characters.'];
    }

    if (instagramHandle.trim().length > 100) {
      errors.instagramHandle = ['Instagram handle must not exceed 100 characters.'];
    }

    if (copyrightText.trim().length > 300) {
      errors.copyrightText = ['Copyright text must not exceed 300 characters.'];
    }

    // Validate social URLs
    SUPPORTED_SOCIAL_PLATFORMS.forEach((p) => {
      const url = (socialLinks[p.id] || '').trim();
      if (url) {
        if (!/^https?:\/\//i.test(url)) {
          errors[`social_${p.id}`] = ['Must be a valid web URL starting with http:// or https://'];
        }
      }
    });

    // Validate columns and links
    columns.forEach((col, cIdx) => {
      const trimmedTitle = col.title.trim();
      if (!trimmedTitle) {
        errors[`column_${cIdx}_title`] = ['Column title is required.'];
      } else if (trimmedTitle.length > 100) {
        errors[`column_${cIdx}_title`] = ['Column title cannot exceed 100 characters.'];
      }

      col.links.forEach((link, lIdx) => {
        const trimmedLabel = link.label.trim();
        const trimmedHref = link.href.trim();

        if (!trimmedLabel) {
          errors[`link_${cIdx}_${lIdx}_label`] = ['Link label is required.'];
        } else if (trimmedLabel.length > 100) {
          errors[`link_${cIdx}_${lIdx}_label`] = ['Link label cannot exceed 100 characters.'];
        }

        if (!trimmedHref) {
          errors[`link_${cIdx}_${lIdx}_href`] = ['Destination URL is required.'];
        } else if (trimmedHref.length > 1000) {
          errors[`link_${cIdx}_${lIdx}_href`] = ['Destination URL cannot exceed 1000 characters.'];
        } else if (
          !trimmedHref.startsWith('/') &&
          !trimmedHref.startsWith('http://') &&
          !trimmedHref.startsWith('https://') &&
          !trimmedHref.startsWith('#') &&
          !trimmedHref.startsWith('mailto:') &&
          !trimmedHref.startsWith('tel:')
        ) {
          errors[`link_${cIdx}_${lIdx}_href`] = [
            'Must be a relative path (/...), web URL (https://...), anchor (#...), or mailto/tel link.',
          ];
        }
      });
    });

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('Please review and correct the validation errors highlighted below before saving.');
      toast.error('Validation failed. Please review incomplete rows or invalid URLs.');
      return false;
    }

    setGeneralError('');
    return true;
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      // Build clean socialLinks object with only non-empty URLs
      const cleanedSocial: Record<string, string> = {};
      SUPPORTED_SOCIAL_PLATFORMS.forEach((p) => {
        const val = (socialLinks[p.id] || '').trim();
        if (val) {
          cleanedSocial[p.id] = val;
        }
      });

      // Build payload matching backend updateFooterSchema
      const payload: Partial<FooterSettings> = {
        certificationLine: certificationLine.trim() || null,
        atelierAddress: atelierAddress.trim() || null,
        instagramHandle: instagramHandle.trim() || null,
        copyrightText: copyrightText.trim() || null,
        cities: cities.map((c) => c.trim()).filter(Boolean),
        columns: columns.map((col) => ({
          title: col.title.trim(),
          links: col.links.map((link) => ({
            label: link.label.trim(),
            href: link.href.trim(),
          })),
        })),
        socialLinks: Object.keys(cleanedSocial).length > 0 ? cleanedSocial : null,
      };

      return settingsApi.updateFooterSettings(payload);
    },
    onSuccess: (saved) => {
      setBaseline(saved);
      // Synchronize state with saved response
      setCertificationLine(saved.certificationLine || '');
      setAtelierAddress(saved.atelierAddress || '');
      setInstagramHandle(saved.instagramHandle || '');
      setCopyrightText(saved.copyrightText || '');
      setCities(Array.isArray(saved.cities) ? [...saved.cities] : []);
      if (Array.isArray(saved.columns)) {
        setColumns(
          saved.columns.map((c) => ({
            title: c.title || '',
            links: Array.isArray(c.links)
              ? c.links.map((l) => ({ label: l.label || '', href: l.href || '' }))
              : [],
          }))
        );
      }
      const loadedSocial: Record<string, string> = {
        instagram: '',
        facebook: '',
        pinterest: '',
        tiktok: '',
        youtube: '',
        linkedin: '',
      };
      if (saved.socialLinks && typeof saved.socialLinks === 'object') {
        Object.entries(saved.socialLinks).forEach(([k, v]) => {
          if (typeof v === 'string') loadedSocial[k] = v;
        });
      }
      setSocialLinks(loadedSocial);

      // Invalidate relevant React Query caches
      queryClient.invalidateQueries({ queryKey: ['admin-footer'] });
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });

      setFieldErrors({});
      setGeneralError('');
      toast.success('Footer settings and storefront navigation saved successfully.');
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update footer settings.');
      setFieldErrors(parsed.fieldErrors);
      setGeneralError(parsed.message);
      toast.error(parsed.message);
    },
  });

  const handleSave = () => {
    if (!canEdit) {
      toast.error('You do not have permission to update store settings.');
      return;
    }
    if (validateForm()) {
      saveMutation.mutate();
    }
  };

  const handleReset = () => {
    if (!baseline) return;
    if (isDirty) {
      const confirmReset = window.confirm(
        'Discard all unsaved changes and restore the last saved footer configuration?'
      );
      if (!confirmReset) return;
    }

    setCertificationLine(baseline.certificationLine || '');
    setAtelierAddress(baseline.atelierAddress || '');
    setInstagramHandle(baseline.instagramHandle || '');
    setCopyrightText(baseline.copyrightText || '');
    setCities(Array.isArray(baseline.cities) ? [...baseline.cities] : []);
    const loadedSocial: Record<string, string> = {
      instagram: '',
      facebook: '',
      pinterest: '',
      tiktok: '',
      youtube: '',
      linkedin: '',
    };
    if (baseline.socialLinks && typeof baseline.socialLinks === 'object') {
      Object.entries(baseline.socialLinks).forEach(([k, v]) => {
        if (typeof v === 'string') loadedSocial[k] = v;
      });
    }
    setSocialLinks(loadedSocial);

    if (Array.isArray(baseline.columns)) {
      setColumns(
        baseline.columns.map((c) => ({
          title: c.title || '',
          links: Array.isArray(c.links)
            ? c.links.map((l) => ({ label: l.label || '', href: l.href || '' }))
            : [],
        }))
      );
    } else {
      setColumns([]);
    }

    setFieldErrors({});
    setGeneralError('');
    toast.info('Restored footer settings to the last saved configuration.');
  };

  // City Handlers
  const handleAddCity = () => {
    const trimmed = newCityInput.trim().toUpperCase();
    if (!trimmed) return;
    if (cities.includes(trimmed)) {
      toast.info(`City "${trimmed}" is already in the list.`);
      return;
    }
    setCities([...cities, trimmed]);
    setNewCityInput('');
  };

  const handleRemoveCity = (index: number) => {
    setCities(cities.filter((_, i) => i !== index));
  };

  const handleResetDefaultCities = () => {
    setCities(['MILANO', 'PARIS', 'ZURICH', 'MUNICH']);
    toast.info('Loaded default European cities: MILANO, PARIS, ZURICH, MUNICH.');
  };

  // Column Handlers
  const handleAddColumn = () => {
    setColumns([
      ...columns,
      {
        title: `Column ${columns.length + 1}`,
        links: [{ label: '', href: '/' }],
      },
    ]);
  };

  const handleRemoveColumn = (colIdx: number) => {
    const colName = columns[colIdx].title || `Column ${colIdx + 1}`;
    if (columns[colIdx].links.length > 0) {
      const confirmDelete = window.confirm(
        `Are you sure you want to delete column "${colName}" and all its ${columns[colIdx].links.length} links?`
      );
      if (!confirmDelete) return;
    }
    setColumns(columns.filter((_, i) => i !== colIdx));
  };

  const handleMoveColumn = (colIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? colIdx - 1 : colIdx + 1;
    if (targetIdx < 0 || targetIdx >= columns.length) return;
    const updated = [...columns];
    const [moved] = updated.splice(colIdx, 1);
    updated.splice(targetIdx, 0, moved);
    setColumns(updated);
  };

  const handleColumnTitleChange = (colIdx: number, title: string) => {
    const updated = [...columns];
    updated[colIdx] = { ...updated[colIdx], title };
    setColumns(updated);
    setFieldErrors((prev) => clearFieldError(prev, `column_${colIdx}_title`));
  };

  // Link Handlers
  const handleAddLink = (colIdx: number) => {
    const updated = [...columns];
    updated[colIdx] = {
      ...updated[colIdx],
      links: [...updated[colIdx].links, { label: '', href: '/' }],
    };
    setColumns(updated);
  };

  const handleRemoveLink = (colIdx: number, linkIdx: number) => {
    const updated = [...columns];
    updated[colIdx] = {
      ...updated[colIdx],
      links: updated[colIdx].links.filter((_, i) => i !== linkIdx),
    };
    setColumns(updated);
  };

  const handleMoveLink = (colIdx: number, linkIdx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? linkIdx - 1 : linkIdx + 1;
    const colLinks = [...columns[colIdx].links];
    if (targetIdx < 0 || targetIdx >= colLinks.length) return;
    const [moved] = colLinks.splice(linkIdx, 1);
    colLinks.splice(targetIdx, 0, moved);
    const updated = [...columns];
    updated[colIdx] = { ...updated[colIdx], links: colLinks };
    setColumns(updated);
  };

  const handleLinkChange = (
    colIdx: number,
    linkIdx: number,
    field: 'label' | 'href',
    value: string
  ) => {
    const updated = [...columns];
    const links = [...updated[colIdx].links];
    links[linkIdx] = { ...links[linkIdx], [field]: value };
    updated[colIdx] = { ...updated[colIdx], links };
    setColumns(updated);
    setFieldErrors((prev) => clearFieldError(prev, `link_${colIdx}_${linkIdx}_${field}`));
  };

  if (isLoading) {
    return <FormSettingsSkeleton />;
  }

  if (loadError) {
    return (
      <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
        <div className="flex items-center gap-3 text-rose-500">
          <AlertCircle className="w-6 h-6 shrink-0" />
          <div>
            <h3 className="font-semibold text-sm">Failed to load footer settings</h3>
            <p className="text-xs text-muted mt-0.5">{(loadError as any)?.message || 'Network or server error'}</p>
          </div>
        </div>
        <Button variant="secondary" size="sm" onClick={() => refetch()}>
          Retry Loading
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Role Notice if Unauthorized */}
      {!canEdit && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-2.5">
          <Lock className="w-4 h-4 shrink-0" />
          <span>
            <strong>Read-only access:</strong> You are currently viewing footer settings in read-only mode. Only administrators with <strong>super_admin</strong> or <strong>store_manager</strong> privileges can save changes.
          </span>
        </div>
      )}

      {/* General Error Alert */}
      {generalError && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-xs leading-relaxed">{generalError}</span>
        </div>
      )}

      {/* Action Header Strip */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
            <Columns className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold uppercase tracking-wider text-primary">
                Storefront Footer & Navigation Configuration
              </h2>
              {isDirty ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  Unsaved Changes
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                  Synchronized
                </span>
              )}
            </div>
            <p className="text-xs text-muted mt-0.5">
              Manage dynamic footer columns, verified EU certifications, flagship address, social links, and legal copy.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleReset}
            disabled={!isDirty || saveMutation.isPending}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={!canEdit || saveMutation.isPending}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Footer Settings
          </Button>
        </div>
      </div>

      {/* Section A: Atelier Credentials & Trust Badges */}
      <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-5">
        <div className="border-b border-theme pb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Atelier Credentials & Trust Badges
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Configure European leather compliance badges, flagship showroom location, and official copyright text.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="EU Compliance & Certification Badge Line"
            description="Rendered above the legal strip across all storefront pages."
            error={getFieldError(fieldErrors, 'certificationLine', 'certification_line', 'footer.certificationLine')}
          >
            <Input
              disabled={!canEdit}
              placeholder="e.g. ✔️ AZO-Free Leather · ✔️ EU REACH Compliant"
              value={certificationLine}
              onChange={(e) => {
                setCertificationLine(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'certificationLine', 'certification_line', 'footer.certificationLine'));
              }}
            />
          </FormField>

          <FormField
            label="Official Instagram Handle"
            description="Used as primary handle and fallback for Instagram profile link."
            error={getFieldError(fieldErrors, 'instagramHandle', 'instagram_handle', 'footer.instagramHandle')}
          >
            <Input
              disabled={!canEdit}
              placeholder="@ATELIERVALENTI"
              value={instagramHandle}
              onChange={(e) => {
                setInstagramHandle(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'instagramHandle', 'instagram_handle', 'footer.instagramHandle'));
              }}
            />
          </FormField>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Milan Flagship Workshop Address"
            description="Displayed on the storefront brand column."
            error={getFieldError(fieldErrors, 'atelierAddress', 'atelier_address', 'footer.atelierAddress')}
          >
            <Input
              disabled={!canEdit}
              placeholder="e.g. Via Montenapoleone, 27, 20121 Milano, Italy"
              value={atelierAddress}
              onChange={(e) => {
                setAtelierAddress(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'atelierAddress', 'atelier_address', 'footer.atelierAddress'));
              }}
            />
          </FormField>

          <FormField
            label="Legal Copyright Notice"
            description="Displayed at the bottom left of the storefront footer."
            error={getFieldError(fieldErrors, 'copyrightText', 'copyright_text', 'footer.copyrightText')}
          >
            <Input
              disabled={!canEdit}
              placeholder={`© ${new Date().getFullYear()} ${branding.platformName || 'Platform'}. All rights reserved.`}
              value={copyrightText}
              onChange={(e) => {
                setCopyrightText(e.target.value);
                setFieldErrors((prev) => clearFieldError(prev, 'copyrightText', 'copyright_text', 'footer.copyrightText'));
              }}
            />
          </FormField>
        </div>
      </div>

      {/* Section B: Atelier Cities Strip */}
      <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-3">
          <div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Atelier Flagship Cities Strip
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Cities rendered in the bottom right legal strip (e.g. MILANO • PARIS • ZURICH • MUNICH).
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleResetDefaultCities}
            disabled={!canEdit}
            className="text-xs"
          >
            Load Default Cities
          </Button>
        </div>

        <div className="flex gap-2">
          <Input
            disabled={!canEdit}
            placeholder="Add European city (e.g. MILANO, PARIS, ZURICH)..."
            value={newCityInput}
            onChange={(e) => setNewCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCity();
              }
            }}
            className="text-xs font-mono uppercase tracking-wider"
          />
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={handleAddCity}
            disabled={!canEdit || !newCityInput.trim()}
          >
            Add City
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          {cities.length === 0 ? (
            <p className="text-xs text-muted italic">No cities configured. Default fallback will be used.</p>
          ) : (
            cities.map((city, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-surface-subtle border border-theme text-xs font-mono uppercase tracking-widest text-primary"
              >
                <span>{city}</span>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => handleRemoveCity(idx)}
                    className="text-muted hover:text-rose-500 font-bold transition-colors cursor-pointer"
                    title={`Remove ${city}`}
                  >
                    ×
                  </button>
                )}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Section C: Social Media URLs */}
      <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
        <div className="border-b border-theme pb-3">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
              Atelier Social Media Profiles
            </h3>
          </div>
          <p className="text-xs text-muted mt-0.5">
            Configure verified brand social media URLs. Only platforms with a valid URL (starting with http:// or https://) are displayed as active icons in the storefront footer.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SUPPORTED_SOCIAL_PLATFORMS.map((platform) => {
            const currentUrl = socialLinks[platform.id] || '';
            const isActive = /^https?:\/\//i.test(currentUrl.trim());
            const errorKey = `social_${platform.id}`;

            return (
              <div
                key={platform.id}
                className="p-3.5 rounded-xl border border-theme bg-surface-subtle/30 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-secondary flex items-center gap-1.5">
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    {platform.label}
                  </span>
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-500 font-medium bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      <Check className="w-3 h-3" /> Active on Storefront
                    </span>
                  ) : (
                    <span className="text-[10px] text-muted italic">Unconfigured (Hidden)</span>
                  )}
                </div>

                <FormField
                  label=""
                  error={fieldErrors[errorKey]}
                  className="gap-0"
                >
                  <Input
                    disabled={!canEdit}
                    placeholder={platform.placeholder}
                    value={currentUrl}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSocialLinks((prev) => ({ ...prev, [platform.id]: val }));
                      setFieldErrors((prev) => clearFieldError(prev, errorKey));
                    }}
                    className="text-xs font-mono"
                  />
                </FormField>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section D: Storefront Navigation Columns */}
      <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Columns className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Footer Navigation Columns & Links
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Add, edit, reorder, and remove multi-column navigation links rendered on the storefront.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {!contactLinkStatus.exists && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleEnsureContactLink}
                disabled={!canEdit}
                className="text-xs border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" /> Add Contact Us Link
              </Button>
            )}

            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddColumn}
              disabled={!canEdit}
              className="flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Column
            </Button>
          </div>
        </div>

        {/* Contact Us Status Notification */}
        {contactLinkStatus.exists ? (
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                <strong>Contact Us Route Verified:</strong> Points to the storefront Contact Us page (<code>/contact</code>) in column &ldquo;{columns[contactLinkStatus.columnIndex]?.title || 'Client Care'}&rdquo;.
              </span>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>
                No link pointing directly to <code>/contact</code> was detected. Clients may not be able to reach the Contact Us page from dynamic columns.
              </span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleEnsureContactLink}
              disabled={!canEdit}
              className="text-xs shrink-0 ml-2"
            >
              Insert Link Now
            </Button>
          </div>
        )}

        {/* Columns List */}
        {columns.length === 0 ? (
          <div className="text-center py-10 border border-dashed border-theme rounded-2xl space-y-3">
            <p className="text-xs text-muted">No navigation columns configured yet.</p>
            <Button variant="secondary" size="sm" onClick={handleAddColumn} disabled={!canEdit}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Create First Column
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {columns.map((col, colIdx) => {
              const colTitleError = fieldErrors[`column_${colIdx}_title`];

              return (
                <div
                  key={colIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-theme bg-surface-muted/40 space-y-4 transition-all"
                >
                  {/* Column Header */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={!canEdit || colIdx === 0}
                        onClick={() => handleMoveColumn(colIdx, 'up')}
                        className="p-1 rounded hover:bg-surface text-secondary disabled:opacity-20 transition-all cursor-pointer"
                        title="Move column up (left)"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        disabled={!canEdit || colIdx === columns.length - 1}
                        onClick={() => handleMoveColumn(colIdx, 'down')}
                        className="p-1 rounded hover:bg-surface text-secondary disabled:opacity-20 transition-all cursor-pointer"
                        title="Move column down (right)"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex-1">
                      <Input
                        disabled={!canEdit}
                        value={col.title}
                        error={!!colTitleError}
                        onChange={(e) => handleColumnTitleChange(colIdx, e.target.value)}
                        placeholder="Column Title (e.g. Catalogue, Client Care, The Atelier)"
                        className="font-mono text-xs uppercase tracking-wider font-semibold"
                      />
                      {colTitleError && (
                        <p className="text-[11px] text-rose-500 mt-1">{colTitleError[0]}</p>
                      )}
                    </div>

                    <span className="text-[11px] text-muted font-mono shrink-0 hidden sm:inline">
                      {col.links.length} {col.links.length === 1 ? 'link' : 'links'}
                    </span>

                    <button
                      type="button"
                      disabled={!canEdit}
                      onClick={() => handleRemoveColumn(colIdx)}
                      className="p-1.5 text-danger/80 hover:text-danger hover:bg-danger/10 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
                      title="Delete this column"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Links List inside Column */}
                  <div className="space-y-2.5 pl-3 sm:pl-4 border-l-2 border-theme">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-muted uppercase tracking-wider pb-1">
                      <span>Navigation Links ({col.links.length})</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleAddLink(colIdx)}
                          className="text-amber-500 hover:text-amber-400 hover:underline flex items-center gap-1 text-[11px] font-medium cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Link
                        </button>
                      )}
                    </div>

                    {col.links.length === 0 ? (
                      <p className="text-xs text-muted italic py-1">No links in this column.</p>
                    ) : (
                      <div className="space-y-2">
                        {col.links.map((link, linkIdx) => {
                          const labelError = fieldErrors[`link_${colIdx}_${linkIdx}_label`];
                          const hrefError = fieldErrors[`link_${colIdx}_${linkIdx}_href`];
                          const isContact = link.href === '/contact' || link.href === '/contact/';

                          return (
                            <div
                              key={linkIdx}
                              className={`p-2.5 rounded-xl border ${
                                isContact
                                  ? 'border-amber-500/30 bg-amber-500/5'
                                  : 'border-theme bg-surface/80'
                              } flex flex-col sm:flex-row items-stretch sm:items-center gap-2`}
                            >
                              <div className="flex items-center gap-1 shrink-0 self-start sm:self-center">
                                <button
                                  type="button"
                                  disabled={!canEdit || linkIdx === 0}
                                  onClick={() => handleMoveLink(colIdx, linkIdx, 'up')}
                                  className="p-0.5 text-muted hover:text-secondary disabled:opacity-20 cursor-pointer"
                                  title="Move link up"
                                >
                                  <ChevronUp className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  disabled={!canEdit || linkIdx === col.links.length - 1}
                                  onClick={() => handleMoveLink(colIdx, linkIdx, 'down')}
                                  className="p-0.5 text-muted hover:text-secondary disabled:opacity-20 cursor-pointer"
                                  title="Move link down"
                                >
                                  <ChevronDown className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div>
                                  <Input
                                    disabled={!canEdit}
                                    value={link.label}
                                    error={!!labelError}
                                    onChange={(e) => handleLinkChange(colIdx, linkIdx, 'label', e.target.value)}
                                    placeholder="Label (e.g. Biker Jackets)"
                                    className="text-xs"
                                  />
                                  {labelError && (
                                    <p className="text-[10px] text-rose-500 mt-0.5">{labelError[0]}</p>
                                  )}
                                </div>

                                <div>
                                  <div className="relative">
                                    <Input
                                      disabled={!canEdit}
                                      value={link.href}
                                      error={!!hrefError}
                                      onChange={(e) => handleLinkChange(colIdx, linkIdx, 'href', e.target.value)}
                                      placeholder="Route / URL (e.g. /shop?category=biker)"
                                      className="text-xs font-mono"
                                    />
                                    {isContact && (
                                      <span className="absolute right-2 top-2 text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 pointer-events-none">
                                        Contact Us
                                      </span>
                                    )}
                                  </div>
                                  {hrefError && (
                                    <p className="text-[10px] text-rose-500 mt-0.5">{hrefError[0]}</p>
                                  )}
                                </div>
                              </div>

                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleRemoveLink(colIdx, linkIdx)}
                                className="p-1.5 text-danger/70 hover:text-danger hover:bg-danger/10 rounded transition-colors self-end sm:self-center cursor-pointer disabled:opacity-20"
                                title="Delete link"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Section E: Live Storefront Footer Preview */}
      <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-theme pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                Live Storefront Footer Preview
              </h3>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Real-time rendering of your footer as it will appear on the public storefront.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center bg-surface-subtle p-0.5 rounded-lg border border-theme">
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'desktop'
                    ? 'bg-amber-500/20 text-amber-500 font-semibold shadow-xs'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Desktop</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded-md text-xs flex items-center gap-1 transition-all cursor-pointer ${
                  previewDevice === 'mobile'
                    ? 'bg-amber-500/20 text-amber-500 font-semibold shadow-xs'
                    : 'text-muted hover:text-primary'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mobile</span>
              </button>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
          </div>
        </div>

        {showPreview && (
          <div
            className={`transition-all mx-auto overflow-hidden rounded-xl border border-white/10 ${
              previewDevice === 'mobile' ? 'max-w-sm' : 'w-full'
            }`}
          >
            {/* Atelier Storefront Dark Footer Simulation */}
            <div className="bg-[#0A0908] text-[#E7DFD5] p-6 sm:p-8 font-sans space-y-8 select-none">
              {/* Brand & Address + Columns Grid */}
              <div
                className={`grid gap-8 ${
                  previewDevice === 'mobile'
                    ? 'grid-cols-1'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-5'
                }`}
              >
                {/* Brand Column */}
                <div className={previewDevice === 'mobile' ? 'space-y-3' : 'lg:col-span-1 space-y-3'}>
                  <div className="font-serif text-lg tracking-[0.2em] font-light uppercase text-[#F7F4EE]">
                    {branding.platformName ? branding.platformName.toUpperCase() : 'STOREFRONT'}
                  </div>
                  <p className="text-[11px] text-white/50 leading-relaxed font-light">
                    Handcrafted European leather outerwear crafted by hand in our Milanese atelier.
                  </p>
                  <p className="text-[10px] text-white/40 font-mono">
                    {atelierAddress || 'Via Montenapoleone, 27, 20121 Milano, Italy'}
                  </p>

                  {/* Active Social Icons */}
                  <div className="flex items-center gap-2 pt-1 text-white/50">
                    {SUPPORTED_SOCIAL_PLATFORMS.map((p) => {
                      const url = (socialLinks[p.id] || '').trim();
                      if (!url && !(p.id === 'instagram' && instagramHandle)) return null;

                      return (
                        <span
                          key={p.id}
                          className="px-2 py-1 rounded bg-white/5 border border-white/10 text-[9px] uppercase tracking-wider text-[#C5A47E]"
                        >
                          {p.label}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Dynamic Columns */}
                {columns.map((col, idx) => (
                  <div key={idx} className="space-y-2.5">
                    <h4 className="text-[10px] uppercase font-mono tracking-[0.25em] text-[#C5A47E] font-medium">
                      {col.title || `Column ${idx + 1}`}
                    </h4>
                    <ul className="space-y-1.5 text-xs text-white/60 tracking-wider">
                      {col.links.map((link, lIdx) => {
                        const isContact = link.href === '/contact' || link.href === '/contact/';
                        return (
                          <li
                            key={lIdx}
                            className={`transition-colors ${
                              isContact ? 'text-[#C5A47E] font-medium' : 'hover:text-[#F7F4EE]'
                            }`}
                          >
                            {link.label || 'Untitled Link'}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Certification Trust Badge Line */}
              <div className="border-t border-white/10 pt-4 text-center">
                <p className="text-xs tracking-[0.16em] text-[#C5A47E] font-medium">
                  {certificationLine || '✔️ AZO-Free Leather · ✔️ EU REACH Compliant'}
                </p>
              </div>

              {/* Bottom Copyright & Cities */}
              <div className="border-t border-white/10 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] text-white/40">
                <p>
                  {copyrightText ||
                    `© ${new Date().getFullYear()} ${branding.platformName || 'Platform'}. All rights reserved.`}
                </p>
                <div className="flex items-center gap-3 tracking-widest uppercase text-white/50 font-mono text-[9px]">
                  {cities.map((city, cIdx) => (
                    <React.Fragment key={cIdx}>
                      <span>{city}</span>
                      {cIdx < cities.length - 1 && <span>•</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Save Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs flex items-center justify-between">
        <p className="text-xs text-muted">
          Persist all footer credentials, cities, social URLs, and navigation columns directly to the backend database.
        </p>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={handleReset}
            disabled={!isDirty || saveMutation.isPending}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleSave}
            isLoading={saveMutation.isPending}
            disabled={!canEdit || saveMutation.isPending}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Save Footer Settings
          </Button>
        </div>
      </div>
    </div>
  );
};
