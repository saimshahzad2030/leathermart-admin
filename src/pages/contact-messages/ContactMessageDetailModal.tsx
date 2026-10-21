import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { StatusBadge } from '@/components/common/Badge';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { ContactMessage, ContactMessageStatus } from '@/types';
import { formatDate } from '@/lib/utils';
import {
  Mail,
  Phone,
  User,
  Calendar,
  Tag,
  Save,
  ExternalLink,
  MessageSquare,
  FileEdit,
} from 'lucide-react';

interface ContactMessageDetailModalProps {
  message: ContactMessage | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (id: string, updates: { status: ContactMessageStatus; adminNotes: string }) => Promise<void>;
  isUpdating: boolean;
}

export const ContactMessageDetailModal: React.FC<ContactMessageDetailModalProps> = ({
  message,
  isOpen,
  onClose,
  onUpdate,
  isUpdating,
}) => {
  const [status, setStatus] = useState<ContactMessageStatus>('new');
  const [adminNotes, setAdminNotes] = useState('');

  useEffect(() => {
    if (message) {
      setStatus(message.status);
      setAdminNotes(message.adminNotes || '');
    }
  }, [message]);

  if (!message) return null;

  const handleSave = async () => {
    await onUpdate(message.id, { status, adminNotes });
  };

  const mailtoUrl = `mailto:${encodeURIComponent(message.email)}?subject=${encodeURIComponent(
    `Re: ${message.subject} [Atelier Valenti Milano]`
  )}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Client Concierge Inquiry"
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Header Summary Card */}
        <div className="p-4 rounded-xl bg-surface-subtle border border-theme space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted block">
                Subject
              </span>
              <h3 className="text-base font-bold font-serif-luxury text-primary mt-0.5">
                {message.subject}
              </h3>
            </div>
            <StatusBadge status={message.status} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-theme text-xs">
            <div>
              <span className="text-muted block text-[10px] uppercase font-mono">Client</span>
              <div className="flex items-center gap-1.5 font-medium text-primary mt-0.5">
                <User className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="truncate">{message.name}</span>
              </div>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-mono">Email</span>
              <div className="flex items-center gap-1.5 font-medium text-primary mt-0.5">
                <Mail className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <a
                  href={`mailto:${message.email}`}
                  className="truncate text-amber-500 hover:underline"
                >
                  {message.email}
                </a>
              </div>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-mono">Phone</span>
              <div className="flex items-center gap-1.5 font-medium text-primary mt-0.5">
                <Phone className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{message.phone || 'Not provided'}</span>
              </div>
            </div>

            <div>
              <span className="text-muted block text-[10px] uppercase font-mono">Submitted</span>
              <div className="flex items-center gap-1.5 font-medium text-primary mt-0.5">
                <Calendar className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span>{formatDate(message.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Message Body */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-primary uppercase font-mono tracking-wider">
            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
            Inquiry Message
          </div>
          <div className="p-4 rounded-xl bg-surface border border-theme text-xs sm:text-sm text-secondary whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
            {message.message}
          </div>
        </div>

        {/* Status & Internal Admin Notes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-theme">
          <div className="md:col-span-1 space-y-2">
            <label className="text-xs font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              Inquiry Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as ContactMessageStatus)}
              wrapperClassName="w-full"
            >
              <option value="new">New (Unread)</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="spam">Spam / Junk</option>
            </Select>
            <p className="text-[10px] text-muted leading-tight">
              Keep client inquiries organized by lifecycle stage.
            </p>
          </div>

          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-primary uppercase font-mono tracking-wider flex items-center gap-1.5">
              <FileEdit className="w-3.5 h-3.5 text-amber-500" />
              Internal Atelier Notes
            </label>
            <Textarea
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="e.g. Spoke with client via telephone; preparing custom sizing quote..."
              rows={3}
              className="w-full text-xs"
            />
          </div>
        </div>

        {/* Modal Actions Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-theme">
          <a
            href={mailtoUrl}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-theme text-primary hover:bg-surface-hover transition-colors"
          >
            <Mail className="w-3.5 h-3.5 text-amber-500" />
            Reply via Email
            <ExternalLink className="w-3 h-3 text-muted" />
          </a>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              isLoading={isUpdating}
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
