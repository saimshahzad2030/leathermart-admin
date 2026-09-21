import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reviewsApi, ReviewQueryParams } from '@/lib/api/reviews';
import { ProductReview } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Select } from '@/components/forms/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { formatDate } from '@/lib/utils';
import { Star, CheckCircle, XCircle, Trash2, ShieldCheck, MapPin } from 'lucide-react';

export const ReviewsModeration: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [filterApproved, setFilterApproved] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<ProductReview | null>(null);

  const queryParams: ReviewQueryParams = {
    page,
    limit: 15,
    ...(filterApproved === 'pending'
      ? { isApproved: false }
      : filterApproved === 'approved'
      ? { isApproved: true }
      : {}),
  };

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-reviews', queryParams],
    queryFn: () => reviewsApi.listReviews(queryParams),
  });

  const moderateMutation = useMutation({
    mutationFn: ({ id, isApproved }: { id: string; isApproved: boolean }) =>
      reviewsApi.moderateReview(id, isApproved),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] });
      toast.success(
        variables.isApproved
          ? 'Review approved and published to storefront.'
          : 'Review marked as pending moderation.'
      );
    },
    onError: () => toast.error('Failed to update review status.'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => reviewsApi.deleteReview(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-reviews'] });
      queryClient.invalidateQueries({ queryKey: ['admin-reviews-pending'] });
      toast.success('Review permanently deleted.');
      setDeleteTarget(null);
    },
    onError: () => toast.error('Failed to delete review.'),
  });

  const columns: Column<ProductReview>[] = [
    {
      key: 'author',
      header: 'Client & Location',
      width: '180px',
      render: (item) => (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-semibold text-primary">
            <span>{item.author}</span>
            {item.verified && (
              <span title="Verified Client">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              </span>
            )}
          </div>
          {item.location && (
            <div className="flex items-center gap-1 text-[11px] text-muted mt-0.5">
              <MapPin className="w-3 h-3 text-muted" />
              <span>{item.location}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Garment',
      width: '180px',
      render: (item) => (
        <span className="font-medium text-xs text-secondary truncate block max-w-[170px]">
          {item.product?.name || 'Garment Specification'}
        </span>
      ),
    },
    {
      key: 'rating',
      header: 'Score',
      width: '100px',
      render: (item) => (
        <div className="flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-3.5 h-3.5 ${
                i < item.rating
                  ? 'fill-amber-500 text-amber-500'
                  : 'fill-zinc-300 text-zinc-300 dark:fill-zinc-800 dark:text-zinc-800'
              }`}
            />
          ))}
        </div>
      ),
    },
    {
      key: 'feedback',
      header: 'Review & Impression',
      render: (item) => (
        <div className="flex flex-col max-w-md">
          <span className="font-semibold text-xs text-primary">{item.title}</span>
          <p className="text-xs text-muted leading-relaxed mt-0.5 line-clamp-2">
            "{item.comment}"
          </p>
          <span className="text-[10px] text-muted/80 mt-1">{formatDate(item.createdAt)}</span>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '110px',
      render: (item) => (
        <StatusBadge status={item.isApproved ? 'approved' : 'pending'} />
      ),
    },
    {
      key: 'actions',
      header: 'Moderation Actions',
      width: '140px',
      render: (item) => (
        <div className="flex items-center gap-2">
          {item.isApproved ? (
            <Button
              variant="outline"
              size="sm"
              disabled={moderateMutation.isPending}
              isLoading={moderateMutation.isPending && moderateMutation.variables?.id === item.id && !moderateMutation.variables?.isApproved}
              onClick={() => moderateMutation.mutate({ id: item.id, isApproved: false })}
              className="text-xs h-8 px-2"
              title="Reject / Make Pending"
            >
              <XCircle className="w-3.5 h-3.5 mr-1 text-amber-500" />
              Unapprove
            </Button>
          ) : (
            <Button
              variant="primary"
              size="sm"
              disabled={moderateMutation.isPending}
              isLoading={moderateMutation.isPending && moderateMutation.variables?.id === item.id && moderateMutation.variables?.isApproved}
              onClick={() => moderateMutation.mutate({ id: item.id, isApproved: true })}
              className="text-xs h-8 px-2"
              title="Approve & Publish"
            >
              <CheckCircle className="w-3.5 h-3.5 mr-1" />
              Approve
            </Button>
          )}

          <button
            type="button"
            disabled={deleteMutation.isPending && deleteMutation.variables === item.id}
            onClick={() => setDeleteTarget(item)}
            className="p-1.5 text-muted hover:text-rose-500 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Delete Review"
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
            Client Review Moderation
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Evaluate customer feedback, verify authenticity, and publish verified client quotes
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh reviews"
          />

          <div className="w-44 sm:w-48">
            <Select
              value={filterApproved}
              onChange={(e) => {
                setFilterApproved(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">All Reviews</option>
              <option value="pending">Pending Moderation</option>
              <option value="approved">Approved & Live</option>
            </Select>
          </div>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={data?.reviews || []}
        isLoading={isLoading}
        pagination={data?.pagination}
        onPageChange={setPage}
        emptyTitle="No reviews in moderation queue"
        emptyDescription="Client reviews submitted on the public storefront will appear here for approval."
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Client Review"
        message={`Permanently remove review from "${deleteTarget?.author}"? This action cannot be undone.`}
        confirmText="Delete Review"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
