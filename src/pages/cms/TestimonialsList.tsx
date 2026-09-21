import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsApi } from '@/lib/api/cms';
import { Testimonial } from '@/types';
import { Button } from '@/components/common/Button';
import { RefreshButton } from '@/components/common/RefreshButton';
import { GridCardSkeleton } from '@/components/common/Skeleton';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { Modal } from '@/components/common/Modal';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { StatusBadge } from '@/components/common/Badge';
import { useToast } from '@/context/ToastContext';
import { Plus, Edit2, Trash2, Star, MessageSquareQuote } from 'lucide-react';

export const TestimonialsList: React.FC = () => {
  const toast = useToast();
  const queryClient = useQueryClient();

  const { data: testimonials, isLoading, isFetching, refetch } = useQuery({
    queryKey: ['admin-testimonials'],
    queryFn: () => cmsApi.listTestimonials(),
  });

  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Testimonial | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Testimonial | null>(null);

  const [author, setAuthor] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [verifiedGarment, setVerifiedGarment] = useState('');
  const [quote, setQuote] = useState('');
  const [rating, setRating] = useState(5);
  const [isPublished, setIsPublished] = useState(true);

  const resetForm = () => {
    setEditingItem(null);
    setAuthor('');
    setCity('');
    setCountry('');
    setVerifiedGarment('');
    setQuote('');
    setRating(5);
    setIsPublished(true);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (t: Testimonial) => {
    setEditingItem(t);
    setAuthor(t.author);
    setCity(t.city);
    setCountry(t.country);
    setVerifiedGarment(t.verifiedGarment);
    setQuote(t.quote);
    setRating(t.rating);
    setIsPublished(t.isPublished);
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Partial<Testimonial> = {
        author: author.trim(),
        city: city.trim(),
        country: country.trim(),
        verifiedGarment: verifiedGarment.trim(),
        quote: quote.trim(),
        rating: Number(rating) || 5,
        isPublished,
      };

      return editingItem
        ? cmsApi.updateTestimonial(editingItem.id, payload)
        : cmsApi.createTestimonial(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success(`Testimonial ${editingItem ? 'updated' : 'added'} successfully.`);
      setModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to save testimonial.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => cmsApi.deleteTestimonial(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-testimonials'] });
      toast.success('Testimonial deleted.');
      setDeleteTarget(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to delete testimonial.');
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-serif-luxury text-primary">
            Client Testimonials
          </h1>
          <p className="text-xs text-muted mt-0.5">
            Curate verified customer quotes, city locations, and star reviews
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <RefreshButton
            onRefresh={() => refetch()}
            isRefreshing={isFetching}
            title="Refresh testimonials"
          />
          <Button variant="primary" size="md" onClick={openCreate} leftIcon={<Plus className="w-4 h-4" />}>
            Add Testimonial
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <GridCardSkeleton key={i} hasImage={false} />
          ))}
        </div>
      ) : testimonials?.length === 0 ? (
        <div className="py-16 text-center rounded-2xl bg-surface border border-theme p-6">
          <MessageSquareQuote className="w-12 h-12 text-muted mx-auto mb-3" />
          <h3 className="text-base font-semibold text-primary font-serif-luxury">No testimonials yet</h3>
          <p className="text-xs text-muted mt-1">Add client feedback and editorial quotes above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials?.map((t) => (
          <div
            key={t.id}
            className="p-5 rounded-2xl bg-surface border border-theme shadow-xs flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3.5 h-3.5 ${
                        i < t.rating ? 'fill-amber-500 text-amber-500' : 'fill-zinc-700 text-zinc-700'
                      }`}
                    />
                  ))}
                </div>
                <StatusBadge status={t.isPublished ? 'published' : 'draft'} />
              </div>

              <p className="text-xs text-secondary leading-relaxed italic">
                "{t.quote}"
              </p>

              <div className="pt-2 border-t border-theme">
                <div className="text-xs font-semibold text-primary">{t.author}</div>
                <div className="text-[11px] text-muted">{t.city}, {t.country}</div>
                <div className="text-[10px] text-amber-500 font-mono mt-0.5">
                  Verified: {t.verifiedGarment}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-1">
              <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                <Edit2 className="w-3.5 h-3.5" />
              </Button>
              <button
                onClick={() => setDeleteTarget(t)}
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
        title={editingItem ? 'Edit Testimonial' : 'New Client Testimonial'}
        maxWidth="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            saveMutation.mutate();
          }}
          className="space-y-4"
        >
          <FormField label="Client Author" required>
            <Input
              placeholder="e.g. Julian De Vries"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="City" required>
              <Input
                placeholder="e.g. Amsterdam"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                required
              />
            </FormField>
            <FormField label="Country" required>
              <Input
                placeholder="e.g. Netherlands"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
              />
            </FormField>
          </div>

          <FormField label="Verified Garment Name" required>
            <Input
              placeholder="e.g. Montreal Leather Bomber"
              value={verifiedGarment}
              onChange={(e) => setVerifiedGarment(e.target.value)}
              required
            />
          </FormField>

          <FormField label="Star Rating (1 - 5)" required>
            <Input
              type="number"
              min={1}
              max={5}
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
              required
            />
          </FormField>

          <FormField label="Quote Narrative" required>
            <Textarea
              rows={3}
              placeholder="Quote text..."
              value={quote}
              onChange={(e) => setQuote(e.target.value)}
              required
            />
          </FormField>

          <Switch
            label="Published in Storefront"
            checked={isPublished}
            onChange={setIsPublished}
          />

          <div className="flex justify-end gap-2.5 pt-4 border-t border-theme">
            <Button variant="outline" size="sm" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" isLoading={saveMutation.isPending}>
              Save Testimonial
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        title="Delete Testimonial"
        message={`Permanently remove testimonial from "${deleteTarget?.author}"?`}
        confirmText="Delete"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
