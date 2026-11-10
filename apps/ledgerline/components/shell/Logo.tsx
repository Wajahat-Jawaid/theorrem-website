import { cn } from '@/lib/cn';

/**
 * Three stacked bars of decreasing width; the top bar has a small square
 * notch cut from its right end.
 */
export function LogoGlyph({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden className={cn('shrink-0 fill-signal', className)}>
      <path d="M2 5.5h22.5V7H26v1.5H2z" />
      <rect x="2" y="12.5" width="18" height="3" />
      <rect x="2" y="19.5" width="12" height="3" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <LogoGlyph />
      <span className="font-display text-[17px] font-bold tracking-[0.06em] text-hi">LEDGERLINE</span>
    </span>
  );
}
