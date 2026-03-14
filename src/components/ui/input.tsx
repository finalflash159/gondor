import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-8 w-full rounded-lg border border-border',
          'bg-card px-3 py-1.5 text-sm text-foreground',
          'placeholder:text-muted-foreground',
          'focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-colors duration-120',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
