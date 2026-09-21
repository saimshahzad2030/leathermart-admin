import React from 'react';
import { cn } from '@/lib/utils';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, rows = 3, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          'w-full bg-surface border border-theme rounded-xl px-3.5 py-2.5 text-sm text-primary placeholder:text-muted/60 transition-all focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50 disabled:bg-surface-subtle resize-y',
          error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';
