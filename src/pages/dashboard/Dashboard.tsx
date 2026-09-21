import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { productsApi } from '@/lib/api/products';
import { commissionsApi } from '@/lib/api/commissions';
import { reviewsApi } from '@/lib/api/reviews';
import { cmsApi } from '@/lib/api/cms';
import { mediaApi } from '@/lib/api/media';
import { settingsApi } from '@/lib/api/settings';
import { formatCurrency, formatDate } from '@/lib/utils';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { CardSkeleton, ListSkeleton } from '@/components/common/Skeleton';
import { useToast } from '@/context/ToastContext';
import {
  Layers,
  FileText,
  Star,
  Users,
  Image as ImageIcon,
  Activity,
  Plus,
  ArrowUpRight,
  ExternalLink,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Real Queries directly to backend APIs
  const {
    data: productsData,
    isLoading: isProductsLoading,
    isFetching: isProductsFetching,
    refetch: refetchProducts,
  } = useQuery({
    queryKey: ['admin-products-summary'],
    queryFn: () => productsApi.listProducts({ limit: 5 }),
  });

  const {
    data: publishedData,
    refetch: refetchPublished,
  } = useQuery({
    queryKey: ['admin-products-published'],
    queryFn: () => productsApi.listProducts({ status: 'published', limit: 1 }),
  });

  const {
    data: draftData,
    refetch: refetchDraft,
  } = useQuery({
    queryKey: ['admin-products-draft'],
    queryFn: () => productsApi.listProducts({ status: 'draft', limit: 1 }),
  });

  const {
    data: commissionsData,
    isLoading: isCommissionsLoading,
    isFetching: isCommissionsFetching,
    refetch: refetchCommissions,
  } = useQuery({
    queryKey: ['admin-commissions-summary'],
    queryFn: () => commissionsApi.listCommissions({ limit: 5 }),
  });

  const {
    data: pendingCommissionsData,
    refetch: refetchPendingCommissions,
  } = useQuery({
    queryKey: ['admin-commissions-pending'],
    queryFn: () => commissionsApi.listCommissions({ status: 'pending', limit: 1 }),
  });

  const {
    data: reviewsData,
    isFetching: isReviewsFetching,
    refetch: refetchReviews,
  } = useQuery({
    queryKey: ['admin-reviews-pending'],
    queryFn: () => reviewsApi.listReviews({ isApproved: false, limit: 1 }),
  });

  const {
    data: subscribersData,
    isFetching: isSubscribersFetching,
    refetch: refetchSubscribers,
  } = useQuery({
    queryKey: ['admin-subscribers-count'],
    queryFn: () => cmsApi.listSubscribers(),
  });

  const {
    data: mediaData,
    refetch: refetchMedia,
  } = useQuery({
    queryKey: ['admin-media-count'],
    queryFn: () => mediaApi.listMedia({ limit: 1 }),
  });

  const {
    data: healthData,
    refetch: refetchHealth,
  } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => settingsApi.getHealth(),
  });

  const isRefreshing =
    isProductsFetching ||
    isCommissionsFetching ||
    isReviewsFetching ||
    isSubscribersFetching;

  const handleRefreshAll = async () => {
    await Promise.allSettled([
      refetchProducts(),
      refetchPublished(),
      refetchDraft(),
      refetchCommissions(),
      refetchPendingCommissions(),
      refetchReviews(),
      refetchSubscribers(),
      refetchMedia(),
      refetchHealth(),
    ]);
  };

  // Toggle publish status mutation
  const togglePublishMutation = useMutation({
    mutationFn: (id: string) => productsApi.togglePublish(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-published'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-draft'] });
      toast.success(`Product is now ${data.isPublished ? 'Published' : 'Draft'}.`);
    },
    onError: () => toast.error('Failed to change product status.'),
  });

  const stats = [
    {
      title: 'Total Garments',
      value: productsData?.pagination.totalCount ?? '—',
      subtext: `${publishedData?.pagination.totalCount || 0} published • ${draftData?.pagination.totalCount || 0} draft`,
      icon: Layers,
      href: '/products',
      color: 'amber',
    },
    {
      title: 'Bespoke Commissions',
      value: commissionsData?.pagination.totalCount ?? '—',
      subtext: `${pendingCommissionsData?.pagination.totalCount || 0} dossiers awaiting review`,
      icon: FileText,
      href: '/commissions',
      color: 'gold',
    },
    {
      title: 'Pending Reviews',
      value: reviewsData?.pagination.totalCount ?? '—',
      subtext: 'Awaiting moderation in queue',
      icon: Star,
      href: '/reviews',
      color: 'emerald',
    },
    {
      title: 'Subscribers & Media',
      value: subscribersData ? `${subscribersData.length} VIPs` : '—',
      subtext: `${mediaData?.pagination.totalCount || 0} media assets in library`,
      icon: Users,
      href: '/subscribers',
      color: 'sky',
    },
  ];

  return (
    <div className="space-y-8 max-w-full">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-surface border border-theme p-6 sm:p-8 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-500 mb-1">
              <span>Milan Atelier</span>
              <span>•</span>
              <span>Executive Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif-luxury text-primary">
              Benvenuto, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-secondary max-w-2xl leading-relaxed">
              Real-time operational dashboard for Atelier Valenti Milano outerwear, bespoke made-to-order commissions, and luxury editorial CMS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 shrink-0">
            <RefreshButton
              onRefresh={handleRefreshAll}
              isRefreshing={isRefreshing}
              title="Refresh all dashboard statistics and recent records"
            />
            <Link to="/products/new">
              <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
                New Garment
              </Button>
            </Link>
            <Link to="/commissions">
              <Button variant="outline" size="md" rightIcon={<ArrowUpRight className="w-4 h-4" />}>
                Review Dossiers
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {isProductsLoading || isCommissionsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)
        ) : (
          stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Link
                key={idx}
                to={stat.href}
                className="group p-6 rounded-2xl bg-surface border border-theme hover:border-amber-500/40 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div className="mt-4">
                  <div className="text-3xl font-bold font-serif-luxury text-primary tracking-tight">
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted mt-1 truncate">{stat.subtext}</div>
                </div>
              </Link>
            );
          })
        )}
      </div>

      {/* Two Column Layout: Recent Commissions & Recent Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Bespoke Commissions */}
        <div className="rounded-2xl bg-surface border border-theme p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-theme mb-4">
            <div>
              <h2 className="text-base font-bold font-serif-luxury text-primary">
                Recent Bespoke Commissions
              </h2>
              <p className="text-xs text-muted">Latest made-to-order client inquiries</p>
            </div>
            <Link
              to="/commissions"
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1">
            {isCommissionsLoading ? (
              <ListSkeleton count={5} />
            ) : commissionsData?.commissions.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">No bespoke dossiers on record yet.</div>
            ) : (
              <div className="divide-y divide-theme overflow-hidden">
                {commissionsData?.commissions.map((comm) => (
                  <div key={comm.id} className="py-3.5 flex items-center justify-between gap-4">
                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-primary">
                          {comm.dossierNumber}
                        </span>
                        <StatusBadge status={comm.status} />
                      </div>
                      <span className="text-xs text-secondary mt-0.5 truncate">
                        {comm.customer.name} • {comm.silhouetteName} ({comm.leatherName})
                      </span>
                      <span className="text-[11px] text-muted">
                        {formatDate(comm.createdAt)}
                      </span>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-sm font-bold text-primary font-mono">
                        {formatCurrency(comm.estimatedPrice, comm.currency)}
                      </div>
                      <Link
                        to={`/commissions`}
                        className="text-[11px] text-amber-500 hover:underline mt-0.5 block"
                      >
                        Inspect Dossier
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Garment Specifications */}
        <div className="rounded-2xl bg-surface border border-theme p-6 flex flex-col shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-theme mb-4">
            <div>
              <h2 className="text-base font-bold font-serif-luxury text-primary">
                Catalogue Garments
              </h2>
              <p className="text-xs text-muted">Recently updated outerwear specifications</p>
            </div>
            <Link
              to="/products"
              className="text-xs text-amber-500 hover:text-amber-400 font-semibold inline-flex items-center gap-1"
            >
              View All <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex-1">
            {isProductsLoading ? (
              <ListSkeleton count={5} />
            ) : productsData?.products.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted">No products found in catalogue.</div>
            ) : (
              <div className="divide-y divide-theme overflow-hidden">
                {productsData?.products.map((prod) => {
                  const isToggling =
                    togglePublishMutation.isPending &&
                    togglePublishMutation.variables === prod.id;

                  return (
                    <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={prod.images?.[0]?.url || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format'}
                          alt={prod.name}
                          className="w-12 h-12 rounded-xl object-cover border border-theme shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-semibold text-primary truncate">
                            {prod.name}
                          </span>
                          <span className="text-[11px] text-muted font-mono">{prod.sku} • {prod.category}</span>
                          <span className="text-xs font-bold text-primary font-mono mt-0.5">
                            {formatCurrency(prod.price)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          disabled={isToggling}
                          onClick={() => togglePublishMutation.mutate(prod.id)}
                          className="text-[11px] cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 inline-flex items-center gap-1"
                          title="Toggle published status"
                        >
                          {isToggling ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-500" />
                          ) : (
                            <StatusBadge status={prod.isPublished ? 'published' : 'draft'} />
                          )}
                        </button>
                        <Link to={`/products/edit/${prod.id}`}>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Backend Infrastructure & Server Status Card */}
      <div className="p-6 rounded-2xl bg-surface border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="font-semibold text-primary flex items-center gap-2">
              <span>Atelier Valenti Milano Engine & Supabase PostgreSQL</span>
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono">
                <CheckCircle2 className="w-3 h-3" /> Healthy
              </span>
            </div>
            <div className="text-muted mt-0.5">
              ORM: {healthData?.orm || 'Prisma 6.19'} • Node: Express 4.21 • Environment: {healthData?.environment || 'Development'}
            </div>
          </div>
        </div>

        <div className="text-right text-muted font-mono text-[11px]">
          Uptime: {Math.round(healthData?.uptime || 0)}s
        </div>
      </div>
    </div>
  );
};
