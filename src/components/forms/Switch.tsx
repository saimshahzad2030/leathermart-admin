import React from 'react';
import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <label className={cn('inline-flex items-center gap-3 cursor-pointer select-none', disabled && 'opacity-50 cursor-not-allowed')}>
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={cn(
            'w-11 h-6 rounded-full transition-colors duration-200 ease-in-out',
            checked ? 'bg-amber-500' : 'bg-zinc-300 dark:bg-zinc-700'
          )}
        />
        <div
          className={cn(
            'absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm',
            checked && 'translate-x-5'
          )}
        />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && <span className="text-sm font-medium text-primary">{label}</span>}
          {description && <span className="text-xs text-muted leading-tight">{description}</span>}
        </div>
      )}
    </label>
  );
};
