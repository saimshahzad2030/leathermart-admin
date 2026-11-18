import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { categoriesApi } from '@/lib/api/categories';
import { productsApi } from '@/lib/api/products';
import { NavigationItem, Category, Product } from '@/types';
import {
  Sparkles,
  Hash,
  Globe,
  Type,
  Tag,
  Layers,
  ShoppingBag,
  Link as LinkIcon,
  Search,
  CheckCircle2,
  Eye,
  EyeOff,
  FileCheck,
  RefreshCw,
} from 'lucide-react';

interface NavigationItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (item: NavigationItem) => void;
  initialItem?: NavigationItem | null;
  existingIds: string[];
  sectionName: string;
  departmentId: string;
}

type ItemType = 'CUSTOM_LINK' | 'CATEGORY' | 'PRODUCT';

export const NavigationItemModal: React.FC<NavigationItemModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialItem,
  existingIds,
  sectionName,
  departmentId,
}) => {
  const isEditing = Boolean(initialItem);

  const [type, setType] = useState<ItemType>('CUSTOM_LINK');
  const [id, setId] = useState('');
  const [fallbackLabel, setFallbackLabel] = useState('');
  const [labelKey, setLabelKey] = useState('');
  const [href, setHref] = useState('');
  const [badge, setBadge] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [productId, setProductId] = useState<string | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isDraft, setIsDraft] = useState(false);

  // Catalog picker search terms
  const [categorySearch, setCategorySearch] = useState('');
  const [productSearch, setProductSearch] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Query catalog categories
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ['admin-categories-selector'],
    queryFn: categoriesApi.listCategories,
    enabled: isOpen && type === 'CATEGORY',
  });

  // Query catalog products
  const { data: productsData, isLoading: isLoadingProducts } = useQuery({
    queryKey: ['admin-products-selector', productSearch],
    queryFn: () => productsApi.listProducts({ limit: 40, search: productSearch || undefined }),
    enabled: isOpen && type === 'PRODUCT',
  });
  const products = productsData?.products || [];

  const generateUuid = () => {
    try {
      return crypto.randomUUID();
    } catch {
      return 'item-' + Math.random().toString(36).substring(2, 10);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (initialItem) {
        setId(initialItem.id || '');
        setFallbackLabel(initialItem.fallbackLabel || '');
        setLabelKey(initialItem.labelKey || '');
        setHref(initialItem.href || '');
        setBadge(initialItem.badge || '');
        setType(
          initialItem.type ||
          (initialItem.categoryId ? 'CATEGORY' : initialItem.productId ? 'PRODUCT' : 'CUSTOM_LINK')
        );
        setCategoryId(initialItem.categoryId || null);
        setProductId(initialItem.productId || null);
        setIsActive(initialItem.isActive !== undefined ? initialItem.isActive : true);
        setIsDraft(initialItem.isDraft !== undefined ? initialItem.isDraft : false);
      } else {
        const defaultType: ItemType = sectionName.toLowerCase().includes('categor')
          ? 'CATEGORY'
          : 'CUSTOM_LINK';
        setType(defaultType);
        setId(generateUuid());
        setFallbackLabel('');
        setLabelKey('');
        setHref(`/${departmentId}`);
        setBadge('');
        setCategoryId(null);
        setProductId(null);
        setIsActive(true);
        setIsDraft(false);
      }
      setCategorySearch('');
      setProductSearch('');
      setErrors({});
    }
  }, [isOpen, initialItem, departmentId, sectionName]);

  const handleSelectCategory = (cat: Category) => {
    setCategoryId(cat.id);
    setFallbackLabel(cat.name);
    const slug = cat.slug;
    const prefix = departmentId === 'men' ? 'm' : 'w';
    if (!id || !isEditing) {
      setId(`${prefix}-${slug}`);
    }
    setLabelKey(`nav.${slug.replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase())}`);
    setHref(`/shop?category=${slug}`);
  };

  const handleSelectProduct = (prod: Product) => {
    setProductId(prod.id);
    setFallbackLabel(prod.name);
    const slug = prod.slug;
    const prefix = departmentId === 'men' ? 'm' : 'w';
    if (!id || !isEditing) {
      setId(`${prefix}-${slug}`);
    }
    setLabelKey(`nav.${slug.replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase())}`);
    setHref(`/products/${slug}`);
  };

  const handleLabelChange = (val: string) => {
    setFallbackLabel(val);
    if (!isEditing && (!id || id.length > 20)) {
      const prefix = departmentId === 'men' ? 'm' : 'w';
      const slug = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      if (slug) {
        setId(`${prefix}-${slug}`);
        setLabelKey(`nav.${slug.replace(/-([a-z0-9])/g, (_, l) => l.toUpperCase())}`);
        if (type === 'CUSTOM_LINK') {
          setHref(`/${departmentId}/${slug}`);
        }
      }
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedId = id.trim();
    const trimmedLabel = fallbackLabel.trim();
    const trimmedHref = href.trim();

    if (!trimmedId) {
      errs.id = 'Item identifier (ID) is required.';
    } else if (
      existingIds.some(
        (existing) =>
          existing.toLowerCase() === trimmedId.toLowerCase() &&
          (!isEditing || initialItem?.id?.toLowerCase() !== trimmedId.toLowerCase())
      )
    ) {
      errs.id = 'An item with this ID already exists in this section.';
    }

    if (!trimmedLabel) {
      errs.fallbackLabel = 'Display label is required.';
    }

    if (!trimmedHref) {
      errs.href = 'Destination URL is required.';
    }

    if (type === 'CATEGORY' && !categoryId && !isEditing) {
      errs.categoryId = 'Please select a catalog category.';
    }

    if (type === 'PRODUCT' && !productId && !isEditing) {
      errs.productId = 'Please select a catalog product.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      id: id.trim(),
      fallbackLabel: fallbackLabel.trim(),
      labelKey: labelKey.trim() || `nav.${id.trim()}`,
      href: href.trim(),
      badge: badge.trim() ? badge.trim() : undefined,
      type,
      categoryId: type === 'CATEGORY' ? categoryId : null,
      productId: type === 'PRODUCT' ? productId : null,
      isActive,
      isDraft,
      legacyId: initialItem?.legacyId || id.trim(),
    });
    onClose();
  };

  const filteredCategories = categories.filter(
    (c) =>
      c.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
      c.slug.toLowerCase().includes(categorySearch.toLowerCase())
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Navigation Item' : 'Add Navigation Item'}
      subtitle={`Configure link destination and properties in ${sectionName} (${departmentId.toUpperCase()})`}
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Link Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-primary uppercase tracking-wider mb-2">
            Link Destination Type
          </label>
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-xl bg-surface border border-theme">
            <button
              type="button"
              onClick={() => setType('CATEGORY')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${type === 'CATEGORY'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                  : 'text-muted hover:text-primary'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Catalog Category</span>
            </button>
            <button
              type="button"
              onClick={() => setType('PRODUCT')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${type === 'PRODUCT'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                  : 'text-muted hover:text-primary'
                }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Catalog Product</span>
            </button>
            <button
              type="button"
              onClick={() => setType('CUSTOM_LINK')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-medium transition-all ${type === 'CUSTOM_LINK'
                  ? 'bg-amber-500 text-zinc-950 font-semibold shadow-xs'
                  : 'text-muted hover:text-primary'
                }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Custom URL</span>
            </button>
          </div>
        </div>

        {/* Category Picker */}
        {type === 'CATEGORY' && (
          <div className="p-4 rounded-xl bg-surface-hover/30 border border-theme space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary">Select Catalog Category</label>
              {categoryId && (
                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Linked to category
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={categorySearch}
                onChange={(e) => setCategorySearch(e.target.value)}
                placeholder="Filter categories by name or slug..."
                className="pl-9 text-xs"
              />
            </div>
            {isLoadingCategories ? (
              <p className="text-xs text-muted py-3 text-center">Loading categories...</p>
            ) : filteredCategories.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">No categories matching search.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleSelectCategory(cat)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${categoryId === cat.id
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold'
                        : 'hover:bg-surface border border-transparent text-primary'
                      }`}
                  >
                    <span>{cat.name}</span>
                    <span className="font-mono text-[10px] text-muted">/shop?category={cat.slug}</span>
                  </button>
                ))}
              </div>
            )}
            {errors.categoryId && <p className="text-xs text-red-500">{errors.categoryId}</p>}
          </div>
        )}

        {/* Product Picker */}
        {type === 'PRODUCT' && (
          <div className="p-4 rounded-xl bg-surface-hover/30 border border-theme space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary">Select Catalog Product</label>
              {productId && (
                <span className="text-[10px] text-emerald-500 font-medium flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Linked to product
                </span>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products by title..."
                className="pl-9 text-xs"
              />
            </div>
            {isLoadingProducts ? (
              <p className="text-xs text-muted py-3 text-center">Loading products...</p>
            ) : products.length === 0 ? (
              <p className="text-xs text-muted py-3 text-center">No products found.</p>
            ) : (
              <div className="max-h-40 overflow-y-auto space-y-1 pr-1">
                {products.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => handleSelectProduct(prod)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${productId === prod.id
                        ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40 font-semibold'
                        : 'hover:bg-surface border border-transparent text-primary'
                      }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {prod.images?.[0]?.url && (
                        <img src={prod.images[0].url} alt="" className="w-6 h-6 rounded object-cover" />
                      )}
                      <span className="truncate">{prod.name}</span>
                    </div>
                    <span className="font-mono text-[10px] text-muted shrink-0 ml-2">
                      €{typeof prod.price === 'number' ? prod.price.toFixed(2) : prod.price}
                    </span>
                  </button>
                ))}
              </div>
            )}
            {errors.productId && <p className="text-xs text-red-500">{errors.productId}</p>}
          </div>
        )}

        {/* Label & ID Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Display Label"
            required
            error={errors.fallbackLabel}
            description="The English text displayed to storefront customers."
          >
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={fallbackLabel}
                onChange={(e) => handleLabelChange(e.target.value)}
                placeholder="e.g. Biker Jackets"
                className="pl-9"
              />
            </div>
          </FormField>

          <FormField
            label="Item Identifier (ID / Legacy ID)"
            required
            error={errors.id}
            description="Unique identifier for testing, mapping, and routing."
          >
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  value={id}
                  onChange={(e) => setId(e.target.value)}
                  placeholder="e.g. m-biker"
                  className="pl-9 font-mono text-xs"
                />
              </div>
              <button
                type="button"
                onClick={() => setId(generateUuid())}
                className="px-2.5 py-2 rounded-xl bg-surface border border-theme text-muted hover:text-amber-500 text-xs flex items-center gap-1.5 transition-colors"
                title="Generate UUID"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">UUID</span>
              </button>
            </div>
          </FormField>
        </div>

        {/* Translation Key & Href */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            label="Translation Key"
            description="i18n dictionary key for multi-currency & language localization."
          >
            <div className="relative">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={labelKey}
                onChange={(e) => setLabelKey(e.target.value)}
                placeholder="e.g. nav.bikerJackets"
                className="pl-9 font-mono text-xs"
              />
            </div>
          </FormField>

          <FormField
            label="Destination URL (Href)"
            required
            error={errors.href}
            description="Storefront route or query path to open upon click."
          >
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={href}
                onChange={(e) => setHref(e.target.value)}
                placeholder="e.g. /shop?category=biker"
                className="pl-9 font-mono text-xs"
              />
            </div>
          </FormField>
        </div>

        {/* Badge and Status Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          <FormField
            label="Badge Tag (Optional)"
            error={errors.badge}
            description="High-contrast promotional tag badge."
          >
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                placeholder="New, Exclusive, Bestseller"
                className="pl-9"
              />
            </div>
          </FormField>

          <div className="p-3 rounded-xl bg-surface border border-theme flex flex-col justify-between">
            <span className="text-xs font-semibold text-primary">Visibility Status</span>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${isActive
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
              >
                {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                <span>{isActive ? 'Active' : 'Inactive'}</span>
              </button>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-surface border border-theme flex flex-col justify-between">
            <span className="text-xs font-semibold text-primary">Publish State</span>
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setIsDraft(!isDraft)}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${!isDraft
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
              >
                <FileCheck className="w-3.5 h-3.5" />
                <span>{!isDraft ? 'Published' : 'Draft'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme mt-6">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {isEditing ? 'Save Item Changes' : 'Add Item'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
