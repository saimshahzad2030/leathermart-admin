import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api/cms';
import { SocialLook } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { GridCardSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { ImageUploader } from '@/components/forms/ImageUploader';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit2, Trash2, Camera, ExternalLink } from 'lucide-react';

export const SocialLooksList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: looks, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-social-looks'],
    queryFn: () => cmsApi.listSocialLooks(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SocialLook | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SocialLook | null>(null);

  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [tag, setTag] = useState('@ATELIERVALENTI');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const resetForm = () => {
    setEditingItem(null);
    setImageUrl('');
    setCaption('');
    setTag('@ATELIERVALENTI');
    setInstagramUrl('');
    setIsPublished(true);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: SocialLook) => {
    setEditingItem(item);
    setImageUrl(item.imageUrl);
    setCaption(item.caption);
    setTag(item.tag || '@ATELIERVALENTI');
    setInstagramUrl(item.instagramUrl || '');
    setIsPublished(item.isPublished);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<SocialLook> = {
        imageUrl: imageUrl.trim(),
        caption: caption.trim(),
        tag: tag.trim(),
        instagramUrl: instagramUrl.trim() || null,
        isPublished,
      };

      return editingItem
        ? cmsApi.updateSocialLook(editingItem.id, payload)
        : cmsApi.createSocialLook(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-looks'] });
      toast.success(`Social look ${editingItem ? 'updated' : 'added'} successfully.`);
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save social look.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cmsApi.deleteSocialLook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-social-looks'] });
      toast.success('Social look deleted.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete social look.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Social Looks & Instagram Grid
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Curate the editorial street-style visual feed and customer garment tags
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh social looks"
          />
          <Button variant="primary" size="md" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Add Social Look
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <GridCardSkeleton key={i} />
          ))}
        </div>
      ) : looks?.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-theme p-6">
          <Camera className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-primary font-serif-luxury">No social looks published</h3>
          <p className="text-xs text-muted mt-1">Upload editorial photography for the community lookbook.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {looks?.map((look) => (
          <div
            key={look.id}
            className="rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col justify-between group"
          >
            <div className="h-56 relative bg-surface-subtle overflow-hidden">
              <img
                src={look.imageUrl}
                alt={look.caption}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-2 right-2">
                <StatusBadge status={look.isPublished ? 'published' : 'draft'} />
              </div>
            </div>

            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-amber-500">{look.tag}</span>
                {look.instagramUrl && (
                  <a
                    href={look.instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-muted hover:text-primary"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
              <p className="text-xs text-secondary line-clamp-2 leading-relaxed">
                {look.caption}
              </p>
            </div>

            <div className="p-3 border-t border-theme flex justify-end gap-1 bg-surface-subtle/30">
              <Button variant="ghost" size="sm" onClick={() => openEdit(look)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={() => setDeleteTarget(look)}
                className="p-1.5 text-muted hover:text-rose-500 rounded"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingItem ? 'Edit Social Look' : 'New Social Look'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField label="Look Photography" required>
            <ImageUploader
              folder="editorial"
              value={imageUrl}
              onChange={setImageUrl}
            />
          </FormField>

          <FormField label="Caption / Context" required>
            <Input
              placeholder="e.g. Spotted in Milan Fashion Week wearing custom Biker"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Handle Tag">
              <Input
                placeholder="@ATELIERVALENTI"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
              />
            </FormField>

            <FormField label="Instagram Link (Optional)">
              <Input
                placeholder="https://instagram.com/p/..."
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
              />
            </FormField>
          </div>

          <Switch
            label="Visible in Editorial Grid"
            checked={isPublished}
            onChange={setIsPublished}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
              Save Look
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Social Look"
        message="Permanently remove this photo from the editorial gallery?"
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
