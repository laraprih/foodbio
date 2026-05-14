import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import Spinner from './Spinner';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-lime-primary)] disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        primary: 'bg-[var(--color-lime-primary)] text-black font-bold hover:opacity-90',
        dark: 'bg-[var(--color-app-dark)] text-white font-bold shadow-lg hover:opacity-90',
        ghost: 'border-2 border-current bg-transparent hover:bg-black/5',
        danger: 'bg-red-500 text-white hover:bg-red-600',
      },
      size: {
        sm: 'px-4 py-2 text-sm rounded-[14px]',
        md: 'px-6 py-3.5 text-sm rounded-[18px]',
        lg: 'px-8 py-4 text-base rounded-[20px]',
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
  ({ className, variant, size, loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size="sm" className="mr-2" />
            {children}
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
