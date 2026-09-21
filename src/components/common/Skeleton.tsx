import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800/70 transition-colors',
        className
      )}
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => {
  return (
    <div className="w-full divide-y divide-theme">
      <div className="py-3.5 px-4 flex gap-4 bg-surface-subtle/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="py-4 px-4 flex gap-4 items-center">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn(
                'h-4 flex-1',
                c === 0 && 'max-w-[48px]',
                c === 1 && 'max-w-[180px]',
                c === cols - 1 && 'max-w-[90px]'
              )}
            />
          ))}
        </div>
      ))}
    </div>
  );
};

export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 rounded-2xl bg-surface border border-theme flex flex-col gap-4 shadow-xs', className)}>
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-9 w-9 rounded-xl" />
      </div>
      <Skeleton className="h-9 w-24" />
      <Skeleton className="h-3 w-40" />
    </div>
  );
};

export const GridCardSkeleton: React.FC<{ hasImage?: boolean; className?: string }> = ({
  hasImage = true,
  className,
}) => {
  return (
    <div className={cn('rounded-2xl bg-surface border border-theme overflow-hidden shadow-xs flex flex-col justify-between', className)}>
      <div>
        {hasImage && <Skeleton className="h-44 w-full rounded-none" />}
        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="pt-2 flex items-center gap-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
      <div className="p-4 border-t border-theme flex items-center justify-between bg-surface-subtle/30">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>
    </div>
  );
};

export const ProductDetailsSkeleton: React.FC = () => {
  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      {/* Action Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <div>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-3.5 w-64 mt-1.5" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Grid Layout Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
            <Skeleton className="h-5 w-40" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
            <Skeleton className="h-5 w-44" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-24" />
                <Skeleton className="h-10 w-full rounded-xl" />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
            <Skeleton className="h-5 w-36" />
            <div className="space-y-2 pt-2">
              <Skeleton className="h-24 w-full rounded-xl" />
            </div>
          </div>
        </div>

        {/* Sidebar Section */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-44 w-full rounded-xl" />
            <div className="grid grid-cols-3 gap-2">
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
              <Skeleton className="h-16 w-full rounded-lg" />
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-surface border border-theme space-y-4">
            <Skeleton className="h-5 w-28" />
            <div className="space-y-3 pt-1">
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
              <div className="flex justify-between items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-6 w-11 rounded-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const FormSettingsSkeleton: React.FC = () => {
  return (
    <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-theme space-y-6 shadow-xs animate-in fade-in duration-150">
      <div className="pb-4 border-b border-theme space-y-1">
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-3.5 w-80" />
      </div>
      <div className="space-y-4 pt-2">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-10 w-full max-w-lg rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-20 w-full max-w-xl rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export const MediaGridSkeleton: React.FC<{ count?: number }> = ({ count = 12 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="h-44 rounded-2xl bg-surface border border-theme p-3 flex flex-col justify-between overflow-hidden shadow-xs"
        >
          <Skeleton className="h-28 w-full rounded-xl" />
          <div className="space-y-1 pt-2">
            <Skeleton className="h-3 w-3/4" />
            <Skeleton className="h-2.5 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
};

export const ListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="divide-y divide-theme overflow-hidden">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <Skeleton className="w-12 h-12 rounded-xl shrink-0" />
            <div className="space-y-1.5 flex-1 min-w-0">
              <Skeleton className="h-3.5 w-48" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <div className="space-y-1 text-right shrink-0">
            <Skeleton className="h-4 w-16 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
};
