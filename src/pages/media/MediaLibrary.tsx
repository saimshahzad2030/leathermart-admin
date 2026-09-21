import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { mediaApi, MediaQueryParams } from '@/lib/api/media';
import { MediaAsset } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { MediaGridSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Pagination } from '@/components/tables/Pagination';
import { useToast } from '@/context/ToastContext';
import { formatFileSize, formatDate } from '@/lib/utils';
import {
  Image as ImageIcon,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  UploadCloud,
  Check,
} from 'lucide-react';

export const MediaLibrary: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [queryParams, setQueryParams] = useState<MediaQueryParams>({
    page: 1,
    limit: 24,
    folder: '',
    search: '',
  });

  const [searchInput, setSearchInput] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<MediaAsset | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showUploader, setShowUploader] = useState(false);

  const { data, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-media', queryParams],
    queryFn: () => mediaApi.listMedia(queryParams),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => mediaApi.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-media'] });
      queryClient.invalidateQueries({ queryKey: ['admin-media-count'] });
      toast.success('Media asset deleted from storage.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete asset.');
    },
  });

  const handleCopy = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success('Asset URL copied to clipboard.');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const folderTabs = [
    { label: 'All Media', value: '' },
    { label: 'Products', value: 'products' },
    { label: 'Editorial', value: 'editorial' },
    { label: 'Lookbook', value: 'lookbook' },
    { label: 'General', value: 'general' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Media Asset Library
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Cloud and server storage for high-resolution garment lookbooks and video
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh media library"
          />
          <Button
            variant="primary"
            size="md"
            onClick={() => setShowUploader(!showUploader)}
            leftIcon={<UploadCloud className="w-4 h-4" />}
          >
            {showUploader ? 'Close Uploader' : 'Upload Asset'}
          </Button>
        </div>
      </div>

      {/* Collapsible Direct Drag-and-Drop Uploader Banner */}
      {showUploader && (
        <div className="p-6 rounded-3xl bg-surface border border-theme shadow-sm space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
              Direct Storage Uploader
            </h3>
            <span className="text-xs text-muted">Supports JPG, PNG, WEBP, AVIF, MP4 up to 10MB</span>
          </div>

          <ImageUploader
            folder="products"
            onChange={() => {
              queryClient.invalidateQueries({ queryKey: ['admin-media'] });
              queryClient.invalidateQueries({ queryKey: ['admin-media-count'] });
              setShowUploader(false);
            }}
          />
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Folder Tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {folderTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() =>
                setQueryParams((prev) => ({ ...prev, folder: tab.value, page: 1 }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
                queryParams.folder === tab.value
                  ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  : 'text-muted hover:text-primary hover:bg-surface-hover'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <Input
            placeholder="Search filenames..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
            className="w-full sm:w-64 text-xs h-9"
          />
          <Button type="submit" variant="secondary" size="sm" className="h-9">
            Search
          </Button>
        </form>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <MediaGridSkeleton count={18} />
      ) : data?.assets.length === 0 ? (
        <div className="py-20 text-center rounded-2xl bg-surface border border-theme p-6">
          <ImageIcon className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-primary font-serif-luxury">No assets found</h3>
          <p className="text-xs text-muted mt-1">Upload photography using the button above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {data?.assets.map((asset) => (
            <div
              key={asset.id}
              className="group rounded-2xl bg-surface border border-theme overflow-hidden flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition-all"
            >
              <div className="h-36 relative bg-surface-subtle overflow-hidden flex items-center justify-center">
                <img
                  src={asset.url}
                  alt={asset.altText || asset.originalName}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&auto=format';
                  }}
                />
                <span className="absolute top-2 left-2 text-[9px] uppercase font-mono font-bold px-1.5 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                  {asset.folder}
                </span>
              </div>

              <div className="p-3 space-y-1">
                <div
                  className="text-xs font-semibold text-primary truncate"
                  title={asset.originalName}
                >
                  {asset.originalName}
                </div>
                <div className="flex items-center justify-between text-[10px] text-muted font-mono">
                  <span>{formatFileSize(asset.size)}</span>
                  <span>{asset.mimeType.split('/')[1]?.toUpperCase()}</span>
                </div>
              </div>

              <div className="p-2 border-t border-theme flex items-center justify-between bg-surface-subtle/30">
                <button
                  onClick={() => handleCopy(asset.url, asset.id)}
                  className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-surface-hover transition-colors"
                  title="Copy Direct URL"
                >
                  {copiedId === asset.id ? (
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>

                <a
                  href={asset.url}
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover transition-colors"
                  title="Open Full Image"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>

                <button
                  onClick={() => setDeleteTarget(asset)}
                  className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-surface-hover transition-colors"
                  title="Delete Asset"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {data && data.pagination && (
        <Pagination
          pagination={data.pagination}
          onPageChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
        />
      )}

      {/* Delete Modal */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Remove Media Asset"
        message={`Permanently remove "${deleteTarget?.originalName}" from atelier cloud storage and disk?`}
        confirmText="Delete Asset"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
