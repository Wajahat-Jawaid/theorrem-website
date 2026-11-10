/**
 * Seeded pseudo-random source. The dataset is generated from fixed seeds so
 * every build, server render and browser render produces the same records.
 */
export interface Rng {
  next(): number;
  int(min: number, max: number): number;
  float(min: number, max: number): number;
  pick<T>(list: readonly T[]): T;
  weighted<T>(list: readonly (readonly [T, number])[]): T;
  chance(p: number): boolean;
  hex(length: number): string;
  digits(length: number): string;
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0;
  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number): number => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    float: (min, max) => min + next() * (max - min),
    pick: (list) => list[Math.floor(next() * list.length)],
    weighted: (list) => {
      const total = list.reduce((sum, [, w]) => sum + w, 0);
      let roll = next() * total;
      for (const [value, weight] of list) {
        roll -= weight;
        if (roll <= 0) return value;
      }
      return list[list.length - 1][0];
    },
    chance: (p) => next() < p,
    hex: (length) => {
      let out = '';
      for (let i = 0; i < length; i += 1) out += Math.floor(next() * 16).toString(16);
      return out;
    },
    digits: (length) => {
      let out = '';
      for (let i = 0; i < length; i += 1) out += String(int(i === 0 ? 1 : 0, 9));
      return out;
    },
  };
}

/** Stable string hash (FNV-1a) for deterministic per-name choices. */
export function hashString(value: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** Fills each '#' in an invoice number pattern with a digit. */
export function fillPattern(pattern: string, rng: Rng): string {
  return pattern.replace(/#/g, () => String(rng.int(0, 9)));
}
