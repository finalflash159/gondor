import * as React from 'react';
import { cn } from '@/lib/utils';

type InputHeight = 'sm' | 'md' | 'lg';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  inputHeight?: InputHeight;
};

const heightClasses: Record<InputHeight, string> = {
  sm: 'h-9 px-3 py-1.5 text-sm',
  md: 'h-11 px-4 py-2.5 text-base',
  lg: 'h-12 px-5 py-3 text-base',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, inputHeight = 'md', ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex w-full rounded-lg border border-border',
          'bg-transparent text-foreground',
          'placeholder:text-muted-foreground/60',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 focus:ring-offset-1 focus:ring-offset-background',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'transition-all duration-150',
          'autofill:bg-transparent',
          heightClasses[inputHeight],
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export type { InputProps, InputHeight };
export { Input };
