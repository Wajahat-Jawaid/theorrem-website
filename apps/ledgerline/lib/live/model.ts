import { round } from '@/lib/format';
import { MONTH, SAVED_HOURS_PER_DOC, type BankId, type DocId } from './month';

/**
 * What the dashboard shows at one moment. The live demo moves this from an
 * empty month to a finished one; /dashboard shows the finished one. The four
 * counters are never stored: they are worked out from the rows and the
 * documents behind them, so they always agree with the list and the cards.
 */

export type RowStatus = 'reading' | 'checking' | 'needs_ok' | 'done';

export type Field = 'supplier' | 'date' | 'amount' | 'vat' | 'category';

export interface RowModel {
  id: DocId;
  /** Which values are on the row yet. Until read, the row says who sent it. */
  shown: Record<Field, boolean>;
  status: RowStatus;
  /** The line under the status. */
  note: 'matched' | 'duplicate' | 'cash' | 'project' | null;
  /** The posted copy of a duplicate, sliding onto the original before it goes. */
  merging: boolean;
  /** Amber ring: the same invoice twice. */
  twice: boolean;
  /** Bumped on every change worth a mint glow. */
  pulse: number;
}

export interface DashboardModel {
  /** Newest first. */
  rows: RowModel[];
  /** Documents this month not drawn as rows, and how many of them are done. */
  more: number;
  moreDone: number;
  bank: { lines: BankId[]; inBulk: number; pulse: number };
  missing: { state: 'none' | 'missing' | 'chasing' | 'sorted'; pulse: number };
  ask: { state: 'none' | 'asking' | 'pressed' | 'answered'; pulse: number };
  vat: { state: 'building' | 'ready'; pulse: number };
  /** The month-end email to the accountant. */
  outbox: { state: 'none' | 'drafting' | 'ready'; attached: ('books' | 'vat' | 'docs')[] };
}

export interface Counters {
  docsIn: number;
  doneAuto: number;
  needsOk: number;
  savedHours: number;
  bankMatched: number;
}

export function counters(m: DashboardModel): Counters {
  const rows = m.rows.filter((r) => !r.merging);
  const doneAuto = rows.filter((r) => r.status === 'done').length + m.moreDone;
  return {
    docsIn: rows.length + m.more,
    doneAuto,
    needsOk: rows.filter((r) => r.status === 'needs_ok').length,
    savedHours: round(doneAuto * SAVED_HOURS_PER_DOC, 1),
    bankMatched: m.bank.lines.length + m.bank.inBulk,
  };
}

export const NONE_SHOWN: Record<Field, boolean> = { supplier: false, date: false, amount: false, vat: false, category: false };
export const ALL_SHOWN: Record<Field, boolean> = { supplier: true, date: true, amount: true, vat: true, category: true };

export function emptyModel(): DashboardModel {
  return {
    rows: [],
    more: 0,
    moreDone: 0,
    bank: { lines: [], inBulk: 0, pulse: 0 },
    missing: { state: 'none', pulse: 0 },
    ask: { state: 'none', pulse: 0 },
    vat: { state: 'building', pulse: 0 },
    outbox: { state: 'none', attached: [] },
  };
}

const done = (id: DocId, note: RowModel['note']): RowModel => ({ id, shown: ALL_SHOWN, status: 'done', note, merging: false, twice: false, pulse: 0 });

/** The finished month: where the demo ends, and what /dashboard shows. */
export const FINAL_MODEL: DashboardModel = {
  rows: [
    done('speedy', 'matched'),
    done('toolstation', 'project'),
    done('aplant', 'duplicate'),
    done('skips', 'cash'),
    done('jewson', 'matched'),
    done('wickes', 'matched'),
    done('screwfix', 'matched'),
    done('tp', 'matched'),
  ],
  more: MONTH.more,
  moreDone: MONTH.more,
  bank: { lines: ['b_tp', 'b_jewson', 'b_screwfix', 'b_aplant'], inBulk: MONTH.bankMatchedInBulk + 1, pulse: 0 },
  missing: { state: 'sorted', pulse: 0 },
  ask: { state: 'answered', pulse: 0 },
  vat: { state: 'ready', pulse: 0 },
  outbox: { state: 'ready', attached: ['books', 'vat', 'docs'] },
};
