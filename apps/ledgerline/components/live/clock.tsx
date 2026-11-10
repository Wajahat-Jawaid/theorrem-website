'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from 'react';
import { CHAPTERS, CUES, LOOP, chapterAt, cueAtOrBefore } from '@/lib/live/timeline';
import { useIsoLayoutEffect } from '@/lib/agent';

/**
 * The demo's one clock. `t` is React state and only moves at the cues in the
 * timeline, so the dashboard re-renders a few times a second, not sixty.
 * `now()` is the precise time, read by the frame loop that moves flights,
 * the scan, the cursor and the typing directly in the DOM. Both come from
 * one start time, so they never disagree, and the loop never drifts: each
 * pass starts exactly LOOP ms after the last.
 *
 * Under reduced motion the clock steps from one chapter's final state to the
 * next every 6 seconds, and nothing moves in between.
 */

const REDUCED_STEP_MS = 6000;

type FrameFn = (now: number) => void;

interface ClockValue {
  t: number;
  chapter: number;
  paused: boolean;
  /** True for the frame after a jump or a loop: nothing animates into the new state. */
  snap: boolean;
  reduced: boolean;
  now: () => number;
  jump: (index: number) => void;
  toggle: () => void;
  subscribe: (fn: FrameFn) => () => void;
  /** The scale of the 1280×800 stage on screen, for turning screen pixels into stage units. */
  scale: () => number;
  setScale: (k: number) => void;
  /** The stage element: every measurement is made inside it. */
  stage: RefObject<HTMLDivElement>;
}

const ClockContext = createContext<ClockValue | null>(null);

export function ClockProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  const [t, setT] = useState(0);
  const [paused, setPaused] = useState(false);
  const [snap, setSnap] = useState(false);
  const [reduced, setReduced] = useState(false);

  const tRef = useRef(0);
  const startRef = useRef<number | null>(null);
  const pausedAt = useRef<number | null>(null);
  const autoPaused = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const subs = useRef(new Set<FrameFn>());
  const scaleRef = useRef(1);
  const reducedRef = useRef(false);
  const stage = useRef<HTMLDivElement>(null);

  const now = useCallback((): number => {
    if (reducedRef.current) return tRef.current;
    if (pausedAt.current !== null) return pausedAt.current;
    if (startRef.current === null) return tRef.current;
    return Math.min(LOOP, Math.max(0, performance.now() - startRef.current));
  }, []);

  const commit = useCallback((next: number, withSnap: boolean): void => {
    tRef.current = next;
    setT(next);
    if (withSnap) setSnap(true);
  }, []);

  const schedule = useCallback((): void => {
    clearTimeout(timer.current);
    if (!enabled || pausedAt.current !== null) return;
    if (reducedRef.current) {
      timer.current = setTimeout(() => {
        const i = (chapterAt(tRef.current).n) % CHAPTERS.length;
        commit(CHAPTERS[i].still, true);
        schedule();
      }, REDUCED_STEP_MS);
      return;
    }
    if (startRef.current === null) startRef.current = performance.now() - tRef.current;
    const next = CUES.find((c) => c > tRef.current) ?? LOOP;
    const delay = Math.max(0, startRef.current + next - performance.now());
    timer.current = setTimeout(() => {
      if (startRef.current === null) return;
      let elapsed = performance.now() - startRef.current;
      if (elapsed >= LOOP) {
        // Round the loop: the next pass starts exactly LOOP after this one did.
        const passes = Math.floor(elapsed / LOOP);
        startRef.current += passes * LOOP;
        elapsed -= passes * LOOP;
        commit(cueAtOrBefore(elapsed), true);
      } else {
        // A late timer (a busy tab) catches up to the latest cue it has passed.
        commit(Math.max(next, cueAtOrBefore(elapsed)), false);
      }
      schedule();
    }, delay);
  }, [enabled, commit]);

  // Reduced motion: chapter final states only.
  useIsoLayoutEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = (): void => {
      reducedRef.current = mq.matches;
      setReduced(mq.matches);
      if (mq.matches) commit(CHAPTERS[chapterAt(tRef.current).n - 1].still, true);
      startRef.current = null;
    };
    apply();
    const onChange = (): void => {
      apply();
      schedule();
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [commit, schedule]);

  // Run while the demo is on screen; stop when it is hidden (narrow screens) or the tab is.
  useEffect(() => {
    if (!enabled) {
      clearTimeout(timer.current);
      return undefined;
    }
    startRef.current = pausedAt.current === null ? performance.now() - tRef.current : null;
    schedule();
    const onVisibility = (): void => {
      if (document.hidden) {
        if (pausedAt.current === null) {
          pausedAt.current = now();
          autoPaused.current = true;
          clearTimeout(timer.current);
        }
      } else if (autoPaused.current) {
        autoPaused.current = false;
        startRef.current = performance.now() - (pausedAt.current ?? tRef.current);
        pausedAt.current = null;
        schedule();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearTimeout(timer.current);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, schedule, now]);

  // One frame loop for everything that moves continuously.
  useEffect(() => {
    if (!enabled) return undefined;
    let id = 0;
    const frame = (): void => {
      const n = now();
      subs.current.forEach((fn) => fn(n));
      id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [enabled, now]);

  // A snap lasts one painted frame.
  useEffect(() => {
    if (!snap) return undefined;
    let id = requestAnimationFrame(() => {
      id = requestAnimationFrame(() => setSnap(false));
    });
    return () => cancelAnimationFrame(id);
  }, [snap, t]);

  const jump = useCallback(
    (index: number): void => {
      const ch = CHAPTERS[((index % CHAPTERS.length) + CHAPTERS.length) % CHAPTERS.length];
      const target = reducedRef.current ? ch.still : ch.start;
      if (pausedAt.current !== null) pausedAt.current = target;
      else startRef.current = performance.now() - target;
      commit(target, true);
      schedule();
    },
    [commit, schedule],
  );

  const toggle = useCallback((): void => {
    autoPaused.current = false;
    if (pausedAt.current === null) {
      pausedAt.current = now();
      clearTimeout(timer.current);
      setPaused(true);
    } else {
      startRef.current = performance.now() - pausedAt.current;
      pausedAt.current = null;
      setPaused(false);
      schedule();
    }
  }, [now, schedule]);

  const subscribe = useCallback((fn: FrameFn) => {
    subs.current.add(fn);
    return () => {
      subs.current.delete(fn);
    };
  }, []);

  const scale = useCallback(() => scaleRef.current, []);
  const setScale = useCallback((k: number) => {
    scaleRef.current = k;
  }, []);

  const chapter = chapterAt(t).n - 1;
  const value = useMemo<ClockValue>(
    () => ({ t, chapter, paused, snap, reduced, now, jump, toggle, subscribe, scale, setScale, stage }),
    [t, chapter, paused, snap, reduced, now, jump, toggle, subscribe, scale, setScale],
  );
  return <ClockContext.Provider value={value}>{children}</ClockContext.Provider>;
}

export function useClock(): ClockValue {
  const ctx = useContext(ClockContext);
  if (!ctx) throw new Error('useClock must be used inside ClockProvider');
  return ctx;
}

/** Calls `fn` on every animation frame with the clock's precise time. */
export function useFrame(fn: FrameFn): void {
  const { subscribe, now } = useClock();
  const ref = useRef(fn);
  ref.current = fn;
  useIsoLayoutEffect(() => {
    ref.current(now());
    return subscribe((n) => ref.current(n));
  }, [subscribe, now]);
}

export interface StageRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** An element's box in stage units. Rotated elements report their own size, not their bounding box. */
export function measure(el: Element | null, stage: Element | null, k: number): StageRect | null {
  if (!el || !stage) return null;
  const r = el.getBoundingClientRect();
  const s = stage.getBoundingClientRect();
  const cx = (r.left + r.width / 2 - s.left) / k;
  const cy = (r.top + r.height / 2 - s.top) / k;
  const rotated = el instanceof HTMLElement && el.dataset.rot !== undefined;
  const w = rotated ? (el as HTMLElement).offsetWidth : r.width / k;
  const h = rotated ? (el as HTMLElement).offsetHeight : r.height / k;
  return { x: cx - w / 2, y: cy - h / 2, w, h };
}

/** A soft spring from 0 to 1 over about 600ms, with a 2% overshoot. */
export function spring(ms: number): number {
  if (ms <= 0) return 0;
  const s = ms / 1000;
  const zeta = 0.78;
  const omega = 11.5;
  const wd = omega * Math.sqrt(1 - zeta * zeta);
  const v = 1 - Math.exp(-zeta * omega * s) * (Math.cos(wd * s) + ((zeta * omega) / wd) * Math.sin(wd * s));
  return ms >= 600 ? 1 + (v - 1) * Math.max(0, 1 - (ms - 600) / 120) : v;
}

export const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));
export const easeInOut = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - (-2 * p + 2) ** 3 / 2);
export const easeOut = (p: number): number => 1 - (1 - p) ** 3;
export const easeIn = (p: number): number => p * p * p;
