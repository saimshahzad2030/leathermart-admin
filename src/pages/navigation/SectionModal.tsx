import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/forms/Input';
import { Textarea } from '@/components/forms/Textarea';
import { FormField } from '@/components/forms/FormField';
import { Switch } from '@/components/forms/Switch';
import { FolderTree, Hash, Eye, EyeOff, FileCheck } from 'lucide-react';

export interface SectionFormData {
  name: string;
  key: string;
  description?: string;
  isActive?: boolean;
  isDraft?: boolean;
}

interface SectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (section: SectionFormData) => void;
  initialSection?: SectionFormData | null;
  existingKeys: string[];
  departmentId: string;
}

export const SectionModal: React.FC<SectionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialSection,
  existingKeys,
  departmentId,
}) => {
  const isEditing = Boolean(initialSection);

  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      if (initialSection) {
        setName(initialSection.name || '');
        setKey(initialSection.key || '');
        setDescription(initialSection.description || '');
        setIsActive(initialSection.isActive !== undefined ? initialSection.isActive : true);
        setIsDraft(initialSection.isDraft !== undefined ? initialSection.isDraft : false);
      } else {
        setName('');
        setKey('');
        setDescription('');
        setIsActive(true);
        setIsDraft(false);
      }
      setErrors({});
    }
  }, [isOpen, initialSection]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!isEditing && !key) {
      const generatedKey = val
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '')
        .replace(/^-+|-+$/g, '');
      setKey(generatedKey);
    }
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    const trimmedName = name.trim();
    const trimmedKey = key.trim();

    if (!trimmedName) {
      errs.name = 'Section name is required.';
    }

    if (!trimmedKey) {
      errs.key = 'Section slug / key is required.';
    } else if (
      existingKeys.some(
        (existing) =>
          existing.toLowerCase() === trimmedKey.toLowerCase() &&
          (!isEditing || initialSection?.key.toLowerCase() !== trimmedKey.toLowerCase())
      )
    ) {
      errs.key = 'A section with this key already exists.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      key: key.trim(),
      description: description.trim() || undefined,
      isActive,
      isDraft,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Navigation Section' : 'Add Navigation Section'}
      subtitle={
        isEditing
          ? `Modify settings for "${initialSection?.name}" in ${departmentId.toUpperCase()} menu.`
          : `Create a new column or grouped category section in ${departmentId.toUpperCase()} menu.`
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          label="Section Name / Title"
          required
          error={errors.name}
          description="Display title shown in navigation hierarchy (e.g. Leather Accessories, Capsule Collections)."
        >
          <div className="relative">
            <FolderTree className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <Input
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="e.g. Leather Accessories"
              className="pl-9"
              autoFocus
            />
          </div>
        </FormField>

        <FormField
          label="Section Slug / Key"
          required
          error={errors.key}
          description="Unique machine identifier for section grouping."
        >
          <div className="relative">
            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none" />
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
              placeholder="e.g. accessories"
              disabled={isEditing}
              className="pl-9 font-mono text-xs disabled:opacity-60"
            />
          </div>
        </FormField>

        <FormField
          label="Section Description"
          description="Guidance text for editors describing what items belong in this section."
        >
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description of this section's purpose..."
            rows={2}
          />
        </FormField>

        {/* Section Visibility & Publishing Controls */}
        <div className="pt-2 border-t border-theme space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/50 border border-theme">
            <div className="flex items-center gap-2.5">
              {isActive ? (
                <Eye className="w-4 h-4 text-emerald-400" />
              ) : (
                <EyeOff className="w-4 h-4 text-muted" />
              )}
              <div>
                <div className="text-xs font-semibold text-primary">Active on Storefront</div>
                <div className="text-[11px] text-muted">When enabled, section appears in storefront navigation.</div>
              </div>
            </div>
            <Switch checked={isActive} onChange={setIsActive} />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-surface-subtle/50 border border-theme">
            <div className="flex items-center gap-2.5">
              <FileCheck className="w-4 h-4 text-amber-400" />
              <div>
                <div className="text-xs font-semibold text-primary">Draft Mode</div>
                <div className="text-[11px] text-muted">Keep changes hidden until publishing live.</div>
              </div>
            </div>
            <Switch checked={isDraft} onChange={setIsDraft} />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-theme mt-6">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm">
            {isEditing ? 'Save Section' : 'Create Section'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
