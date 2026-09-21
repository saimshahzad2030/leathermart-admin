import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, wrapperClassName, error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className={cn('relative flex items-center w-full', wrapperClassName)}>
        {leftIcon && (
          <div className="absolute left-3.5 text-muted pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full bg-surface border border-theme rounded-xl px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50 disabled:bg-surface-subtle',
            leftIcon && 'pl-10',
            rightIcon && 'pr-10',
            error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
            className
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3.5 text-muted flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
