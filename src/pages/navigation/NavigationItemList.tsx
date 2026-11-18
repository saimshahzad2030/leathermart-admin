import React from 'react';
import { NavigationItem } from '@/types';
import { Button } from '@/components/common/Button';
import { EmptyState } from '@/components/common/EmptyState';
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Trash2,
  Plus,
  Layers,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Link as LinkIcon,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';

interface NavigationItemListProps {
  sectionTitle: string;
  sectionDescription: string;
  items: NavigationItem[];
  onReorder: (newItems: NavigationItem[]) => void;
  onEdit: (item: NavigationItem, index: number) => void;
  onDelete: (index: number) => void;
  onAddNew: () => void;
  onEditSection?: () => void;
  onDeleteSection?: () => void;
  isCustomSection?: boolean;
  canEdit: boolean;
  departmentId: string;
}

export const NavigationItemList: React.FC<NavigationItemListProps> = ({
  sectionTitle,
  sectionDescription,
  items,
  onReorder,
  onEdit,
  onDelete,
  onAddNew,
  onEditSection,
  onDeleteSection,
  isCustomSection = false,
  canEdit,
  departmentId,
}) => {
  const handleMoveUp = (index: number) => {
    if (index === 0 || !canEdit) return;
    const newItems = [...items];
    const temp = newItems[index - 1];
    newItems[index - 1] = newItems[index];
    newItems[index] = temp;
    onReorder(newItems);
  };

  const handleMoveDown = (index: number) => {
    if (index === items.length - 1 || !canEdit) return;
    const newItems = [...items];
    const temp = newItems[index + 1];
    newItems[index + 1] = newItems[index];
    newItems[index] = temp;
    onReorder(newItems);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-surface border border-theme shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-base font-semibold text-primary font-serif-luxury tracking-wide">
              {sectionTitle}
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-amber-500/10 text-amber-500 border border-amber-500/20">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
            {isCustomSection && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-surface-subtle border border-theme text-muted">
                Custom Section
              </span>
            )}
          </div>
          <p className="text-xs text-muted mt-1 leading-relaxed">{sectionDescription}</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && onEditSection && (
            <Button
              variant="outline"
              size="sm"
              onClick={onEditSection}
              leftIcon={<Settings className="w-3.5 h-3.5" />}
              title="Edit Section Settings"
            >
              Edit Section
            </Button>
          )}

          {canEdit && onDeleteSection && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDeleteSection}
              leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
              className="text-rose-500 hover:bg-rose-500/10"
              title="Delete Section"
            >
              Delete Section
            </Button>
          )}

          {canEdit && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddNew}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Add {sectionTitle === 'Categories' ? 'Category' : sectionTitle === 'Styles' ? 'Style' : sectionTitle === 'Coats' ? 'Coat' : sectionTitle === 'Shop By' ? 'Filter Link' : 'Item'}
            </Button>
          )}
        </div>
      </div>

      {/* Items Table or Empty State */}
      {items.length === 0 ? (
        <div className="p-8 rounded-2xl bg-surface border border-theme shadow-xs">
          <EmptyState
            icon={Layers}
            title={`No items configured in ${sectionTitle}`}
            description={`Add navigation links to show up under the ${sectionTitle} section of the ${departmentId.toUpperCase()} menu.`}
            actionText={canEdit ? `Add First Item` : undefined}
            onAction={canEdit ? onAddNew : undefined}
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-surface border border-theme shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-theme bg-surface-subtle/50 text-muted uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-3 w-16 text-center">Order</th>
                  <th className="py-3 px-4 min-w-[200px]">Label & Type</th>
                  <th className="py-3 px-4 min-w-[120px]">Identifier</th>
                  <th className="py-3 px-4 min-w-[140px]">Translation Key</th>
                  <th className="py-3 px-4 min-w-[180px]">Destination URL</th>
                  <th className="py-3 px-3 min-w-[100px] text-center">Status</th>
                  <th className="py-3 px-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme">
                {items.map((item, index) => {
                  const isFirst = index === 0;
                  const isLast = index === items.length - 1;
                  const itemType = item.type || (item.categoryId ? 'CATEGORY' : item.productId ? 'PRODUCT' : 'CUSTOM_LINK');

                  return (
                    <tr
                      key={item.id || index}
                      className="hover:bg-surface-hover/70 transition-colors group"
                    >
                      {/* Order Controls */}
                      <td className="py-3 px-2 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className="font-mono text-xs text-muted w-5 text-right font-medium">
                            {index + 1}
                          </span>
                          {canEdit && (
                            <div className="flex flex-col ml-1">
                              <button
                                type="button"
                                onClick={() => handleMoveUp(index)}
                                disabled={isFirst}
                                title={isFirst ? 'First item' : 'Move up'}
                                className="p-0.5 text-muted hover:text-amber-500 disabled:opacity-20 disabled:hover:text-muted cursor-pointer transition-colors"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMoveDown(index)}
                                disabled={isLast}
                                title={isLast ? 'Last item' : 'Move down'}
                                className="p-0.5 text-muted hover:text-amber-500 disabled:opacity-20 disabled:hover:text-muted cursor-pointer transition-colors"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Display Label, Badge, & Type */}
                      <td className="py-3 px-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-primary text-sm">
                              {item.fallbackLabel}
                            </span>
                            {item.badge && (
                              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded-md bg-amber-500 text-zinc-950">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-muted">
                            {itemType === 'CATEGORY' && (
                              <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 font-medium">
                                <Layers className="w-2.5 h-2.5" /> Category
                              </span>
                            )}
                            {itemType === 'PRODUCT' && (
                              <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 font-medium">
                                <ShoppingBag className="w-2.5 h-2.5" /> Product
                              </span>
                            )}
                            {itemType === 'CUSTOM_LINK' && (
                              <span className="inline-flex items-center gap-1 text-zinc-400 bg-zinc-500/10 px-1.5 py-0.5 rounded border border-zinc-500/20 font-medium">
                                <LinkIcon className="w-2.5 h-2.5" /> Custom
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Identifier */}
                      <td className="py-3 px-4">
                        <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-surface-subtle border border-theme text-secondary">
                          {item.legacyId || item.id}
                        </span>
                      </td>

                      {/* Translation Key */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-muted font-mono text-[11px]">
                          <Sparkles className="w-3 h-3 text-amber-500/70 shrink-0" />
                          <span className="truncate">{item.labelKey}</span>
                        </div>
                      </td>

                      {/* Destination URL */}
                      <td className="py-3 px-4">
                        <a
                          href={item.href}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-mono text-[11px] text-muted hover:text-amber-500 transition-colors group/link truncate max-w-[200px]"
                        >
                          <span className="truncate">{item.href}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0" />
                        </a>
                      </td>

                      {/* Active / Draft Status */}
                      <td className="py-3 px-3 text-center">
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium border">
                          {item.isActive !== false ? (
                            <span className="text-emerald-400 bg-emerald-500/10 border-emerald-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <Eye className="w-2.5 h-2.5" /> Active
                            </span>
                          ) : (
                            <span className="text-zinc-400 bg-zinc-500/10 border-zinc-500/20 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                          {item.isDraft && (
                            <span className="text-amber-400 bg-amber-500/10 px-1 rounded text-[9px] uppercase font-bold">
                              Draft
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(item, index)}
                            title="Edit Item"
                            className="p-1.5 h-7 w-7 text-muted hover:text-amber-500 hover:bg-amber-500/10 rounded-lg"
                            disabled={!canEdit}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDelete(index)}
                            title="Delete Item"
                            className="p-1.5 h-7 w-7 text-muted hover:text-rose-500 hover:bg-rose-500/10 rounded-lg"
                            disabled={!canEdit}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
