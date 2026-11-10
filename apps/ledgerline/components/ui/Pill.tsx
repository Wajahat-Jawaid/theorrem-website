import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Document } from '@/lib/types';

type Tone = 'done' | 'ok' | 'neutral' | 'filed';

const TONE: Record<Tone, string> = {
  done: 'bg-signal/10 text-signal',
  ok: 'bg-amber/15 text-amber',
  neutral: 'bg-white/[0.04] text-mid ring-1 ring-inset ring-white/10',
  filed: 'bg-signal text-ink-950',
};

export function Pill({ tone, children, className }: { tone: Tone; children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex h-7 shrink-0 items-center whitespace-nowrap rounded-full px-3 text-[13px] font-medium', TONE[tone], className)}>{children}</span>;
}

/** The one status pill every document carries, in plain words. */
export function StatusPill({ doc, className }: { doc: Document; className?: string }) {
  switch (doc.status) {
    case 'done':
      return (
        <Pill tone="done" className={className}>
          {doc.approvedByYou ? 'Approved by you' : 'Done automatically'}
        </Pill>
      );
    case 'needs_ok':
      return (
        <Pill tone="ok" className={className}>
          Needs your OK
        </Pill>
      );
    case 'on_hold':
      return (
        <Pill tone="ok" className={className}>
          On hold
        </Pill>
      );
    case 'skipped':
      return (
        <Pill tone="neutral" className={className}>
          Skipped
        </Pill>
      );
  }
}
