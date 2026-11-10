import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface PageTitleProps {
  title: ReactNode;
  /** Only when it tells the viewer something the title does not. */
  subtitle?: ReactNode;
  eyebrow?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function PageTitle({ title, subtitle, eyebrow, action, className }: PageTitleProps) {
  return (
    <div className={cn('flex flex-wrap items-end justify-between gap-6', className)}>
      <div className="min-w-0">
        {eyebrow ? <p className="eyebrow mb-3">{eyebrow}</p> : null}
        <h1 className="font-display text-h1-sm text-hi 2xl:text-h1">{title}</h1>
        {subtitle ? <p className="mt-3 max-w-[640px] text-lead text-mid">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}
