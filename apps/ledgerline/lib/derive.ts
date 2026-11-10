import type { Document, ReadField, Reminder, VatReturn } from './types';
import { MINUTES_PER_APPROVAL, MINUTES_PER_DOCUMENT, MINUTES_READING_SUMMARY, MONTH, TODAY_ISO } from './constants';
import { reviewItemFor } from './data/reviewItems';
import { gbp } from './format';

/**
 * The only place aggregates are computed. Every badge, count and headline
 * figure on screen comes from a function in this file.
 */

const pence = (v: number): number => Math.round(v * 100);

/* ------------------------------------------------------------------ */
/* Queues                                                              */
/* ------------------------------------------------------------------ */

/** Needs your OK, in the order it is walked. */
export function needsOkQueue(docs: Document[]): Document[] {
  return docs
    .filter((d) => d.status === 'needs_ok')
    .sort((a, b) => (reviewItemFor(a.id)?.order ?? 99) - (reviewItemFor(b.id)?.order ?? 99));
}

export function openReminders(reminders: Reminder[]): Reminder[] {
  return reminders.filter((r) => r.status === 'open');
}

/** Can go out now: still open, under the limit, and not already sent while the app was open. */
export function canSend(r: Reminder): boolean {
  return r.status === 'open' && r.stage < r.of && r.lastSentAt < TODAY_ISO;
}

/* ------------------------------------------------------------------ */
/* The month counters                                                  */
/* ------------------------------------------------------------------ */

export interface Counters {
  /** Documents received this month: the month figure plus anything read since the page opened. */
  received: number;
  needsOk: number;
  /** Taken out of the queue while we ask the supplier. */
  onHold: number;
  /** Everything received that is not waiting on you or a supplier. */
  done: number;
  /** Documents that came to the owner this month: waiting, held, or approved by them. */
  touched: number;
  /** Read, sorted and added to Xero without the owner: received less touched. */
  auto: number;
  missing: number;
  /** Minutes the month's documents would take to key and file by hand. */
  manualMinutes: number;
  /** Minutes left for the owner: approving what came to them, and reading the summary. */
  minutesWithUs: number;
  spendingSorted: number;
}

export function counters(docs: Document[], reminders: Reminder[]): Counters {
  const session = docs.filter((d) => d.origin === 'session');
  const received = MONTH.documentsReceived + session.length;
  const needsOk = docs.filter((d) => d.status === 'needs_ok').length;
  const onHold = docs.filter((d) => d.status === 'on_hold').length;
  const touched = needsOk + onHold + docs.filter((d) => d.approvedByYou).length;
  // The month figure covers what was added before today's session; documents read
  // or approved since then add their totals to it.
  const addedSince = docs.filter((d) => d.status === 'done' && (d.origin === 'session' || d.approvedByYou));
  const spendingSorted = (pence(MONTH.spendingSorted) + addedSince.reduce((s, d) => s + pence(d.gross), 0)) / 100;
  return {
    received,
    needsOk,
    onHold,
    done: received - needsOk - onHold,
    touched,
    auto: received - touched,
    missing: openReminders(reminders).length,
    manualMinutes: received * MINUTES_PER_DOCUMENT,
    minutesWithUs: touched * MINUTES_PER_APPROVAL + MINUTES_READING_SUMMARY,
    spendingSorted,
  };
}

/** Reminders sent this month, and the documents they brought back, including replies since the page opened. */
export function reminderStats(remindersSentNow: number, reminders: Reminder[]): { sent: number; back: number } {
  const repliedNow = reminders.filter((r) => r.reply !== null).length;
  return { sent: MONTH.remindersSent + remindersSentNow, back: MONTH.documentsBack + repliedNow };
}

/** A VAT-inclusive total split into net and VAT at a percentage rate, to the penny. */
export function replyFigures(gross: number, ratePercent: number): { net: number; vat: number; gross: number } {
  const grossPence = pence(gross);
  const netPence = Math.round((grossPence * 100) / (100 + ratePercent));
  return { net: netPence / 100, vat: (grossPence - netPence) / 100, gross: grossPence / 100 };
}

/* ------------------------------------------------------------------ */
/* All documents                                                       */
/* ------------------------------------------------------------------ */

export type DocFilter = 'all' | 'auto' | 'needs_ok' | 'skipped';

export function filterDocs(docs: Document[], filter: DocFilter): Document[] {
  switch (filter) {
    case 'all':
      return docs;
    case 'auto':
      return docs.filter((d) => d.status === 'done' && !d.approvedByYou);
    case 'needs_ok':
      return docs.filter((d) => d.status === 'needs_ok');
    case 'skipped':
      return docs.filter((d) => d.status === 'skipped');
  }
}

/* ------------------------------------------------------------------ */
/* Needs your OK: the "Adds up" check                                  */
/* ------------------------------------------------------------------ */

/** Reads a typed amount: "£3,771.36", "3771.36" or "3,771". Null when it is not an amount. */
export function parseAmount(text: string): number | null {
  const clean = text.replace(/[£,\s]/g, '');
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Number(clean);
}

export interface AmountsCheck {
  ok: boolean;
  net: number;
  vat: number;
  gross: number;
  /** "£3,142.80 + £628.56 = £3,771.36", or what is wrong. */
  message: string;
  /** The fields to flag "Please check" when the amounts do not add up. */
  flagged: ReadField[];
}

export function amountsCheck(d: Document, edits: Partial<Record<ReadField, string>> | undefined): AmountsCheck {
  const read = (field: 'net' | 'vat' | 'gross'): number | null => {
    const typed = edits?.[field];
    return typed === undefined ? d[field] : parseAmount(typed);
  };
  const net = read('net');
  const vat = read('vat');
  const gross = read('gross');
  const unreadable = (['net', 'vat', 'gross'] as const).filter((f) => (f === 'net' ? net : f === 'vat' ? vat : gross) === null);
  if (net === null || vat === null || gross === null) {
    const field = unreadable[0];
    return {
      ok: false,
      net: d.net,
      vat: d.vat,
      gross: d.gross,
      message: `"${edits?.[field] ?? ''}" is not an amount we can read`,
      flagged: [...unreadable],
    };
  }
  const sum = pence(net) + pence(vat);
  if (sum !== pence(gross)) {
    return {
      ok: false,
      net,
      vat,
      gross,
      message: `${gbp(net)} + ${gbp(vat)} = ${gbp(sum / 100)}, not ${gbp(gross)}`,
      flagged: ['net', 'vat', 'gross'],
    };
  }
  return { ok: true, net, vat, gross, message: `${gbp(net)} + ${gbp(vat)} = ${gbp(gross)}`, flagged: [] };
}

/* ------------------------------------------------------------------ */
/* VAT                                                                 */
/* ------------------------------------------------------------------ */

export interface VatFigures {
  b1: number;
  b2: number;
  b3: number;
  b4: number;
  b5: number;
  b6: number;
  b7: number;
  b8: number;
  b9: number;
  /** Positive when VAT is owed to HMRC. */
  toPay: number;
  readiness: number;
}

export function vatFigures(ret: VatReturn): VatFigures {
  const { b1, b2, b4, b6, b7, b8, b9 } = ret.boxes;
  const b3 = (pence(b1) + pence(b2)) / 100;
  const toPay = (pence(b3) - pence(b4)) / 100;
  return {
    b1,
    b2,
    b3,
    b4,
    b5: Math.abs(toPay),
    b6,
    b7,
    b8,
    b9,
    toPay,
    readiness: ret.documentsIn / ret.documentsExpected,
  };
}
