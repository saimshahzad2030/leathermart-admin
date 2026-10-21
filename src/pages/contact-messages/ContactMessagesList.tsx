import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactApi } from '@/lib/api/contact';
import { ContactMessage, ContactMessageStatus, ContactQueryParams } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { ContactMessageDetailModal } from './ContactMessageDetailModal';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { parseApiError } from '@/lib/apiErrors';
import {
  Inbox,
  Search,
  Eye,
  Trash2,
  Mail,
  XCircle,
} from 'lucide-react';

export const ContactMessagesList: React.FC = () => {
  const queryClient = useQueryClient();
  const { hasRole } = useAuth();
  const toast = useToast();

  // State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchInput, setSearchInput] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [activeMessage, setActiveMessage] = useState<ContactMessage | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Query Params
  const queryParams: ContactQueryParams = {
    page,
    limit,
    ...(statusFilter ? { status: statusFilter as ContactMessageStatus } : {}),
    ...(searchInput.trim() ? { search: searchInput.trim() } : {}),
    ...(startDate ? { startDate } : {}),
    ...(endDate ? { endDate } : {}),
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['contact-messages', queryParams],
    queryFn: () => contactApi.listMessages(queryParams),
  });

  // Update Status / Notes Mutation
  const updateMutation = useMutation({
    mutationFn: ({
      id,
      updates,
    }: {
      id: string;
      updates: { status: ContactMessageStatus; adminNotes: string };
    }) => contactApi.updateMessage(id, updates),
    onSuccess: (updated: ContactMessage) => {
      toast.success('Inquiry status updated');
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      setActiveMessage(updated);
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, 'Failed to update inquiry').message);
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => contactApi.deleteMessage(id),
    onSuccess: () => {
      toast.success('Inquiry deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['contact-messages'] });
      setDeletingId(null);
      if (activeMessage && activeMessage.id === deletingId) {
        setActiveMessage(null);
      }
    },
    onError: (err: any) => {
      toast.error(parseApiError(err, 'Failed to delete inquiry').message);
    },
  });

  const handleUpdate = async (
    id: string,
    updates: { status: ContactMessageStatus; adminNotes: string }
  ) => {
    await updateMutation.mutateAsync({ id, updates });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearchInput('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const hasActiveFilters = Boolean(statusFilter || searchInput || startDate || endDate);

  const columns: Column<ContactMessage>[] = [
    {
      key: 'client',
      header: 'Client Details',
      render: (item) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-primary text-xs flex items-center gap-1.5">
            <span>{item.name}</span>
          </div>
          <div className="text-[11px] text-muted flex items-center gap-1">
            <Mail className="w-3 h-3 text-muted shrink-0" />
            <a
              href={`mailto:${item.email}`}
              className="hover:text-amber-500 hover:underline transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {item.email}
            </a>
          </div>
          {item.phone && (
            <div className="text-[10px] text-muted font-mono">{item.phone}</div>
          )}
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject & Preview',
      render: (item) => (
        <div className="max-w-md space-y-1">
          <div className="font-medium text-xs text-primary truncate">
            {item.subject}
          </div>
          <p className="text-[11px] text-muted line-clamp-1 leading-relaxed">
            {item.message}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'createdAt',
      header: 'Date',
      render: (item) => (
        <span className="text-xs font-mono text-muted whitespace-nowrap">
          {formatDate(item.createdAt)}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveMessage(item)}
            title="View inquiry details"
          >
            <Eye className="w-3.5 h-3.5 mr-1 text-amber-500" />
            Review
          </Button>
          {hasRole(['super_admin', 'store_manager']) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeletingId(item.id)}
              className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10"
              title="Delete message"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary tracking-wide">
            Contact Inquiries
          </h1>
          <p className="text-xs text-muted mt-1">
            Review and respond to client inquiries, sizing questions, and bespoke requests.
          </p>
        </div>
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-3">
          {/* Search */}
          <div className="flex-1 min-w-[200px] relative">
            <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Input
              value={searchInput}
              onChange={(e) => {
                setSearchInput(e.target.value);
                setPage(1);
              }}
              placeholder="Search by client name, email, or subject..."
              className="pl-9 text-xs w-full"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-44">
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              wrapperClassName="w-full"
            >
              <option value="">All Statuses</option>
              <option value="new">New (Unread)</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="spam">Spam</option>
            </Select>
          </div>

          {/* Start Date */}
          <div className="w-full sm:w-36">
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="text-xs"
              title="Start Date"
            />
          </div>

          {/* End Date */}
          <div className="w-full sm:w-36">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="text-xs"
              title="End Date"
            />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-xs h-9"
            >
              <XCircle className="w-3.5 h-3.5 mr-1 text-muted" />
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <DataTable<ContactMessage>
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        onRowClick={(item) => setActiveMessage(item)}
        emptyTitle="No client inquiries found"
        emptyDescription={
          hasActiveFilters
            ? 'No messages match the chosen filters. Try clearing your search or status.'
            : 'When customers submit inquiries from the storefront contact modal, they will appear here.'
        }
        emptyIcon={Inbox}
      />

      {/* Custom Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-theme text-xs text-secondary">
          <div>
            Showing <span className="font-semibold text-primary">{(page - 1) * limit + 1}</span> to{' '}
            <span className="font-semibold text-primary">
              {Math.min(page * limit, data.pagination.totalCount)}
            </span>{' '}
            of <span className="font-semibold text-primary">{data.pagination.totalCount}</span> inquiries
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="px-2 font-mono text-muted">
              {page} / {data.pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Detail / Response Modal */}
      <ContactMessageDetailModal
        message={activeMessage}
        isOpen={Boolean(activeMessage)}
        onClose={() => setActiveMessage(null)}
        onUpdate={handleUpdate}
        isUpdating={updateMutation.isPending}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={() => {
          if (deletingId) {
            deleteMutation.mutate(deletingId);
          }
        }}
        title="Delete Contact Inquiry"
        message="Are you sure you want to delete this client message? This action is permanent and cannot be undone."
        confirmText="Delete Message"
        isDestructive={true}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
