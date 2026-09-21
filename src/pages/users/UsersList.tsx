import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '@/lib/api/auth';
import { AdminUser, AdminRole } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { UserCheck, Plus, Edit2, Trash2, Shield, Lock } from 'lucide-react';

export const UsersList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-users-list'],
    queryFn: () => authApi.listUsers(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<AdminRole>('store_manager');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setRole('store_manager');
    setIsActive(true);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (u: AdminUser) => {
    setEditingUser(u);
    setEmail(u.email);
    setPassword('');
    setFirstName(u.firstName);
    setLastName(u.lastName);
    setRole(u.role);
    setIsActive(u.isActive);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingUser) {
        return authApi.updateUser(editingUser.id, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
          isActive,
        });
      } else {
        return authApi.createUser({
          email: email.trim().toLowerCase(),
          password: password.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          role,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      toast.success(`Staff user ${editingUser ? 'updated' : 'created'} successfully.`);
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save staff account.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users-list'] });
      toast.success('Staff account revoked.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to revoke staff access.');
    },
  });

  const columns: Column<AdminUser>[] = [
    {
      key: 'name',
      header: 'Staff Member',
      render: (item) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-xs">
            {item.firstName[0]}
          </div>
          <div>
            <div className="font-semibold text-xs text-primary">
              {item.firstName} {item.lastName}
            </div>
            <div className="text-[11px] text-muted">{item.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Administrative Role',
      width: '160px',
      render: (item) => <StatusBadge status={item.role} />,
    },
    {
      key: 'status',
      header: 'Account Status',
      width: '120px',
      render: (item) => (
        <StatusBadge status={item.isActive ? 'active' : 'deactivated'} />
      ),
    },
    {
      key: 'lastLogin',
      header: 'Last Authentication',
      width: '180px',
      render: (item) => (
        <span className="text-xs text-muted font-mono">{formatDate(item.lastLoginAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => openEdit(item)}>
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <button
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-muted hover:text-rose-500 rounded"
            title="Revoke Access"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Staff & Administrative Users
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage executive roles, access privileges, and staff security permissions (Super Admin Only)
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh staff users"
          />
          <Button variant="primary" size="md" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Add Staff User
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={users || []}
        isLoading={isLoading}
        emptyTitle="No staff users found"
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit Staff: ${editingUser.firstName}` : 'New Staff Account'}
        subtitle="Configure role hierarchy and access control"
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
            <FormField label="First Name" required>
              <Input
                placeholder="e.g. Marco"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Last Name" required>
              <Input
                placeholder="e.g. Mancini"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </FormField>
          </div>

          {!editingUser && (
            <>
              <FormField label="Email Address" required>
                <Input
                  type="email"
                  placeholder="marco.m@ateliervalenti.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Temporary Password" required>
                <Input
                  type="password"
                  placeholder="Min 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </FormField>
            </>
          )}

          <FormField label="Administrative Role" required>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value as AdminRole)}
            >
              <option value="store_manager">Store Manager (Catalogue & Commissions)</option>
              <option value="content_editor">Content Editor (CMS & Social Looks)</option>
              <option value="concierge">Concierge (Bespoke Dossiers)</option>
              <option value="super_admin">Super Admin (Unrestricted System Access)</option>
            </Select>
          </FormField>

          {editingUser && (
            <Switch
              label="Account Active"
              description="Deactivating revokes access immediately."
              checked={isActive}
              onChange={setIsActive}
            />
          )}

          <div className="flex justify-end gap-2.5 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
              {editingUser ? 'Save Changes' : 'Create Staff User'}
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Revoke Staff Access"
        message={`Permanently remove administrative account for "${deleteTarget?.firstName} ${deleteTarget?.lastName}" (${deleteTarget?.email})?`}
        confirmText="Revoke Access"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
