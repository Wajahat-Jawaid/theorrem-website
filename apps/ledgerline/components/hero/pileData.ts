import type { CategoryCode, Document, Reminder } from '@/lib/types';
import { ANCHOR_IDS, documents } from '@/lib/data/documents';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { categoryLabel } from '@/lib/data/categories';
import { siteManager } from '@/lib/data/business';
import { REMINDER_IDS, reminders as seedReminders } from '@/lib/data/reminders';
import { HERO } from '@/lib/motion';
import { HERO_DOC } from './stageData';

/**
 * The Overview's "chaos to order" stage: 24 representative pieces of
 * October's paperwork, where each one lies in the pile, and where it ends up
 * in the ledger or the outbox. Every document is a real record from the
 * month; the bank lines are those receipts' payments; the spreadsheet row,
 * the phone photo and the sticky note are the chases already on file.
 */

/** Where October's paperwork came from. The caption counts these. */
export const PLACES = ['Email', 'WhatsApp', 'Post', 'Bank feed', 'Spreadsheet'] as const;

export type Source = 'email' | 'whatsapp' | 'post' | 'bank' | 'sheet' | 'note';
export type Kind = 'email' | 'photo' | 'post' | 'bank' | 'sheet' | 'note';

/** Each kind of paper is drawn at one size, in stage units. */
export const SIZE: Record<Kind, { w: number; h: number }> = {
  email: { w: 156, h: 88 },
  photo: { w: 118, h: 156 },
  post: { w: 128, h: 166 },
  bank: { w: 176, h: 46 },
  sheet: { w: 188, h: 60 },
  note: { w: 104, h: 96 },
};

/* ------------------------------------------------------------------ */
/* Stage geometry, in stage units. The stage is scaled to its column.   */
/* ------------------------------------------------------------------ */

export const STAGE_W = 760;
export const STAGE_H = 428;
export const PANEL_TOP = 34;
export const PANEL_H = STAGE_H - PANEL_TOP;
export const LEDGER_W = 480;
export const OUTBOX_X = 496;
export const OUTBOX_W = STAGE_W - OUTBOX_X;
export const COL_X = [14, 248] as const;
export const COL_W = 218;
export const ROW_H = 22;
const GROUP_HEAD = 22;
const GROUP_GAP = 12;
const CONTENT_TOP = 44;
export const OUTBOX_ROW_TOP = 50;
export const OUTBOX_ROW_H = 72;
/** Chases the outbox draws in full; any more, such as items held in Review, are counted on one line. */
export const OUTBOX_SLOTS = 3;
export const OUTBOX_MORE_H = 24;
/** The envelope at the start of each outbox row. */
export const ENVELOPE = { x: 14, y: 12, w: 28, h: 20 } as const;

/* ------------------------------------------------------------------ */
/* The documents                                                       */
/* ------------------------------------------------------------------ */

function doc(id: string): Document {
  const found = documents.find((d) => d.id === id);
  if (!found) throw new Error(`The Overview pile points at a missing document ${id}`);
  return found;
}

/** The latest `n` documents added to Xero from one supplier, newest first. */
function latest(supplierId: string, n: number, opts: { layout?: Document['layout']; not?: string[] } = {}): Document[] {
  const out = documents
    .filter((d) => d.supplierId === supplierId && d.status === 'done' && d.origin === 'month')
    .filter((d) => !opts.layout || d.layout === opts.layout)
    .filter((d) => !opts.not?.includes(d.id))
    .slice(0, n);
  if (out.length < n) throw new Error(`The Overview pile needs ${n} documents from ${supplierId}`);
  return out;
}

const jewson = doc(ANCHOR_IDS.jewsonOriginal);
const jewsonCopy = doc(ANCHOR_IDS.jewsonDuplicate);
const [jewsonOther] = latest('jewson', 1, { layout: 'invoice', not: [jewson.id] });
const [cityPlumbing] = latest('city-plumbing', 1);
const [wickes] = latest('wickes', 1);
const [screwfixA, screwfixB] = latest('screwfix', 2, { layout: 'receipt' });
const [toolstationA, toolstationB] = latest('toolstation', 2, { layout: 'receipt' });
const [speedyOther] = latest('speedy-hire', 1, { not: [HERO_DOC.id] });
const [aPlant] = latest('a-plant', 1);
const [teale] = latest('teale-plastering', 1);
const [hollisA, hollisB] = latest('hollis-scaffolding', 2);
const [shell] = latest('shell-fuel', 1);
const [bp] = latest('bp-fuel', 1);

/** The till receipts whose card payments sit in the bank feed with nothing attached. */
const RECEIPTS = [screwfixA, toolstationA, screwfixB, toolstationB];

/* ------------------------------------------------------------------ */
/* The ledger: four categories and the bank lines, in two columns       */
/* ------------------------------------------------------------------ */

export interface LedgerRow {
  id: string;
  col: 0 | 1;
  /** Top, in ledger-panel units. */
  y: number;
  name: string;
  amount: number;
  /** Bank lines only: the payment date, and the receipt row it matched. */
  date?: string;
  matches?: string;
  tag?: string;
}

export interface GroupHead {
  id: string;
  label: string;
  col: 0 | 1;
  y: number;
}

const rowId = (d: Document): string => `row-${d.id}`;
const bankId = (d: Document): string => `bank-${d.id}`;

const COLUMNS: { col: 0 | 1; groups: { id: string; label: string; rows: Omit<LedgerRow, 'col' | 'y'>[] }[] }[] = [
  {
    col: 0,
    groups: [
      {
        id: '310',
        label: categoryLabel('310' as CategoryCode),
        rows: [jewson, jewsonOther, cityPlumbing, wickes, ...RECEIPTS].map((d) => ({
          id: rowId(d),
          name: getSupplier(d.supplierId).shortName,
          amount: d.gross,
          tag: d.id === jewson.id ? 'Duplicate removed' : undefined,
        })),
      },
      {
        id: 'bank',
        label: 'Bank lines matched',
        rows: RECEIPTS.map((d) => ({ id: bankId(d), name: getSupplier(d.supplierId).shortName, amount: d.gross, date: d.invoiceDate, matches: rowId(d) })),
      },
    ],
  },
  {
    col: 1,
    groups: [
      { id: '325', label: categoryLabel('325' as CategoryCode), rows: [HERO_DOC, speedyOther, aPlant].map(docRow) },
      { id: '320', label: categoryLabel('320' as CategoryCode), rows: [teale, hollisA, hollisB].map(docRow) },
      { id: '449', label: categoryLabel('449' as CategoryCode), rows: [shell, bp].map(docRow) },
    ],
  },
];

function docRow(d: Document): Omit<LedgerRow, 'col' | 'y'> {
  return { id: rowId(d), name: getSupplier(d.supplierId).shortName, amount: d.gross };
}

export const GROUPS: GroupHead[] = [];
export const ROWS: LedgerRow[] = [];
for (const { col, groups } of COLUMNS) {
  let y = CONTENT_TOP;
  for (const g of groups) {
    GROUPS.push({ id: g.id, label: g.label, col, y });
    y += GROUP_HEAD;
    for (const r of g.rows) {
      ROWS.push({ ...r, col, y });
      y += ROW_H;
    }
    y += GROUP_GAP;
  }
}

export const ROW_BY_ID = new Map(ROWS.map((r) => [r.id, r]));

/** A ledger row's top-left, in stage units. */
export function rowAt(id: string): { x: number; y: number } {
  const r = ROW_BY_ID.get(id);
  if (!r) throw new Error(`No ledger row ${id}`);
  return { x: COL_X[r.col], y: PANEL_TOP + r.y };
}

export const HERO_ROW = rowId(HERO_DOC);

/* ------------------------------------------------------------------ */
/* The pile                                                            */
/* ------------------------------------------------------------------ */

export type Destination =
  | { kind: 'detail' }
  | { kind: 'row'; row: string; order: number }
  | { kind: 'merge'; into: string }
  | { kind: 'chase'; reminderId: string };

export interface PileItem {
  id: string;
  kind: Kind;
  source: Source;
  /** Top-left and rotation in the pile, in stage units. */
  x: number;
  y: number;
  rot: number;
  /** The back layer is slightly out of focus. */
  back: boolean;
  doc?: Document;
  bank?: { date: string; payee: string; amount: number };
  sheet?: { date: string; what: string; amount: number; note: string };
  note?: string;
  /** Who sent the photo, when the record says. */
  sender?: string;
  blurry?: boolean;
  to: Destination;
}

const fuelChase = seedReminders.find((r) => r.id === REMINDER_IDS.fuel);
const howdensChase = seedReminders.find((r) => r.id === REMINDER_IDS.howdensCard);
const firstFuel = fuelChase?.items[0];
if (!fuelChase || !howdensChase || !firstFuel?.date || firstFuel.amount === null) throw new Error('The Overview pile needs the fuel and Howdens chases');

const docItem = (d: Document, kind: Kind, source: Source, x: number, y: number, rot: number, back: boolean, to: Destination, extra: Partial<PileItem> = {}): PileItem => ({
  id: `pile-${d.id}-${source}`,
  kind,
  source,
  x,
  y,
  rot,
  back,
  doc: d,
  to,
  ...extra,
});

const bankItem = (d: Document, x: number, y: number, rot: number, back: boolean, order: number): PileItem => ({
  id: `pile-${bankId(d)}`,
  kind: 'bank',
  source: 'bank',
  x,
  y,
  rot,
  back,
  bank: { date: d.invoiceDate, payee: getSupplier(d.supplierId).shortName, amount: d.gross },
  to: { kind: 'row', row: bankId(d), order },
});

const row = (d: Document, order: number): Destination => ({ kind: 'row', row: rowId(d), order });

/**
 * In drawing order, back to front. `order` is when each one leaves the pile:
 * the receipts before their bank lines, so the match can be drawn, and the
 * Jewson original last, so its "Duplicate removed" tag can be read first.
 */
const ALL_ITEMS: PileItem[] = [
  // The back layer.
  docItem(hollisA, 'post', 'post', 18, 40, -8, true, row(hollisA, 6)),
  docItem(cityPlumbing, 'email', 'email', 236, 32, 5, true, row(cityPlumbing, 4)),
  docItem(aPlant, 'email', 'email', 574, 38, -6, true, row(aPlant, 0)),
  bankItem(toolstationA, 440, 334, 6, true, 15),
  docItem(teale, 'email', 'email', 592, 262, 8, true, row(teale, 3)),
  docItem(toolstationB, 'photo', 'whatsapp', 150, 250, -11, true, row(toolstationB, 11)),
  docItem(bp, 'email', 'email', 22, 322, 4, true, row(bp, 10)),
  bankItem(screwfixB, 300, 370, -4, true, 16),
  // The front.
  docItem(wickes, 'post', 'post', 470, 112, -5, false, row(wickes, 9)),
  docItem(jewsonOther, 'email', 'email', 116, 150, 8, false, row(jewsonOther, 12)),
  docItem(screwfixA, 'email', 'email', 598, 150, 6, false, row(screwfixA, 2)),
  docItem(shell, 'email', 'email', 300, 214, -10, false, row(shell, 1)),
  bankItem(toolstationB, 566, 370, -3, false, 17),
  docItem(hollisB, 'email', 'email', 12, 210, -3, false, row(hollisB, 13)),
  docItem(jewsonCopy, 'photo', 'whatsapp', 392, 48, 10, false, { kind: 'merge', into: `pile-${jewson.id}-email` }),
  docItem(jewson, 'email', 'email', 196, 96, -4, false, row(jewson, 18)),
  docItem(screwfixB, 'email', 'email', 470, 270, 9, false, row(screwfixB, 8)),
  bankItem(screwfixA, 150, 372, 5, false, 14),
  docItem(speedyOther, 'email', 'email', 420, 206, -7, false, row(speedyOther, 7)),
  docItem(toolstationA, 'photo', 'whatsapp', 640, 248, 7, false, row(toolstationA, 5)),
  {
    id: 'pile-sheet-fuel',
    kind: 'sheet',
    source: 'sheet',
    x: 36,
    y: 98,
    rot: -6,
    back: false,
    sheet: { date: firstFuel.date, what: 'fuel??', amount: firstFuel.amount, note: `ask ${siteManager.firstName}` },
    to: { kind: 'chase', reminderId: fuelChase.id },
  },
  {
    id: 'pile-photo-fuel',
    kind: 'photo',
    source: 'whatsapp',
    x: 616,
    y: 60,
    rot: 12,
    back: false,
    sender: siteManager.name,
    blurry: true,
    to: { kind: 'chase', reminderId: fuelChase.id },
  },
  {
    id: 'pile-note-howdens',
    kind: 'note',
    source: 'note',
    x: 330,
    y: 120,
    rot: -9,
    back: false,
    note: `${getSupplier('howdens').shortName} paid by card??`,
    to: { kind: 'chase', reminderId: howdensChase.id },
  },
  docItem(HERO_DOC, 'email', 'email', 246, 252, 3, false, { kind: 'detail' }),
];

/** How many leave the pile for a ledger row, not counting the invoice read in detail. */
export const FLIGHTS = ALL_ITEMS.filter((i) => i.to.kind === 'row').length;

/** The pile as it stands: the chase pieces only while their chase is still open. */
export function pileFor(open: Reminder[]): PileItem[] {
  const ids = new Set(open.map((r) => r.id));
  return ALL_ITEMS.filter((i) => i.to.kind !== 'chase' || ids.has(i.to.reminderId));
}

/* ------------------------------------------------------------------ */
/* Timing                                                              */
/* ------------------------------------------------------------------ */

/** When an item leaves the pile for its row, and how long the flight takes: faster and faster. */
export function flight(order: number): { start: number; duration: number; land: number } {
  const f = FLIGHTS > 1 ? order / (FLIGHTS - 1) : 0;
  const start = HERO.sort + 150 + HERO.sortSpan * Math.sqrt(f);
  const duration = 520 - 200 * f;
  return { start, duration, land: start + duration * 0.85 };
}

/** The row the detail invoice lands in, after its read. */
export const HERO_LANDS = HERO.sort + 420;

/** When each ledger row appears. */
export const ROW_LANDS: Record<string, number> = Object.fromEntries([
  [HERO_ROW, HERO_LANDS],
  ...ALL_ITEMS.flatMap((i) => (i.to.kind === 'row' ? [[i.to.row, flight(i.to.order).land] as const] : [])),
]);

if (ROWS.some((r) => ROW_LANDS[r.id] === undefined)) throw new Error('Every ledger row needs a piece of paper that lands in it');

/** An item's centre in the pile. */
export function centre(i: PileItem): { x: number; y: number } {
  const s = SIZE[i.kind];
  return { x: i.x + s.w / 2, y: i.y + s.h / 2 };
}
