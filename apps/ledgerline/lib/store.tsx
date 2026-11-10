'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { initialState, reducer, type Action, type AppState, type ToastKind } from './state';
import { counters, type Counters } from './derive';
import { TODAY_MS } from './constants';
import { londonIso } from './format';

interface AppDataValue {
  state: AppState;
  counts: Counters;
  dispatch: (action: Action) => void;
  toast: (kind: ToastKind, title: string, body?: string) => void;
  /** The time now, on a clock that starts at TODAY when the page loads. Read in event handlers only. */
  nowIso: () => string;
}

const AppDataContext = createContext<AppDataValue | null>(null);

/** The single holder of the session's data. Nothing ticks in the background. */
export function AppDataProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const loadedAt = useRef<number | null>(null);
  useEffect(() => {
    loadedAt.current = performance.now();
  }, []);
  const nowIso = useCallback(() => {
    const elapsed = loadedAt.current === null ? 0 : performance.now() - loadedAt.current;
    return londonIso(TODAY_MS + Math.floor(elapsed / 1000) * 1000);
  }, []);
  const toast = useCallback((kind: ToastKind, title: string, body?: string) => dispatch({ type: 'toast', kind, title, body }), []);
  const counts = useMemo(() => counters(state.documents, state.reminders), [state.documents, state.reminders]);
  const value = useMemo(() => ({ state, counts, dispatch, toast, nowIso }), [state, counts, toast, nowIso]);
  return (
    <AppDataContext.Provider value={value}>
      <UiProvider>{children}</UiProvider>
    </AppDataContext.Provider>
  );
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error('useAppData must be used inside AppDataProvider');
  return ctx;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = (): void => setReduced(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);
  return reduced;
}

/* ------------------------------------------------------------------ */
/* Shared interface state                                              */
/* ------------------------------------------------------------------ */

interface UiValue {
  reducedMotion: boolean;
}

const UiContext = createContext<UiValue | null>(null);

function UiProvider({ children }: { children: ReactNode }) {
  const reducedMotion = useReducedMotion();
  const value = useMemo(() => ({ reducedMotion }), [reducedMotion]);
  return <UiContext.Provider value={value}>{children}</UiContext.Provider>;
}

export function useUi(): UiValue {
  const ctx = useContext(UiContext);
  if (!ctx) throw new Error('useUi must be used inside AppDataProvider');
  return ctx;
}
