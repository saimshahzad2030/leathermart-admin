import React from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface FormFieldProps {
  label: string;
  error?: string | string[];
  description?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  description,
  required,
  children,
  className,
  id,
}) => {
  const errorList: string[] = Array.isArray(error)
    ? error.filter((e): e is string => typeof e === 'string' && e.trim().length > 0)
    : typeof error === 'string' && error.trim().length > 0
    ? [error.trim()]
    : [];

  const hasError = errorList.length > 0;
  const errorId = id ? `${id}-error` : undefined;

  // Pass down error and aria-invalid to child input elements if they don't already define them
  const renderedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const childElement = child as React.ReactElement<any>;
      const childProps = childElement.props || {};
      return React.cloneElement(childElement, {
        error: childProps.error !== undefined ? childProps.error : hasError,
        'aria-invalid': childProps['aria-invalid'] !== undefined ? childProps['aria-invalid'] : hasError,
        'aria-describedby': hasError ? errorId || childProps['aria-describedby'] : childProps['aria-describedby'],
      } as any);
    }
    return child;
  });

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className={cn(
            'text-xs font-semibold uppercase tracking-wider text-secondary transition-colors',
            hasError && 'text-rose-500'
          )}
        >
          {label} {required && <span className="text-amber-500">*</span>}
        </label>
      </div>

      {renderedChildren}

      {description && !hasError && (
        <p className="text-xs text-muted leading-relaxed">{description}</p>
      )}

      {hasError && (
        <div id={errorId} className="space-y-1 mt-0.5 animate-in fade-in">
          {errorList.map((err, i) => (
            <div key={i} className="flex items-start gap-1.5 text-xs text-rose-500 font-medium">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-rose-500" />
              <span className="leading-tight">{err}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

