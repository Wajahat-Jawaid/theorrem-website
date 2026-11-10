'use client';

import { useCallback, useRef, useState } from 'react';
import { useIsoLayoutEffect } from '@/lib/agent';
import { useDemo, useReplay } from '@/lib/demo-store';
import { HERO, prefersReducedMotion } from '@/lib/motion';

/** Every beat the hero waits on, in ms from first paint. */
const BEATS = [HERO.label, HERO.headline, HERO.scan, HERO.detail, HERO.sort, HERO.merge, HERO.fold, HERO.outbox, HERO.meter, HERO.cta, HERO.done];

export interface HeroSequence {
  /** The latest beat reached; Infinity once the end state is shown. */
  now: number;
  /** True when the end state is rendered at once (reduced motion, or already played in this tab). */
  skip: boolean;
  /** Changes on every replay; key the stage on it so it starts fresh. */
  playKey: number;
  replay: () => void;
}

/**
 * The single timeline for the Overview's first eight seconds. Plays once per
 * tab on its own; Space or "Watch it again" replays it. Under reduced motion
 * it jumps straight to the end state.
 */
export function useHeroSequence(): HeroSequence {
  const { hasHeroPlayed, markHeroPlayed } = useDemo();
  const [playKey, setPlayKey] = useState(0);
  const [now, setNow] = useState(0);
  const [skip, setSkip] = useState(false);
  const forced = useRef(false);

  useIsoLayoutEffect(() => {
    if (prefersReducedMotion() || (!forced.current && hasHeroPlayed())) {
      setSkip(true);
      setNow(Infinity);
      return undefined;
    }
    setSkip(false);
    setNow(0);
    const ids = BEATS.map((t) =>
      setTimeout(() => {
        setNow(t);
        // Counted as played only once it has run to the end.
        if (t === HERO.done) {
          forced.current = false;
          markHeroPlayed();
        }
      }, t),
    );
    return () => ids.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey]);

  const replay = useCallback(() => {
    forced.current = true;
    // Leave the end state in the same render that remounts the stage, so it mounts unskipped.
    if (!prefersReducedMotion()) {
      setSkip(false);
      setNow(0);
    }
    setPlayKey((k) => k + 1);
  }, []);
  useReplay('overview', replay);

  return { now, skip, playKey, replay };
}
