/**
 * Motion tokens. Only the agent working, numbers changing, state changes and
 * screen transitions move; one focal motion at a time; transform, opacity,
 * clip-path and filter only. Under reduced motion every choreography jumps to
 * its final state.
 */

/** Seconds, for framer-motion. */
export const DUR = {
  instant: 0,
  micro: 0.12,
  small: 0.2,
  medium: 0.32,
  large: 0.52,
  cinematic: 1.2,
} as const;

type Bezier = [number, number, number, number];

export const EASE: { outExpo: Bezier; inQuart: Bezier; scan: Bezier } = {
  /** All entrances. */
  outExpo: [0.16, 1, 0.3, 1],
  /** Exits. */
  inQuart: [0.5, 0, 0.75, 0],
  /** The scan beam. */
  scan: [0.55, 0, 0.45, 1],
};

export const CSS_EASE = {
  outExpo: 'cubic-bezier(0.16, 1, 0.3, 1)',
  scan: 'cubic-bezier(0.55, 0, 0.45, 1)',
} as const;

export const SPRING = {
  /** Field chips and document flights. */
  fly: { type: 'spring', stiffness: 260, damping: 26 },
  /** Layout and badges. */
  snap: { type: 'spring', stiffness: 400, damping: 34 },
  /** The invoice unfolding out of the email. */
  unfold: { type: 'spring', stiffness: 220, damping: 24 },
  /** An email stub dropping into the inbox. */
  drop: { type: 'spring', stiffness: 380, damping: 30 },
} as const;

/**
 * The Overview hero, "chaos to order", in ms from first paint. A month of
 * paperwork lies scattered and holds still, a scan passes over it, one
 * invoice is read in detail (on PIPELINE below), then the rest fly into a
 * ledger and an outbox, faster and faster, and the work meter settles.
 */
export const HERO = {
  label: 150,
  headline: 250,
  wordStagger: 70,
  /** Each piece of the mess fades in this long after the one before, then the pile holds still until `scan`. */
  pileStagger: 45,
  scan: 1500,
  scanDuration: 700,
  detail: 2000,
  /** The detail invoice's scan starts this long after it lifts out of the pile. */
  detailScanAfter: 350,
  sort: 3800,
  /** The rest leave the pile over this long, accelerating. */
  sortSpan: 1900,
  merge: 4500,
  fold: 5000,
  outbox: 6200,
  outboxStagger: 220,
  meter: 7200,
  cta: 7800,
  done: 8000,
} as const;

/** One document read in detail, in ms, at 1x speed. */
export const PIPELINE = {
  paper: 300,
  beamStart: 900,
  beamDuration: 1200,
  /** After the last field lands. */
  posted: 160,
} as const;

/** Typed text, ms per character. */
export const TYPE_MS = 18;

/** True when the OS asks for less motion. Read in effects and handlers, never in render. */
export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
