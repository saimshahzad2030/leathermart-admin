import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/lib/api/categories';
import { Category, Collection } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { GridCardSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit2, Trash2, FolderTree, Sparkles, Layers } from 'lucide-react';

export const CategoriesList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'categories' | 'collections'>('categories');

  // Categories Queries & Mutations
  const {
    data: categories,
    isLoading: isCategoriesLoading,
    isFetching: isCategoriesFetching,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['admin-categories-full'],
    queryFn: () => categoriesApi.listCategories(),
  });

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<Category | null>(null);

  const [catSlug, setCatSlug] = useState('');
  const [catName, setCatName] = useState('');
  const [catSubtitle, setCatSubtitle] = useState('');
  const [catDescription, setCatDescription] = useState('');
  const [catHeroImage, setCatHeroImage] = useState('');
  const [catHighlightSpecs, setCatHighlightSpecs] = useState<string[]>(['']);

  // Collections Queries & Mutations
  const {
    data: collections,
    isLoading: isCollectionsLoading,
    isFetching: isCollectionsFetching,
    refetch: refetchCollections,
  } = useQuery({
    queryKey: ['admin-collections-full'],
    queryFn: () => categoriesApi.listCollections(),
  });

  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [deleteCollectionTarget, setDeleteCollectionTarget] = useState<Collection | null>(null);

  const [colSlug, setColSlug] = useState('');
  const [colTitle, setColTitle] = useState('');
  const [colSeason, setColSeason] = useState('');
  const [colSubtitle, setColSubtitle] = useState('');
  const [colDescription, setColDescription] = useState('');
  const [colHeroImage, setColHeroImage] = useState('');
  const [colBadge, setColBadge] = useState('Capsule Collection');

  // Save Category Mutation
  const saveCategoryMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Category> = {
        slug: catSlug.trim().toLowerCase(),
        name: catName.trim(),
        subtitle: catSubtitle.trim(),
        description: catDescription.trim(),
        heroImage: catHeroImage.trim(),
        highlightSpecs: catHighlightSpecs.filter((s) => s.trim().length > 0),
      };

      if (editingCategory) {
        return categoriesApi.updateCategory(editingCategory.id, payload);
      } else {
        return categoriesApi.createCategory(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
      toast.success(`Category ${editingCategory ? 'updated' : 'created'} successfully.`);
      setCategoryModalOpen(false);
      resetCategoryForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save category.');
    },
  });

  // Delete Category Mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories-full'] });
      toast.success('Category removed from atelier.');
      setDeleteCategoryTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete category.');
    },
  });

  // Save Collection Mutation
  const saveCollectionMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Collection> = {
        slug: colSlug.trim().toLowerCase(),
        title: colTitle.trim(),
        season: colSeason.trim(),
        subtitle: colSubtitle.trim(),
        description: colDescription.trim(),
        heroImage: colHeroImage.trim(),
        badge: colBadge.trim(),
      };

      if (editingCollection) {
        return categoriesApi.updateCollection(editingCollection.id, payload);
      } else {
        return categoriesApi.createCollection(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections-full'] });
      queryClient.invalidateQueries({ queryKey: ['admin-collections'] });
      toast.success(`Collection ${editingCollection ? 'updated' : 'created'} successfully.`);
      setCollectionModalOpen(false);
      resetCollectionForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save collection.');
    },
  });

  // Delete Collection Mutation
  const deleteCollectionMutation = useMutation({
    mutationFn: (id: string) => categoriesApi.deleteCollection(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-collections-full'] });
      toast.success('Collection removed from atelier.');
      setDeleteCollectionTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete collection.');
    },
  });

  const resetCategoryForm = () => {
    setEditingCategory(null);
    setCatSlug('');
    setCatName('');
    setCatSubtitle('');
    setCatDescription('');
    setCatHeroImage('');
    setCatHighlightSpecs(['']);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCategory(cat);
    setCatSlug(cat.slug);
    setCatName(cat.name);
    setCatSubtitle(cat.subtitle || '');
    setCatDescription(cat.description || '');
    setCatHeroImage(cat.heroImage || '');
    setCatHighlightSpecs(cat.highlightSpecs?.length ? cat.highlightSpecs : ['']);
    setCategoryModalOpen(true);
  };

  const resetCollectionForm = () => {
    setEditingCollection(null);
    setColSlug('');
    setColTitle('');
    setColSeason('');
    setColSubtitle('');
    setColDescription('');
    setColHeroImage('');
    setColBadge('Capsule Collection');
  };

  const openEditCollection = (col: Collection) => {
    setEditingCollection(col);
    setColSlug(col.slug);
    setColTitle(col.title);
    setColSeason(col.season);
    setColSubtitle(col.subtitle || '');
    setColDescription(col.description || '');
    setColHeroImage(col.heroImage || '');
    setColBadge(col.badge || 'Capsule Collection');
    setCollectionModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Categories & Capsules
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Organize Italian outerwear classifications and seasonal runway lookbooks
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <RefreshButton
            onRefresh={async () => {
              await Promise.allSettled([refetchCategories(), refetchCollections()]);
            }}
            isRefreshing={isCategoriesFetching || isCollectionsFetching}
            title="Refresh categories & collections"
          />

          {activeTab === 'categories' ? (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetCategoryForm();
                setCategoryModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Category
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetCollectionForm();
                setCollectionModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              New Collection
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-theme pb-2">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <FolderTree className="w-4 h-4" />
          Garment Categories ({categories?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab('collections')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
            activeTab === 'collections'
              ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
              : 'text-muted hover:text-primary hover:bg-surface-hover'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Seasonal Capsules ({collections?.length || 0})
        </button>
      </div>

      {/* Categories View */}
      {activeTab === 'categories' && (
        isCategoriesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : categories?.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface border border-theme p-6">
            <FolderTree className="w-12 h-12 text-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-primary font-serif-luxury">No categories created</h3>
            <p className="text-xs text-muted mt-1">Create your first garment category above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categories?.map((cat) => (
              <div
                key={cat.id}
                className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col group hover:border-amber-500/30 transition-all"
              >
                <div className="h-36 relative overflow-hidden bg-surface-subtle">
                  <img
                    src={cat.heroImage || 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                        /{cat.slug}
                      </span>
                      <h3 className="text-base font-bold font-serif-luxury text-white">
                        {cat.name}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    {cat.subtitle && <p className="text-xs text-primary font-medium">{cat.subtitle}</p>}
                    {cat.description && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">{cat.description}</p>
                    )}
                    {cat.highlightSpecs && cat.highlightSpecs.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {cat.highlightSpecs.map((spec, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-surface-subtle text-secondary font-mono"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-theme flex items-center justify-between">
                    <StatusBadge status={cat.isPublished ? 'published' : 'draft'} />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditCategory(cat)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => setDeleteCategoryTarget(cat)}
                        className="p-1.5 text-muted hover:text-rose-500 rounded-lg cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Collections View */}
      {activeTab === 'collections' && (
        isCollectionsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <GridCardSkeleton key={i} />
            ))}
          </div>
        ) : collections?.length === 0 ? (
          <div className="py-16 text-center rounded-2xl bg-surface border border-theme p-6">
            <Sparkles className="w-12 h-12 text-muted mx-auto mb-3" />
            <h3 className="text-base font-semibold text-primary font-serif-luxury">No capsules created</h3>
            <p className="text-xs text-muted mt-1">Create your first seasonal capsule collection above.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections?.map((col) => (
              <div
                key={col.id}
                className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col group hover:border-amber-500/30 transition-all"
              >
                <div className="h-40 relative overflow-hidden bg-surface-subtle">
                  <img
                    src={col.heroImage || 'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=500&auto=format'}
                    alt={col.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex items-end p-4">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
                        {col.season}
                      </span>
                      <h3 className="text-base font-bold font-serif-luxury text-white tracking-wide">
                        {col.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono text-muted">/{col.slug}</span>
                      {col.badge && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-semibold uppercase">
                          {col.badge}
                        </span>
                      )}
                    </div>
                    {col.subtitle && <p className="text-xs text-primary font-medium">{col.subtitle}</p>}
                    {col.description && (
                      <p className="text-xs text-muted leading-relaxed line-clamp-2">{col.description}</p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-theme flex items-center justify-between">
                    <StatusBadge status={col.isActive ? 'active' : 'draft'} />
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditCollection(col)}
                        leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                      >
                        Edit
                      </Button>
                      <button
                        onClick={() => setDeleteCollectionTarget(col)}
                        className="p-1.5 text-muted hover:text-rose-500 rounded-lg cursor-pointer"
                        title="Delete capsule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {/* Category Modal (Create / Edit) */}
      <Modal
        isOpen={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title={editingCategory ? `Edit Category: ${editingCategory.name}` : 'New Category'}
        subtitle="Manage taxonomy, hero photography, and bullet points"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCategoryMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category Name" required>
              <Input
                placeholder="e.g. Aviator & Shearling"
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
              />
            </FormField>
            <FormField label="URL Slug" required>
              <Input
                placeholder="e.g. aviator"
                value={catSlug}
                onChange={(e) => setCatSlug(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Subtitle">
            <Input
              placeholder="e.g. Whole-pelt Spanish Merino shearling thermal defenses"
              value={catSubtitle}
              onChange={(e) => setCatSubtitle(e.target.value)}
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              rows={3}
              placeholder="Detailed craft narrative..."
              value={catDescription}
              onChange={(e) => setCatDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Hero Image Photography">
            <ImageUploader
              folder="editorial"
              value={catHeroImage}
              onChange={setCatHeroImage}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveCategoryMutation.isPending}>
              {editingCategory ? 'Update Category' : 'Create Category'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Collection Modal (Create / Edit) */}
      <Modal
        isOpen={collectionModalOpen}
        onClose={() => setCollectionModalOpen(false)}
        title={editingCollection ? `Edit Collection: ${editingCollection.title}` : 'New Seasonal Collection'}
        subtitle="Capsule lookbook and campaign presentation"
        maxWidth="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveCollectionMutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Collection Title" required>
              <Input
                placeholder="e.g. Inverno 2026 Lookbook"
                value={colTitle}
                onChange={(e) => setColTitle(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Season" required>
              <Input
                placeholder="e.g. Autumn / Winter 2026"
                value={colSeason}
                onChange={(e) => setColSeason(e.target.value)}
                required
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Slug" required>
              <Input
                placeholder="e.g. inverno-26"
                value={colSlug}
                onChange={(e) => setColSlug(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Badge">
              <Input
                placeholder="e.g. Capsule Collection"
                value={colBadge}
                onChange={(e) => setColBadge(e.target.value)}
              />
            </FormField>
          </div>

          <FormField label="Subtitle">
            <Input
              placeholder="e.g. Sculpted Silhouettes in Heavy Calfskin"
              value={colSubtitle}
              onChange={(e) => setColSubtitle(e.target.value)}
            />
          </FormField>

          <FormField label="Description">
            <Textarea
              rows={3}
              placeholder="Campaign notes and fashion week introduction..."
              value={colDescription}
              onChange={(e) => setColDescription(e.target.value)}
            />
          </FormField>

          <FormField label="Cover Photography">
            <ImageUploader
              folder="lookbook"
              value={colHeroImage}
              onChange={setColHeroImage}
            />
          </FormField>

          <div className="flex justify-end gap-3 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setCollectionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveCollectionMutation.isPending}>
              {editingCollection ? 'Update Collection' : 'Create Collection'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Category Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCategoryTarget}
        onClose={() => setDeleteCategoryTarget(null)}
        onConfirm={() => deleteCategoryTarget && deleteCategoryMutation.mutate(deleteCategoryTarget.id)}
        title="Delete Garment Category"
        message={`Permanently remove "${deleteCategoryTarget?.name}"? Note: Garments referencing this category may prevent deletion.`}
        confirmText="Delete Category"
        isLoading={deleteCategoryMutation.isPending}
      />

      {/* Delete Collection Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteCollectionTarget}
        onClose={() => setDeleteCollectionTarget(null)}
        onConfirm={() => deleteCollectionTarget && deleteCollectionMutation.mutate(deleteCollectionTarget.id)}
        title="Delete Seasonal Collection"
        message={`Permanently remove capsule "${deleteCollectionTarget?.title}"? Garments attached will have their collection reset to null.`}
        confirmText="Delete Collection"
        isLoading={deleteCollectionMutation.isPending}
      />
    </div>
  );
};
