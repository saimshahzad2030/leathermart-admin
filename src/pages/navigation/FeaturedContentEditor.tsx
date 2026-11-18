import React, { useState, useRef } from 'react';
import { NavigationFeatured } from '@/types';
import { mediaApi } from '@/lib/api/media';
import { parseApiError } from '@/lib/apiErrors';
import { FormField } from '@/components/forms/FormField';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { Switch } from '@/components/forms/Switch';
import { Button } from '@/components/common/Button';
import {
  Sparkles,
  Globe,
  Tag,
  Image as ImageIcon,
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Upload,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

interface FeaturedContentEditorProps {
  featured: NavigationFeatured;
  onChange: (updated: NavigationFeatured) => void;
  canEdit: boolean;
  departmentId: string;
}

export const FeaturedContentEditor: React.FC<FeaturedContentEditorProps> = ({
  featured,
  onChange,
  canEdit,
  departmentId,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (field: keyof NavigationFeatured, value: any) => {
    if (field === 'imageUrl') {
      setImageError(false);
      setUploadError(null);
      setUploadSuccess(false);
    }
    onChange({
      ...featured,
      [field]: value,
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error & success state
    setUploadError(null);
    setUploadSuccess(false);
    setIsUploading(true);

    try {
      const altText = featured.title || `${departmentId} navigation featured banner`;
      const uploaded = await mediaApi.upload(file, 'navigation', altText);

      if (uploaded && uploaded.url) {
        handleChange('imageUrl', uploaded.url);
        setUploadSuccess(true);
        setTimeout(() => setUploadSuccess(false), 4000);
      } else {
        throw new Error('Upload succeeded but no image URL was returned.');
      }
    } catch (err: any) {
      const parsed = parseApiError(err, 'Failed to upload promotional image.');
      setUploadError(parsed.message);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = () => {
    handleChange('imageUrl', '');
    setImageError(false);
    setUploadError(null);
    setUploadSuccess(false);
  };

  const defaultImg =
    'https://images.unsplash.com/photo-1520975954732-35dd22299614?q=80&w=1200&auto=format&fit=crop';

  const isActive = featured.isActive !== false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-5 rounded-2xl bg-surface border border-theme shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-primary font-serif-luxury tracking-wide">
                Promotional Editorial Banner
              </h3>
              <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
                Storefront Spotlight
              </span>
            </div>
            <p className="text-xs text-muted mt-1 leading-relaxed">
              Configure the curated promotional spotlight card shown in the right column of the{' '}
              {departmentId.toUpperCase()} mega-menu on desktop.
            </p>
          </div>

          <div className="flex items-center gap-3 px-3 py-1.5 rounded-xl bg-surface-subtle border border-theme shrink-0">
            <span className="text-xs font-medium text-secondary">Display Status:</span>
            <div className="flex items-center gap-2">
              {isActive ? (
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-muted" />
              )}
              <Switch
                checked={isActive}
                onChange={(val) => handleChange('isActive', val)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form Controls */}
        <div className="lg:col-span-7 space-y-4 p-6 rounded-2xl bg-surface border border-theme shadow-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FormField
              label="Card Kicker / Tag"
              required
              description="Top kicker tag (e.g. Atelier Curated)."
            >
              <div className="relative">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  value={featured.tag || ''}
                  onChange={(e) => handleChange('tag', e.target.value)}
                  placeholder="e.g. Atelier Curated"
                  disabled={!canEdit}
                  className="pl-9"
                />
              </div>
            </FormField>

            <FormField
              label="Promotional Badge"
              description="High-contrast pill (e.g. Exclusive)."
            >
              <Input
                value={featured.badge || ''}
                onChange={(e) => handleChange('badge', e.target.value)}
                placeholder="e.g. Limited Edition"
                disabled={!canEdit}
              />
            </FormField>

            <FormField
              label="Headline Title"
              required
              description="Luxury serif headline."
            >
              <Input
                value={featured.title || ''}
                onChange={(e) => handleChange('title', e.target.value)}
                placeholder="e.g. THE MILANESE CUT"
                disabled={!canEdit}
                className="font-serif-luxury tracking-wider font-semibold"
              />
            </FormField>
          </div>

          <FormField
            label="Editorial Description"
            required
            description="Brief artisan storytelling summary."
          >
            <Textarea
              value={featured.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="e.g. Handcrafted calfskin and lambskin silhouettes engineered for effortless elegance."
              disabled={!canEdit}
              rows={3}
              className="resize-none"
            />
          </FormField>

          {/* Media Upload and Image URL */}
          <div className="space-y-3 p-4 rounded-xl bg-surface-subtle/60 border border-theme">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-primary">
                Featured Banner Image
              </label>
              {featured.imageUrl && (
                <span className="text-[10px] font-mono text-emerald-500 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Image linked
                </span>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  value={featured.imageUrl || ''}
                  onChange={(e) => handleChange('imageUrl', e.target.value)}
                  placeholder="https://images.unsplash.com/... or upload below"
                  disabled={!canEdit || isUploading}
                  className="pl-9 font-mono text-xs"
                />
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                disabled={!canEdit || isUploading}
              />

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!canEdit || isUploading}
                  isLoading={isUploading}
                  leftIcon={isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  className="shrink-0"
                >
                  {featured.imageUrl ? 'Replace' : 'Upload'}
                </Button>

                {featured.imageUrl && canEdit && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveImage}
                    disabled={isUploading}
                    leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                    className="text-rose-500 hover:bg-rose-500/10 shrink-0"
                    title="Remove Image"
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Upload Feedback */}
            {uploadError && (
              <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-500 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {uploadSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Banner image uploaded to media storage successfully.</span>
              </div>
            )}

            <p className="text-[11px] text-muted leading-relaxed">
              Upload a high-resolution JPEG, PNG, or WebP photo (stored under <code>navigation</code> in Supabase/storage), or paste an external image URL.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Call to Action (CTA) Text"
              required
              description="Button display label."
            >
              <Input
                value={featured.fallbackCta || ''}
                onChange={(e) => handleChange('fallbackCta', e.target.value)}
                placeholder="e.g. SHOP MEN"
                disabled={!canEdit}
                className="font-semibold tracking-wider text-xs uppercase"
              />
            </FormField>

            <FormField
              label="CTA Translation Key"
              required
              description="i18n translation key for the button."
            >
              <div className="relative">
                <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
                <Input
                  value={featured.ctaTextKey || ''}
                  onChange={(e) => handleChange('ctaTextKey', e.target.value)}
                  placeholder="e.g. nav.shopMen"
                  disabled={!canEdit}
                  className="pl-9 font-mono text-xs"
                />
              </div>
            </FormField>
          </div>

          <FormField
            label="Destination URL (Href / ctaUrl)"
            required
            description="Storefront route reached when the card is clicked."
          >
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
              <Input
                value={featured.href || ''}
                onChange={(e) => handleChange('href', e.target.value)}
                placeholder="e.g. /men"
                disabled={!canEdit}
                className="pl-9 font-mono text-xs"
              />
            </div>
          </FormField>
        </div>

        {/* Live Mega-Menu Storefront Preview Card */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-muted font-mono uppercase tracking-wider px-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Storefront Live Preview
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-surface border border-theme">
              {isActive ? 'Active on Storefront' : 'Hidden'}
            </span>
          </div>

          <div
            className={`group relative rounded-2xl overflow-hidden border border-zinc-700/60 shadow-xl bg-zinc-950 min-h-[380px] flex flex-col justify-end p-6 text-white transition-opacity ${
              isActive ? 'opacity-100' : 'opacity-60'
            }`}
          >
            {/* Background Image with Gradient Overlay */}
            <img
              src={!imageError && featured.imageUrl ? featured.imageUrl : defaultImg}
              alt={featured.title || 'Featured'}
              onError={() => setImageError(true)}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
            <div className="absolute inset-0 bg-black/25" />

            {/* Content Overlay */}
            <div className="relative z-10 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {featured.tag && (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-widest uppercase bg-amber-500/90 text-zinc-950 backdrop-blur-md shadow-xs">
                    <span>{featured.tag}</span>
                  </div>
                )}
                {featured.badge && (
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase bg-white/20 text-white backdrop-blur-md border border-white/20">
                    <span>{featured.badge}</span>
                  </div>
                )}
              </div>

              <h4 className="text-xl font-bold font-serif-luxury tracking-wide text-white drop-shadow-sm">
                {featured.title || 'UNNAMED FEATURED'}
              </h4>

              <p className="text-xs text-zinc-300 line-clamp-3 leading-relaxed drop-shadow-xs">
                {featured.description || 'No description provided.'}
              </p>

              <div className="pt-2">
                <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400 group-hover:text-amber-300 transition-colors">
                  <span>{featured.fallbackCta || 'EXPLORE NOW'}</span>
                  <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Clickable Destination hint */}
            <div className="absolute top-4 right-4 z-10 px-2 py-1 rounded-lg bg-black/50 backdrop-blur-sm text-[10px] font-mono text-zinc-400 border border-white/10 flex items-center gap-1">
              <span>{featured.href || `/${departmentId}`}</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
