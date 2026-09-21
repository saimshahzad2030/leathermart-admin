// Standard API Envelopes
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: Pagination;
  errorCode?: string;
  statusCode?: number;
  errors?: Record<string, string[]>;
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage?: boolean;
  hasPrevPage?: boolean;
}

// Roles
export type AdminRole = 'super_admin' | 'store_manager' | 'content_editor' | 'concierge';

export interface AdminUser {
  id: string;
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: AdminRole;
  permissions: string[];
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthSession {
  admin: AdminUser;
  accessToken: string;
  refreshToken?: string;
}

// Product Catalogue Models
export interface ProductImage {
  id?: string;
  url: string;
  alt?: string;
  isPrimary?: boolean;
  isHover?: boolean;
  type?: string;
  sortOrder?: number;
}

export interface ProductVariant {
  id?: string;
  sku: string;
  size: string;
  color: string;
  colorHex?: string;
  stock: number;
  priceOverride?: number | null;
}

export interface ProductReview {
  id: string;
  _id?: string;
  productId?: string;
  product?: {
    id: string;
    name: string;
    slug: string;
  };
  author: string;
  location?: string;
  rating: number;
  title: string;
  comment: string;
  verified: boolean;
  isApproved: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  _id?: string;
  sku: string;
  slug: string;
  name: string;
  tagline?: string;
  category: string;
  categoryLabel?: string;
  collectionId?: string | null;
  gender: 'men' | 'women' | 'unisex';
  styles: string[];
  price: number;
  salePrice?: number | null;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isPublished: boolean;
  sortOrder?: number;
  leatherType: string;
  hardware?: string;
  lining?: string;
  description: string;
  editorialQuote?: string;
  specifications: string[];
  careInstructions: string[];
  modelInfo?: string;
  images: ProductImage[];
  variants: ProductVariant[];
  availableColors?: { name: string; hex: string }[];
  availableSizes?: string[];
  rating?: number;
  reviewCount?: number;
  reviews?: ProductReview[];
  seoTitle?: string;
  seoDescription?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Categories & Collections
export interface Category {
  id: string;
  slug: string;
  name: string;
  subtitle?: string;
  description?: string;
  heroImage?: string;
  itemCount?: number;
  featuredOrder?: number;
  highlightSpecs: string[];
  seoTitle?: string;
  seoDescription?: string;
  isPublished?: boolean;
  createdAt?: string;
}

export interface Collection {
  id: string;
  _id?: string;
  slug: string;
  title: string;
  season: string;
  subtitle?: string;
  description?: string;
  heroImage?: string;
  badge?: string;
  isActive: boolean;
  createdAt?: string;
}

// CMS & Content
export interface CmsSection {
  id: string;
  _id?: string;
  sectionKey: string;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  body?: any;
  primaryCta?: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  mediaUrl?: string;
  secondaryMediaUrl?: string;
  extraPayload?: Record<string, any>;
  isVisible: boolean;
  sortOrder: number;
}

export interface Testimonial {
  id: string;
  _id?: string;
  quote: string;
  author: string;
  city: string;
  country: string;
  verifiedGarment: string;
  rating: number;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
}

export interface SocialLook {
  id: string;
  _id?: string;
  imageUrl: string;
  caption: string;
  tag: string;
  instagramUrl?: string | null;
  sortOrder: number;
  isPublished: boolean;
  createdAt?: string;
}

export interface NewsletterSubscriber {
  id: string;
  _id?: string;
  email: string;
  locale: string;
  isActive: boolean;
  subscribedAt: string;
}

// Bespoke Commissions & Studio
export type CommissionStatus = 'pending' | 'contacted' | 'in_tailoring' | 'completed' | 'cancelled';

export interface CustomCommission {
  id: string;
  _id?: string;
  dossierNumber: string;
  silhouetteId: string;
  silhouetteName: string;
  leatherId: string;
  leatherName: string;
  colorId: string;
  colorName: string;
  liningId: string;
  liningName: string;
  hardwareId: string;
  hardwareName: string;
  monogramText?: string;
  monogramPlacement?: string;
  measurements: {
    unit: 'cm' | 'in';
    chest: number;
    waist: number;
    shoulders: number;
    sleeve: number;
    backLength: number;
  };
  customer: {
    name: string;
    email: string;
    phone?: string;
  };
  status: CommissionStatus;
  estimatedPrice: number;
  currency: string;
  estimatedDelivery: string;
  notes?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CustomSilhouette {
  id: string;
  slug: string;
  name: string;
  description: string;
  basePrice: number;
  imageUrl?: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomLeather {
  id: string;
  slug: string;
  name: string;
  weight: string;
  origin: string;
  description: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomColor {
  id: string;
  slug: string;
  name: string;
  hex: string;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomLining {
  id: string;
  slug: string;
  name: string;
  description: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
}

export interface CustomHardware {
  id: string;
  slug: string;
  name: string;
  finish: string;
  extraPrice: number;
  sortOrder: number;
  isActive: boolean;
}

// Media Assets
export interface MediaAsset {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  path?: string;
  folder: string;
  altText?: string;
  createdAt: string;
}

// Global Site Settings
export interface SiteSetting {
  id: string;
  _id?: string;
  announcement: {
    enabled: boolean;
    badge: string;
    message: string;
    linkText: string;
    linkHref: string;
    countryNotice: string;
  };
  shipping: {
    freeShippingThreshold: number;
    standardShippingCost: number;
    countries: Array<{
      code: string;
      name: string;
      rate: number;
      days: string;
    }>;
  };
  footer: {
    certificationLine: string;
    atelierAddress: string;
    instagramHandle: string;
    copyrightText: string;
    cities: string[];
    columns: Array<{
      title: string;
      links: Array<{ label: string; href: string }>;
    }>;
  };
  searchKeywords: string[];
}

export interface MegaMenuPayload {
  categories: Array<{ name: string; href: string; tag?: string }>;
  featuredCard?: {
    title: string;
    image: string;
    href: string;
  };
}

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  uptime: number;
  database: 'connected' | 'disconnected';
  orm: string;
  databaseType: string;
  environment: string;
}
