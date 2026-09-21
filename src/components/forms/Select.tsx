import React from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
  options?: Array<{ label: string; value: string | number }>;
  wrapperClassName?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, wrapperClassName, error, options, children, ...props }, ref) => {
    return (
      <div className={cn('relative w-full', wrapperClassName)}>
        <select
          ref={ref}
          className={cn(
            'w-full bg-surface border border-theme rounded-xl px-3.5 py-2.5 text-sm text-primary transition-all appearance-none pr-10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 disabled:opacity-50 disabled:bg-surface-subtle cursor-pointer',
            error && 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value} className="bg-surface text-primary py-1">
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-muted">
          <ChevronDown className="w-4 h-4" />
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';
