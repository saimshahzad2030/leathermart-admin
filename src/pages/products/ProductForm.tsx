import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/lib/api/products';
import { categoriesApi } from '@/lib/api/categories';
import { sizesApi } from '@/lib/api/sizes';
import { colorsApi } from '@/lib/api/colors';
import { policiesApi } from '@/lib/api/policies';
import { Product, ProductImage, ProductVariant, ProductSize, ProductColor, ProductPolicy } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { ProductDetailsSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { FormField } from '@/components/forms/FormField';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { ManageSizesModal } from '@/components/modals/ManageSizesModal';
import { ManageColorsModal } from '@/components/modals/ManageColorsModal';
import { ManagePoliciesModal } from '@/components/modals/ManagePoliciesModal';
import { useToast } from '@/context/ToastContext';
import { parseApiError, clearFieldError, getFieldError } from '@/lib/apiErrors';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Check,
  Star,
  Layers,
  Sparkles,
  Info,
  Ruler,
  Palette,
  ShieldCheck,
  Globe,
  Settings2,
  AlertCircle,
} from 'lucide-react';

export const ProductForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();
  const queryClient = useQueryClient();

  // Modal open states
  const [isSizeModalOpen, setIsSizeModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);

  // Queries for categories, sizes, colors, and policies
  const { data: categories = [], refetch: refetchCategories } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => categoriesApi.listCategories(),
  });

  const { data: availableSizesList = [], refetch: refetchSizes } = useQuery({
    queryKey: ['admin-sizes'],
    queryFn: () => sizesApi.listSizes(),
  });

  const { data: availableColorsList = [], refetch: refetchColors } = useQuery({
    queryKey: ['admin-colors'],
    queryFn: () => colorsApi.listColors(),
  });

  const { data: availablePoliciesList = [], refetch: refetchPolicies } = useQuery({
    queryKey: ['admin-policies'],
    queryFn: () => policiesApi.listPolicies(),
  });

  // Query product if in edit mode
  const { data: existingProduct, isLoading: isProductLoading, refetch: refetchProduct } = useQuery({
    queryKey: ['admin-product', id],
    queryFn: () => productsApi.getProductById(id!),
    enabled: isEdit,
  });

  // Basic Details
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [slug, setSlug] = useState('');
  const [tagline, setTagline] = useState('');
  const [category, setCategory] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [gender, setGender] = useState<'men' | 'women' | 'unisex'>('unisex');
  const [leatherType, setLeatherType] = useState('Full-Grain Italian Calfskin');
  const [hardware, setHardware] = useState('');
  const [lining, setLining] = useState('');
  const [modelInfo, setModelInfo] = useState('');

  // Sizing & Colors (Mandatory selections)
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);

  // Reusable Policies (Optional selection)
  const [selectedPolicies, setSelectedPolicies] = useState<string[]>([]);

  // Regional Pricing (Global EUR, Pakistan PKR, Italy EUR)
  const [priceGlobal, setPriceGlobal] = useState<number | string>('');
  const [salePriceGlobal, setSalePriceGlobal] = useState<number | string>('');
  const [pricePK, setPricePK] = useState<number | string>('');
  const [salePricePK, setSalePricePK] = useState<number | string>('');
  const [priceIT, setPriceIT] = useState<number | string>('');
  const [salePriceIT, setSalePriceIT] = useState<number | string>('');

  // Editorial & Details
  const [description, setDescription] = useState('');
  const [editorialQuote, setEditorialQuote] = useState('');
  const [specifications, setSpecifications] = useState<string[]>(['']);
  const [careInstructions, setCareInstructions] = useState<string[]>(['']);

  // Visibility Flags
  const [isPublished, setIsPublished] = useState(true);
  const [isInStock, setIsInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isBestseller, setIsBestseller] = useState(false);
  const [isNewArrival, setIsNewArrival] = useState(true);

  // SEO
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');

  // Images
  const [images, setImages] = useState<ProductImage[]>([]);

  // Variant & Inventory Matrix (inStock boolean)
  const [variants, setVariants] = useState<ProductVariant[]>([
    {
      sku: '',
      size: '48 (EU M)',
      color: 'Obsidian Black',
      colorHex: '#11100F',
      inStock: true,
      priceOverride: null,
    },
  ]);

  // Validation Errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  const clearError = (...fields: string[]) => {
    setErrors((prev) => {
      let changed = false;
      const next = { ...prev };
      for (const f of fields) {
        if (next[f]) {
          delete next[f];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
    if (formError) setFormError('');
  };

  // Populate data when editing existing product
  useEffect(() => {
    if (existingProduct) {
      setName(existingProduct.name || '');
      setSku(existingProduct.sku || '');
      setSlug(existingProduct.slug || '');
      setTagline(existingProduct.tagline || '');
      setCategory(existingProduct.category || '');
      setCollectionId(existingProduct.collectionId || '');
      setGender(existingProduct.gender || 'unisex');
      setLeatherType(existingProduct.leatherType || '');
      setHardware(existingProduct.hardware || '');
      setLining(existingProduct.lining || '');
      setModelInfo(existingProduct.modelInfo || '');

      // Load Regional Prices
      const rawPrices = existingProduct.regionalPrices || [];
      const globalPriceObj = rawPrices.find((p) => p.regionCode === 'GLOBAL');
      const pkPriceObj = rawPrices.find((p) => p.regionCode === 'PK');
      const itPriceObj = rawPrices.find((p) => p.regionCode === 'IT');

      setPriceGlobal(globalPriceObj ? globalPriceObj.price : existingProduct.price || '');
      setSalePriceGlobal(globalPriceObj ? (globalPriceObj.salePrice ?? '') : existingProduct.salePrice || '');
      setPricePK(pkPriceObj ? pkPriceObj.price : '');
      setSalePricePK(pkPriceObj ? (pkPriceObj.salePrice ?? '') : '');
      setPriceIT(itPriceObj ? itPriceObj.price : '');
      setSalePriceIT(itPriceObj ? (itPriceObj.salePrice ?? '') : '');

      // Load Selected Sizes
      if (Array.isArray(existingProduct.sizes) && existingProduct.sizes.length > 0) {
        setSelectedSizes(existingProduct.sizes.map((s: any) => (typeof s === 'string' ? s : s.name)));
      } else if (Array.isArray(existingProduct.availableSizes) && existingProduct.availableSizes.length > 0) {
        setSelectedSizes(existingProduct.availableSizes);
      }

      // Load Selected Colors
      if (Array.isArray(existingProduct.colors) && existingProduct.colors.length > 0) {
        setSelectedColors(existingProduct.colors.map((c: any) => (typeof c === 'string' ? c : c.name)));
      } else if (Array.isArray(existingProduct.availableColors) && existingProduct.availableColors.length > 0) {
        setSelectedColors(existingProduct.availableColors.map((c) => c.name));
      }

      // Load Selected Policies
      if (Array.isArray(existingProduct.policies) && existingProduct.policies.length > 0) {
        setSelectedPolicies(existingProduct.policies.map((p: any) => (typeof p === 'string' ? p : (p.id || p.slug))));
      }

      setDescription(existingProduct.description || '');
      setEditorialQuote(existingProduct.editorialQuote || '');
      if (existingProduct.specifications?.length) setSpecifications(existingProduct.specifications);
      if (existingProduct.careInstructions?.length) setCareInstructions(existingProduct.careInstructions);

      setIsPublished(Boolean(existingProduct.isPublished));
      setIsInStock(existingProduct.isInStock !== undefined ? Boolean(existingProduct.isInStock) : (existingProduct.inStock !== undefined ? Boolean(existingProduct.inStock) : true));
      setIsFeatured(Boolean(existingProduct.isFeatured));
      setIsBestseller(Boolean(existingProduct.isBestseller));
      setIsNewArrival(Boolean(existingProduct.isNewArrival));

      setSeoTitle(existingProduct.seoTitle || '');
      setSeoDescription(existingProduct.seoDescription || '');

      if (existingProduct.images?.length) setImages(existingProduct.images);

      if (existingProduct.variants?.length) {
        setVariants(
          existingProduct.variants.map((v) => ({
            id: v.id,
            sku: v.sku,
            size: v.size,
            color: v.color,
            colorHex: v.colorHex || '#11100F',
            inStock: v.inStock !== undefined ? Boolean(v.inStock) : (Number(v.stock) > 0),
            priceOverride: v.priceOverride ?? null,
          }))
        );
      }
    }
  }, [existingProduct]);

  // Auto-generate SKU for new single variant if empty
  useEffect(() => {
    if (!isEdit && sku && variants.length === 1 && !variants[0].sku) {
      setVariants([{ ...variants[0], sku: `${sku}-48-BLK` }]);
    }
  }, [sku, isEdit]);

  // Mutations
  const handleMutationError = (err: any, fallbackMessage: string) => {
    const parsed = parseApiError(err, fallbackMessage);
    if (parsed.hasFieldErrors) {
      const mappedErrors: Record<string, string> = {};
      Object.entries(parsed.fieldErrors).forEach(([k, msgs]) => {
        mappedErrors[k] = msgs[0];
      });
      // Specific mappings for ProductForm field names
      if (parsed.fieldErrors.price) {
        mappedErrors.priceGlobal = parsed.fieldErrors.price[0];
      }
      if (parsed.fieldErrors.sale_price || parsed.fieldErrors.salePrice) {
        mappedErrors.salePriceGlobal = (parsed.fieldErrors.sale_price || parsed.fieldErrors.salePrice)[0];
      }
      if (parsed.fieldErrors.leather_type) {
        mappedErrors.leatherType = parsed.fieldErrors.leather_type[0];
      }
      if (parsed.fieldErrors.model_info) {
        mappedErrors.modelInfo = parsed.fieldErrors.model_info[0];
      }
      if (parsed.fieldErrors.seo_title) {
        mappedErrors.seoTitle = parsed.fieldErrors.seo_title[0];
      }
      if (parsed.fieldErrors.seo_description) {
        mappedErrors.seoDescription = parsed.fieldErrors.seo_description[0];
      }
      setErrors((prev) => ({ ...prev, ...mappedErrors }));
      setFormError(parsed.message);
      toast.error(parsed.message);
    } else {
      setFormError(parsed.message);
      toast.error(parsed.message);
    }
  };

  const createMutation = useMutation({
    mutationFn: productsApi.createProduct,
    onSuccess: (data) => {
      toast.success(`Garment '${data.name}' specification created`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      navigate('/products');
    },
    onError: (err: any) => {
      handleMutationError(err, 'Failed to create product');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (payload: Partial<Product>) => productsApi.updateProduct(id!, payload),
    onSuccess: (data) => {
      toast.success(`Garment '${data.name}' specification updated`);
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product', id] });
      navigate('/products');
    },
    onError: (err: any) => {
      handleMutationError(err, 'Failed to update product');
    },
  });

  // Toggle selection helpers
  const toggleSizeSelection = (sizeName: string) => {
    clearError('sizes');
    if (selectedSizes.includes(sizeName)) {
      setSelectedSizes(selectedSizes.filter((s) => s !== sizeName));
    } else {
      setSelectedSizes([...selectedSizes, sizeName]);
    }
  };

  const toggleColorSelection = (colorName: string) => {
    clearError('colors');
    if (selectedColors.includes(colorName)) {
      setSelectedColors(selectedColors.filter((c) => c !== colorName));
    } else {
      setSelectedColors([...selectedColors, colorName]);
    }
  };

  const togglePolicySelection = (policyId: string) => {
    if (selectedPolicies.includes(policyId)) {
      setSelectedPolicies(selectedPolicies.filter((p) => p !== policyId));
    } else {
      setSelectedPolicies([...selectedPolicies, policyId]);
    }
  };

  // Variant row helpers
  const addVariant = () => {
    const defaultSize = selectedSizes[0] || '48 (EU M)';
    const defaultColor = selectedColors[0] || 'Obsidian Black';
    const foundColorObj = availableColorsList.find((c) => c.name === defaultColor);

    setVariants([
      ...variants,
      {
        sku: `${sku || 'AVM'}-${variants.length + 1}`.toUpperCase(),
        size: defaultSize,
        color: defaultColor,
        colorHex: foundColorObj?.hex || '#11100F',
        inStock: true,
        priceOverride: null,
      },
    ]);
  };

  const updateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    const copy = [...variants];
    copy[index] = { ...copy[index], [field]: value };
    setVariants(copy);
  };

  const removeVariant = (index: number) => {
    if (variants.length <= 1) {
      toast.error('Every product must have at least one variant configuration');
      return;
    }
    setVariants(variants.filter((_, i) => i !== index));
  };

  // Specification array helpers
  const addSpec = () => setSpecifications([...specifications, '']);
  const updateSpec = (idx: number, val: string) => {
    const c = [...specifications];
    c[idx] = val;
    setSpecifications(c);
  };
  const removeSpec = (idx: number) => setSpecifications(specifications.filter((_, i) => i !== idx));

  // Care instruction array helpers
  const addCare = () => setCareInstructions([...careInstructions, '']);
  const updateCare = (idx: number, val: string) => {
    const c = [...careInstructions];
    c[idx] = val;
    setCareInstructions(c);
  };
  const removeCare = (idx: number) => setCareInstructions(careInstructions.filter((_, i) => i !== idx));

  // Form Validation & Submission
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Garment designation is required';
    if (!sku.trim()) newErrors.sku = 'Stock Keeping Unit (SKU) is required';
    if (!category) newErrors.category = 'Category assignment is required';
    if (!leatherType.trim()) newErrors.leatherType = 'Leather hide material is required';
    if (!description.trim()) newErrors.description = 'Editorial description is required';

    // Mandatory Sizes validation
    if (selectedSizes.length === 0) {
      newErrors.sizes = 'Every product must have at least one available size selected';
    }

    // Mandatory Colors validation
    if (selectedColors.length === 0) {
      newErrors.colors = 'Every product must have at least one available color selected';
    }

    // Pricing validation (Global EUR required)
    if (!priceGlobal || Number(priceGlobal) <= 0) {
      newErrors.priceGlobal = 'Global market price in EUR is required and must be greater than zero';
    }
    if (salePriceGlobal && Number(salePriceGlobal) >= Number(priceGlobal)) {
      newErrors.salePriceGlobal = 'Sale price must be strictly lower than regular price';
    }
    if (pricePK && Number(pricePK) < 0) {
      newErrors.pricePK = 'Pakistan price must be a non-negative amount in PKR';
    }
    if (priceIT && Number(priceIT) < 0) {
      newErrors.priceIT = 'Italy price must be a non-negative amount in EUR';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      toast.error('Please resolve highlighted validation errors before saving');
      return;
    }

    // Build regional prices payload
    const regionalPricesPayload: Array<{
      regionCode: 'GLOBAL' | 'PK' | 'IT';
      currency: 'EUR' | 'PKR';
      price: number;
      salePrice: number | null;
      isActive: boolean;
    }> = [
        {
          regionCode: 'GLOBAL' as const,
          currency: 'EUR' as const,
          price: Number(priceGlobal),
          salePrice: salePriceGlobal ? Number(salePriceGlobal) : null,
          isActive: true,
        },
      ];

    if (pricePK && Number(pricePK) > 0) {
      regionalPricesPayload.push({
        regionCode: 'PK' as const,
        currency: 'PKR' as const,
        price: Number(pricePK),
        salePrice: salePricePK ? Number(salePricePK) : null,
        isActive: true,
      });
    }

    if (priceIT && Number(priceIT) > 0) {
      regionalPricesPayload.push({
        regionCode: 'IT' as const,
        currency: 'EUR' as const,
        price: Number(priceIT),
        salePrice: salePriceIT ? Number(salePriceIT) : null,
        isActive: true,
      });
    }

    const payload: any = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      slug: slug.trim() || undefined,
      tagline: tagline.trim() || undefined,
      category,
      collectionId: collectionId || null,
      gender,
      leatherType: leatherType.trim(),
      hardware: hardware.trim() || undefined,
      lining: lining.trim() || undefined,
      modelInfo: modelInfo.trim() || undefined,
      description: description.trim(),
      editorialQuote: editorialQuote.trim() || undefined,
      price: Number(priceGlobal),
      salePrice: salePriceGlobal ? Number(salePriceGlobal) : null,
      regionalPrices: regionalPricesPayload,
      sizes: selectedSizes,
      colors: selectedColors,
      policies: selectedPolicies,
      isPublished,
      isInStock,
      isFeatured,
      isBestseller,
      isNewArrival,
      seoTitle: seoTitle.trim() || undefined,
      seoDescription: seoDescription.trim() || undefined,
      specifications: specifications.filter((s) => s.trim().length > 0),
      careInstructions: careInstructions.filter((c) => c.trim().length > 0),
      images,
      variants: variants.map((v, i) => ({
        sku: v.sku || `${sku}-${v.size}-${v.color}`.toUpperCase().replace(/\s+/g, '-'),
        size: v.size,
        color: v.color,
        colorHex: v.colorHex || '#11100F',
        inStock: Boolean(v.inStock),
        priceOverride: v.priceOverride ? Number(v.priceOverride) : null,
      })),
    };

    if (isEdit) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (isEdit && isProductLoading) {
    return <ProductDetailsSkeleton />;
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 max-w-6xl mx-auto pb-16">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-theme">
          <div className="flex items-center gap-3">
            <Link
              to="/products"
              className="p-2 rounded-xl border border-theme bg-surface hover:bg-surface-subtle transition-colors text-muted hover:text-primary"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold font-serif-luxury text-primary tracking-wide">
                {isEdit ? `Edit Garment: ${existingProduct?.name || name}` : 'Create Luxury Garment Specification'}
              </h1>
              <p className="text-xs text-muted mt-0.5">
                {isEdit
                  ? 'Maintain atelier technical specifications, sizes, colors, regional pricing, and policies'
                  : 'Register a bespoke leather garment specification in the central catalog'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isEdit && (
              <RefreshButton
                onRefresh={() => {
                  refetchProduct();
                  refetchCategories();
                  refetchSizes();
                  refetchColors();
                  refetchPolicies();
                }}
                isRefreshing={isProductLoading}
              />
            )}
            <Button
              type="submit"
              variant="primary"
              size="md"
              isLoading={createMutation.isPending || updateMutation.isPending}
              leftIcon={<Save className="w-4 h-4" />}
            >
              {isEdit ? 'Save Changes' : 'Publish Product'}
            </Button>
          </div>
        </div>

        {/* Form Body: 2 Columns */}
        {formError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column (2 spans) */}
          <div className="lg:col-span-2 space-y-8">
            {/* Section 1: Basic Garment Details */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  1. Garment Identity & Cut
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="Product Name" required error={errors.name}>
                  <Input
                    placeholder="e.g. Milanese Double-Rider Biker Jacket"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      clearError('name');
                      if (!isEdit && !slug) {
                        setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                      }
                    }}
                  />
                </FormField>

                <FormField label="Garment SKU" required error={errors.sku}>
                  <Input
                    placeholder="e.g. AVM-BIK-001"
                    value={sku}
                    onChange={(e) => {
                      setSku(e.target.value.toUpperCase());
                      clearError('sku');
                    }}
                    className="font-mono"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="URL Slug" error={errors.slug}>
                  <Input
                    placeholder="e.g. milanese-double-rider"
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      clearError('slug');
                    }}
                    className="font-mono text-xs"
                  />
                </FormField>

                <FormField label="Sub-title / Tagline">
                  <Input
                    placeholder="e.g. Drum-dyed Tuscan calfskin with Excella hardware"
                    value={tagline}
                    onChange={(e) => setTagline(e.target.value)}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Category" required error={errors.category}>
                  <Select
                    value={category}
                    onChange={(e) => {
                      setCategory(e.target.value);
                      clearError('category');
                    }}
                    options={[
                      { value: '', label: 'Select Category...' },
                      ...categories.map((c) => ({ value: c.slug, label: c.name })),
                    ]}
                  />
                </FormField>

                <FormField label="Gender Cut">
                  <Select
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    options={[
                      { value: 'unisex', label: 'Unisex Fit' },
                      { value: 'men', label: 'Men’s Tailoring' },
                      { value: 'women', label: 'Women’s Tailoring' },
                    ]}
                  />
                </FormField>

                <FormField label="Leather Hide Type" required error={errors.leatherType}>
                  <Input
                    placeholder="e.g. Full-Grain Calfskin"
                    value={leatherType}
                    onChange={(e) => {
                      setLeatherType(e.target.value);
                      clearError('leatherType', 'leather_type');
                    }}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <FormField label="Hardware Specification">
                  <Input
                    placeholder="e.g. Brushed Brass Excella®"
                    value={hardware}
                    onChange={(e) => setHardware(e.target.value)}
                  />
                </FormField>

                <FormField label="Internal Lining Material">
                  <Input
                    placeholder="e.g. 100% Japanese Cupro"
                    value={lining}
                    onChange={(e) => setLining(e.target.value)}
                  />
                </FormField>

                <FormField label="Model Sizing Context">
                  <Input
                    placeholder="e.g. Model is 187cm in 48 (EU M)"
                    value={modelInfo}
                    onChange={(e) => setModelInfo(e.target.value)}
                  />
                </FormField>
              </div>
            </div>

            {/* Section 2: Product Sizes Selection (Mandatory) */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-theme">
                <div className="flex items-center gap-2">
                  <Ruler className="w-4 h-4 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                      2. Available Product Sizes <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-[11px] text-muted">
                      Select all sizes produced for this garment. At least one size is strictly required.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSizeModalOpen(true)}
                  leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                >
                  Manage Sizes
                </Button>
              </div>

              {errors.sizes && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.sizes}
                </div>
              )}

              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {availableSizesList.map((size) => {
                    const isSelected = selectedSizes.includes(size.name);
                    return (
                      <button
                        type="button"
                        key={size.id}
                        disabled={!size.isActive && !isSelected}
                        onClick={() => toggleSizeSelection(size.name)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-all flex items-center gap-1.5 border ${isSelected
                          ? 'bg-amber-500 text-black border-amber-500 font-bold shadow-xs'
                          : size.isActive
                            ? 'bg-surface-subtle text-secondary border-theme hover:border-amber-500/50 hover:text-primary'
                            : 'bg-surface-subtle/40 text-muted/60 border-dashed border-theme cursor-not-allowed line-through'
                          }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                        {size.name}
                        {!size.isActive && <span className="text-[9px] font-sans opacity-70">(Inactive)</span>}
                      </button>
                    );
                  })}
                </div>

                {selectedSizes.length > 0 && (
                  <p className="text-[11px] text-muted">
                    Selected sizes ({selectedSizes.length}):{' '}
                    <span className="font-mono text-primary font-semibold">{selectedSizes.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 3: Product Colors Selection (Mandatory) */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-theme">
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                      3. Available Product Colors <span className="text-rose-500">*</span>
                    </h2>
                    <p className="text-[11px] text-muted">
                      Select visual leather color swatches available for this product. At least one color is required.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsColorModalOpen(true)}
                  leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                >
                  Manage Colors
                </Button>
              </div>

              {errors.colors && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  {errors.colors}
                </div>
              )}

              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableColorsList.map((col) => {
                    const isSelected = selectedColors.includes(col.name);
                    return (
                      <button
                        type="button"
                        key={col.id}
                        disabled={!col.isActive && !isSelected}
                        onClick={() => toggleColorSelection(col.name)}
                        className={`p-2.5 rounded-xl text-left transition-all border flex items-center gap-2.5 ${isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-primary shadow-xs'
                          : col.isActive
                            ? 'bg-surface-subtle text-secondary border-theme hover:border-theme-hover'
                            : 'bg-surface-subtle/40 text-muted/60 border-dashed border-theme cursor-not-allowed opacity-60'
                          }`}
                      >
                        <div
                          className="w-5 h-5 rounded-lg border border-theme shadow-xs flex-shrink-0"
                          style={{ backgroundColor: col.hex }}
                        />
                        <div className="truncate flex-1 min-w-0">
                          <span className="text-xs font-medium block truncate">{col.name}</span>
                          <span className="text-[10px] font-mono text-muted">{col.hex}</span>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 ml-auto" />}
                      </button>
                    );
                  })}
                </div>

                {selectedColors.length > 0 && (
                  <p className="text-[11px] text-muted">
                    Selected colors ({selectedColors.length}):{' '}
                    <span className="font-semibold text-primary">{selectedColors.join(', ')}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Section 4: Variant Availability Matrix (inStock Boolean) */}
            {/* <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-theme">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                      4. Purchasable Variant Inventory
                    </h2>
                    <p className="text-[11px] text-muted">
                      Boolean availability status is the single source of truth. No stock quantities.
                    </p>
                  </div>
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
                      <label className="text-[10px] uppercase font-bold text-muted">Variant SKU</label>
                      <Input
                        placeholder="Variant SKU"
                        value={v.sku}
                        onChange={(e) => updateVariant(i, 'sku', e.target.value)}
                        className="text-xs h-9 font-mono"
                      />
                    </div>

                    <div className="w-full sm:w-32">
                      <label className="text-[10px] uppercase font-bold text-muted">Size</label>
                      <select
                        value={v.size}
                        onChange={(e) => updateVariant(i, 'size', e.target.value)}
                        className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-amber-500 h-9"
                      >
                        {selectedSizes.length > 0 ? (
                          selectedSizes.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))
                        ) : (
                          <option value={v.size}>{v.size}</option>
                        )}
                      </select>
                    </div>

                    <div className="w-full sm:w-40">
                      <label className="text-[10px] uppercase font-bold text-muted">Color</label>
                      <select
                        value={v.color}
                        onChange={(e) => {
                          const chosenColor = e.target.value;
                          const found = availableColorsList.find((c) => c.name === chosenColor);
                          updateVariant(i, 'color', chosenColor);
                          if (found) updateVariant(i, 'colorHex', found.hex);
                        }}
                        className="w-full bg-surface border border-theme rounded-xl px-2.5 py-1.5 text-xs text-primary focus:outline-none focus:ring-1 focus:ring-amber-500 h-9"
                      >
                        {selectedColors.length > 0 ? (
                          selectedColors.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))
                        ) : (
                          <option value={v.color}>{v.color}</option>
                        )}
                      </select>
                    </div>

                     <div className="w-full sm:w-36 flex flex-col justify-center">
                      <label className="text-[10px] uppercase font-bold text-muted mb-1">Availability</label>
                      <div className="flex items-center gap-2 h-9">
                        <Switch
                          checked={v.inStock}
                          onChange={(val) => updateVariant(i, 'inStock', val)}
                        />
                        <span
                          className={`text-xs font-semibold ${
                            v.inStock ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {v.inStock ? 'In Stock' : 'Out of Stock'}
                        </span>
                      </div>
                    </div>

                    <div className="pt-4 sm:pt-3 ml-auto">
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
            </div> */}

            {/* Section 5: Reusable Product Policies */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-theme">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-amber-500" />
                  <div>
                    <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                      4. Reusable Garment Policies
                    </h2>
                    <p className="text-[11px] text-muted">
                      Attach shipping, returns, warranty, and bespoke care policies displayed on the storefront.
                    </p>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsPolicyModalOpen(true)}
                  leftIcon={<Settings2 className="w-3.5 h-3.5" />}
                >
                  Manage Policies
                </Button>
              </div>

              <div className="space-y-2.5">
                {availablePoliciesList.length === 0 ? (
                  <p className="text-xs text-muted py-2">No policies created yet. Click Manage Policies to create one.</p>
                ) : (
                  availablePoliciesList.map((pol) => {
                    const isChecked = selectedPolicies.includes(pol.id);
                    return (
                      <label
                        key={pol.id}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${isChecked
                          ? 'bg-amber-500/10 border-amber-500 text-primary'
                          : 'bg-surface-subtle/50 border-theme hover:border-theme-hover text-secondary'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => togglePolicySelection(pol.id)}
                          className="mt-0.5 rounded border-red-400 text-amber-500 focus:ring-amber-500"
                        />
                        <div className="space-y-0.5 flex-1">
                          <span className="text-xs font-bold block text-primary">{pol.name}</span>
                          <p className="text-[11px] text-muted line-clamp-2 leading-relaxed">{pol.description}</p>
                        </div>
                      </label>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section 6: Editorial Details & Specifications */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Info className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  5. Editorial Narrative & Specifications
                </h2>
              </div>

              <FormField label="Comprehensive Editorial Description" required error={errors.description}>
                <Textarea
                  placeholder="Describe the architectural proportions, silhouette cut, tanning methods, and styling notes..."
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    clearError('description');
                  }}
                  rows={4}
                />
              </FormField>

              <FormField label="Curator / Atelier Editorial Quote">
                <Input
                  placeholder="e.g. 'A sculpted European double rider engineered with bespoke lapels.'"
                  value={editorialQuote}
                  onChange={(e) => setEditorialQuote(e.target.value)}
                />
              </FormField>

              {/* Repeatable Specifications */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-primary">Technical Bullet Specifications</label>
                {specifications.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. YKK Excella® multi-tooth zip closures"
                      value={spec}
                      onChange={(e) => updateSpec(i, e.target.value)}
                      className="text-xs h-8 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeSpec(i)}
                      className="text-muted hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addSpec} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Specification
                </Button>
              </div>

              {/* Repeatable Care Instructions */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-primary">Leather Care & Preservation Instructions</label>
                {careInstructions.map((care, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. Treat biannually with natural beeswax conditioner"
                      value={care}
                      onChange={(e) => updateCare(i, e.target.value)}
                      className="text-xs h-8 flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeCare(i)}
                      className="text-muted hover:text-rose-500 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={addCare} leftIcon={<Plus className="w-3.5 h-3.5" />}>
                  Add Care Instruction
                </Button>
              </div>
            </div>
          </div>

          {/* Right Sidebar Column (1 span) */}
          <div className="space-y-8">
            {/* Dedicated Regional Pricing Card */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Globe className="w-4 h-4 text-amber-500" />
                <div>
                  <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                    Regional Pricing
                  </h2>
                  <p className="text-[11px] text-muted">
                    Configure independent market pricing. No automated currency conversion.
                  </p>
                </div>
              </div>

              {/* Global Market (EUR) */}
              <div className="p-3.5 rounded-xl border border-theme bg-surface-subtle/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-primary">Global Market (€ EUR)</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold">Default</span>
                </div>
                <FormField label="Global Price (€ EUR)" required error={errors.priceGlobal}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 520"
                    value={priceGlobal}
                    onChange={(e) => {
                      setPriceGlobal(e.target.value);
                      clearError('priceGlobal', 'price');
                    }}
                    className="font-mono text-xs"
                  />
                </FormField>
                <FormField label="Sale Price (€ EUR, Optional)" error={errors.salePriceGlobal}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 460"
                    value={salePriceGlobal}
                    onChange={(e) => {
                      setSalePriceGlobal(e.target.value);
                      clearError('salePriceGlobal', 'sale_price', 'salePrice');
                    }}
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              {/* Pakistan Market (PKR) */}
              <div className="p-3.5 rounded-xl border border-theme bg-surface-subtle/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-primary">Pakistan Market (Rs. PKR)</span>
                  <span className="text-[10px] font-mono text-muted">Independent PKR</span>
                </div>
                <FormField label="Pakistan Price (Rs. PKR)" error={errors.pricePK}>
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="e.g. 146025"
                    value={pricePK}
                    onChange={(e) => {
                      setPricePK(e.target.value);
                      clearError('pricePK');
                    }}
                    className="font-mono text-xs"
                  />
                </FormField>
                <FormField label="Sale Price (Rs. PKR, Optional)">
                  <Input
                    type="number"
                    min={0}
                    step="1"
                    placeholder="Optional sale price"
                    value={salePricePK}
                    onChange={(e) => setSalePricePK(e.target.value)}
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>

              {/* Italy Market (EUR) */}
              <div className="p-3.5 rounded-xl border border-theme bg-surface-subtle/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase text-primary">Italy Domestic (€ EUR)</span>
                  <span className="text-[10px] font-mono text-muted">Direct Italian Atelier</span>
                </div>
                <FormField label="Italy Price (€ EUR)" error={errors.priceIT}>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="e.g. 480"
                    value={priceIT}
                    onChange={(e) => {
                      setPriceIT(e.target.value);
                      clearError('priceIT');
                    }}
                    className="font-mono text-xs"
                  />
                </FormField>
                <FormField label="Sale Price (€ EUR, Optional)">
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    placeholder="Optional sale price"
                    value={salePriceIT}
                    onChange={(e) => setSalePriceIT(e.target.value)}
                    className="font-mono text-xs"
                  />
                </FormField>
              </div>
            </div>

            {/* Publishing Flags */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Star className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  Publishing & Merchandising
                </h2>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-primary block">Stock Availability (Master)</span>
                    <span className="text-[10px] text-muted">Independent master stock status for the entire product</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider ${isInStock ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {isInStock ? 'In Stock' : 'Out of Stock'}
                    </span>
                    <Switch checked={isInStock} onChange={setIsInStock} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme">
                  <div>
                    <span className="text-xs font-bold text-primary block">Published Live</span>
                    <span className="text-[10px] text-muted">Visible on public storefront</span>
                  </div>
                  <Switch checked={isPublished} onChange={setIsPublished} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme">
                  <div>
                    <span className="text-xs font-bold text-primary block">Featured Garment</span>
                    <span className="text-[10px] text-muted">Highlighted on boutique homepage</span>
                  </div>
                  <Switch checked={isFeatured} onChange={setIsFeatured} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme">
                  <div>
                    <span className="text-xs font-bold text-primary block">Bestseller Badge</span>
                    <span className="text-[10px] text-muted">Flagged as atelier staple</span>
                  </div>
                  <Switch checked={isBestseller} onChange={setIsBestseller} />
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-theme">
                  <div>
                    <span className="text-xs font-bold text-primary block">New Arrival</span>
                    <span className="text-[10px] text-muted">Flagged in seasonal launches</span>
                  </div>
                  <Switch checked={isNewArrival} onChange={setIsNewArrival} />
                </div>
              </div>
            </div>

            {/* Product Photography */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Layers className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  Product Photography
                </h2>
              </div>
              <div className="space-y-3">
                <span className="text-xs font-semibold text-secondary block">
                  Add Photography (Upload to Media Storage):
                </span>
                <ImageUploader
                  folder="products"
                  onChange={(newUrl) => {
                    if (newUrl) {
                      setImages((prev) => [
                        ...prev,
                        {
                          url: newUrl,
                          alt: name ? `${name} view` : 'Garment detail',
                          isPrimary: prev.length === 0,
                          isHover: prev.length === 1,
                          sortOrder: prev.length + 1,
                        },
                      ]);
                    }
                  }}
                />

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
            </div>

            {/* SEO Meta Information */}
            <div className="p-6 rounded-2xl bg-surface border border-theme shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-theme">
                <Globe className="w-4 h-4 text-amber-500" />
                <h2 className="text-sm font-bold font-serif-luxury text-primary uppercase tracking-wide">
                  Search Engine Optimization
                </h2>
              </div>

              <FormField label="Meta Title">
                <Input
                  placeholder="e.g. Milanese Double Rider | Leather Outerwear"
                  value={seoTitle}
                  onChange={(e) => setSeoTitle(e.target.value)}
                  className="text-xs"
                />
              </FormField>

              <FormField label="Meta Description">
                <Textarea
                  placeholder="Summary displayed on Google search results..."
                  value={seoDescription}
                  onChange={(e) => setSeoDescription(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </FormField>
            </div>
          </div>
        </div>
      </form>

      {/* Reusable Sizing Management Modal */}
      <ManageSizesModal
        isOpen={isSizeModalOpen}
        onClose={() => setIsSizeModalOpen(false)}
        onSizesUpdated={() => refetchSizes()}
      />

      {/* Reusable Colors Management Modal */}
      <ManageColorsModal
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
        onColorsUpdated={() => refetchColors()}
      />

      {/* Reusable Policies Management Modal */}
      <ManagePoliciesModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
        onPoliciesUpdated={() => refetchPolicies()}
      />
    </>
  );
};
