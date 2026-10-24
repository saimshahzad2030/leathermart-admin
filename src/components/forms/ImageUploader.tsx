import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2, AlertCircle } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { Input } from './Input';
import { cn } from '@/lib/utils';

export interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string) => void;
  folder?: string;
  label?: string;
  fit?: 'cover' | 'contain';
  previewBg?: 'default' | 'dark' | 'light' | 'checker';
  helperText?: string;
  maxSizeMB?: number;
  heightClass?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = '',
  onChange,
  folder = 'general',
  label = 'Asset Image',
  fit = 'cover',
  previewBg = 'default',
  helperText,
  maxSizeMB = 10,
  heightClass = 'h-48',
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const [imageError, setImageError] = useState(false);

  const displayValue = value || '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size exceeds the ${maxSizeMB}MB limit.`);
      return;
    }

    // Validate type
    const validTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/avif',
      'image/svg+xml',
      'image/x-icon',
      'image/vnd.microsoft.icon',
      'image/gif',
      'video/mp4',
      'video/webm',
    ];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload JPG, PNG, WEBP, AVIF, SVG, or ICO.');
      return;
    }

    try {
      setIsUploading(true);
      const asset = await mediaApi.upload(file, folder, label);
      onChange(asset.url);
      setUrlInput(asset.url);
      setImageError(false);
      toast.success('Asset uploaded successfully to storage.');
    } catch (err: any) {
      const errMsg = err.response?.data?.message || err.message || 'Failed to upload asset.';
      toast.error(errMsg);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) {
      handleClear();
      setIsUrlMode(false);
      return;
    }

    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
      toast.error('URL must begin with http://, https://, or /');
      return;
    }

    onChange(trimmed);
    setImageError(false);
    setIsUrlMode(false);
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
    setImageError(false);
  };

  const getBgClass = () => {
    switch (previewBg) {
      case 'dark':
        return 'bg-zinc-950 border-zinc-800';
      case 'light':
        return 'bg-zinc-100 border-zinc-300';
      case 'checker':
        return 'bg-[repeating-conic-gradient(#71717a20_0%_25%,transparent_0%_50%)] bg-[length:16px_16px] bg-zinc-900/40 border-theme';
      default:
        return 'bg-surface-subtle border-theme';
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {displayValue ? (
        <div
          className={cn(
            'relative group rounded-xl overflow-hidden border flex items-center justify-center transition-all',
            heightClass,
            getBgClass()
          )}
        >
          {imageError ? (
            <div className="flex flex-col items-center justify-center p-4 text-center gap-1.5 text-muted">
              <AlertCircle className="w-6 h-6 text-amber-500/70" />
              <span className="text-xs font-mono break-all max-w-xs">{displayValue}</span>
              <span className="text-[11px] text-muted">Image cannot be previewed</span>
            </div>
          ) : (
            <img
              src={displayValue}
              alt={label}
              className={cn(
                'transition-all duration-300',
                fit === 'contain'
                  ? 'max-w-full max-h-full object-contain p-3'
                  : 'w-full h-full object-cover group-hover:scale-105'
              )}
              onError={() => setImageError(true)}
            />
          )}

          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
            <Button variant="danger" size="sm" onClick={handleClear} leftIcon={<X className="w-4 h-4" />}>
              Remove
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<UploadCloud className="w-4 h-4" />}
            >
              Replace
            </Button>
          </div>
        </div>
      ) : isUrlMode ? (
        <div className="flex flex-col gap-2 p-3 rounded-xl border border-theme bg-surface-subtle">
          <Input
            placeholder="Paste public image URL (e.g. https://... or /assets/...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyUrl())}
            autoFocus
          />
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setIsUrlMode(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleApplyUrl}>
              Apply URL
            </Button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed border-theme rounded-2xl text-center hover:border-amber-500/50 hover:bg-surface-hover transition-all cursor-pointer flex flex-col items-center justify-center gap-2 group p-4',
            heightClass
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-3">
              <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
              <span className="text-xs text-secondary font-medium">Uploading asset...</span>
            </div>
          ) : (
            <>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div className="text-xs font-semibold text-primary">
                Click to upload or drag & drop
              </div>
              <p className="text-[11px] text-muted">
                {helperText || `JPG, PNG, WEBP, SVG, ICO up to ${maxSizeMB}MB`}
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setUrlInput(displayValue);
                  setIsUrlMode(true);
                }}
                className="mt-0.5 text-xs text-amber-500 hover:text-amber-400 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5" />
                Or link external image URL
              </button>
            </>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico,.svg,image/gif,video/mp4,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
