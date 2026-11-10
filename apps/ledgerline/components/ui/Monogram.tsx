import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

/** A supplier's initials in a small paper tile. */
export function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span aria-hidden className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-6 bg-paper font-mono text-[12px] font-medium text-paper-ink', className)}>
      {initials(name)}
    </span>
  );
}
