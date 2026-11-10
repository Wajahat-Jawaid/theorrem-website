'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Laptop } from 'lucide-react';
import { useIsoLayoutEffect } from '@/lib/agent';
import { CHAPTERS, CURTAIN, LOOP, focusAt, stateAt } from '@/lib/live/timeline';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { FxProvider } from '@/components/dashboard/fx';
import { Wordmark } from '@/components/shell/Logo';
import { BottomBar } from './BottomBar';
import { ClockProvider, clamp01, useClock, useFrame } from './clock';
import { Flights } from './Flights';
import { Lanes } from './Lanes';
import { Overlays } from './Overlays';

/**
 * The live demo at /: one fixed 1280×800 screen, scaled to fit the window.
 * Paperwork on the left flows into the real dashboard on the right, chapter
 * by chapter, on a loop. Below 1024px wide it shows the finished month as a
 * still instead.
 */

export const STAGE = { w: 1280, h: 800 } as const;
const LEFT = { x: 24, y: 24, w: 419, h: 660 } as const;
const RIGHT = { x: 492, y: 24, w: 764, h: 660 } as const;

function useWide(): boolean {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const update = (): void => setWide(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return wide;
}

export function LiveDemo() {
  const wide = useWide();
  return (
    <>
      <h1 className="sr-only">Ledgerline: your paperwork, done</h1>
      <p className="sr-only">
        A live demo in six chapters. {CHAPTERS.map((c) => `${c.n}. ${c.title} ${c.payoff}`).join(' ')} Use the arrow keys to move between chapters and Space
        to pause.
      </p>
      <ClockProvider enabled={wide}>
        <div className="relative hidden h-[100svh] w-full overflow-hidden lg:block">
          {wide ? (
            <StageFit>
              <Stage />
            </StageFit>
          ) : null}
        </div>
      </ClockProvider>
      <Still />
    </>
  );
}

/** Scales the 1280×800 stage to fit the window, centred, and keeps the clock's scale in step. */
function StageFit({ children }: { children: ReactNode }) {
  const { stage, setScale } = useClock();
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState<number | null>(null);
  useIsoLayoutEffect(() => {
    const el = box.current;
    if (!el) return undefined;
    const fit = (): void => {
      if (el.clientWidth === 0) return;
      const v = Math.min(el.clientWidth / STAGE.w, el.clientHeight / STAGE.h);
      setScale(v);
      setK(v);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [setScale]);
  return (
    <div ref={box} className="absolute inset-0">
      <div
        ref={stage}
        data-stage=""
        className="absolute left-1/2 top-1/2"
        style={{ width: STAGE.w, height: STAGE.h, marginLeft: -STAGE.w / 2, marginTop: -STAGE.h / 2, transform: `scale(${k ?? 1})`, visibility: k === null ? 'hidden' : undefined }}
      >
        {children}
      </div>
    </div>
  );
}

function Stage() {
  const { t, snap, reduced, jump, toggle, chapter } = useClock();
  const state = stateAt(t);
  const fx = useMemo(() => ({ focus: focusAt(t), glow: !reduced, snap: snap || reduced }), [t, snap, reduced]);
  const content = useRef<HTMLDivElement>(null);

  // The loop's seam: the screen fades out over the end of the hold, and back in as the month starts again.
  useFrame((now) => {
    if (!content.current) return;
    const out = clamp01((now - CURTAIN.out) / (LOOP - CURTAIN.out));
    const back = 1 - clamp01(now / CURTAIN.in);
    content.current.style.opacity = reduced ? '1' : String(1 - Math.max(out, back));
  });

  // ← and → move between chapters; Space pauses. Space on the pause button presses it as usual.
  const keys = useRef({ jump, toggle, chapter });
  keys.current = { jump, toggle, chapter };
  useEffect(() => {
    const onDown = (e: KeyboardEvent): void => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.repeat) return;
        keys.current.jump(keys.current.chapter + (e.key === 'ArrowRight' ? 1 : -1));
      } else if (e.key === ' ' || e.code === 'Space') {
        if (target?.closest('[data-pause]')) return;
        e.preventDefault();
        if (!e.repeat) keys.current.toggle();
      }
    };
    // A focused chapter dot would otherwise take Space as a click.
    const onUp = (e: KeyboardEvent): void => {
      if ((e.key === ' ' || e.code === 'Space') && !(e.target as HTMLElement | null)?.closest('[data-pause]')) e.preventDefault();
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  return (
    <FxProvider value={fx}>
      <div ref={content} className="absolute inset-0" style={{ opacity: 0 }}>
        <div className="absolute" style={{ left: LEFT.x, top: LEFT.y, width: LEFT.w, height: LEFT.h }}>
          <Lanes lanes={state.lanes} />
        </div>
        <div className="absolute" style={{ left: RIGHT.x, top: RIGHT.y, width: RIGHT.w, height: RIGHT.h }}>
          <AppWindow>
            <Dashboard model={state.dash} mode="demo" />
          </AppWindow>
        </div>
        <Overlays state={state} />
        <Flights />
      </div>
      <BottomBar />
    </FxProvider>
  );
}

/** A laptop-style app window: traffic lights, the address, and the app inside. */
function AppWindow({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-12 border border-white/[0.1] bg-ink-900 shadow-float">
      <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-white/[0.06] bg-ink-800 px-3">
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]/70" />
        <span aria-hidden className="h-2.5 w-2.5 rounded-full bg-[#28C840]/70" />
        <span className="mx-auto rounded-6 bg-white/[0.05] px-3 py-px text-[12px] text-lo">app.ledgerline.co.uk/dashboard</span>
        <span aria-hidden className="w-[42px]" />
      </div>
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}

/** Phones and small tablets: the finished month as a picture, and the way into the dashboard. */
function Still() {
  return (
    <div className="flex min-h-[100svh] flex-col items-center justify-center gap-6 px-4 py-10 text-center lg:hidden">
      <Wordmark />
      <p className="font-display text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-hi">Your paperwork, done.</p>
      <Image
        src="/live/final.jpg"
        alt="The Ledgerline dashboard at the end of October: 312 documents in, all done automatically, the VAT return ready to file with £11,827.20 to pay, the month-end email to the accountant ready to send, and time on paperwork down from 16.5 hours to 54 minutes."
        width={1280}
        height={800}
        className="h-auto w-full max-w-[720px] rounded-12 border border-white/10 shadow-float"
      />
      <p className="flex items-center gap-2 text-body text-mid">
        <Laptop size={18} strokeWidth={1.75} aria-hidden />
        Best viewed on a laptop
      </p>
      <Link
        href="/dashboard"
        className="inline-flex h-12 items-center gap-2 rounded-12 bg-brass px-6 text-body font-semibold text-ink-950 shadow-brass transition-colors duration-micro hover:bg-[#EAC36E] active:bg-brass-deep"
      >
        Open the full dashboard
        <ArrowRight size={18} strokeWidth={2} aria-hidden />
      </Link>
    </div>
  );
}
