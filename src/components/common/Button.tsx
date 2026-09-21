import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variantStyles = {
      primary:
        'bg-amber-600 hover:bg-amber-500 text-white shadow-sm border border-amber-500/30 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-zinc-950 font-semibold',
      secondary:
        'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border border-zinc-700/60 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 dark:text-zinc-200',
      outline:
        'border border-theme text-primary hover:bg-surface-hover hover:border-theme active:bg-surface-subtle',
      ghost:
        'text-secondary hover:text-primary hover:bg-surface-hover active:bg-surface-subtle',
      danger:
        'bg-rose-600 hover:bg-rose-500 text-white shadow-sm border border-rose-500/30 dark:bg-rose-600 dark:hover:bg-rose-500',
    };

    const sizeStyles = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {!isLoading && leftIcon}
        {children}
        {!isLoading && rightIcon}
      </button>
    );
  }
);

Button.displayName = 'Button';
