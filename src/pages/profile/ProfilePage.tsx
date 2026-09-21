import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { authApi } from '@/lib/api/auth';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { Shield, Lock, User, KeyRound, CheckCircle2 } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Current password is required.');
      return;
    }

    if (newPassword.length < 8) {
      toast.error('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }

    try {
      setIsChanging(true);
      await authApi.changePassword({ currentPassword, newPassword });
      toast.success('Your security password has been changed successfully.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Administrator Account & Security
          </h1>
          <p className="text-xs text-muted mt-0.5">
            View your staff profile, privileges, and rotate your master access key
          </p>
        </div>

        <div className="shrink-0">
          <RefreshButton
            onRefresh={async () => {
              setIsRefreshing(true);
              try {
                await refreshUser();
                toast.success('Admin profile updated.');
              } catch {
                toast.error('Failed to refresh profile.');
              } finally {
                setIsRefreshing(false);
              }
            }}
            isRefreshing={isRefreshing}
            title="Refresh profile details"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Profile Details Card */}
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-theme">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center font-bold text-2xl font-serif-luxury">
              {user?.firstName?.[0]}
            </div>
            <div>
              <h2 className="text-lg font-bold font-serif-luxury text-primary">
                {user?.firstName} {user?.lastName}
              </h2>
              <p className="text-xs text-muted font-mono">{user?.email}</p>
              <div className="mt-1.5">
                <StatusBadge status={user?.role || 'staff'} />
              </div>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-theme-subtle">
              <span className="text-muted">Role Permissions:</span>
              <span className="font-mono text-primary">
                {user?.permissions?.join(', ') || 'All Permissions (*)'}
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-theme-subtle">
              <span className="text-muted">Account Status:</span>
              <span className="text-emerald-500 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active
              </span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-theme-subtle">
              <span className="text-muted">Staff UUID:</span>
              <span className="font-mono text-muted text-[11px] truncate max-w-[180px]">
                {user?.id}
              </span>
            </div>

            <div className="flex justify-between py-1.5">
              <span className="text-muted">Last Login:</span>
              <span className="text-primary font-mono">{formatDate(user?.lastLoginAt)}</span>
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-5">
          <div className="flex items-center gap-2 pb-3 border-b border-theme">
            <KeyRound className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
              Change Security Password
            </h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <FormField label="Current Password" required>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </FormField>

            <FormField label="New Password (min 8 chars)" required>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </FormField>

            <FormField label="Confirm New Password" required>
              <Input
                type="password"
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                required
              />
            </FormField>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isChanging}
              >
                Update Password
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
