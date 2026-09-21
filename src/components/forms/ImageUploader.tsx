import React, { useState, useRef } from 'react';
import { UploadCloud, Image as ImageIcon, X, Loader2, Link2 } from 'lucide-react';
import { mediaApi } from '@/lib/api/media';
import { useToast } from '@/context/ToastContext';
import { Button } from '@/components/common/Button';
import { Input } from './Input';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  folder?: 'products' | 'editorial' | 'lookbook' | 'general';
  label?: string;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({
  value = '',
  onChange,
  folder = 'products',
  label = 'Asset Image',
}) => {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUrlMode, setIsUrlMode] = useState(false);
  const [urlInput, setUrlInput] = useState(value);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size exceeds the 10MB limit.');
      return;
    }

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'video/mp4', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file format. Please upload JPG, PNG, WEBP, or AVIF.');
      return;
    }

    try {
      setIsUploading(true);
      const asset = await mediaApi.upload(file, folder);
      onChange(asset.url);
      setUrlInput(asset.url);
      toast.success('Asset uploaded successfully to atelier storage.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to upload image asset.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleApplyUrl = () => {
    if (urlInput.trim()) {
      onChange(urlInput.trim());
      setIsUrlMode(false);
    }
  };

  const handleClear = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {value ? (
        <div className="relative group rounded-xl overflow-hidden border border-theme bg-surface-subtle h-48 flex items-center justify-center">
          <img
            src={value}
            alt={label}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=500&auto=format';
            }}
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
        <div className="flex gap-2">
          <Input
            placeholder="Paste public image URL (e.g. https://...)"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
          />
          <Button variant="primary" size="sm" onClick={handleApplyUrl}>
            Apply
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsUrlMode(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <div
          onClick={() => !isUploading && fileInputRef.current?.click()}
          className="border-2 border-dashed border-theme rounded-2xl p-6 text-center hover:border-amber-500/50 hover:bg-surface-hover transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 group"
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="text-xs text-secondary font-medium">Uploading asset to storage...</span>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="text-sm font-medium text-primary">
                Click to upload or drag & drop
              </div>
              <p className="text-xs text-muted">
                JPG, PNG, WEBP, AVIF up to 10MB
              </p>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsUrlMode(true);
                }}
                className="mt-1 text-xs text-amber-500 hover:text-amber-400 font-medium inline-flex items-center gap-1 hover:underline"
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
        accept="image/jpeg,image/png,image/webp,image/avif,video/mp4,video/webm"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  );
};
