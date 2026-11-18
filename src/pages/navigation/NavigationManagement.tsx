import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { navigationApi } from '@/lib/api/navigation';
import { DepartmentNavData, NavigationItem, NavigationFeatured } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError } from '@/lib/apiErrors';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Modal } from '@/components/common/Modal';
import { TableSkeleton } from '@/components/common/Skeleton';
import { NavigationItemList } from './NavigationItemList';
import { NavigationItemModal } from './NavigationItemModal';
import { FeaturedContentEditor } from './FeaturedContentEditor';
import { SectionModal } from './SectionModal';
import {
  Compass,
  Save,
  RotateCcw,
  Sparkles,
  Layers,
  Palette,
  ShieldAlert,
  CheckCircle2,
  FolderTree,
  Plus,
  Send,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Radio,
} from 'lucide-react';

type DepartmentKey = 'men' | 'women';

export const NavigationManagement: React.FC = () => {
  const { hasRole } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  const canEdit = hasRole(['super_admin', 'store_manager', 'content_editor']);

  // Active Department Tab ('men' | 'women')
  const [activeDept, setActiveDept] = useState<DepartmentKey>('men');

  // Pending department switch when dirty
  const [pendingDeptSwitch, setPendingDeptSwitch] = useState<DepartmentKey | null>(null);

  // Active Section sub-tab
  const [activeMenSection, setActiveMenSection] = useState<string>('categories');
  const [activeWomenSection, setActiveWomenSection] = useState<string>('categories');

  // Query Men and Women data independently
  const {
    data: serverMen,
    isLoading: isMenLoading,
    isFetching: isMenFetching,
    isError: isMenError,
    error: menError,
    refetch: refetchMen,
  } = useQuery({
    queryKey: ['admin-navigation', 'men'],
    queryFn: () => navigationApi.getMenu('men'),
  });

  const {
    data: serverWomen,
    isLoading: isWomenLoading,
    isFetching: isWomenFetching,
    isError: isWomenError,
    error: womenError,
    refetch: refetchWomen,
  } = useQuery({
    queryKey: ['admin-navigation', 'women'],
    queryFn: () => navigationApi.getMenu('women'),
  });

  // Local working copy drafts
  const [menDraft, setMenDraft] = useState<DepartmentNavData | null>(null);
  const [womenDraft, setWomenDraft] = useState<DepartmentNavData | null>(null);

  // Storefront Verification State
  const [storefrontData, setStorefrontData] = useState<any | null>(null);
  const [isVerifyingStorefront, setIsVerifyingStorefront] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [lastVerifiedDept, setLastVerifiedDept] = useState<DepartmentKey | null>(null);

  // Synchronize local drafts when server data arrives
  useEffect(() => {
    if (serverMen && !menDraft) {
      setMenDraft(JSON.parse(JSON.stringify(serverMen)));
    }
  }, [serverMen, menDraft]);

  useEffect(() => {
    if (serverWomen && !womenDraft) {
      setWomenDraft(JSON.parse(JSON.stringify(serverWomen)));
    }
  }, [serverWomen, womenDraft]);

  // Compute dirty states
  const isMenDirty = Boolean(
    menDraft && serverMen && JSON.stringify(menDraft) !== JSON.stringify(serverMen)
  );

  const isWomenDirty = Boolean(
    womenDraft && serverWomen && JSON.stringify(womenDraft) !== JSON.stringify(serverWomen)
  );

  const currentDraft = activeDept === 'men' ? menDraft : womenDraft;
  const isCurrentDirty = activeDept === 'men' ? isMenDirty : isWomenDirty;
  const activeSection = activeDept === 'men' ? activeMenSection : activeWomenSection;
  const setActiveSection = activeDept === 'men' ? setActiveMenSection : setActiveWomenSection;

  // Modal State for Navigation Item (Add / Edit)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    item: NavigationItem | null;
    index: number;
    section: string;
  } | null>(null);

  // Section Modal State (Add custom section)
  const [sectionModalOpen, setSectionModalOpen] = useState(false);

  // Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    index: number;
    item: NavigationItem;
    section: string;
  } | null>(null);

  // Helper to build clean payload
  const buildCleanPayload = (draft: DepartmentNavData, dept: DepartmentKey): DepartmentNavData => {
    const payload: DepartmentNavData = {
      id: dept,
      labelKey: draft.labelKey || `nav.${dept}`,
      fallbackLabel: draft.fallbackLabel || dept.toUpperCase(),
      href: draft.href || `/${dept}`,
      categories: Array.isArray(draft.categories) ? draft.categories : [],
      styles: Array.isArray(draft.styles) ? draft.styles : [],
      coats: Array.isArray(draft.coats) ? draft.coats : [],
      shopBy: Array.isArray(draft.shopBy) ? draft.shopBy : [],
      featured: draft.featured || {
        title: '',
        description: '',
        imageUrl: '',
        ctaTextKey: 'nav.featured.cta',
        fallbackCta: 'EXPLORE NOW',
        href: `/${dept}`,
        tag: 'NEW SEASON',
      },
    };

    // Preserve any custom array sections
    Object.keys(draft).forEach((key) => {
      if (
        ![
          'id',
          'labelKey',
          'fallbackLabel',
          'href',
          'categories',
          'styles',
          'coats',
          'shopBy',
          'featured',
          'isActive',
          'isDraft',
        ].includes(key) &&
        Array.isArray(draft[key])
      ) {
        payload[key] = draft[key];
      }
    });

    return payload;
  };

  // Save Draft Mutation (?draft=true)
  const saveDraftMutation = useMutation({
    mutationFn: async ({
      dept,
      payload,
    }: {
      dept: DepartmentKey;
      payload: DepartmentNavData;
    }) => {
      const cleanPayload = buildCleanPayload(payload, dept);
      return navigationApi.updateMenu(dept, cleanPayload, true);
    },
    onSuccess: (updatedData, variables) => {
      queryClient.setQueryData(['admin-navigation', variables.dept], updatedData);
      queryClient.invalidateQueries({ queryKey: ['admin-navigation', variables.dept] });

      if (variables.dept === 'men') {
        setMenDraft(JSON.parse(JSON.stringify(updatedData)));
      } else {
        setWomenDraft(JSON.parse(JSON.stringify(updatedData)));
      }

      toast.success(
        `${variables.dept === 'men' ? 'Men' : 'Women'} navigation draft saved successfully. Storefront remains unchanged.`,
        'Draft Saved'
      );
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to save navigation draft.');
      toast.error(parsed.message, 'Save Error');
    },
  });

  // Publish Live Mutation (Live commit without ?draft=true)
  const publishLiveMutation = useMutation({
    mutationFn: async ({
      dept,
      payload,
    }: {
      dept: DepartmentKey;
      payload: DepartmentNavData;
    }) => {
      const cleanPayload = buildCleanPayload(payload, dept);
      return navigationApi.updateMenu(dept, cleanPayload, false);
    },
    onSuccess: async (updatedData, variables) => {
      queryClient.setQueryData(['admin-navigation', variables.dept], updatedData);
      queryClient.invalidateQueries({ queryKey: ['admin-navigation', variables.dept] });

      if (variables.dept === 'men') {
        setMenDraft(JSON.parse(JSON.stringify(updatedData)));
      } else {
        setWomenDraft(JSON.parse(JSON.stringify(updatedData)));
      }

      toast.success(
        `${variables.dept === 'men' ? 'Men' : 'Women'} navigation menu published live to storefront!`,
        'Published Live'
      );

      // Automatically verify storefront
      await handleVerifyStorefront(variables.dept);
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to publish navigation menu.');
      toast.error(parsed.message, 'Publish Error');
    },
  });

  // Storefront Verification Action
  const handleVerifyStorefront = async (deptToVerify: DepartmentKey = activeDept) => {
    setIsVerifyingStorefront(true);
    try {
      const liveData = await navigationApi.getStorefrontNavigation(deptToVerify);
      setStorefrontData(liveData);
      setLastVerifiedDept(deptToVerify);
      setVerificationModalOpen(true);
      toast.success(
        `Storefront navigation verified for ${deptToVerify.toUpperCase()}.`,
        'Storefront Verified'
      );
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to verify public storefront navigation.');
      toast.error(parsed.message, 'Verification Error');
    } finally {
      setIsVerifyingStorefront(false);
    }
  };

  const handleSaveDraft = () => {
    if (!currentDraft || !canEdit || !isCurrentDirty) return;
    saveDraftMutation.mutate({
      dept: activeDept,
      payload: currentDraft,
    });
  };

  const handlePublishLive = () => {
    if (!currentDraft || !canEdit) return;
    publishLiveMutation.mutate({
      dept: activeDept,
      payload: currentDraft,
    });
  };

  const handleResetActive = () => {
    if (activeDept === 'men' && serverMen) {
      setMenDraft(JSON.parse(JSON.stringify(serverMen)));
      toast.info('Men navigation draft reverted to server state.');
    } else if (activeDept === 'women' && serverWomen) {
      setWomenDraft(JSON.parse(JSON.stringify(serverWomen)));
      toast.info('Women navigation draft reverted to server state.');
    }
  };

  const handleRefresh = async () => {
    if (activeDept === 'men') {
      const res = await refetchMen();
      if (res.data) setMenDraft(JSON.parse(JSON.stringify(res.data)));
    } else {
      const res = await refetchWomen();
      if (res.data) setWomenDraft(JSON.parse(JSON.stringify(res.data)));
    }
    toast.info('Refreshed navigation data from backend.');
  };

  // Safe Department Switching with Unsaved Changes Guard
  const handleDepartmentSwitch = (target: DepartmentKey) => {
    if (target === activeDept) return;
    if (isCurrentDirty) {
      setPendingDeptSwitch(target);
      return;
    }
    setActiveDept(target);
  };

  const handleConfirmDiscardSwitch = () => {
    if (!pendingDeptSwitch) return;
    if (activeDept === 'men' && serverMen) {
      setMenDraft(JSON.parse(JSON.stringify(serverMen)));
    } else if (activeDept === 'women' && serverWomen) {
      setWomenDraft(JSON.parse(JSON.stringify(serverWomen)));
    }
    setActiveDept(pendingDeptSwitch);
    setPendingDeptSwitch(null);
    toast.info(`Switched to ${pendingDeptSwitch.toUpperCase()}. Unsaved changes discarded.`);
  };

  // Helper to update specific section in current draft
  const updateSectionItems = (section: string, newItems: NavigationItem[]) => {
    if (activeDept === 'men') {
      setMenDraft((prev) => (prev ? { ...prev, [section]: newItems } : null));
    } else {
      setWomenDraft((prev) => (prev ? { ...prev, [section]: newItems } : null));
    }
  };

  const updateFeatured = (featured: NavigationFeatured) => {
    if (activeDept === 'men') {
      setMenDraft((prev) => (prev ? { ...prev, featured } : null));
    } else {
      setWomenDraft((prev) => (prev ? { ...prev, featured } : null));
    }
  };

  // Add Custom Section
  const handleCreateSection = (section: { name: string; key: string; description?: string }) => {
    if (!currentDraft) return;
    const { key } = section;
    if (activeDept === 'men') {
      setMenDraft((prev) => (prev ? { ...prev, [key]: [] } : null));
      setActiveMenSection(key);
    } else {
      setWomenDraft((prev) => (prev ? { ...prev, [key]: [] } : null));
      setActiveWomenSection(key);
    }
    toast.success(`Created section "${section.name}". Add navigation items below.`);
  };

  // Item Add/Edit Triggers
  const handleAddNewItem = (section: string) => {
    setEditingItem({ item: null, index: -1, section });
    setModalOpen(true);
  };

  const handleEditItem = (item: NavigationItem, index: number, section: string) => {
    setEditingItem({ item, index, section });
    setModalOpen(true);
  };

  const handleSaveItemModal = (item: NavigationItem) => {
    if (!editingItem || !currentDraft) return;
    const { section, index } = editingItem;
    const existingList: NavigationItem[] = currentDraft[section] || [];
    const updatedList = [...existingList];

    if (index >= 0) {
      updatedList[index] = item;
    } else {
      updatedList.push(item);
    }

    updateSectionItems(section, updatedList);
    setModalOpen(false);
    setEditingItem(null);
  };

  const handleDeleteItem = (index: number, item: NavigationItem, section: string) => {
    setDeleteTarget({ index, item, section });
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget || !currentDraft) return;
    const { section, index } = deleteTarget;
    const existingList: NavigationItem[] = currentDraft[section] || [];
    const updatedList = existingList.filter((_, i) => i !== index);

    updateSectionItems(section, updatedList);
    setDeleteTarget(null);
    toast.info(`Removed "${deleteTarget.item.fallbackLabel}" from ${section}.`);
  };

  const isLoading =
    activeDept === 'men' ? isMenLoading && !menDraft : isWomenLoading && !womenDraft;
  const isFetching = activeDept === 'men' ? isMenFetching : isWomenFetching;
  const isError = activeDept === 'men' ? isMenError : isWomenError;
  const currentError = activeDept === 'men' ? menError : womenError;

  // Existing IDs for duplicate validation in modal
  const existingIds =
    editingItem && currentDraft
      ? ((currentDraft[editingItem.section] as NavigationItem[]) || []).map((i) => i.id)
      : [];

  // Available section keys
  const defaultSections =
    activeDept === 'men'
      ? [
        { key: 'categories', label: 'Categories', icon: FolderTree },
        { key: 'styles', label: 'Styles', icon: Palette },
        { key: 'shopBy', label: 'Shop By', icon: Layers },
        { key: 'featured', label: 'Featured Content', icon: Sparkles },
      ]
      : [
        { key: 'categories', label: 'Categories', icon: FolderTree },
        { key: 'coats', label: 'Coats', icon: Palette },
        { key: 'shopBy', label: 'Shop By', icon: Layers },
        { key: 'featured', label: 'Featured Content', icon: Sparkles },
      ];

  const customSectionKeys = currentDraft
    ? Object.keys(currentDraft).filter(
      (k) =>
        ![
          'id',
          'labelKey',
          'fallbackLabel',
          'href',
          'categories',
          'styles',
          'coats',
          'shopBy',
          'featured',
          'isActive',
          'isDraft',
        ].includes(k) && Array.isArray(currentDraft[k])
    )
    : [];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary font-serif-luxury tracking-wide">
                Navigation CMS
              </h1>
              <p className="text-xs text-muted mt-0.5">
                Manage Men & Women mega-menus, category taxonomies, curated link groups, and promotional editorial cards.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <RefreshButton
            onRefresh={handleRefresh}
            isRefreshing={isFetching}
            size="sm"
            label="Refresh"
          />

          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleVerifyStorefront(activeDept)}
            disabled={isVerifyingStorefront}
            isLoading={isVerifyingStorefront}
            leftIcon={<Radio className="w-4 h-4 text-emerald-400" />}
            title="Verify Live Public Storefront Navigation"
          >
            Verify Storefront
          </Button>

          {isCurrentDirty && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetActive}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset Draft
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSaveDraft}
            disabled={!canEdit || !isCurrentDirty || saveDraftMutation.isPending}
            isLoading={saveDraftMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            Save Draft
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePublishLive}
            disabled={!canEdit || publishLiveMutation.isPending}
            isLoading={publishLiveMutation.isPending}
            leftIcon={<Send className="w-4 h-4" />}
          >
            Publish Live
          </Button>
        </div>
      </div>

      {/* Role Notice */}
      {!canEdit && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500 text-xs flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 shrink-0" />
          <span>
            Read-only access: Only users with <strong>Super Admin</strong>,{' '}
            <strong>Store Manager</strong>, or <strong>Content Editor</strong> roles can modify and publish navigation hierarchies.
          </span>
        </div>
      )}

      {/* Unsaved Changes Banner */}
      {isCurrentDirty && (
        <div className="p-3.5 px-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-500 animate-in fade-in">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>
              You have unsaved changes in the <strong>{activeDept.toUpperCase()}</strong> navigation menu draft.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[11px] opacity-80">
              Save Draft (safe) or Publish Live to push to storefront.
            </span>
          </div>
        </div>
      )}

      {/* Department Tabs (Men / Women) */}
      <div className="flex items-center justify-between border-b border-theme pb-px">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleDepartmentSwitch('men')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl font-serif-luxury text-sm font-semibold tracking-wider transition-all cursor-pointer relative ${activeDept === 'men'
              ? 'bg-surface border-t border-l border-r border-theme text-amber-500 -mb-px shadow-xs'
              : 'text-muted hover:text-primary hover:bg-surface-hover/50'
              }`}
          >
            <span>MEN</span>
            {isMenDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title="Unsaved changes in Men" />
            )}
            {menDraft && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-subtle border border-theme text-muted">
                {(menDraft.categories?.length || 0) +
                  (menDraft.styles?.length || 0) +
                  (menDraft.shopBy?.length || 0)}{' '}
                links
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleDepartmentSwitch('women')}
            className={`flex items-center gap-2.5 px-5 py-3 rounded-t-2xl font-serif-luxury text-sm font-semibold tracking-wider transition-all cursor-pointer relative ${activeDept === 'women'
              ? 'bg-surface border-t border-l border-r border-theme text-amber-500 -mb-px shadow-xs'
              : 'text-muted hover:text-primary hover:bg-surface-hover/50'
              }`}
          >
            <span>WOMEN</span>
            {isWomenDirty && (
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-xs" title="Unsaved changes in Women" />
            )}
            {womenDraft && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-subtle border border-theme text-muted">
                {(womenDraft.categories?.length || 0) +
                  (womenDraft.coats?.length || 0) +
                  (womenDraft.shopBy?.length || 0)}{' '}
                links
              </span>
            )}
          </button>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => handleVerifyStorefront(activeDept)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Storefront API Active</span>
          </button>
        </div>
      </div>

      {/* Error State */}
      {isError && !currentDraft && (
        <div className="p-8 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-center space-y-4">
          <AlertTriangle className="w-8 h-8 mx-auto" />
          <div>
            <h3 className="text-base font-semibold">Failed to load {activeDept.toUpperCase()} navigation</h3>
            <p className="text-xs text-rose-400 mt-1">
              {currentError ? parseApiError(currentError).message : 'Something went wrong. Please try again in a few seconds.'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            Retry Loading
          </Button>
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading ? (
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs">
          <TableSkeleton rows={6} cols={6} />
        </div>
      ) : currentDraft ? (
        <div className="space-y-6">
          {/* Section Sub-Tabs */}
          <div className="flex items-center justify-between gap-3 overflow-x-auto pb-1">
            <div className="flex items-center gap-2 shrink-0">
              {defaultSections.map((sec) => {
                const IconComponent = sec.icon;
                const isSelected = activeSection === sec.key;
                const count =
                  sec.key === 'featured'
                    ? 'Card'
                    : Array.isArray(currentDraft[sec.key])
                      ? currentDraft[sec.key].length
                      : 0;

                return (
                  <button
                    key={sec.key}
                    type="button"
                    onClick={() => setActiveSection(sec.key)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${isSelected
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      : 'text-muted hover:text-primary hover:bg-surface-hover border border-transparent'
                      }`}
                  >
                    <IconComponent className="w-3.5 h-3.5" />
                    <span>{sec.label}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface border border-theme">
                      {count}
                    </span>
                  </button>
                );
              })}

              {/* Custom Sections */}
              {customSectionKeys.map((secKey) => {
                const isSelected = activeSection === secKey;
                const count = Array.isArray(currentDraft[secKey]) ? currentDraft[secKey].length : 0;
                const formattedName = secKey.charAt(0).toUpperCase() + secKey.slice(1);

                return (
                  <button
                    key={secKey}
                    type="button"
                    onClick={() => setActiveSection(secKey)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shrink-0 ${isSelected
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30'
                      : 'text-muted hover:text-primary hover:bg-surface-hover border border-transparent'
                      }`}
                  >
                    <FolderTree className="w-3.5 h-3.5" />
                    <span>{formattedName}</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-surface border border-theme">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {canEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSectionModalOpen(true)}
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                className="text-muted hover:text-amber-500 shrink-0 text-xs"
              >
                Add Section
              </Button>
            )}
          </div>

          {/* Section Body */}
          {activeSection === 'featured' ? (
            currentDraft.featured && (
              <FeaturedContentEditor
                departmentId={activeDept}
                featured={currentDraft.featured}
                onChange={updateFeatured}
                canEdit={canEdit}
              />
            )
          ) : (
            <NavigationItemList
              departmentId={activeDept}
              sectionTitle={
                activeSection === 'categories'
                  ? 'Categories'
                  : activeSection === 'styles'
                    ? 'Styles'
                    : activeSection === 'coats'
                      ? 'Coats'
                      : activeSection === 'shopBy'
                        ? 'Shop By'
                        : activeSection.charAt(0).toUpperCase() + activeSection.slice(1)
              }
              sectionDescription={
                activeSection === 'categories'
                  ? 'Primary outerwear silhouettes and core taxonomy links displayed in the first column.'
                  : activeSection === 'styles'
                    ? 'Curated style aesthetics (Classic, Vintage, Biker, Minimal, Luxury) shown in the second column.'
                    : activeSection === 'coats'
                      ? 'Dedicated women outerwear coats section (Leather Coats, Trench, Shearling).'
                      : activeSection === 'shopBy'
                        ? 'Filter and leather finish criteria (Black, Brown, Suede, Shearling) in the third column.'
                        : `Custom navigation group for ${activeDept.toUpperCase()} menu.`
              }
              items={Array.isArray(currentDraft[activeSection]) ? currentDraft[activeSection] : []}
              onReorder={(items) => updateSectionItems(activeSection, items)}
              onEdit={(item, index) => handleEditItem(item, index, activeSection)}
              onDelete={(index) =>
                handleDeleteItem(
                  index,
                  (currentDraft[activeSection] as NavigationItem[])[index],
                  activeSection
                )
              }
              onAddNew={() => handleAddNewItem(activeSection)}
              canEdit={canEdit}
            />
          )}
        </div>
      ) : null}

      {/* Item Modal (Add/Edit) */}
      {modalOpen && editingItem && (
        <NavigationItemModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingItem(null);
          }}
          onSave={handleSaveItemModal}
          initialItem={editingItem.item}
          existingIds={existingIds}
          sectionName={editingItem.section}
          departmentId={activeDept}
        />
      )}

      {/* Section Modal (Add Section) */}
      {sectionModalOpen && (
        <SectionModal
          isOpen={sectionModalOpen}
          onClose={() => setSectionModalOpen(false)}
          onSave={handleCreateSection}
          existingKeys={[...defaultSections.map((s) => s.key), ...customSectionKeys]}
          departmentId={activeDept}
        />
      )}

      {/* Delete Item Confirmation Dialog */}
      {deleteTarget && (
        <ConfirmDialog
          isOpen={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          title="Remove Navigation Link"
          message={`Are you sure you want to delete "${deleteTarget.item.fallbackLabel}" (${deleteTarget.item.id}) from the ${deleteTarget.section} section?`}
          confirmText="Delete Link"
          isDestructive={true}
        />
      )}

      {/* Discard Changes on Department Switch Warning Dialog */}
      {pendingDeptSwitch && (
        <ConfirmDialog
          isOpen={Boolean(pendingDeptSwitch)}
          onClose={() => setPendingDeptSwitch(null)}
          onConfirm={handleConfirmDiscardSwitch}
          title="Discard Unsaved Draft Changes?"
          message={`You have unsaved changes in the ${activeDept.toUpperCase()} navigation menu. If you switch to ${pendingDeptSwitch.toUpperCase()} now, your current unsaved modifications will be discarded. Do you wish to proceed?`}
          confirmText="Discard & Switch"
          isDestructive={true}
        />
      )}

      {/* Storefront Verification Modal */}
      {verificationModalOpen && (
        <Modal
          isOpen={verificationModalOpen}
          onClose={() => setVerificationModalOpen(false)}
          title={`Storefront Live Verification (${lastVerifiedDept?.toUpperCase()})`}
          subtitle={`Queried GET /api/v1/content/navigation?department=${lastVerifiedDept}`}
          maxWidth="lg"
        >
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 shrink-0" />
              <span>
                The public storefront API is healthy and serving active published navigation for{' '}
                <strong>{lastVerifiedDept?.toUpperCase()}</strong>.
              </span>
            </div>

            {storefrontData && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-surface border border-theme">
                    <span className="text-muted block text-[10px] uppercase font-mono">Department</span>
                    <span className="font-semibold text-primary">{storefrontData.label || lastVerifiedDept?.toUpperCase()}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-theme">
                    <span className="text-muted block text-[10px] uppercase font-mono">Categories</span>
                    <span className="font-semibold text-primary">{storefrontData.categories?.length || 0}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-theme">
                    <span className="text-muted block text-[10px] uppercase font-mono">Styles / Coats</span>
                    <span className="font-semibold text-primary">
                      {(storefrontData.styles?.length || 0) + (storefrontData.coats?.length || 0)}
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface border border-theme">
                    <span className="text-muted block text-[10px] uppercase font-mono">Shop By</span>
                    <span className="font-semibold text-primary">{storefrontData.shopBy?.length || 0}</span>
                  </div>
                </div>

                {storefrontData.featured && (
                  <div className="p-3.5 rounded-xl bg-surface border border-theme text-xs space-y-1.5">
                    <span className="text-muted block text-[10px] uppercase font-mono">Active Promotional Card</span>
                    <p className="font-semibold text-primary">{storefrontData.featured.title || 'Untitled Card'}</p>
                    <p className="text-muted text-[11px] line-clamp-2">{storefrontData.featured.description}</p>
                    <div className="flex items-center gap-2 pt-1 font-mono text-[10px] text-amber-500">
                      <span>CTA: {storefrontData.featured.fallbackCta || storefrontData.featured.ctaText || 'EXPLORE NOW'}</span>
                      <span>&rarr;</span>
                      <span>{storefrontData.featured.href || `/${lastVerifiedDept}`}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex items-center justify-end pt-3 border-t border-theme">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setVerificationModalOpen(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
