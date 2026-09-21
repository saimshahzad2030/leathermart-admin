import React, { useState } from 'react';
import { RotateCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

export interface RefreshButtonProps {
  onRefresh: () => Promise<any> | void;
  isRefreshing?: boolean;
  size?: 'sm' | 'md';
  variant?: 'outline' | 'ghost' | 'secondary';
  label?: string;
  className?: string;
  showLabelOnMobile?: boolean;
  title?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing: externalIsRefreshing,
  size = 'md',
  variant = 'outline',
  label = 'Refresh',
  className,
  showLabelOnMobile = false,
  title = 'Re-fetch latest data',
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const toast = useToast();

  const isRefreshing = externalIsRefreshing !== undefined ? externalIsRefreshing : internalLoading;

  const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (isRefreshing) return;

    try {
      setInternalLoading(true);
      const result = onRefresh();
      if (result && typeof (result as Promise<any>).then === 'function') {
        await result;
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to refresh data.');
    } finally {
      setInternalLoading(false);
    }
  };

  const baseStyles =
    'inline-flex items-center justify-center font-medium rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-1 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer active:scale-[0.98] select-none shrink-0';

  const sizeStyles = {
    sm: 'h-8 px-2.5 text-xs gap-1.5',
    md: 'h-9 px-3 text-xs sm:text-sm gap-2',
  };

  const variantStyles = {
    outline:
      'border border-theme bg-surface hover:bg-surface-hover text-secondary hover:text-primary active:bg-surface-subtle shadow-xs',
    secondary:
      'bg-surface-subtle hover:bg-surface-hover text-secondary hover:text-primary border border-theme/60',
    ghost:
      'text-secondary hover:text-primary hover:bg-surface-hover active:bg-surface-subtle',
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isRefreshing}
      title={title}
      className={cn(baseStyles, sizeStyles[size], variantStyles[variant], className)}
      aria-label={label}
    >
      <RotateCw
        className={cn(
          'w-3.5 h-3.5 transition-transform',
          isRefreshing && 'animate-spin text-amber-500'
        )}
      />
      {label && (
        <span className={cn(showLabelOnMobile ? 'inline' : 'hidden sm:inline')}>
          {label}
        </span>
      )}
    </button>
  );
};
