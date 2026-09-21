import React from 'react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  label: string;
  error?: string;
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  description,
  required,
  children,
  className,
}) => {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold uppercase tracking-wider text-secondary">
          {label} {required && <span className="text-amber-500">*</span>}
        </label>
      </div>
      {children}
      {description && !error && <p className="text-xs text-muted leading-relaxed">{description}</p>}
      {error && <p className="text-xs text-rose-500 font-medium animate-in fade-in">{error}</p>}
    </div>
  );
};
