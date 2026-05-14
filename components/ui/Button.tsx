import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap font-bold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lime-primary)] disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97]',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-lime-primary)] text-white hover:brightness-90 shadow-sm',
        dark: 'bg-[var(--color-lime-primary)] text-white hover:brightness-90 shadow-sm',
        outline: 'border-2 border-gray-200 text-gray-900 bg-white hover:border-gray-300 hover:bg-gray-50',
        ghost: 'text-gray-700 hover:bg-gray-100',
        danger: 'bg-red-500 text-white hover:bg-red-600',
        success: 'bg-emerald-500 text-white hover:bg-emerald-600',
      },
      size: {
        xs: 'px-3 py-1.5 text-xs rounded-lg',
        sm: 'px-4 py-2 text-sm rounded-xl',
        md: 'px-5 py-3 text-sm rounded-xl',
        lg: 'px-6 py-3.5 text-base rounded-xl',
        xl: 'px-8 py-4 text-base rounded-2xl',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, children, ...props }, ref) => (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <Spinner size="sm" />
          {children}
        </>
      ) : (
        children
      )}
    </button>
  )
);
Button.displayName = 'Button';

export { Button, buttonVariants };
