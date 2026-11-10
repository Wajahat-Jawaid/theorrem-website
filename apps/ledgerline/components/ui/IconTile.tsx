import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

interface IconTileProps {
  icon: LucideIcon;
  className?: string;
}

/** 44px, radius 12, a 20px mint icon at stroke 1.75. */
export function IconTile({ icon: Icon, className }: IconTileProps) {
  return (
    <span aria-hidden className={cn('inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-12 border border-signal/25 bg-signal/10 text-signal', className)}>
      <Icon size={20} strokeWidth={1.75} />
    </span>
  );
}
