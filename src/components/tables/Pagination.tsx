import React from 'react';
import { Pagination as PaginationType } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/common/Button';

interface PaginationProps {
  pagination: PaginationType;
  onPageChange: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  pagination,
  onPageChange,
  onLimitChange,
}) => {
  const { currentPage, totalPages, totalCount, limit } = pagination;

  const start = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-theme bg-surface/50 text-xs text-muted">
      <div className="flex items-center gap-2">
        <span>
          Showing <strong className="text-primary font-medium">{start}</strong> to{' '}
          <strong className="text-primary font-medium">{end}</strong> of{' '}
          <strong className="text-primary font-medium">{totalCount}</strong> results
        </span>

        {onLimitChange && (
          <div className="flex items-center gap-1.5 ml-4">
            <span>Per page:</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="bg-surface border border-theme rounded px-2 py-1 text-primary focus:outline-none focus:border-amber-500"
            >
              <option value={10}>10</option>
              <option value={12}>12</option>
              <option value={20}>20</option>
              <option value={24}>24</option>
              <option value={48}>48</option>
            </select>
          </div>
        )}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="h-8 px-2.5"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center px-2 font-medium text-primary">
          Page {currentPage} of {totalPages || 1}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages || totalPages === 0}
          onClick={() => onPageChange(currentPage + 1)}
          className="h-8 px-2.5"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};
