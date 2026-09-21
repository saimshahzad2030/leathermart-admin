import React, { useState } from 'react';
import { CustomCommission, CommissionStatus } from '@/types';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';
import { Select } from '@/components/forms/Select';
import { Textarea } from '@/components/forms/Textarea';
import { StatusBadge } from '@/components/common/Badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  User,
  Mail,
  Phone,
  Ruler,
  Scissors,
  Tag,
  Clock,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

interface CommissionDetailModalProps {
  commission: CustomCommission | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, status: CommissionStatus, notes?: string) => Promise<void>;
  isUpdating?: boolean;
}

export const CommissionDetailModal: React.FC<CommissionDetailModalProps> = ({
  commission,
  isOpen,
  onClose,
  onUpdateStatus,
  isUpdating = false,
}) => {
  if (!commission) return null;

  const [selectedStatus, setSelectedStatus] = useState<CommissionStatus>(commission.status);
  const [atelierNotes, setAtelierNotes] = useState(commission.notes || '');

  const handleStatusChange = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdateStatus(commission.id, selectedStatus, atelierNotes);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Bespoke Dossier: ${commission.dossierNumber}`}
      subtitle={`Created on ${formatDate(commission.createdAt)} • Made-to-measure Italian commission`}
      maxWidth="2xl"
    >
      <div className="space-y-6">
        {/* Status Advancement Bar */}
        <form
          onSubmit={handleStatusChange}
          className="p-4 rounded-2xl bg-surface-subtle/50 border border-theme flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <StatusBadge status={commission.status} />
            <span className="text-xs text-secondary">
              Atelier workflow status
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as CommissionStatus)}
              className="text-xs h-9 w-40"
            >
              <option value="pending">Pending</option>
              <option value="contacted">Contacted</option>
              <option value="in_tailoring">In Tailoring</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </Select>

            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isUpdating}
              disabled={selectedStatus === commission.status && atelierNotes === (commission.notes || '')}
            >
              Advance Status
            </Button>
          </div>
        </form>

        {/* 2 Column Details: Garment Specs & Client Measurements */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Garment Specifications */}
          <div className="space-y-4 p-5 rounded-2xl bg-surface border border-theme">
            <div className="flex items-center gap-2 pb-2 border-b border-theme text-xs font-bold uppercase tracking-wider text-secondary">
              <Scissors className="w-4 h-4 text-amber-500" />
              Bespoke Garment Specifications
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1 border-b border-theme-subtle">
                <span className="text-muted">Silhouette Model:</span>
                <strong className="text-primary font-serif-luxury">{commission.silhouetteName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-subtle">
                <span className="text-muted">Selected Leather:</span>
                <strong className="text-primary">{commission.leatherName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-subtle">
                <span className="text-muted">Dye / Color:</span>
                <strong className="text-primary">{commission.colorName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-subtle">
                <span className="text-muted">Sartorial Lining:</span>
                <strong className="text-primary">{commission.liningName}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-theme-subtle">
                <span className="text-muted">Hardware Trim:</span>
                <strong className="text-primary">{commission.hardwareName}</strong>
              </div>
              {commission.monogramText && (
                <div className="flex justify-between py-1 border-b border-theme-subtle">
                  <span className="text-muted">Monogram Embroidery:</span>
                  <strong className="text-amber-500 font-mono">
                    "{commission.monogramText}" ({commission.monogramPlacement || 'Chest'})
                  </strong>
                </div>
              )}
              <div className="flex justify-between py-1 pt-2">
                <span className="text-muted">Estimated Tailoring Price:</span>
                <strong className="text-base font-bold text-primary font-mono">
                  {formatCurrency(commission.estimatedPrice, commission.currency)}
                </strong>
              </div>
              <div className="flex justify-between py-1 text-[11px] text-muted">
                <span>Estimated Atelier Delivery:</span>
                <span>{commission.estimatedDelivery || '4–6 weeks'}</span>
              </div>
            </div>
          </div>

          {/* Client Body Measurements */}
          <div className="space-y-4 p-5 rounded-2xl bg-surface border border-theme">
            <div className="flex items-center gap-2 pb-2 border-b border-theme text-xs font-bold uppercase tracking-wider text-secondary">
              <Ruler className="w-4 h-4 text-amber-500" />
              Sartorial Measurements ({commission.measurements.unit.toUpperCase()})
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-theme flex flex-col">
                <span className="text-muted text-[10px] uppercase">Chest Girth</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5">
                  {commission.measurements.chest} {commission.measurements.unit}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-theme flex flex-col">
                <span className="text-muted text-[10px] uppercase">Natural Waist</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5">
                  {commission.measurements.waist} {commission.measurements.unit}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-theme flex flex-col">
                <span className="text-muted text-[10px] uppercase">Shoulder Span</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5">
                  {commission.measurements.shoulders} {commission.measurements.unit}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-surface-subtle/50 border border-theme flex flex-col">
                <span className="text-muted text-[10px] uppercase">Sleeve Length</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5">
                  {commission.measurements.sleeve} {commission.measurements.unit}
                </span>
              </div>

              <div className="col-span-2 p-2.5 rounded-xl bg-surface-subtle/50 border border-theme flex flex-col">
                <span className="text-muted text-[10px] uppercase">Back Center Length</span>
                <span className="text-base font-bold font-mono text-primary mt-0.5">
                  {commission.measurements.backLength} {commission.measurements.unit}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Client Contact Details */}
        <div className="p-5 rounded-2xl bg-surface border border-theme space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-theme text-xs font-bold uppercase tracking-wider text-secondary">
            <User className="w-4 h-4 text-amber-500" />
            Client Dossier Contact Information
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted" />
              <div>
                <span className="text-[10px] text-muted block uppercase">Client Full Name</span>
                <strong className="text-primary">{commission.customer.name}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted" />
              <div>
                <span className="text-[10px] text-muted block uppercase">Email</span>
                <a href={`mailto:${commission.customer.email}`} className="text-amber-500 hover:underline">
                  {commission.customer.email}
                </a>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted" />
              <div>
                <span className="text-[10px] text-muted block uppercase">Telephone</span>
                <a href={`tel:${commission.customer.phone}`} className="text-primary hover:underline">
                  {commission.customer.phone || '—'}
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Internal Atelier Notes */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
            Internal Atelier Craft Notes
          </label>
          <Textarea
            rows={3}
            placeholder="Record master tailor assignments, leather dye lot numbers, or customer fitting adjustments..."
            value={atelierNotes}
            onChange={(e) => setAtelierNotes(e.target.value)}
          />
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Close Dossier
          </Button>
        </div>
      </div>
    </Modal>
  );
};
