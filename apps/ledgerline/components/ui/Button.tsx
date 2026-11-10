'use client';

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'md' | 'lg' | 'xl';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: ReactNode;
  trailing?: ReactNode;
}

const VARIANT: Record<Variant, string> = {
  // Brass is the one primary action on a screen.
  primary: 'bg-brass text-ink-950 shadow-brass hover:bg-[#EAC36E] active:bg-brass-deep disabled:bg-brass/35 disabled:text-ink-950/70 disabled:shadow-none',
  secondary: 'border border-white/10 bg-white/[0.04] text-hi hover:bg-white/[0.08] disabled:text-lo disabled:hover:bg-white/[0.04]',
  ghost: 'text-mid hover:bg-white/[0.05] hover:text-hi disabled:text-lo',
};

/** Primary buttons are 48 tall, secondary 40. Labels say exactly what happens. */
const SIZE: Record<Size, string> = {
  md: 'h-10 rounded-8 px-4 text-small font-semibold',
  lg: 'h-12 rounded-12 px-6 text-body font-semibold',
  xl: 'h-14 rounded-12 px-7 text-lead font-semibold',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'secondary', size, icon, trailing, className, children, type = 'button', ...rest },
  ref,
) {
  const resolved = size ?? (variant === 'primary' ? 'lg' : 'md');
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap transition-colors duration-micro ease-out disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[resolved],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  );
});

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

/** 36×36, hairline border, always carries an aria-label. */
export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton({ label, className, children, type = 'button', ...rest }, ref) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 text-hi transition-colors duration-micro ease-out hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-lo disabled:hover:bg-transparent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  );
});
