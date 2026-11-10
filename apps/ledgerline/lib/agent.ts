'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { TYPE_MS } from './motion';

/** useLayoutEffect in the browser, useEffect on the server (no SSR warning). */
export const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Cancels every timer it scheduled when the component unmounts or `clear` is called. */
export function useTimers(): { later: (fn: () => void, ms: number) => void; clear: () => void } {
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);
  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);
  useEffect(() => clear, [clear]);
  return { later, clear };
}

/**
 * Types `text` out one character every 18ms once `run` is true; shows all of
 * it at once when `instant`. Calls `onDone` once the last character is down.
 */
export function useTypewriter(text: string, run: boolean, instant: boolean, onDone?: () => void): string {
  const [shown, setShown] = useState(instant && run ? text.length : 0);
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    if (!run) {
      setShown(0);
      return undefined;
    }
    if (instant) {
      setShown(text.length);
      done.current?.();
      return undefined;
    }
    let i = 0;
    setShown(0);
    const id = setInterval(() => {
      i += 1;
      setShown(i);
      if (i >= text.length) {
        clearInterval(id);
        done.current?.();
      }
    }, TYPE_MS);
    return () => clearInterval(id);
  }, [text, run, instant]);
  return text.slice(0, shown);
}
