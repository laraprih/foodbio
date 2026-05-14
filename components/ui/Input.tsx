import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-semibold text-zinc-700 mb-1.5">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              {icon}
            </div>
          )}
          <input
            className={cn(
              'w-full bg-white rounded-[20px] py-4 px-4 text-sm transition-all',
              'border border-transparent focus:ring-2 focus:ring-[var(--color-lime-primary)]/50 outline-none',
              icon && 'pl-12',
              error && 'border-red-400 focus:ring-red-200',
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-xs text-red-500 mt-1 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
