'use client';

import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import type { Region } from '@/lib/live/timeline';

/**
 * How the dashboard is being shown. On /dashboard it simply sits there: no
 * glows, nothing dimmed. Inside the live demo, the area each chapter is about
 * stays lit while the rest dims to 55%, every landing glows mint for 400ms,
 * and after a jump everything takes its new state without animating.
 */
export interface Fx {
  focus: Set<Region> | null;
  glow: boolean;
  snap: boolean;
}

const FxContext = createContext<Fx>({ focus: null, glow: false, snap: false });

export function FxProvider({ value, children }: { value: Fx; children: ReactNode }) {
  return <FxContext.Provider value={value}>{children}</FxContext.Provider>;
}

export function useFx(): Fx {
  return useContext(FxContext);
}

/** A region the spotlight can light: full strength when it is in focus, 55% when not. */
export function Spot({
  id,
  className,
  style,
  children,
  ...data
}: { id: Region; className?: string; style?: CSSProperties; children: ReactNode } & Record<`data-${string}`, string | undefined>) {
  const { focus, snap } = useFx();
  const on = !focus || focus.has(id);
  return (
    <div {...data} className={cn('transition-opacity ease-out', snap ? 'duration-0' : 'duration-[450ms]', className)} style={{ ...style, opacity: on ? 1 : 0.55 }}>
      {children}
    </div>
  );
}

/** A 400ms mint glow each time `pulse` changes, unless the change came from a jump. */
export function Glow({ pulse, className }: { pulse: number; className?: string }) {
  const { glow, snap } = useFx();
  const [key, setKey] = useState(0);
  const snapRef = useRef(snap);
  snapRef.current = snap;
  useEffect(() => {
    if (!glow || pulse === 0 || snapRef.current) return;
    setKey((k) => k + 1);
  }, [pulse, glow]);
  if (key === 0) return null;
  return <span key={key} aria-hidden className={cn('ll-glow pointer-events-none absolute inset-0 rounded-[inherit]', className)} />;
}

/** True when this element mounted in the middle of the demo, not on a jump: it may fade in. */
export function useEntering(): boolean {
  const { glow, snap } = useFx();
  const [entering] = useState(glow && !snap);
  return entering;
}
