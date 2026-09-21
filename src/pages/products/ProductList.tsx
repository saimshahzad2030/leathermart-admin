import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi, ProductQueryParams } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { Product } from '@/types';
import { DataTable, Column } from '@/components/tables/DataTable';
import { StatusBadge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { formatCurrency } from '@/lib/utils';
import {
  Plus,
  Search,
  Copy,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Star,
  RotateCcw,
  Loader2,
} from 'lucide-react';

export const ProductList: React.FC = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Query parameters state
  const [queryParams, setQueryParams] = useState<ProductQueryParams>({
    page: 1,
    limit: 12,
    status: 'all',
    category: '',
    gender: 'all',
    search: '',
    sort: 'newest',
  });

  const [searchInput, setSearchInput] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Fetch Categories for filter dropdown
  const { data: categories } = useQuery({
    queryKey: ['admin-categories-filter'],
    queryFn: () => categoriesApi.listCategories(),
  });

  // Fetch Products using backend query parameters
  const {
    data: productData,
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    queryKey: ['admin-products', queryParams],
    queryFn: () => productsApi.listProducts(queryParams),
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: (id: string) => productsApi.togglePublish(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-summary'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-published'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-draft'] });
      toast.success(`Product status switched to ${data.isPublished ? 'Published' : 'Draft'}.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to toggle product status.');
    },
  });

  // Duplicate product mutation
  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productsApi.duplicateProduct(id),
    onSuccess: (newProduct) => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-summary'] });
      toast.success(`Product duplicated as draft: ${newProduct.sku}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to duplicate product.');
    },
  });

  // Delete product mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-summary'] });
      toast.success('Garment removed from catalogue.');
      setDeleteProductTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete product.');
    },
  });

  // Bulk action mutation
  const bulkActionMutation = useMutation({
    mutationFn: (action: 'publish' | 'unpublish' | 'delete') =>
      productsApi.bulkAction(action, selectedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-products-summary'] });
      toast.success(`Bulk operation executed successfully.`);
      setSelectedIds([]);
      setBulkDeleteConfirmOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to execute bulk action.');
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setQueryParams((prev) => ({ ...prev, search: searchInput, page: 1 }));
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setQueryParams({
      page: 1,
      limit: 12,
      status: 'all',
      category: '',
      gender: 'all',
      search: '',
      sort: 'newest',
    });
  };

  const hasActiveFilters =
    Boolean(queryParams.search) ||
    queryParams.status !== 'all' ||
    Boolean(queryParams.category) ||
    queryParams.gender !== 'all' ||
    queryParams.sort !== 'newest';

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (!productData) return;
    const allIds = productData.products.map((p) => p.id);
    const isAll = allIds.every((id) => selectedIds.includes(id));
    setSelectedIds(isAll ? [] : allIds);
  };

  const columns: Column<Product>[] = [
    {
      key: 'image',
      header: 'Garment',
      width: '80px',
      render: (item) => (
        <img
          src={item.images?.[0]?.url || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=100&auto=format'}
          alt={item.name}
          className="w-12 h-14 rounded-lg object-cover border border-theme bg-surface-subtle shrink-0"
        />
      ),
    },
    {
      key: 'details',
      header: 'Name & Specifications',
      render: (item) => (
        <div className="flex flex-col min-w-0">
          <Link
            to={`/products/edit/${item.id}`}
            className="font-semibold text-primary hover:text-amber-500 transition-colors truncate"
          >
            {item.name}
          </Link>
          <div className="flex items-center gap-2 text-xs text-muted mt-0.5 flex-wrap">
            <span className="font-mono text-[11px]">{item.sku}</span>
            <span>•</span>
            <span className="capitalize">{item.leatherType || 'Leather Outerwear'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      render: (item) => (
        <span className="text-xs uppercase font-medium text-secondary whitespace-nowrap">
          {item.categoryLabel || item.category}
        </span>
      ),
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (item) => (
        <span className="text-xs uppercase text-muted font-mono tracking-wider">
          {item.gender}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Price (EUR)',
      render: (item) => (
        <div className="flex flex-col">
          <span className="font-mono font-bold text-primary whitespace-nowrap">
            {formatCurrency(item.price)}
          </span>
          {item.salePrice && (
            <span className="text-[11px] font-mono text-emerald-500 line-through whitespace-nowrap">
              {formatCurrency(item.salePrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Publish Status',
      render: (item) => {
        const isToggling =
          togglePublishMutation.isPending &&
          togglePublishMutation.variables === item.id;

        return (
          <button
            type="button"
            disabled={isToggling}
            onClick={(e) => {
              e.stopPropagation();
              togglePublishMutation.mutate(item.id);
            }}
            className="cursor-pointer hover:opacity-80 transition-opacity disabled:opacity-50 inline-flex items-center gap-1.5"
            title="Click to toggle publish status"
          >
            {isToggling ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
            ) : (
              <StatusBadge status={item.isPublished ? 'published' : 'draft'} />
            )}
          </button>
        );
      },
    },
    {
      key: 'rating',
      header: 'Rating',
      render: (item) => (
        <div className="flex items-center gap-1 text-xs text-amber-500 font-medium whitespace-nowrap">
          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
          <span>{item.rating?.toFixed(1) || '5.0'}</span>
          <span className="text-muted text-[11px]">({item.reviewCount || 0})</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (item) => {
        const isDuplicating =
          duplicateMutation.isPending && duplicateMutation.variables === item.id;
        const isDeleting =
          deleteMutation.isPending && deleteMutation.variables === item.id;

        return (
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => navigate(`/products/edit/${item.id}`)}
              className="p-1.5 rounded-lg text-muted hover:text-primary hover:bg-surface-hover cursor-pointer"
              title="Edit Garment"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              disabled={isDuplicating}
              onClick={() => duplicateMutation.mutate(item.id)}
              className="p-1.5 rounded-lg text-muted hover:text-amber-500 hover:bg-surface-hover cursor-pointer disabled:opacity-50"
              title="Duplicate as Draft"
            >
              {isDuplicating ? (
                <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
            <button
              type="button"
              disabled={isDeleting}
              onClick={() => setDeleteProductTarget(item)}
              className="p-1.5 rounded-lg text-muted hover:text-rose-500 hover:bg-surface-hover cursor-pointer disabled:opacity-50"
              title="Delete Garment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6 max-w-full">
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Garment Catalogue
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Manage Italian leather outerwear, specifications, and SKU variant inventory
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh product catalogue"
          />

          <Link to="/products/new">
            <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />}>
              New Garment
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar - Responsive across Desktop, Laptop, Tablet, Mobile */}
      <div className="p-4 rounded-2xl bg-surface border border-theme shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col lg:flex-row gap-3">
          {/* Search Input */}
          <div className="flex-1 min-w-0">
            <Input
              placeholder="Search garments by name, SKU, tagline, or leather..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>

          {/* Filter Dropdowns Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap lg:items-center gap-2.5 w-full lg:w-auto">
            {/* Status Filter */}
            <Select
              value={queryParams.status || 'all'}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  status: e.target.value as any,
                  page: 1,
                }))
              }
              wrapperClassName="w-full lg:w-32"
            >
              <option value="all">All Status</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </Select>

            {/* Category Filter */}
            <Select
              value={queryParams.category || ''}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  category: e.target.value,
                  page: 1,
                }))
              }
              wrapperClassName="w-full lg:w-40"
            >
              <option value="">All Categories</option>
              {categories?.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </Select>

            {/* Gender Filter */}
            <Select
              value={queryParams.gender || 'all'}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  gender: e.target.value as any,
                  page: 1,
                }))
              }
              wrapperClassName="w-full lg:w-32"
            >
              <option value="all">All Gender</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </Select>

            {/* Sort Filter */}
            <Select
              value={queryParams.sort || 'newest'}
              onChange={(e) =>
                setQueryParams((prev) => ({
                  ...prev,
                  sort: e.target.value as any,
                  page: 1,
                }))
              }
              wrapperClassName="w-full lg:w-36"
            >
              <option value="newest">Newest First</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
              <option value="featured">Featured First</option>
              <option value="rating">Highest Rated</option>
            </Select>

            {/* Actions: Filter & Reset */}
            <div className="flex items-center gap-2 col-span-1 sm:col-span-2 md:col-span-4 lg:col-auto">
              <Button type="submit" variant="secondary" size="md" className="flex-1 lg:flex-initial">
                Filter
              </Button>
              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={handleResetFilters}
                  leftIcon={<RotateCcw className="w-3.5 h-3.5 text-muted" />}
                  className="text-xs"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Main Data Table */}
      <DataTable
        columns={columns}
        data={productData?.products || []}
        isLoading={isLoading}
        pagination={productData?.pagination}
        onPageChange={(page) => setQueryParams((prev) => ({ ...prev, page }))}
        onLimitChange={(limit) => setQueryParams((prev) => ({ ...prev, limit, page: 1 }))}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onToggleSelectAll={handleToggleSelectAll}
        onRowClick={(item) => navigate(`/products/edit/${item.id}`)}
        bulkActions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionMutation.isPending}
              isLoading={bulkActionMutation.isPending && bulkActionMutation.variables === 'publish'}
              onClick={() => bulkActionMutation.mutate('publish')}
              leftIcon={<CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
            >
              Publish Selected
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={bulkActionMutation.isPending}
              isLoading={bulkActionMutation.isPending && bulkActionMutation.variables === 'unpublish'}
              onClick={() => bulkActionMutation.mutate('unpublish')}
              leftIcon={<XCircle className="w-3.5 h-3.5 text-amber-500" />}
            >
              Unpublish Selected
            </Button>
            <Button
              variant="danger"
              size="sm"
              disabled={bulkActionMutation.isPending}
              onClick={() => setBulkDeleteConfirmOpen(true)}
              leftIcon={<Trash2 className="w-3.5 h-3.5" />}
            >
              Delete Selected
            </Button>
          </div>
        }
        emptyTitle="No garments found"
        emptyDescription="No garments matched your query or catalogue is empty."
        emptyActionText="Create First Garment"
        onEmptyAction={() => navigate('/products/new')}
      />

      {/* Single Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={() => deleteProductTarget && deleteMutation.mutate(deleteProductTarget.id)}
        title="Remove Garment Specification"
        message={`Are you sure you want to permanently delete "${deleteProductTarget?.name}" (${deleteProductTarget?.sku})? All associated child images, variants, and reviews will be removed.`}
        confirmText="Delete Garment"
        isLoading={deleteMutation.isPending}
      />

      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={bulkDeleteConfirmOpen}
        onClose={() => setBulkDeleteConfirmOpen(false)}
        onConfirm={() => bulkActionMutation.mutate('delete')}
        title="Bulk Remove Selected Garments"
        message={`Are you sure you want to permanently delete ${selectedIds.length} selected garments from the catalogue? This action cannot be undone.`}
        confirmText={`Delete ${selectedIds.length} Garments`}
        isLoading={bulkActionMutation.isPending}
      />
    </div>
  );
};
