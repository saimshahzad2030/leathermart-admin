import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { commissionsApi, CommissionQueryParams } from '@/lib/api/commissions';
import { CustomCommission, CommissionStatus } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { CommissionDetailModal } from './CommissionDetailModal';
import { useToast } from '@/context/ToastContext';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  Search,
  FileText,
  Eye,
  Sliders,
  CheckCircle2,
  Filter,
} from 'lucide-react';

export const CommissionList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<CommissionQueryParams>({
    page: 1,
    limit: 15,
    status: '',
    search: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeDossier, setActiveDossier] = useState<CustomCommission | null>(null);
  const [bulkStatus, setBulkStatus] = useState<CommissionStatus>('contacted');

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-commissions', queryParams],
    queryFn: () => commissionsApi.listCommissions(queryParams),
  });

  // Single status update mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: CommissionStatus; notes?: string }) =>
      commissionsApi.updateStatus(id, status, notes),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commissions-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commissions-pending'] });
      toast.success(`Dossier ${updated.dossierNumber} advanced to ${updated.status}.`);
      setActiveDossier(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to update commission status.');
    },
  });

  // Bulk status update mutation
  const bulkStatusMutation = useMutation({
    mutationFn: () => commissionsApi.bulkUpdateStatus(bulkStatus, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-commissions'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commissions-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-commissions-pending'] });
      toast.success(`Updated status to '${bulkStatus}' for ${selectedIds.length} commissions.`);
      setSelectedIds([]);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to advance bulk status.');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!data) return;
    const allIds = data.commissions.map((c) => c.id);
    const isAll = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(isAll ? [] : allIds);
  };

  const columns: Column<CustomCommission>[] = [
    {
      key: 'dossier',
      header: 'Dossier #',
      width: '140px',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-amber-500 tracking-wider">
          {item.dossierNumber}
        </span>
      ),
    },
    {
      key: 'customer',
      header: 'Client',
      width: '180px',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-semibold text-xs text-primary">{item.customer.name}</span>
          <span className="text-[11px] text-muted truncate">{item.customer.email}</span>
        </div>
      ),
    },
    {
      key: 'specs',
      header: 'Garment Configuration',
      render: (item) => (
        <div className="flex flex-col min-w-0 max-w-xs">
          <span className="font-medium text-xs text-primary">{item.silhouetteName}</span>
          <span className="text-[11px] text-muted truncate">
            {item.leatherName} • {item.colorName} • {item.liningName}
          </span>
        </div>
      ),
    },
    {
      key: 'measurements',
      header: 'Measurements',
      width: '150px',
      render: (item) => (
        <span className="text-[11px] font-mono text-secondary">
          C:{item.measurements.chest} W:{item.measurements.waist} S:{item.measurements.shoulders} {item.measurements.unit}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Est. Price',
      width: '110px',
      render: (item) => (
        <span className="font-mono font-bold text-primary text-xs">
          {formatCurrency(item.estimatedPrice, item.currency)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '120px',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'date',
      header: 'Created',
      width: '130px',
      render: (item) => (
        <span className="text-[11px] text-muted">{formatDate(item.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      width: '90px',
      render: (item) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setActiveDossier(item);
          }}
          className="text-xs h-8 px-2"
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Inspect
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Bespoke Commission Dossiers
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Client made-to-measure outerwear commissions and master atelier workflow tracking
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh bespoke commissions"
          />
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search by dossier number, client name, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={queryParams.status || ''}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  status: e.target.value,
                  page: 1,
                }))
              }
              wrapperClassName="flex-1 sm:w-48"
            >
              <option value="">All Atelier Statuses</option>
              <option value="pending">Pending Review</option>
              <option value="contacted">Client Contacted</option>
              <option value="in_tailoring">In Tailoring</option>
              <option value="completed">Completed & Shipped</option>
              <option value="cancelled">Cancelled</option>
            </Select>

            <Button type="submit" variant="secondary" size="md">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Main Commissions Table */}
      <DataTable
        columns={columns}
        data={data?.commissions || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setQueryParams((prev) => ({ ...prev, limit, page: 1 }))}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onRowClick={(item) => setActiveDossier(item)}
        bulkActions={
          <div className="flex items-center gap-2">
            <Select
              value={bulkStatus}
              onChange={(e) => setBulkStatus(e.target.value as CommissionStatus)}
              className="text-xs h-8 w-36 bg-surface"
            >
              <option value="pending">Mark Pending</option>
              <option value="contacted">Mark Contacted</option>
              <option value="in_tailoring">Mark In Tailoring</option>
              <option value="completed">Mark Completed</option>
              <option value="cancelled">Mark Cancelled</option>
            </Select>
            <Button
              variant="primary"
              size="sm"
              onClick={() => bulkStatusMutation.mutate()}
              isLoading={bulkStatusMutation.isPending}
            >
              Apply Status
            </Button>
          </div>
        }
        emptyTitle="No bespoke commission dossiers found"
        emptyDescription="Client made-to-order inquiries from the Studio will automatically record here."
      />

      {/* Dossier Detail Inspection Sheet / Modal */}
      <CommissionDetailModal
        commission={activeDossier}
        isOpen={!!activeDossier}
        onClose={() => setActiveDossier(null)}
        onUpdateStatus={async (id, status, notes) => {
          await updateStatusMutation.mutateAsync({ id, status, notes });
        }}
        isUpdating={updateStatusMutation.isPending}
      />
    </div>
  );
};
