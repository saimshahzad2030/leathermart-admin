import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { Product, ProductImage, ProductVariant } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { ProductDetailsSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { useToast } from '@/context/ToastContext';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  Star,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Fetch categories & collections
  const { data: categories, refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.listCategories(),
  });

  const { data: collections, refetch: refetchCollections } = useQuery({
    queryKey: ['admin-collections'],
    queryFn: () => categoriesApi.listCollections(),
  });

  // If editing, fetch existing product
  const {
    data: existingProduct,
    isLoading: isFetchingProduct,
    isRefetching: isRefetchingProduct,
    refetch: refetchProduct,
  } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productsApi.getProductById(id!),
    enabled: isEdit,
  });

  // Form State
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [price, setPrice] = useState<number | string>('');
  const [salePrice, setSalePrice] = useState<number | string>('');
  const [leatherType, setLeatherType] = useState('Full-Grain Tuscan Calfskin');
  const [hardware, setHardware] = useState('Brushed Brass YKK Excella®');
  const [lining, setLining] = useState('100% Breathable Japanese Cupro Twill');
  const [modelInfo, setModelInfo] = useState('');
  const [description, setDescription] = useState('');
  const [editorialQuote, setEditorialQuote] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);
  const [isPublished, setIsPublished] = useState(true);
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Specs & Care bullet strings
  const [specifications, setSpecifications] = useState<string[]>([
    '1.2mm drum-dyed Italian calfskin',
    'Hand-finished French seam stitching',
  ]);
  const [careInstructions, setCareInstructions] = useState<string[]>([
    'Specialist leather dry-clean only',
    'Store on contoured cedar hanger in breathable garment bag',
  ]);

  // Nested Images
  const [images, setImages] = useState<ProductImage[]>([
    {
      url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=1200&auto=format&fit=crop',
      alt: 'Front perspective view',
      isPrimary: true,
      isHover: false,
      type: 'perspective',
      sortOrder: 1,
    },
  ]);

  // Nested Variants
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      sku: '',
      size: '48 (EU M)',
      color: 'Obsidian Black',
      colorHex: '#11100F',
      stock: 10,
      priceOverride: null,
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Populate form on edit load
  useEffect(() => {
    if (existingProduct) {
      setSku(existingProduct.sku || '');
      setName(existingProduct.name || '');
      setSlug(existingProduct.slug || '');
      setTagline(existingProduct.tagline || '');
      setCategory(existingProduct.category || '');
      setCollectionId(existingProduct.collectionId || '');
      setGender(existingProduct.gender || 'unisex');
      setPrice(existingProduct.price || '');
      setSalePrice(existingProduct.salePrice || '');
      setLeatherType(existingProduct.leatherType || '');
      setHardware(existingProduct.hardware || '');
      setLining(existingProduct.lining || '');
      setModelInfo(existingProduct.modelInfo || '');
      setDescription(existingProduct.description || '');
      setEditorialQuote(existingProduct.editorialQuote || '');
      setIsFeatured(existingProduct.isFeatured ?? false);
      setIsBestseller(existingProduct.isBestseller ?? false);
      setIsNewArrival(existingProduct.isNewArrival ?? true);
      setIsPublished(existingProduct.isPublished ?? true);
      setSeoTitle(existingProduct.seoTitle || '');
      setSeoDescription(existingProduct.seoDescription || '');
      if (existingProduct.specifications?.length) setSpecifications(existingProduct.specifications);
      if (existingProduct.careInstructions?.length) setCareInstructions(existingProduct.careInstructions);
      if (existingProduct.images?.length) setImages(existingProduct.images);
      if (existingProduct.variants?.length) setVariants(existingProduct.variants);
    }
  }, [existingProduct]);

  // Automatically update initial variant SKU when root SKU changes on new product
  useEffect(() => {
    if (!isEdit && sku && variants.length === 1 && !variants[0].sku) {
      setVariants([{ ...variants[0], sku: `${sku}-48-BLK` }]);
    }
  }, [sku, isEdit]);

  // Mutation to save product
  const saveMutation = useMutation({
    mutationFn: async (payload: Partial<Product>) => {
      if (isEdit) {
        return productsApi.updateProduct(id!, payload);
      } else {
        return productsApi.createProduct(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      toast.success(`Garment specification ${isEdit ? 'updated' : 'created'} successfully.`);
      navigate('/products');
    },
    onError: (err: any) => {
      const fieldErrors = err.response?.data?.errors;
      if (fieldErrors) {
        const mapped: Record<string, string> = {};
        Object.entries(fieldErrors).forEach(([k, v]) => {
          mapped[k] = Array.isArray(v) ? v[0] : String(v);
        });
        setErrors(mapped);
      }
      toast.error(err.response?.data?.message || 'Failed to save garment specification.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Client-side validation
    const newErrors: Record<string, string> = {};
    if (!sku.trim()) newErrors.sku = 'SKU identifier is required (e.g. MLB-001)';
    if (!name.trim()) newErrors.name = 'Garment name is required';
    if (!category) newErrors.category = 'Please select a garment category';
    if (!price || Number(price) <= 0) newErrors.price = 'Price must be a positive number in EUR';
    if (!leatherType.trim()) newErrors.leatherType = 'Leather type description is required';
    if (!description.trim() || description.length < 10)
      newErrors.description = 'Description must be at least 10 characters';
    if (images.length === 0 || !images[0].url)
      newErrors.images = 'At least one garment image is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error('Please resolve the errors highlighted on the form.');
      return;
    }

    const payload: Partial<Product> = {
      sku: sku.trim(),
      name: name.trim(),
      slug: slug.trim() || undefined,
      tagline: tagline.trim() || undefined,
      category,
      collectionId: collectionId || null,
      gender,
      price: Number(price),
      salePrice: salePrice ? Number(salePrice) : null,
      leatherType: leatherType.trim(),
      hardware: hardware.trim() || undefined,
      lining: lining.trim() || undefined,
      modelInfo: modelInfo.trim() || undefined,
      description: description.trim(),
      editorialQuote: editorialQuote.trim() || undefined,
      isFeatured,
      isBestseller,
      isNewArrival,
      isPublished,
      specifications: specifications.filter((s) => s.trim().length > 0),
      careInstructions: careInstructions.filter((c) => c.trim().length > 0),
      images: images.filter((img) => img.url.trim().length > 0),
      variants: variants.map((v, i) => ({
        ...v,
        sku: v.sku.trim() || `${sku.trim()}-${v.size.replace(/\s+/g, '')}-${i}`,
        stock: Number(v.stock) || 0,
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
    };

    saveMutation.mutate(payload);
  };

  // Helper to add specification
  const addSpec = () => setSpecifications((prev) => [...prev, '']);
  const updateSpec = (index: number, val: string) => {
    const copy = [...specifications];
    copy[index] = val;
    setSpecifications(copy);
  };
  const removeSpec = (index: number) => {
    setSpecifications((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to add care instruction
  const addCare = () => setCareInstructions((prev) => [...prev, '']);
  const updateCare = (index: number, val: string) => {
    const copy = [...careInstructions];
    copy[index] = val;
    setCareInstructions(copy);
  };
  const removeCare = (index: number) => {
    setCareInstructions((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to add variant row
  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      {
        sku: sku ? `${sku}-${prev.length + 1}` : '',
        size: '50 (EU L)',
        color: 'Obsidian Black',
        colorHex: '#11100F',
        stock: 5,
        priceOverride: null,
      },
    ]);
  };
  const updateVariant = (index: number, field: keyof ProductVariant, val: any) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], [field]: val };
    setVariants(copy);
  };
  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('A product must contain at least one variant size/SKU.');
      return;
    }
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  // Helper to add image row
  const addImage = (url: string = '') => {
    setImages((prev) => [
      ...prev,
      {
        url,
        alt: `${name} view`,
        isPrimary: prev.length === 0,
        isHover: prev.length === 1,
        type: 'perspective',
        sortOrder: prev.length + 1,
      },
    ]);
  };

  if (isEdit && isFetchingProduct) {
    return <ProductDetailsSkeleton />;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/products"
            className="p-2 rounded-xl border border-theme bg-surface hover:bg-surface-hover text-muted hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold font-serif-luxury text-primary">
              {isEdit ? `Edit: ${existingProduct?.name || 'Garment'}` : 'Create Garment Specification'}
            </h1>
            <p className="text-xs text-muted">
              {isEdit ? `SKU: ${existingProduct?.sku}` : 'Handcrafted Italian Outerwear Record'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {isEdit && (
            <RefreshButton
              onRefresh={async () => {
                await Promise.allSettled([refetchProduct(), refetchCategories(), refetchCollections()]);
              }}
              isRefreshing={isRefetchingProduct}
              title="Refresh product specification"
            />
          )}
          <Link to="/products">
            <Button type="button" variant="outline" size="md">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={saveMutation.isPending}
            disabled={saveMutation.isPending}
            leftIcon={<Save className="w-4 h-4" />}
          >
            {isEdit ? 'Save Changes' : 'Create Garment'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Columns: Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-theme">
              <Layers className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                1. Garment Identity & Catalogue
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="SKU Identifier" required error={errors.sku}>
                <Input
                  placeholder="e.g. MLB-001"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  required
                />
              </FormField>

              <FormField label="Garment Title / Model" required error={errors.name}>
                <Input
                  placeholder="e.g. Montreal Leather Bomber"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Category" required error={errors.category}>
                <Select value={category} onChange={(e) => setCategory(e.target.value)} required>
                  <option value="">Select Category...</option>
                  {categories?.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="Gender Cut" required>
                <Select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                >
                  <option value="men">Men's Tailoring</option>
                  <option value="women">Women's Tailoring</option>
                  <option value="unisex">Unisex Proportion</option>
                </Select>
              </FormField>

              <FormField label="Seasonal Lookbook Capsule (Optional)">
                <Select
                  value={collectionId}
                  onChange={(e) => setCollectionId(e.target.value)}
                >
                  <option value="">None / Permanent Collection</option>
                  {collections?.map((col) => (
                    <option key={col.id} value={col.id}>
                      {col.title} ({col.season})
                    </option>
                  ))}
                </Select>
              </FormField>

              <FormField label="URL Slug (Optional, auto-generated)">
                <Input
                  placeholder="e.g. montreal-leather-bomber"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase())}
                />
              </FormField>
            </div>

            <FormField label="Tagline / Subheading">
              <Input
                placeholder="e.g. Full-grain calfskin with Italian antiqued brass hardware"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
              />
            </FormField>

            <FormField label="Editorial Narrative & Description" required error={errors.description}>
              <Textarea
                rows={4}
                placeholder="Describe the architectural cut, shoulder mobility, and Italian artisan construction..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Lead Editorial Quote (Optional)">
              <Input
                placeholder='e.g. "A masterclass in modern European proportion tailored in Milan."'
                value={editorialQuote}
                onChange={(e) => setEditorialQuote(e.target.value)}
              />
            </FormField>
          </div>

          {/* Section 2: Materials & Hardware */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-theme">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                2. Tuscan Materials & Tailoring
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Leather Type & Origin" required error={errors.leatherType}>
                <Input
                  placeholder="e.g. 1.2mm Full-Grain Tuscan Calfskin"
                  value={leatherType}
                  onChange={(e) => setLeatherType(e.target.value)}
                  required
                />
              </FormField>

              <FormField label="Hardware Specification">
                <Input
                  placeholder="e.g. Custom Brushed Brass YKK Excella®"
                  value={hardware}
                  onChange={(e) => setHardware(e.target.value)}
                />
              </FormField>

              <FormField label="Internal Lining Material">
                <Input
                  placeholder="e.g. 100% Breathable Japanese Cupro Twill"
                  value={lining}
                  onChange={(e) => setLining(e.target.value)}
                />
              </FormField>

              <FormField label="Model Sizing Context">
                <Input
                  placeholder="e.g. Model is 187cm wearing size 48 (EU M)"
                  value={modelInfo}
                  onChange={(e) => setModelInfo(e.target.value)}
                />
              </FormField>
            </div>
          </div>

          {/* Section 3: Variant & Inventory Matrix */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  3. Size & Color Variant Inventory
                </h2>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addVariant} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                Add Variant Row
              </Button>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl border border-theme bg-surface-subtle/40 flex flex-col sm:flex-row items-start sm:items-center gap-3"
                >
                  <div className="w-full sm:w-36">
                    <label className="text-[10px] uppercase font-bold text-muted">SKU</label>
                    <Input
                      placeholder="Variant SKU"
                      value={v.sku}
                      onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="w-full sm:w-28">
                    <label className="text-[10px] uppercase font-bold text-muted">Size</label>
                    <Input
                      placeholder="e.g. 48 (EU M)"
                      value={v.size}
                      onChange={(e) => updateVariant(i, 'size', e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <label className="text-[10px] uppercase font-bold text-muted">Color Name</label>
                    <Input
                      placeholder="e.g. Obsidian Black"
                      value={v.color}
                      onChange={(e) => updateVariant(i, 'color', e.target.value)}
                      className="text-xs h-9"
                    />
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="text-[10px] uppercase font-bold text-muted">Hex</label>
                    <div className="flex items-center gap-1">
                      <input
                        type="color"
                        value={v.colorHex || '#11100F'}
                        onChange={(e) => updateVariant(i, 'colorHex', e.target.value)}
                        className="w-7 h-8 rounded border border-theme bg-transparent cursor-pointer p-0"
                      />
                      <span className="text-[10px] font-mono text-muted truncate">{v.colorHex}</span>
                    </div>
                  </div>

                  <div className="w-full sm:w-20">
                    <label className="text-[10px] uppercase font-bold text-muted">Stock</label>
                    <Input
                      type="number"
                      min={0}
                      value={v.stock}
                      onChange={(e) => updateVariant(i, 'stock', Number(e.target.value))}
                      className="text-xs h-9 font-mono"
                    />
                  </div>

                  <div className="pt-4 sm:pt-3">
                    <button
                      type="button"
                      onClick={() => removeVariant(i)}
                      className="text-muted hover:text-rose-500 p-1.5 transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Specifications & Care Bullet Points */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-6">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Garment Bullet Specifications
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addSpec}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Spec
                </Button>
              </div>
              <div className="space-y-2">
                {specifications.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={spec}
                      onChange={(e) => updateSpec(i, e.target.value)}
                      placeholder="e.g. 1.2mm drum-dyed full-grain calfskin"
                      className="text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="text-muted hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between pb-3 border-b border-theme mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Care & Preservation Guidelines
                </h3>
                <Button type="button" variant="outline" size="sm" onClick={addCare}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Add Care Note
                </Button>
              </div>
              <div className="space-y-2">
                {careInstructions.map((care, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      value={care}
                      onChange={(e) => updateCare(i, e.target.value)}
                      placeholder="e.g. Specialist leather dry-clean only"
                      className="text-xs"
                    />
                    <button
                      type="button"
                      onClick={() => removeCare(i)}
                      className="text-muted hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Pricing, Images, Badges, SEO */}
        <div className="space-y-6">
          {/* Pricing Card */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide pb-3 border-b border-theme">
              Pricing (EUR)
            </h2>

            <FormField label="Base Price (€ EUR)" required error={errors.price}>
              <Input
                type="number"
                step="1"
                min="1"
                placeholder="e.g. 385"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </FormField>

            <FormField label="Sale Price (€ EUR, Optional)">
              <Input
                type="number"
                step="1"
                min="0"
                placeholder="e.g. 340"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
              />
            </FormField>
          </div>

          {/* Publishing & Badges */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide pb-3 border-b border-theme">
              Status & Badges
            </h2>

            <div className="space-y-3 pt-1">
              <Switch
                label="Published in Storefront"
                description="When disabled, garment is saved as draft."
                checked={isPublished}
                onChange={setIsPublished}
              />

              <Switch
                label="Featured Garment"
                description="Showcase on homepage curated slider."
                checked={isFeatured}
                onChange={setIsFeatured}
              />

              <Switch
                label="Bestseller Badge"
                description="Highlights as client favorite."
                checked={isBestseller}
                onChange={setIsBestseller}
              />

              <Switch
                label="New Arrival Badge"
                description="Tags with Autumn/Winter tag."
                checked={isNewArrival}
                onChange={setIsNewArrival}
              />
            </div>
          </div>

          {/* Garment Photography & Gallery */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-theme">
              <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                Garment Photography
              </h2>
              <span className="text-xs text-muted">{images.length} photos</span>
            </div>

            {errors.images && (
              <p className="text-xs text-rose-500 font-medium">{errors.images}</p>
            )}

            {/* Primary Image Uploader */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-secondary">
                Add Photography (Upload to Media Storage):
              </span>
              <ImageUploader
                folder="products"
                onChange={(newUrl) => {
                  if (newUrl) addImage(newUrl);
                }}
              />
            </div>

            {/* Image Gallery List */}
            <div className="space-y-2.5 pt-2">
              {images.map((img, i) => (
                <div
                  key={i}
                  className="p-2.5 rounded-xl border border-theme bg-surface-subtle/50 flex items-center gap-3 text-xs"
                >
                  <img
                    src={img.url}
                    alt={img.alt || 'Garment preview'}
                    className="w-12 h-14 rounded-lg object-cover border border-theme shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <Input
                      placeholder="Alt description"
                      value={img.alt || ''}
                      onChange={(e) => {
                        const copy = [...images];
                        copy[i].alt = e.target.value;
                        setImages(copy);
                      }}
                      className="text-xs h-7 mb-1"
                    />
                    <div className="flex items-center gap-2 text-[10px] text-muted">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          name="primaryImage"
                          checked={img.isPrimary}
                          onChange={() => {
                            setImages(
                              images.map((im, idx) => ({ ...im, isPrimary: idx === i }))
                            );
                          }}
                        />
                        Primary
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={img.isHover}
                          onChange={(e) => {
                            const copy = [...images];
                            copy[i].isHover = e.target.checked;
                            setImages(copy);
                          }}
                        />
                        Hover View
                      </label>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setImages(images.filter((_, idx) => idx !== i))}
                    className="text-muted hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SEO Metadata */}
          <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
            <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide pb-3 border-b border-theme">
              SEO & Social Cards
            </h2>

            <FormField label="Meta Title">
              <Input
                placeholder="e.g. Montreal Leather Bomber | Atelier Valenti"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
              />
            </FormField>

            <FormField label="Meta Description">
              <Textarea
                rows={3}
                placeholder="Search engine brief description..."
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
              />
            </FormField>
          </div>
        </div>
      </div>
    </form>
  );
};
