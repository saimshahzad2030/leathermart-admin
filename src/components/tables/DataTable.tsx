import React from 'react';
import { Skeleton } from '@/components/common/Skeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { Pagination } from './Pagination';
import { Pagination as PaginationType } from '@/types';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string | React.ReactNode;
  render?: (item: T, index: number) => React.ReactNode;
  accessor?: keyof T;
  className?: string;
  width?: string;
}

interface DataTableProps<T extends { id?: string; _id?: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  pagination?: PaginationType;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
  bulkActions?: React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionText?: string;
  onEmptyAction?: () => void;
  onRowClick?: (item: T) => void;
  className?: string;
}

export function DataTable<T extends { id?: string; _id?: string }>({
  columns,
  data,
  isLoading = false,
  pagination,
  onPageChange,
  onLimitChange,
  selectedIds = [],
  onToggleSelect,
  onToggleSelectAll,
  bulkActions,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items to display matching your criteria.',
  emptyIcon,
  emptyActionText,
  onEmptyAction,
  onRowClick,
  className,
}: DataTableProps<T>) {
  const hasSelection = !!onToggleSelect;
  const isAllSelected =
    data.length > 0 && data.every((item) => selectedIds.includes((item.id || item._id) as string));

  return (
    <div className={cn('rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col', className)}>
      {/* Bulk Actions Header */}
      {selectedIds.length > 0 && bulkActions && (
        <div className="flex items-center justify-between px-6 py-3 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-500 animate-in fade-in">
          <div className="font-semibold">
            {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
          </div>
          <div className="flex items-center gap-2">{bulkActions}</div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto w-full">
        {!isLoading && data.length === 0 ? (
          <EmptyState
            icon={emptyIcon}
            title={emptyTitle}
            description={emptyDescription}
            actionText={emptyActionText}
            onAction={onEmptyAction}
          />
        ) : (
          <table className="w-full text-left text-sm divide-y divide-theme">
            <thead className="bg-surface-subtle/60 text-xs uppercase tracking-wider text-muted font-medium select-none">
              <tr>
                {hasSelection && (
                  <th className="w-10 px-4 py-3.5">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      disabled={isLoading}
                      onChange={onToggleSelectAll}
                      className="rounded border-theme bg-surface text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer disabled:opacity-40"
                    />
                  </th>
                )}
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width }}
                    className={cn('px-5 py-3.5 font-semibold text-secondary whitespace-nowrap', col.className)}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-theme bg-surface">
              {isLoading ? (
                /* Layout-preserving Table Skeleton rows matching columns */
                Array.from({ length: 6 }).map((_, rIdx) => (
                  <tr key={`skeleton-row-${rIdx}`} className="animate-pulse">
                    {hasSelection && (
                      <td className="w-10 px-4 py-4">
                        <Skeleton className="w-4 h-4 rounded" />
                      </td>
                    )}
                    {columns.map((col, cIdx) => (
                      <td
                        key={`skeleton-cell-${rIdx}-${col.key || cIdx}`}
                        style={{ width: col.width }}
                        className={cn('px-5 py-4 align-middle', col.className)}
                      >
                        {col.key.toLowerCase().includes('image') || col.key.toLowerCase().includes('avatar') ? (
                          <Skeleton className="w-12 h-14 rounded-lg" />
                        ) : col.key.toLowerCase().includes('status') ? (
                          <Skeleton className="h-6 w-20 rounded-full" />
                        ) : col.key.toLowerCase().includes('actions') ? (
                          <div className="flex items-center gap-1.5">
                            <Skeleton className="w-7 h-7 rounded-lg" />
                            <Skeleton className="w-7 h-7 rounded-lg" />
                            <Skeleton className="w-7 h-7 rounded-lg" />
                          </div>
                        ) : col.key.toLowerCase().includes('rating') || col.key.toLowerCase().includes('score') ? (
                          <Skeleton className="h-4 w-14 rounded" />
                        ) : (
                          <div className="space-y-1.5">
                            <Skeleton
                              className={cn(
                                'h-4 rounded',
                                cIdx === 0 ? 'w-32' : cIdx === 1 ? 'w-44' : 'w-24'
                              )}
                            />
                            {cIdx <= 1 && <Skeleton className="h-3 w-28 rounded opacity-70" />}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                data.map((item, index) => {
                  const itemId = (item.id || item._id) as string;
                  const isSelected = selectedIds.includes(itemId);

                  return (
                    <tr
                      key={itemId || index}
                      onClick={() => onRowClick && onRowClick(item)}
                      className={cn(
                        'transition-colors hover:bg-surface-hover/70 group',
                        isSelected && 'bg-amber-500/5',
                        onRowClick && 'cursor-pointer'
                      )}
                    >
                      {hasSelection && (
                        <td className="w-10 px-4 py-4" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => onToggleSelect && onToggleSelect(itemId)}
                            className="rounded border-theme bg-surface text-amber-500 focus:ring-amber-500 focus:ring-offset-0 cursor-pointer"
                          />
                        </td>
                      )}
                      {columns.map((col) => (
                        <td
                          key={col.key}
                          className={cn('px-5 py-4 text-primary align-middle', col.className)}
                        >
                          {col.render
                            ? col.render(item, index)
                            : col.accessor
                            ? (item[col.accessor] as any)
                            : null}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      {pagination && onPageChange && !isLoading && data.length > 0 && (
        <Pagination
          pagination={pagination}
          onPageChange={onPageChange}
          onLimitChange={onLimitChange}
        />
      )}
    </div>
  );
}
