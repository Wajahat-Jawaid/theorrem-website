import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLElement> {
  padded?: boolean;
  as?: 'div' | 'section' | 'article';
}

/** Raised ink on the canvas: radius 12, hairline border, inner top highlight, 24px padding. */
export function Card({ padded = true, as: Tag = 'div', className, children, ...rest }: CardProps) {
  return (
    <Tag className={cn('card relative min-w-0', padded && 'p-6', className)} {...rest}>
      {children}
    </Tag>
  );
}

interface CardTitleProps {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
  as?: 'h2' | 'h3';
}

export function CardTitle({ children, action, className, as: Heading = 'h2' }: CardTitleProps) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-3', className)}>
      <Heading className="flex min-w-0 items-center gap-2 text-h3 text-hi">{children}</Heading>
      {action}
    </div>
  );
}
