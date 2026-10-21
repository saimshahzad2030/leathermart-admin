import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colorsApi } from '@/lib/api/colors';
import { ProductColor } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

interface ManageColorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onColorsUpdated?: () => void;
}

export const ManageColorsModal: React.FC<ManageColorsModalProps> = ({
  isOpen,
  onClose,
  onColorsUpdated,
}) => {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'store_manager']);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [editingColor, setEditingColor] = useState<ProductColor | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductColor | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [hex, setHex] = useState('#11100F');
  const [sortOrder, setSortOrder] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: colors = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-colors', search],
    queryFn: () => colorsApi.listColors({ search: search.trim() || undefined }),
    enabled: isOpen,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-colors'] });
    if (onColorsUpdated) onColorsUpdated();
  };

  const createMutation = useMutation({
    mutationFn: colorsApi.createColor,
    onSuccess: () => {
      toast.success('Product color created successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to create color');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => colorsApi.updateColor(id, data),
    onSuccess: () => {
      toast.success('Product color updated successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update color');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: colorsApi.toggleActive,
    onSuccess: (updated) => {
      toast.success(`Color '${updated.name}' is now ${updated.isActive ? 'active' : 'inactive'}`);
      invalidateQueries();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: colorsApi.deleteColor,
    onSuccess: () => {
      toast.success('Product color deleted successfully');
      setDeleteTarget(null);
      invalidateQueries();
    },
    onError: (err: any) => {
      if (err.response?.data?.errorCode === 'ERR_COLOR_IN_USE') {
        toast.error(
          err.response?.data?.message ||
            'Cannot delete color because it is currently assigned to products. Please unassign this color from all products first, or deactivate it instead.'
        );
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to delete color';
        toast.error(msg);
      }
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setEditingColor(null);
    setName('');
    setSlug('');
    setHex('#11100F');
    setSortOrder(colors.length * 10 + 10);
    setIsActive(true);
    setFormError('');
    setFieldErrors({});
    setIsFormOpen(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (c: ProductColor) => {
    setEditingColor(c);
    setName(c.name);
    setSlug(c.slug);
    setHex(c.hex || '#11100F');
    setSortOrder(c.sortOrder ?? 10);
    setIsActive(c.isActive);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Color name is required');
      return;
    }
    if (!hex.trim() || !/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(hex.trim())) {
      setFormError('Please enter a valid hex color code (e.g. #11100F)');
      return;
    }

    setFormError('');
    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      hex: hex.trim().toUpperCase(),
      sortOrder: Number(sortOrder) || 10,
      isActive,
    };

    if (editingColor) {
      updateMutation.mutate({ id: editingColor.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredColors = colors.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase()) ||
    c.hex.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Product Colors"
        subtitle="Maintain luxury leather palette, hex color swatches, and active status"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search colors (e.g. Black, Cognac, #8B4513)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-surface-subtle border border-theme rounded-xl pl-9 pr-3 py-2 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => refetch()}
                leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              >
                Refresh
              </Button>
              {canManage && (
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={handleStartCreate}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  Add Color
                </Button>
              )}
            </div>
          </div>

          {/* Inline Create / Edit Drawer */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-4 rounded-xl border border-amber-500/30 bg-surface-subtle/70 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-theme">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {editingColor ? `Edit Color: ${editingColor.name}` : 'Create New Color'}
                </h4>
                <button
                  type="button"
                  onClick={resetForm}
                  className="text-xs text-muted hover:text-primary"
                >
                  Cancel
                </button>
              </div>

              {formError && (
                <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormField label="Color Name" required error={getFieldError(fieldErrors, 'name')}>
                  <Input
                    placeholder="e.g. Obsidian Black or Tuscan Cognac"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'name'));
                      if (!editingColor && !slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="text-xs h-9"
                    required
                  />
                </FormField>

                <FormField label="Slug (Identifier)" error={getFieldError(fieldErrors, 'slug')}>
                  <Input
                    placeholder="e.g. obsidian-black"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'slug'));
                    }}
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="sm:col-span-2">
                  <FormField label="Hex Color Code" required error={getFieldError(fieldErrors, 'hex')}>
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="color"
                          value={hex}
                          onChange={(e) => {
                            setHex(e.target.value.toUpperCase());
                            setFieldErrors((prev) => clearFieldError(prev, 'hex'));
                          }}
                          className="w-10 h-9 rounded-xl border border-theme bg-transparent cursor-pointer p-0.5"
                        />
                      </div>
                      <Input
                        placeholder="#11100F"
                        value={hex}
                        onChange={(e) => {
                          setHex(e.target.value.toUpperCase());
                          setFieldErrors((prev) => clearFieldError(prev, 'hex'));
                        }}
                        className="text-xs h-9 font-mono flex-1"
                        required
                      />
                      <div
                        className="w-9 h-9 rounded-xl border border-theme shadow-xs flex-shrink-0"
                        style={{ backgroundColor: hex }}
                        title="Live swatch preview"
                      />
                    </div>
                  </FormField>
                </div>

                <FormField label="Sort Order" error={getFieldError(fieldErrors, 'sortOrder', 'sort_order')}>
                  <Input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(Number(e.target.value));
                      setFieldErrors((prev) => clearFieldError(prev, 'sortOrder', 'sort_order'));
                    }}
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Switch checked={isActive} onChange={setIsActive} />
                  <span className="text-xs text-secondary font-medium">
                    {isActive ? 'Active (available for products)' : 'Inactive (disabled for new products)'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={createMutation.isPending || updateMutation.isPending}
                  >
                    {editingColor ? 'Update Color' : 'Save Color'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Colors List Table */}
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle sticky top-0 border-b border-theme text-muted uppercase font-mono tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Swatch</th>
                    <th className="py-2.5 px-3">Color Name</th>
                    <th className="py-2.5 px-3">Hex / Slug</th>
                    <th className="py-2.5 px-3">Products</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        Loading color palette...
                      </td>
                    </tr>
                  ) : filteredColors.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        No product colors found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredColors.map((c) => (
                      <tr key={c.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div
                            className="w-6 h-6 rounded-lg border border-theme shadow-xs"
                            style={{ backgroundColor: c.hex }}
                          />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-primary">{c.name}</td>
                        <td className="py-2.5 px-3 font-mono text-muted text-[11px]">
                          <span className="text-primary font-bold">{c.hex}</span>
                          <span className="block text-[10px] text-muted">{c.slug}</span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-subtle border border-theme text-secondary">
                            {c.productCount ?? 0} {c.productCount === 1 ? 'product' : 'products'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => toggleMutation.mutate(c.id)}
                              className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to toggle status"
                            >
                              {c.isActive ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                                  <CheckCircle2 className="w-3.5 h-3.5" /> Active
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                                  <XCircle className="w-3.5 h-3.5" /> Inactive
                                </span>
                              )}
                            </button>
                          ) : (
                            c.isActive ? (
                              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-500 font-medium">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-medium">
                                <XCircle className="w-3.5 h-3.5" /> Inactive
                              </span>
                            )
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          {canManage && (
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(c)}
                                className="p-1 rounded text-muted hover:text-amber-500 transition-colors"
                                title="Edit color"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(c)}
                                className="p-1 rounded text-muted hover:text-rose-500 transition-colors"
                                title="Delete color"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete Product Color"
        message={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `WARNING: '${deleteTarget.name}' is currently assigned to ${deleteTarget.productCount} product(s). To preserve catalog integrity, you cannot delete a color in active use. Deactivate it instead.`
            : `Are you sure you want to permanently delete color '${deleteTarget?.name}'? This action cannot be undone.`
        }
        confirmText={deleteTarget?.productCount && deleteTarget.productCount > 0 ? 'Cannot Delete (In Use)' : 'Delete Color'}
        isDestructive={!(deleteTarget?.productCount && deleteTarget.productCount > 0)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
