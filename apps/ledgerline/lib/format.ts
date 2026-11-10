import { TODAY_MS } from './constants';

/**
 * Every figure on screen passes through one of these helpers. Formatting is
 * done by hand rather than through Intl so the server and every browser render
 * byte-identical output (no locale drift, no hydration mismatches).
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Round half away from zero to a number of decimal places. */
export function round(value: number, dp = 2): number {
  const factor = 10 ** dp;
  const scaled = Math.abs(value) * factor;
  const rounded = Math.round(scaled + 1e-7) / factor;
  return value < 0 ? -rounded : rounded;
}

/** Pennies helpers keep the dataset arithmetic exact. */
export const toPence = (value: number): number => Math.round(value * 100);
export const fromPence = (pence: number): number => pence / 100;

function group(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function fixed(value: number, dp: number): string {
  const r = round(Math.abs(value), dp);
  const [int, frac] = r.toFixed(dp).split('.');
  return frac === undefined ? group(int) : `${group(int)}.${frac}`;
}

const SYMBOL: Record<'GBP' | 'EUR', string> = { GBP: '£', EUR: '€' };

/** £3,771.36 — negatives in parentheses: (£412.00). */
export function gbp(value: number): string {
  return money(value, 'GBP');
}

export function money(value: number, currency: 'GBP' | 'EUR' = 'GBP'): string {
  const body = `${SYMBOL[currency]}${fixed(value, 2)}`;
  return value < 0 ? `(${body})` : body;
}

/** Whole pounds, for HMRC boxes 6 to 9. */
export function gbpWhole(value: number): string {
  const body = `£${fixed(value, 0)}`;
  return value < 0 ? `(${body})` : body;
}

/** £1.84m, £482.6k, £612. */
export function gbpCompact(value: number): string {
  const abs = Math.abs(value);
  let body: string;
  if (abs >= 1_000_000) body = `£${round(abs / 1_000_000, 2).toFixed(2)}m`;
  else if (abs >= 1_000) body = `£${round(abs / 1_000, 1).toFixed(1)}k`;
  else body = `£${fixed(abs, 0)}`;
  return value < 0 ? `(${body})` : body;
}

function trim(value: number, dp: number): string {
  return round(value, dp).toFixed(dp).replace(/\.0+$/, '').replace(/(\.\d*?)0+$/, '$1');
}

/** Axis ticks: £24k, £1.2m, 1.2k, 800. */
export function axisMoney(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `£${trim(abs / 1_000_000, 1)}m`;
  if (abs >= 1_000) return `£${trim(abs / 1_000, 1)}k`;
  return `£${trim(abs, 0)}`;
}

export function axisCount(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000) return `${trim(abs / 1_000, 1)}k`;
  return trim(abs, 0);
}

/** 1,284 */
export function count(value: number): string {
  const body = fixed(value, 0);
  return value < 0 ? `-${body}` : body;
}

/** Ratio in, percentage out: pct(0.826) → 82.6%. */
export function pct(ratio: number, dp = 1): string {
  return `${round(ratio * 100, dp).toFixed(dp)}%`;
}

/** Percentage-point difference between two ratios: 4.1% */
export function pctPoints(a: number, b: number, dp = 1): string {
  return `${round(Math.abs(a - b) * 100, dp).toFixed(dp)}%`;
}

/** Signed relative change between two values: 3.3% */
export function change(current: number, previous: number, dp = 1): string {
  if (previous === 0) return '0.0%';
  return `${round((Math.abs(current - previous) / previous) * 100, dp).toFixed(dp)}%`;
}

export interface DateParts {
  y: number;
  m: number;
  d: number;
  hh: number;
  mm: number;
}

/** Reads the wall-clock parts written in an ISO string (London local time). */
export function parts(iso: string): DateParts {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}))?/.exec(iso);
  if (!match) throw new Error(`Unreadable date: ${iso}`);
  return {
    y: Number(match[1]),
    m: Number(match[2]),
    d: Number(match[3]),
    hh: match[4] ? Number(match[4]) : 0,
    mm: match[5] ? Number(match[5]) : 0,
  };
}

const pad = (n: number): string => String(n).padStart(2, '0');

/** 14 Oct 2026 */
export function dateLong(iso: string): string {
  const p = parts(iso);
  return `${p.d} ${MONTHS_SHORT[p.m - 1]} ${p.y}`;
}

/** 14 October 2026 */
export function dateFull(iso: string): string {
  const p = parts(iso);
  return `${p.d} ${MONTHS_LONG[p.m - 1]} ${p.y}`;
}

/** 14/10/2026 */
export function dateShort(iso: string): string {
  const p = parts(iso);
  return `${pad(p.d)}/${pad(p.m)}/${p.y}`;
}

/** 14 Oct */
export function dayMonth(iso: string): string {
  const p = parts(iso);
  return `${p.d} ${MONTHS_SHORT[p.m - 1]}`;
}

export function monthShort(iso: string): string {
  return MONTHS_SHORT[parts(iso).m - 1];
}

export function monthLong(iso: string): string {
  return MONTHS_LONG[parts(iso).m - 1];
}

/** Monday */
export function weekday(iso: string): string {
  const p = parts(iso);
  return WEEKDAYS[new Date(Date.UTC(p.y, p.m - 1, p.d)).getUTCDay()];
}

/** 08:14 */
export function time(iso: string): string {
  const p = parts(iso);
  return `${pad(p.hh)}:${pad(p.mm)}`;
}

/** 21 Oct 2026, 08:14 */
export function dateTime(iso: string): string {
  return `${dateLong(iso)}, ${time(iso)}`;
}

function dayNumber(iso: string): number {
  const p = parts(iso);
  return Math.floor(Date.UTC(p.y, p.m - 1, p.d) / 86_400_000);
}

const TODAY_DAY = dayNumber('2026-10-21');

/** Whole calendar days from today to the date; negative when in the past. */
export function daysFromToday(iso: string): number {
  return dayNumber(iso) - TODAY_DAY;
}

/** Calendar days between two dates (b − a). */
export function daysBetween(a: string, b: string): number {
  return dayNumber(b) - dayNumber(a);
}

/** "just now", "14 minutes ago", "2 hours ago", "yesterday", "4 days ago" — against TODAY. */
export function relative(iso: string, nowMs: number = TODAY_MS): string {
  const seconds = Math.floor((nowMs - Date.parse(iso)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  const days = TODAY_DAY - dayNumber(iso);
  if (days <= 0) {
    if (minutes < 60) return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  }
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 60) return `${Math.floor(days / 7)} weeks ago`;
  return dateLong(iso);
}

/** "in 47 days", "tomorrow", "today", "overdue by 4 days". */
export function dueIn(iso: string): string {
  const days = daysFromToday(iso);
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  if (days > 1) return `due in ${days} days`;
  return days === -1 ? 'overdue by 1 day' : `overdue by ${-days} days`;
}

/** 3.2s under ten seconds, whole seconds above. */
export function duration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 10) return `${round(seconds, 1).toFixed(1)}s`;
  return `${Math.round(seconds)}s`;
}

/** 412 KB / 1.8 MB */
export function fileSize(kb: number): string {
  if (kb >= 1024) return `${round(kb / 1024, 1).toFixed(1)} MB`;
  return `${Math.round(kb)} KB`;
}

/** Converts an epoch to an ISO string in London wall-clock time with its offset. */
export function londonIso(ms: number): string {
  // British Summer Time in 2026 runs 29 Mar 01:00 UTC to 25 Oct 01:00 UTC.
  const bstStart = Date.UTC(2026, 2, 29, 1);
  const bstEnd = Date.UTC(2026, 9, 25, 1);
  const offsetHours = ms >= bstStart && ms < bstEnd ? 1 : 0;
  const local = new Date(ms + offsetHours * 3_600_000);
  const iso = `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}T${pad(
    local.getUTCHours(),
  )}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}`;
  return `${iso}${offsetHours ? '+01:00' : '+00:00'}`;
}

/** Clock face for the top bar, from an epoch. */
export function clock(ms: number): string {
  return time(londonIso(ms));
}

export function plural(n: number, one: string, many = `${one}s`): string {
  return `${count(n)} ${n === 1 ? one : many}`;
}

/** Initials for avatars and monograms: "Travis Perkins" → "TP". */
export function initials(name: string): string {
  const words = name
    .replace(/[&.,()]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 0 && !['and', 'of', 'the', 'Ltd', 'LLP', 'Plc', 'Limited'].includes(w));
  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
