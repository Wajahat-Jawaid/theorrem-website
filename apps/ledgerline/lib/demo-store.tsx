'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { business as defaultBusiness, owner as defaultOwner } from './data/business';
import { initials } from './format';
import { useAppData } from './store';

/**
 * Presenter state that sits beside the session's data: which screen's peak to
 * replay, captions, the shared-element hand-off between screens, the
 * personalised business name and the hands-free run. `reset()` puts the data
 * and all of this back to the moment the page loaded.
 */

export type Screen = 'overview' | 'review' | 'paperwork' | 'vat' | 'documents';

/** The four beats of the story, in the order they are walked. */
export const STORY: { screen: Screen; href: string; label: string }[] = [
  { screen: 'overview', href: '/dashboard', label: 'Overview' },
  { screen: 'review', href: '/review', label: 'Needs your OK' },
  { screen: 'paperwork', href: '/paperwork', label: 'Missing paperwork' },
  { screen: 'vat', href: '/vat', label: 'VAT' },
];

export function screenFor(pathname: string): Screen {
  if (pathname.startsWith('/review')) return 'review';
  if (pathname.startsWith('/paperwork')) return 'paperwork';
  if (pathname.startsWith('/vat')) return 'vat';
  if (pathname.startsWith('/documents')) return 'documents';
  return 'overview';
}

export type DemoCommand = 'review:choose' | 'review:approve' | 'paperwork:send' | 'vat:send';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** How a decision card should arrive: zoomed out of an Overview thumbnail, or sliding up after the one before. */
export type Entrance = { kind: 'zoom'; rect: Rect } | { kind: 'next' } | null;

export interface BusinessView {
  name: string;
  shortName: string;
  ownerFirstName: string;
  ownerName: string;
  /** The monogram in the nav. */
  initials: string;
  personalised: boolean;
}

const DEFAULT_BUSINESS: BusinessView = {
  name: defaultBusiness.name,
  shortName: defaultBusiness.shortName,
  ownerFirstName: defaultOwner.firstName,
  ownerName: defaultOwner.name,
  initials: defaultOwner.initials,
  personalised: false,
};

const SCREENS: Screen[] = ['overview', 'review', 'paperwork', 'vat', 'documents'];
const ZERO_REPLAYS = Object.fromEntries(SCREENS.map((s) => [s, 0])) as Record<Screen, number>;

const HERO_KEY = 'ledgerline.hero-played';
/** How long a set entrance waits for its card to mount. */
const ENTRANCE_TTL_MS = 1500;
const BUSINESS_KEY = 'ledgerline.business';

function storageGet(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function storageSet(key: string, value: string | null): void {
  try {
    if (value === null) window.sessionStorage.removeItem(key);
    else window.sessionStorage.setItem(key, value);
  } catch {
    // Private windows can refuse storage; the session still works without it.
  }
}

/** "Harlow Interiors Ltd" → "Harlow Interiors". */
function shortNameOf(name: string): string {
  return name.replace(/[,\s]+(ltd\.?|limited|llp|plc)$/i, '').trim() || name;
}

function businessFrom(name: string | null, ownerFirst: string | null): BusinessView {
  const cleanName = name?.trim().slice(0, 60) ?? '';
  const cleanOwner = ownerFirst?.trim().split(/\s+/)[0]?.slice(0, 30) ?? '';
  if (!cleanName && !cleanOwner) return DEFAULT_BUSINESS;
  const full = cleanName || DEFAULT_BUSINESS.name;
  const first = cleanOwner || DEFAULT_BUSINESS.ownerFirstName;
  return {
    name: full,
    shortName: shortNameOf(full),
    ownerFirstName: first,
    ownerName: cleanOwner ? first : DEFAULT_BUSINESS.ownerName,
    initials: cleanName ? initials(shortNameOf(full)) : DEFAULT_BUSINESS.initials,
    personalised: true,
  };
}

interface DemoValue {
  business: BusinessView;
  /** True once the Overview hero has played in this tab. Read in effects only. */
  hasHeroPlayed: () => boolean;
  markHeroPlayed: () => void;
  replays: Record<Screen, number>;
  replay: (screen: Screen) => void;
  reset: (options?: { replay?: boolean }) => void;
  captions: boolean;
  toggleCaptions: () => void;
  setEntrance: (id: string, entrance: Entrance) => void;
  /** Read by the decision card as it mounts. */
  takeEntrance: (id: string) => Entrance;
  xeroPulse: number;
  pulseXero: () => void;
  autoplay: boolean;
  stopAutoplay: () => void;
  command: { name: DemoCommand; nonce: number } | null;
  send: (name: DemoCommand) => void;
}

const DemoContext = createContext<DemoValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const { dispatch } = useAppData();
  const router = useRouter();
  const [business, setBusiness] = useState<BusinessView>(DEFAULT_BUSINESS);
  const [replays, setReplays] = useState(ZERO_REPLAYS);
  const [captions, setCaptions] = useState(false);
  const [xeroPulse, setXeroPulse] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [command, setCommand] = useState<{ name: DemoCommand; nonce: number } | null>(null);
  const heroPlayed = useRef(false);
  const entrance = useRef<{ id: string; value: Entrance; at: number } | null>(null);

  // ?business=Harlow%20Interiors&owner=Sarah personalises the session; ?autoplay=1 runs it hands-free.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const name = params.get('business');
    const owner = params.get('owner');
    if (name !== null || owner !== null) {
      const view = businessFrom(name, owner);
      setBusiness(view);
      storageSet(BUSINESS_KEY, view.personalised ? JSON.stringify({ name, owner }) : null);
    } else {
      const saved = storageGet(BUSINESS_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { name: string | null; owner: string | null };
          setBusiness(businessFrom(parsed.name, parsed.owner));
        } catch {
          storageSet(BUSINESS_KEY, null);
        }
      }
    }
    if (params.get('autoplay') === '1') {
      setAutoplay(true);
      setCaptions(true);
    }
  }, []);

  const hasHeroPlayed = useCallback(() => heroPlayed.current || storageGet(HERO_KEY) === '1', []);
  const markHeroPlayed = useCallback(() => {
    heroPlayed.current = true;
    storageSet(HERO_KEY, '1');
  }, []);

  const replay = useCallback((screen: Screen) => setReplays((r) => ({ ...r, [screen]: r[screen] + 1 })), []);

  const reset = useCallback(
    (options?: { replay?: boolean }) => {
      dispatch({ type: 'reset' });
      heroPlayed.current = false;
      storageSet(HERO_KEY, null);
      entrance.current = null;
      if (options?.replay !== false) setReplays((r) => Object.fromEntries(SCREENS.map((s) => [s, r[s] + 1])) as Record<Screen, number>);
    },
    [dispatch],
  );

  const toggleCaptions = useCallback(() => setCaptions((c) => !c), []);
  const setEntrance = useCallback((id: string, value: Entrance) => {
    entrance.current = { id, value, at: performance.now() };
  }, []);
  // Not cleared on read: a strict-mode double render reads it twice. It lapses instead,
  // so a later visit to the same card arrives the ordinary way.
  const takeEntrance = useCallback((id: string): Entrance => {
    const e = entrance.current;
    return e && e.id === id && performance.now() - e.at < ENTRANCE_TTL_MS ? e.value : null;
  }, []);
  const pulseXero = useCallback(() => setXeroPulse((n) => n + 1), []);
  const stopAutoplay = useCallback(() => setAutoplay(false), []);
  const send = useCallback((name: DemoCommand) => setCommand((c) => ({ name, nonce: (c?.nonce ?? 0) + 1 })), []);

  useAutoplayDirector(autoplay, { router, reset, send, stop: stopAutoplay });

  const value = useMemo<DemoValue>(
    () => ({
      business,
      hasHeroPlayed,
      markHeroPlayed,
      replays,
      replay,
      reset,
      captions,
      toggleCaptions,
      setEntrance,
      takeEntrance,
      xeroPulse,
      pulseXero,
      autoplay,
      stopAutoplay,
      command,
      send,
    }),
    [business, hasHeroPlayed, markHeroPlayed, replays, replay, reset, captions, toggleCaptions, setEntrance, takeEntrance, xeroPulse, pulseXero, autoplay, stopAutoplay, command, send],
  );
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider');
  return ctx;
}

export function useBusiness(): BusinessView {
  return useDemo().business;
}

/** Runs `handler` each time the presenter replays this screen's peak (not on mount). */
export function useReplay(screen: Screen, handler: () => void): void {
  const { replays } = useDemo();
  const seen = useRef(replays[screen]);
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    if (replays[screen] === seen.current) return;
    seen.current = replays[screen];
    h.current();
  }, [replays, screen]);
}

/** Runs `handler` when the hands-free run sends this command. */
export function useDemoCommand(name: DemoCommand, handler: () => void): void {
  const { command } = useDemo();
  const seen = useRef(command?.nonce ?? 0);
  const h = useRef(handler);
  h.current = handler;
  useEffect(() => {
    if (!command || command.nonce === seen.current) return;
    seen.current = command.nonce;
    if (command.name === name) h.current();
  }, [command, name]);
}

/* ------------------------------------------------------------------ */
/* ?autoplay=1: the whole story, hands-free, in about 80 seconds        */
/* ------------------------------------------------------------------ */

const SCRIPT: [ms: number, step: 'start' | 'review' | 'choose' | 'approve' | 'paperwork' | 'send' | 'vat' | 'file' | 'loop'][] = [
  [0, 'start'],
  [24_000, 'review'],
  [28_500, 'choose'],
  [31_500, 'approve'],
  [37_500, 'paperwork'],
  [41_000, 'send'],
  [56_000, 'vat'],
  [64_000, 'file'],
  [78_000, 'loop'],
];

function useAutoplayDirector(
  active: boolean,
  deps: { router: ReturnType<typeof useRouter>; reset: DemoValue['reset']; send: DemoValue['send']; stop: () => void },
): void {
  const ref = useRef(deps);
  ref.current = deps;
  useEffect(() => {
    if (!active) return undefined;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const run = (): void => {
      for (const [ms, step] of SCRIPT) {
        timers.push(
          setTimeout(() => {
            const { router, reset, send } = ref.current;
            switch (step) {
              case 'start':
                router.push('/dashboard');
                reset({ replay: false });
                break;
              case 'review':
                router.push('/review');
                break;
              case 'choose':
                send('review:choose');
                break;
              case 'approve':
                send('review:approve');
                break;
              case 'paperwork':
                router.push('/paperwork');
                break;
              case 'send':
                send('paperwork:send');
                break;
              case 'vat':
                router.push('/vat');
                break;
              case 'file':
                send('vat:send');
                break;
              case 'loop':
                run();
                break;
            }
          }, ms),
        );
      }
    };
    run();
    // A presenter pressing anything takes over from the hands-free run.
    const takeOver = (e: Event): void => {
      if (e.isTrusted) ref.current.stop();
    };
    window.addEventListener('keydown', takeOver);
    window.addEventListener('pointerdown', takeOver);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('keydown', takeOver);
      window.removeEventListener('pointerdown', takeOver);
    };
  }, [active]);
}
