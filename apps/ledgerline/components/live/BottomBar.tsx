'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CHAPTERS } from '@/lib/live/timeline';
import { clamp01, useClock, useFrame } from './clock';

/**
 * The chapter's headline and payoff, six progress dots (click one to jump),
 * pause, and the way into the full dashboard.
 */
export function BottomBar() {
  const { chapter, paused, toggle, jump } = useClock();
  const ch = CHAPTERS[chapter];
  const fill = useRef<HTMLSpanElement>(null);

  useFrame((now) => {
    if (!fill.current) return;
    const c = CHAPTERS.find((x) => now >= x.start && now < x.end) ?? CHAPTERS[CHAPTERS.length - 1];
    fill.current.style.transform = `scaleX(${clamp01((now - c.start) / (c.end - c.start)).toFixed(4)})`;
  });

  return (
    <div className="absolute bottom-6 left-6 right-6 flex h-[72px] items-center gap-6 rounded-12 border border-white/[0.06] bg-ink-900/80 pl-6 pr-3 shadow-card">
      <div key={ch.n} className="ll-fade-up min-w-0 flex-1">
        <p className="truncate font-display text-[24px] font-semibold leading-[30px] tracking-[-0.015em] text-hi">{ch.title}</p>
        <p className="truncate text-[15px] leading-[20px] text-mid">{ch.payoff}</p>
      </div>

      <div role="group" aria-label="Chapters" className="flex shrink-0 items-center">
        {CHAPTERS.map((c, i) => {
          const active = i === chapter;
          return (
            <button
              key={c.n}
              type="button"
              data-dot=""
              onClick={() => jump(i)}
              aria-label={`Chapter ${c.n} of ${CHAPTERS.length}: ${c.title}`}
              aria-current={active ? 'step' : undefined}
              className="group flex h-9 items-center justify-center px-[5px]"
            >
              <span
                className={cn(
                  'relative block h-2 overflow-hidden rounded-full transition-[width,background-color] duration-300 ease-out-expo',
                  active ? 'w-8 bg-white/15' : cn('w-2 group-hover:bg-white/50', i < chapter ? 'bg-signal/60' : 'bg-white/20'),
                )}
              >
                {active ? <span ref={fill} className="absolute inset-0 origin-left rounded-full bg-signal" style={{ transform: 'scaleX(0)' }} /> : null}
              </span>
            </button>
          );
        })}
      </div>

      <button
        type="button"
        data-pause=""
        onClick={toggle}
        aria-label={paused ? 'Play the demo (Space)' : 'Pause the demo (Space)'}
        title={paused ? 'Play (Space)' : 'Pause (Space)'}
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-hi transition-colors duration-micro hover:bg-white/[0.1]"
      >
        {paused ? <Play size={16} strokeWidth={2} aria-hidden className="translate-x-px" /> : <Pause size={16} strokeWidth={2} aria-hidden />}
      </button>

      <Link
        href="/dashboard"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-12 bg-brass px-5 text-[15px] font-semibold text-ink-950 shadow-brass transition-colors duration-micro hover:bg-[#EAC36E] active:bg-brass-deep"
      >
        Open the full dashboard
        <ArrowRight size={17} strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
