import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sizesApi } from '@/lib/api/sizes';
import { ProductSize } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

interface ManageSizesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSizesUpdated?: () => void;
}

export const ManageSizesModal: React.FC<ManageSizesModalProps> = ({
  isOpen,
  onClose,
  onSizesUpdated,
}) => {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'store_manager']);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [editingSize, setEditingSize] = useState<ProductSize | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductSize | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: sizes = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-sizes', search],
    queryFn: () => sizesApi.listSizes({ search: search.trim() || undefined }),
    enabled: isOpen,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-sizes'] });
    if (onSizesUpdated) onSizesUpdated();
  };

  const createMutation = useMutation({
    mutationFn: sizesApi.createSize,
    onSuccess: () => {
      toast.success('Product size created successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to create size');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => sizesApi.updateSize(id, data),
    onSuccess: () => {
      toast.success('Product size updated successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update size');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: sizesApi.toggleActive,
    onSuccess: (updated) => {
      toast.success( `Size '${updated.name}' is now ${updated.isActive ? 'active' : 'inactive'}`);
      invalidateQueries();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      toast.error( msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sizesApi.deleteSize,
    onSuccess: () => {
      toast.success( 'Product size deleted successfully');
      setDeleteTarget(null);
      invalidateQueries();
    },
    onError: (err: any) => {
      if (err.response?.data?.errorCode === 'ERR_SIZE_IN_USE') {
        toast.error(
          err.response?.data?.message ||
            'Cannot delete size because it is currently assigned to products. Please unassign this size from all products first, or deactivate it instead.'
        );
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to delete size';
        toast.error(msg);
      }
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setEditingSize(null);
    setName('');
    setSlug('');
    setDescription('');
    setSortOrder(sizes.length * 10 + 10);
    setIsActive(true);
    setFormError('');
    setFieldErrors({});
    setIsFormOpen(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (s: ProductSize) => {
    setEditingSize(s);
    setName(s.name);
    setSlug(s.slug);
    setDescription(s.description || '');
    setSortOrder(s.sortOrder ?? 10);
    setIsActive(s.isActive);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Size name or label is required');
      return;
    }

    setFormError('');
    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim() || undefined,
      sortOrder: Number(sortOrder) || 10,
      isActive,
    };

    if (editingSize) {
      updateMutation.mutate({ id: editingSize.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredSizes = sizes.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Product Sizes"
        subtitle="Configure reusable garment sizing, bespoke custom sizes, and sort ordering"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search sizes (e.g. M, 48 EU, Custom)..."
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
                  Add Size
                </Button>
              )}
            </div>
          </div>

          {/* Inline Create / Edit Drawer */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-4 rounded-xl border border-amber-500/30 bg-surface-subtle/70 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-theme">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {editingSize ? `Edit Size: ${editingSize.name}` : 'Create New Size'}
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
                <FormField label="Size Label / Name" required error={getFieldError(fieldErrors, 'name')}>
                  <Input
                    placeholder="e.g. 48 (EU M) or XL or Custom Made"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'name'));
                      if (!editingSize && !slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="text-xs h-9"
                    required
                  />
                </FormField>

                <FormField label="Slug (Identifier)" error={getFieldError(fieldErrors, 'slug')}>
                  <Input
                    placeholder="e.g. 48-eu-m"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'slug'));
                    }}
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <FormField label="Measurement Context / Notes" error={getFieldError(fieldErrors, 'description')}>
                    <Input
                      placeholder="e.g. Chest 96-100cm, Shoulder 45cm"
                      value={description}
                      onChange={(e) => {
                        setDescription(e.target.value);
                        setFieldErrors((prev) => clearFieldError(prev, 'description'));
                      }}
                      className="text-xs h-9"
                    />
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
                    {isActive ? 'Active (available for new products)' : 'Inactive (disabled for new products)'}
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
                    {editingSize ? 'Update Size' : 'Save Size'}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* Sizes List Table */}
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-subtle sticky top-0 border-b border-theme text-muted uppercase font-mono tracking-wider text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Order</th>
                    <th className="py-2.5 px-3">Size Label</th>
                    <th className="py-2.5 px-3">Identifier</th>
                    <th className="py-2.5 px-3">Products</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        Loading size catalog...
                      </td>
                    </tr>
                  ) : filteredSizes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-muted">
                        No product sizes found matching search.
                      </td>
                    </tr>
                  ) : (
                    filteredSizes.map((s) => (
                      <tr key={s.id} className="hover:bg-surface-subtle/50 transition-colors">
                        <td className="py-2.5 px-3 font-mono text-muted">{s.sortOrder}</td>
                        <td className="py-2.5 px-3 font-semibold text-primary">
                          {s.name}
                          {s.description && (
                            <span className="block text-[11px] font-normal text-muted truncate max-w-xs">
                              {s.description}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-muted text-[11px]">{s.slug}</td>
                        <td className="py-2.5 px-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono bg-surface-subtle border border-theme text-secondary">
                            {s.productCount ?? 0} {s.productCount === 1 ? 'product' : 'products'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {canManage ? (
                            <button
                              type="button"
                              onClick={() => toggleMutation.mutate(s.id)}
                              className="inline-flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity"
                              title="Click to toggle status"
                            >
                              {s.isActive ? (
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
                            s.isActive ? (
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
                                onClick={() => handleStartEdit(s)}
                                className="p-1 rounded text-muted hover:text-amber-500 transition-colors"
                                title="Edit size"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(s)}
                                className="p-1 rounded text-muted hover:text-rose-500 transition-colors"
                                title="Delete size"
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

      {/* Delete Confirmation Dialog with Safeguard */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget.id);
        }}
        title="Delete Product Size"
        message={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `WARNING: '${deleteTarget.name}' is currently assigned to ${deleteTarget.productCount} product(s). To preserve catalog integrity, you cannot delete a size that is in use. Deactivate it instead to prevent new assignments.`
            : `Are you sure you want to permanently delete size '${deleteTarget?.name}'? This action cannot be undone.`
        }
        confirmText={deleteTarget?.productCount && deleteTarget.productCount > 0 ? 'Cannot Delete (In Use)' : 'Delete Size'}
        isDestructive={!(deleteTarget?.productCount && deleteTarget.productCount > 0)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
