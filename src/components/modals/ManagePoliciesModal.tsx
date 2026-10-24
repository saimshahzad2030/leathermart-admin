import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { policiesApi } from '@/lib/api/policies';
import { ProductPolicy } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import { Plus, Edit2, Trash2, Search, CheckCircle2, XCircle, RefreshCw, ListOrdered, X } from 'lucide-react';

interface ManagePoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPoliciesUpdated?: () => void;
}

export const ManagePoliciesModal: React.FC<ManagePoliciesModalProps> = ({
  isOpen,
  onClose,
  onPoliciesUpdated,
}) => {
  const toast = useToast();
  const { hasRole } = useAuth();
  const canManage = hasRole(['super_admin', 'store_manager']);
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<ProductPolicy | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ProductPolicy | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [bulletPoints, setBulletPoints] = useState<string[]>([]);
  const [newBullet, setNewBullet] = useState('');
  const [sortOrder, setSortOrder] = useState<number>(10);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});

  const { data: policies = [], isLoading, refetch } = useQuery({
    queryKey: ['admin-policies', search],
    queryFn: () => policiesApi.listPolicies({ search: search.trim() || undefined }),
    enabled: isOpen,
  });

  const invalidateQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-policies'] });
    if (onPoliciesUpdated) onPoliciesUpdated();
  };

  const createMutation = useMutation({
    mutationFn: policiesApi.createPolicy,
    onSuccess: () => {
      toast.success('Policy created successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to create policy');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => policiesApi.updatePolicy(id, data),
    onSuccess: () => {
      toast.success('Policy updated successfully');
      resetForm();
      invalidateQueries();
    },
    onError: (err: any) => {
      const parsed = parseApiError(err, 'Failed to update policy');
      setFieldErrors(parsed.fieldErrors);
      setFormError(parsed.message);
      if (!parsed.hasFieldErrors) {
        toast.error(parsed.message);
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: policiesApi.toggleActive,
    onSuccess: (updated) => {
      toast.success(`Policy '${updated.name}' is now ${updated.isActive ? 'active' : 'inactive'}`);
      invalidateQueries();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.message || err.message || 'Failed to toggle status';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: policiesApi.deletePolicy,
    onSuccess: () => {
      toast.success('Policy deleted successfully');
      setDeleteTarget(null);
      invalidateQueries();
    },
    onError: (err: any) => {
      if (err.response?.data?.errorCode === 'ERR_POLICY_IN_USE') {
        toast.error(
          err.response?.data?.message ||
            'Cannot delete policy because it is currently assigned to products. Please unassign this policy from all products first, or deactivate it instead.'
        );
      } else {
        const msg = err.response?.data?.message || err.message || 'Failed to delete policy';
        toast.error(msg);
      }
      setDeleteTarget(null);
    },
  });

  const resetForm = () => {
    setEditingPolicy(null);
    setName('');
    setSlug('');
    setDescription('');
    setBulletPoints([]);
    setNewBullet('');
    setSortOrder(policies.length * 10 + 10);
    setIsActive(true);
    setFormError('');
    setFieldErrors({});
    setIsFormOpen(false);
  };

  const handleStartCreate = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleStartEdit = (p: ProductPolicy) => {
    setEditingPolicy(p);
    setName(p.name);
    setSlug(p.slug);
    setDescription(p.description || '');
    setBulletPoints(Array.isArray(p.bulletPoints) ? [...p.bulletPoints] : []);
    setNewBullet('');
    setSortOrder(p.sortOrder ?? 10);
    setIsActive(p.isActive);
    setFormError('');
    setIsFormOpen(true);
  };

  const handleAddBullet = () => {
    if (!newBullet.trim()) return;
    setBulletPoints([...bulletPoints, newBullet.trim()]);
    setNewBullet('');
  };

  const handleRemoveBullet = (index: number) => {
    setBulletPoints(bulletPoints.filter((_, idx) => idx !== index));
  };

  const handleUpdateBullet = (index: number, val: string) => {
    const copy = [...bulletPoints];
    copy[index] = val;
    setBulletPoints(copy);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Policy name is required');
      return;
    }
    if (!description.trim()) {
      setFormError('Policy description is required');
      return;
    }

    setFormError('');
    const payload = {
      name: name.trim(),
      slug: slug.trim() || undefined,
      description: description.trim(),
      bulletPoints: bulletPoints.filter((b) => b && b.trim().length > 0),
      sortOrder: Number(sortOrder) || 10,
      isActive,
    };

    if (editingPolicy) {
      updateMutation.mutate({ id: editingPolicy.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const filteredPolicies = policies.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.slug.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Manage Reusable Product Policies"
        subtitle="Manage shipping, returns, warranty, and bespoke care policies attached across products"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Top toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search policies (e.g. Shipping, Returns, Warranty)..."
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
                  Add Policy
                </Button>
              )}
            </div>
          </div>

          {/* Inline Create / Edit Drawer */}
          {isFormOpen && (
            <form onSubmit={handleSave} className="p-4 rounded-xl border border-amber-500/30 bg-surface-subtle/70 space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-theme">
                <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500">
                  {editingPolicy ? `Edit Policy: ${editingPolicy.name}` : 'Create New Reusable Policy'}
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
                <FormField label="Policy Name / Title" required error={getFieldError(fieldErrors, 'name')}>
                  <Input
                    placeholder="e.g. Shipping & White-Glove Delivery"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'name'));
                      if (!editingPolicy && !slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                    className="text-xs h-9"
                    required
                  />
                </FormField>

                <FormField label="Slug (Stable Identifier)" error={getFieldError(fieldErrors, 'slug')}>
                  <Input
                    placeholder="e.g. shipping-delivery"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setFieldErrors((prev) => clearFieldError(prev, 'slug'));
                    }}
                    className="text-xs h-9 font-mono"
                  />
                </FormField>
              </div>

              <FormField label="Main Policy Narrative Description" required error={getFieldError(fieldErrors, 'description')}>
                <Textarea
                  placeholder="Comprehensive description displayed on product detail accordions..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setFieldErrors((prev) => clearFieldError(prev, 'description'));
                  }}
                  rows={3}
                  className="text-xs"
                  required
                />
              </FormField>

              {/* Repeatable Bullet Points Section */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <ListOrdered className="w-3.5 h-3.5 text-amber-500" />
                  Key Highlights / Bullet Points (Optional)
                </label>
                <div className="space-y-2">
                  {bulletPoints.map((bullet, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted w-4">{idx + 1}.</span>
                      <Input
                        value={bullet}
                        onChange={(e) => handleUpdateBullet(idx, e.target.value)}
                        placeholder="Bullet point detail..."
                        className="text-xs h-8 flex-1"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveBullet(idx)}
                        className="text-muted hover:text-rose-500 p-1 transition-colors"
                        title="Remove bullet"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-2 pt-1">
                    <Input
                      value={newBullet}
                      onChange={(e) => setNewBullet(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddBullet();
                        }
                      }}
                      placeholder="Add another highlight bullet..."
                      className="text-xs h-8 flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddBullet}
                      leftIcon={<Plus className="w-3 h-3" />}
                    >
                      Add Point
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
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

                <div className="flex items-center gap-2 pt-4">
                  <Switch checked={isActive} onChange={setIsActive} />
                  <span className="text-xs text-secondary font-medium">
                    {isActive ? 'Active (available for products)' : 'Inactive (disabled for new products)'}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme">
                <Button type="button" variant="outline" size="sm" onClick={resetForm}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  isLoading={createMutation.isPending || updateMutation.isPending}
                >
                  {editingPolicy ? 'Update Policy' : 'Save Policy'}
                </Button>
              </div>
            </form>
          )}

          {/* Policies List */}
          <div className="border border-theme rounded-xl overflow-hidden">
            <div className="max-h-96 overflow-y-auto divide-y divide-theme">
              {isLoading ? (
                <div className="py-8 text-center text-muted text-xs">Loading policies...</div>
              ) : filteredPolicies.length === 0 ? (
                <div className="py-8 text-center text-muted text-xs">No policies found matching search.</div>
              ) : (
                filteredPolicies.map((p) => (
                  <div key={p.id} className="p-3.5 hover:bg-surface-subtle/50 transition-colors flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-primary text-xs">{p.name}</span>
                        <span className="font-mono text-[10px] text-muted">({p.slug})</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-subtle border border-theme text-secondary">
                          {p.productCount ?? 0} {p.productCount === 1 ? 'product' : 'products'}
                        </span>
                        {p.isActive ? (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-emerald-500 font-medium">
                            <CheckCircle2 className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-rose-400 font-medium">
                            <XCircle className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed">{p.description}</p>
                      {Array.isArray(p.bulletPoints) && p.bulletPoints.length > 0 && (
                        <div className="flex items-center gap-1.5 pt-0.5 text-[11px] text-amber-500 font-mono">
                          <span>• {p.bulletPoints.length} highlight {p.bulletPoints.length === 1 ? 'bullet' : 'bullets'} configured</span>
                        </div>
                      )}
                    </div>

                    {canManage && (
                      <div className="flex items-center gap-1 flex-shrink-0 pt-0.5">
                        <button
                          type="button"
                          onClick={() => toggleMutation.mutate(p.id)}
                          className="p-1 rounded text-muted hover:text-primary transition-colors text-xs font-mono"
                          title="Toggle active status"
                        >
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartEdit(p)}
                          className="p-1.5 rounded text-muted hover:text-amber-500 transition-colors"
                          title="Edit policy"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(p)}
                          className="p-1.5 rounded text-muted hover:text-rose-500 transition-colors"
                          title="Delete policy"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
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
        title="Delete Product Policy"
        message={
          deleteTarget?.productCount && deleteTarget.productCount > 0
            ? `WARNING: '${deleteTarget.name}' is currently attached to ${deleteTarget.productCount} product(s). To maintain published storefront information, you cannot delete a policy in active use. Deactivate it instead.`
            : `Are you sure you want to permanently delete policy '${deleteTarget?.name}'? This action cannot be undone.`
        }
        confirmText={deleteTarget?.productCount && deleteTarget.productCount > 0 ? 'Cannot Delete (In Use)' : 'Delete Policy'}
        isDestructive={!(deleteTarget?.productCount && deleteTarget.productCount > 0)}
        isLoading={deleteMutation.isPending}
      />
    </>
  );
};
