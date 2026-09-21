import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api/cms';
import { NewsletterSubscriber } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Input } from '@/components/forms/Input';
import { formatDate } from '@/lib/utils';
import { Mail, Download, Search } from 'lucide-react';

export const SubscribersList: React.FC = () => {
  const [search, setSearch] = useState('');

  const { data: subscribers, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-subscribers'],
    queryFn: () => cmsApi.listSubscribers(),
  });

  const filtered = (subscribers || []).filter((sub) =>
    sub.email.toLowerCase().includes(search.toLowerCase())
  );

  const exportCSV = () => {
    if (!subscribers?.length) return;
    const headers = ['Email', 'Locale', 'Active', 'Subscribed At'];
    const rows = subscribers.map((s) => [
      s.email,
      s.locale || 'en',
      s.isActive ? 'Active' : 'Inactive',
      s.subscribedAt,
    ]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `atelier-subscribers-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const columns: Column<NewsletterSubscriber>[] = [
    {
      key: 'email',
      header: 'Subscriber Email Address',
      render: (item) => (
        <div className="flex items-center gap-2">
          <Mail className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-xs text-primary">{item.email}</span>
        </div>
      ),
    },
    {
      key: 'locale',
      header: 'Locale / Region',
      width: '140px',
      render: (item) => (
        <span className="font-mono text-xs uppercase px-2 py-0.5 rounded bg-surface-subtle border border-theme text-secondary">
          {item.locale || 'en-EU'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Mailing Status',
      width: '140px',
      render: (item) => <StatusBadge status={item.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'date',
      header: 'Subscribed Date',
      width: '180px',
      render: (item) => (
        <span className="text-xs text-muted font-mono">{formatDate(item.subscribedAt)}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Newsletter VIP Subscribers
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Mailing list for private runway invitations, lookbook drops, and bespoke launches
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh subscribers"
          />
          <Button
            variant="outline"
            size="md"
            onClick={exportCSV}
            disabled={!subscribers?.length}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export CSV ({subscribers?.length || 0})
          </Button>
        </div>
      </div>

      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs">
        <Input
          placeholder="Filter subscribers by email address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        isLoading={isLoading}
        emptyTitle="No subscribers on record"
        emptyDescription="Clients who join the Atelier Valenti newsletter on the storefront will appear here."
      />
    </div>
  );
};
