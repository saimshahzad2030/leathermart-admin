import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionsApi } from '@/lib/api/commissions';
import {
  CustomSilhouette,
  CustomLeather,
  CustomColor,
  CustomLining,
  CustomHardware,
} from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Skeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import {
  Sliders,
  Scissors,
  Palette,
  Layers,
  Sparkles,
  Plus,
  Edit2,
  Trash2,
} from 'lucide-react';

export const BespokeStudioOptions: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'silhouettes' | 'leathers' | 'colors' | 'linings' | 'hardware'>('silhouettes');

  const { data: options, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['custom-studio-options'],
    queryFn: () => commissionsApi.getPublicOptions(),
  });

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; type: string } | null>(null);

  // Form Fields
  const [slug, setSlug] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePrice, setBasePrice] = useState<number | string>('');
  const [extraPrice, setExtraPrice] = useState<number | string>('');
  const [imageUrl, setImageUrl] = useState('');
  const [weight, setWeight] = useState('');
  const [origin, setOrigin] = useState('');
  const [hex, setHex] = useState('#11100F');
  const [finish, setFinish] = useState('');

  const resetForm = () => {
    setEditingItem(null);
    setSlug('');
    setName('');
    setDescription('');
    setBasePrice('');
    setExtraPrice('');
    setImageUrl('');
    setWeight('');
    setOrigin('');
    setHex('#11100F');
    setFinish('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setSlug(item.slug || '');
    setName(item.name || '');
    setDescription(item.description || '');
    setBasePrice(item.basePrice ?? '');
    setExtraPrice(item.extraPrice ?? '');
    setImageUrl(item.imageUrl || '');
    setWeight(item.weight || '');
    setOrigin(item.origin || '');
    setHex(item.hex || '#11100F');
    setFinish(item.finish || '');
    setModalOpen(true);
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (activeTab === 'silhouettes') {
        const payload: Partial<CustomSilhouette> = {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          description: description.trim(),
          basePrice: Number(basePrice) || 0,
          imageUrl: imageUrl.trim() || undefined,
          sortOrder: 0,
          isActive: true,
        };
        return editingItem
          ? commissionsApi.updateSilhouette(editingItem.id, payload)
          : commissionsApi.createSilhouette(payload);
      } else if (activeTab === 'leathers') {
        const payload: Partial<CustomLeather> = {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          weight: weight.trim(),
          origin: origin.trim(),
          description: description.trim(),
          extraPrice: Number(extraPrice) || 0,
          sortOrder: 0,
          isActive: true,
        };
        return editingItem
          ? commissionsApi.updateLeather(editingItem.id, payload)
          : commissionsApi.createLeather(payload);
      } else if (activeTab === 'colors') {
        const payload: Partial<CustomColor> = {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          hex: hex.trim(),
          sortOrder: 0,
          isActive: true,
        };
        return editingItem
          ? commissionsApi.updateColor(editingItem.id, payload)
          : commissionsApi.createColor(payload);
      } else if (activeTab === 'linings') {
        const payload: Partial<CustomLining> = {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          description: description.trim(),
          extraPrice: Number(extraPrice) || 0,
          sortOrder: 0,
          isActive: true,
        };
        return editingItem
          ? commissionsApi.updateLining(editingItem.id, payload)
          : commissionsApi.createLining(payload);
      } else if (activeTab === 'hardware') {
        const payload: Partial<CustomHardware> = {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          finish: finish.trim(),
          extraPrice: Number(extraPrice) || 0,
          sortOrder: 0,
          isActive: true,
        };
        return editingItem
          ? commissionsApi.updateHardware(editingItem.id, payload)
          : commissionsApi.createHardware(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-studio-options'] });
      toast.success('Bespoke studio option saved successfully.');
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save option.');
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!deleteTarget) return;
      if (deleteTarget.type === 'silhouettes') await commissionsApi.deleteSilhouette(deleteTarget.id);
      if (deleteTarget.type === 'leathers') await commissionsApi.deleteLeather(deleteTarget.id);
      if (deleteTarget.type === 'colors') await commissionsApi.deleteColor(deleteTarget.id);
      if (deleteTarget.type === 'linings') await commissionsApi.deleteLining(deleteTarget.id);
      if (deleteTarget.type === 'hardware') await commissionsApi.deleteHardware(deleteTarget.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-studio-options'] });
      toast.success('Option removed from studio catalogue.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete option.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Bespoke Studio Options
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Configure custom outerwear silhouettes, Tuscan leathers, lining twills, and hardware finishes
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh bespoke options"
          />
          <Button variant="primary" size="md" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Add Option
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('silhouettes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'silhouettes'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Scissors className="w-4 h-4" />
          Silhouettes ({options?.silhouettes?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('leathers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'leathers'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Layers className="w-4 h-4" />
          Leathers ({options?.leathers?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('colors')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'colors'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Palette className="w-4 h-4" />
          Colors ({options?.colors?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('linings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'linings'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Linings ({options?.linings?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('hardware')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'hardware'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Hardware ({options?.hardware?.length || 0})
        </button>
      </div>

      {/* Content Table / Cards */}
      <div className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm divide-y divide-theme">
            <thead className="bg-surface-subtle/60 text-xs uppercase tracking-wider text-muted font-medium">
              <tr>
                <th className="px-5 py-3.5">Name & Identifier</th>
                {activeTab === 'silhouettes' && <th className="px-5 py-3.5">Base Price</th>}
                {activeTab === 'leathers' && (
                  <>
                    <th className="px-5 py-3.5">Weight & Origin</th>
                    <th className="px-5 py-3.5">Surcharge</th>
                  </>
                )}
                {activeTab === 'colors' && <th className="px-5 py-3.5">Color Hex</th>}
                {activeTab === 'linings' && <th className="px-5 py-3.5">Surcharge</th>}
                {activeTab === 'hardware' && (
                  <>
                    <th className="px-5 py-3.5">Finish</th>
                    <th className="px-5 py-3.5">Surcharge</th>
                  </>
                )}
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme bg-surface">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20 mt-1" />
                    </td>
                    <td className="px-5 py-4">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    {(activeTab === 'leathers' || activeTab === 'hardware') && (
                      <td className="px-5 py-4">
                        <Skeleton className="h-4 w-24" />
                      </td>
                    )}
                    <td className="px-5 py-4">
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Skeleton className="h-8 w-8 rounded-lg" />
                        <Skeleton className="h-8 w-8 rounded-lg" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <>
                  {activeTab === 'silhouettes' &&
                    options?.silhouettes.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-primary">
                      {formatCurrency(item.basePrice)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.isActive ? 'active' : 'draft'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name, type: 'silhouettes' })}
                          className="p-1 text-muted hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeTab === 'leathers' &&
                options?.leathers.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-secondary">
                      {item.weight} • {item.origin}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-primary">
                      +{formatCurrency(item.extraPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.isActive ? 'active' : 'draft'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name, type: 'leathers' })}
                          className="p-1 text-muted hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeTab === 'colors' &&
                options?.colors.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full border border-theme shadow-xs"
                          style={{ backgroundColor: item.hex }}
                        />
                        <span className="font-mono text-xs text-secondary">{item.hex}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.isActive ? 'active' : 'draft'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name, type: 'colors' })}
                          className="p-1 text-muted hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeTab === 'linings' &&
                options?.linings.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-primary">
                      +{formatCurrency(item.extraPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.isActive ? 'active' : 'draft'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name, type: 'linings' })}
                          className="p-1 text-muted hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {activeTab === 'hardware' &&
                options?.hardware.map((item) => (
                  <tr key={item.id} className="hover:bg-surface-hover">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-primary">{item.name}</div>
                      <div className="text-xs text-muted font-mono">{item.slug}</div>
                    </td>
                    <td className="px-5 py-4 text-xs text-secondary">{item.finish}</td>
                    <td className="px-5 py-4 font-mono font-bold text-primary">
                      +{formatCurrency(item.extraPrice)}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={item.isActive ? 'active' : 'draft'} />
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <button
                          onClick={() => setDeleteTarget({ id: item.id, name: item.name, type: 'hardware' })}
                          className="p-1 text-muted hover:text-rose-500 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add New ${activeTab.slice(0, -1)}`}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name" required>
              <Input
                placeholder="e.g. Biker Jacket"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Slug" required>
              <Input
                placeholder="e.g. biker"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                required
              />
            </FormField>
          </div>

          {activeTab === 'silhouettes' && (
            <FormField label="Base Price (€ EUR)" required>
              <Input
                type="number"
                placeholder="e.g. 520"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                required
              />
            </FormField>
          )}

          {activeTab === 'leathers' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Weight Specification">
                  <Input
                    placeholder="e.g. 1.2mm"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                  />
                </FormField>
                <FormField label="Origin / Tannery">
                  <Input
                    placeholder="e.g. Santa Croce, Tuscany"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </FormField>
              </div>
              <FormField label="Extra Surcharge (€ EUR)">
                <Input
                  type="number"
                  placeholder="e.g. 80"
                  value={extraPrice}
                  onChange={(e) => setExtraPrice(e.target.value)}
                />
              </FormField>
            </>
          )}

          {activeTab === 'colors' && (
            <FormField label="Color Hex Code" required>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="w-10 h-10 rounded-xl border border-theme bg-transparent cursor-pointer p-0"
                />
                <Input
                  value={hex}
                  onChange={(e) => setHex(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </FormField>
          )}

          {activeTab === 'linings' && (
            <FormField label="Extra Surcharge (€ EUR)">
              <Input
                type="number"
                placeholder="e.g. 40"
                value={extraPrice}
                onChange={(e) => setExtraPrice(e.target.value)}
              />
            </FormField>
          )}

          {activeTab === 'hardware' && (
            <>
              <FormField label="Metal Finish">
                <Input
                  placeholder="e.g. Antiqued Brushed Brass"
                  value={finish}
                  onChange={(e) => setFinish(e.target.value)}
                />
              </FormField>
              <FormField label="Extra Surcharge (€ EUR)">
                <Input
                  type="number"
                  placeholder="e.g. 25"
                  value={extraPrice}
                  onChange={(e) => setExtraPrice(e.target.value)}
                />
              </FormField>
            </>
          )}

          {activeTab !== 'colors' && (
            <FormField label="Description">
              <Textarea
                rows={2}
                placeholder="Details of material or construction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormField>
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
              Save Option
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteMutation.mutate()}
        title={`Remove ${deleteTarget?.type.slice(0, -1)}`}
        message={`Are you sure you want to permanently delete "${deleteTarget?.name}"?`}
        confirmText="Delete Option"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
