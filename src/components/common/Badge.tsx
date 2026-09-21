import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'gold' | 'emerald' | 'amber' | 'rose' | 'sky' | 'muted' | 'outline';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'muted',
  size = 'md',
  children,
  className,
  dot = false,
}) => {
  const variantStyles = {
    gold: 'bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-600/10 text-amber-700 dark:text-amber-300 border-amber-600/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    sky: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    muted: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
    outline: 'border border-theme text-secondary bg-transparent',
  };

  const dotColors = {
    gold: 'bg-amber-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    sky: 'bg-sky-400',
    muted: 'bg-zinc-400',
    outline: 'bg-zinc-400',
  };

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold tracking-wide',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border uppercase',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
    >
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse', dotColors[variant])} />}
      {children}
    </span>
  );
};

export const StatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  switch (status.toLowerCase()) {
    case 'published':
    case 'active':
    case 'completed':
    case 'approved':
      return <Badge variant="emerald" dot className={className}>{status}</Badge>;
    case 'draft':
    case 'pending':
      return <Badge variant="amber" dot className={className}>{status}</Badge>;
    case 'in_tailoring':
    case 'contacted':
      return <Badge variant="gold" dot className={className}>{status.replace('_', ' ')}</Badge>;
    case 'cancelled':
    case 'deactivated':
    case 'rejected':
      return <Badge variant="rose" className={className}>{status}</Badge>;
    case 'super_admin':
      return <Badge variant="gold" className={className}>Super Admin</Badge>;
    case 'store_manager':
      return <Badge variant="sky" className={className}>Store Manager</Badge>;
    case 'content_editor':
      return <Badge variant="emerald" className={className}>Content Editor</Badge>;
    case 'concierge':
      return <Badge variant="amber" className={className}>Concierge</Badge>;
    default:
      return <Badge variant="muted" className={className}>{status.replace('_', ' ')}</Badge>;
  }
};
