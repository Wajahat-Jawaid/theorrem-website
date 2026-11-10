import { ALL_SHOWN, NONE_SHOWN, emptyModel, type DashboardModel, type Field, type RowModel } from './model';
import { DOCS, MONTH, bankLine, type BankId, type DocId } from './month';
import { gbp } from '@/lib/format';

/**
 * The live demo's script: six chapters on one clock, in ms from the start of
 * the loop. Every change to the dashboard happens at a cue listed here, and
 * every piece of data that moves is a flight listed here, so the screen at
 * any moment is a pure function of the time. That is what lets the loop run
 * forever without drifting, and lets a jump land on a clean chapter start.
 */

export type Region =
  | 'lane:email'
  | 'lane:whatsapp'
  | 'lane:post'
  | 'lane:bank'
  | 'count:in'
  | 'count:auto'
  | 'count:ok'
  | 'count:saved'
  | 'list'
  | 'card:bank'
  | 'card:missing'
  | 'card:ok'
  | 'card:vat';

export interface Chapter {
  n: number;
  start: number;
  end: number;
  /** When the chapter has reached its final state: what reduced motion shows. */
  still: number;
  title: string;
  payoff: string;
  /** What stays lit, from each offset into the chapter. Everything else dims. */
  focus: [offset: number, regions: Region[]][];
}

export const CHAPTERS: Chapter[] = [
  {
    n: 1,
    start: 0,
    end: 6000,
    still: 5900,
    title: 'Everything arrives in one place.',
    payoff: 'Email, WhatsApp, the post and your bank, all in one list.',
    focus: [[0, ['lane:email', 'lane:whatsapp', 'lane:post', 'count:in', 'list']]],
  },
  {
    n: 2,
    start: 6000,
    end: 12000,
    still: 11900,
    title: 'Read for you. No typing.',
    payoff: 'Supplier, date, amount and VAT, read straight off the page.',
    focus: [[0, ['lane:email', 'list', 'count:auto', 'count:saved']]],
  },
  {
    n: 3,
    start: 12000,
    end: 18000,
    still: 17900,
    title: 'Every payment matched.',
    payoff: 'Each bank payment paired with its paperwork. Duplicates caught.',
    focus: [
      [0, ['lane:bank', 'card:bank', 'list']],
      [3300, ['lane:bank', 'card:bank', 'list', 'count:in']],
    ],
  },
  {
    n: 4,
    start: 18000,
    end: 24000,
    still: 23900,
    title: 'We chase what’s missing.',
    payoff: 'No receipt? We ask the supplier for it, politely.',
    focus: [
      [0, ['lane:bank', 'card:missing']],
      [4000, ['lane:email', 'card:missing', 'list', 'count:in', 'count:auto']],
    ],
  },
  {
    n: 5,
    start: 24000,
    end: 30000,
    still: 29900,
    title: 'You only check the odd one.',
    payoff: 'One plain question, one tap. That’s your part.',
    focus: [[0, ['list', 'card:ok', 'count:ok', 'count:auto', 'count:saved']]],
  },
  {
    n: 6,
    start: 30000,
    end: 41500,
    still: 37000,
    title: 'Your month, done.',
    payoff: 'VAT return ready to file. Your accountant’s email ready to send.',
    focus: [
      [0, ['list', 'card:vat']],
      [2200, ['card:vat', 'list', 'count:in']],
      [4300, ['card:vat', 'count:in', 'count:auto', 'count:ok', 'count:saved']],
    ],
  },
];

export const LOOP = CHAPTERS[CHAPTERS.length - 1].end;
/** The dashboard fades out over the last of the hold, and back in at the start. */
export const CURTAIN = { out: LOOP - 500, in: 400 } as const;

export function chapterAt(t: number): Chapter {
  return CHAPTERS.find((c) => t >= c.start && t < c.end) ?? CHAPTERS[CHAPTERS.length - 1];
}

export function focusAt(t: number): Set<Region> {
  const ch = chapterAt(t);
  let regions = ch.focus[0][1];
  for (const [offset, r] of ch.focus) if (t >= ch.start + offset) regions = r;
  return new Set(regions);
}

/* ------------------------------------------------------------------ */
/* Where things are on screen                                          */
/* ------------------------------------------------------------------ */

export const SEL = {
  src: (id: string) => `[data-src="${id}"]`,
  burst: (lane: 'email' | 'whatsapp' | 'post') => `[data-burst="${lane}"]`,
  listThumb: '[data-dst="list-thumb"]',
  listMore: '[data-dst="list-more"]',
  cell: (doc: DocId, field: Field | 'note' | 'status') => `[data-cell="${doc}:${field}"]`,
  thumb: (doc: DocId) => `[data-thumb="${doc}"]`,
  row: (doc: DocId) => `[data-row="${doc}"]`,
  bankSlot: (i: number) => `[data-bank-slot="${i}"]`,
  missing: '[data-dst="missing"]',
  askThumb: '[data-dst="ask-thumb"]',
  askAnswer: '[data-src="ask-answer"]',
  vat: '[data-dst="vat"]',
  attach: (k: 'books' | 'vat' | 'docs') => `[data-dst="attach-${k}"]`,
  field: (f: Field) => `[data-field="${f}"]`,
} as const;

/* ------------------------------------------------------------------ */
/* The lanes                                                           */
/* ------------------------------------------------------------------ */

export interface LaneModel {
  /** Items that have left their lane, by id: a document, a bank line, or the City Plumbing scan. */
  gone: Record<string, boolean>;
  /** Sam's reply has arrived in the email lane. */
  reply: boolean;
  /** The Speedy Hire payment is flagged: no receipt. */
  flagged: boolean;
  /** The Travis Perkins email is open while its invoice is read. */
  open: boolean;
}

/* ------------------------------------------------------------------ */
/* Flights                                                             */
/* ------------------------------------------------------------------ */

export type FlightArt =
  | { kind: 'doc'; doc: DocId }
  | { kind: 'scan-extra' }
  | { kind: 'particle'; tone: number }
  | { kind: 'bank'; line: BankId }
  | { kind: 'chip'; text: string; tone: 'paper' | 'mint' | 'brass'; mono?: boolean };

export interface Flight {
  id: string;
  start: number;
  /** The landing; the flying copy fades out over LINGER after it. */
  land: number;
  from: string;
  to: string;
  art: FlightArt;
  /** box: the art is fitted to the source and target boxes. centre: it keeps its size. */
  fit: 'box' | 'centre';
  /** How much it grows at the top of its arc. */
  lift: number;
}

export const FLY_MS = 600;
export const LINGER = 180;

/* ------------------------------------------------------------------ */
/* Overlay timings                                                     */
/* ------------------------------------------------------------------ */

export const INVOICE = { open: 6200, zoom: 6300, zoomMs: 600, beam: 7000, beamMs: 1300, back: 10000, backMs: 480, gone: 10500 } as const;
const LIFT_AT: Record<'supplier' | 'date' | 'amount' | 'vat', number> = { supplier: 8400, date: 8650, amount: 8900, vat: 9150 };
const TP_DONE = 9850;
const SWEEP = { start: 10500, first: 10620, gap: 140, ms: 1200, moreDone: 11560 } as const;
export const LIST_SWEEP = { start: SWEEP.start, ms: SWEEP.ms } as const;

const BANK_AT: [BankId, number][] = [
  ['b_tp', 12300],
  ['b_jewson', 13100],
  ['b_screwfix', 13750],
  ['b_aplant', 14300],
];
/** A connector stays drawn this long after its line lands, and the row's tick comes up partway. */
export const CONNECT = { draw: 300, hold: 520, fade: 200, tick: 300 } as const;
const DUP = { twice: 15300, merge: 15900, mergeMs: 420, gone: 16380 } as const;
export const MERGE_MS = DUP.mergeMs;
const BULK_AT = 16800;
const FLAG_AT = 17200;

const MISSING_AT = 18300;
export const CHASE = { open: 19100, type: 19400, typeMs: 1700, send: 21200, fly: 21420, flyMs: 480, gone: 21900 } as const;
const CHASING_AT = CHASE.fly;
const REPLY_AT = 22200;
const REPLY_FLY = 22700;
const SORTED_AT = 23500;

const ASK_FLY = 24300;
export const CURSOR = { in: 25200, move: 25300, moveMs: 1000, press: 26450, release: 26620, out: 27600, outMs: 300 } as const;
const ANSWER_FLY = 26700;

const VAT_FLY = 30300;
const VAT_GAP = 110;
const SALES_FLY = 30420;
const VAT_READY = 31700;
export const OUTBOX = { open: 32300, ready: 33900 } as const;
const ATTACH_AT: ['books' | 'vat' | 'docs', string, number][] = [
  ['books', '[data-src="books"]', 32700],
  ['vat', '[data-src="vat-card"]', 32950],
  ['docs', '[data-src="count-in"]', 33200],
];
export const BAR = { in: 34400, shrink: 34900, shrinkMs: 1300, label: 36000, cut: 36100 } as const;

/* ------------------------------------------------------------------ */
/* The script                                                          */
/* ------------------------------------------------------------------ */

interface Draft {
  dash: DashboardModel;
  lanes: LaneModel;
}

export interface Snapshot {
  t: number;
  dash: DashboardModel;
  lanes: LaneModel;
}

const events: { at: number; seq: number; fn: (d: Draft) => void }[] = [];
const flights: Flight[] = [];
const cueSet = new Set<number>([0, LOOP, CURTAIN.out]);
let seq = 0;

function at(ms: number, fn: (d: Draft) => void): void {
  events.push({ at: ms, seq: (seq += 1), fn });
  cueSet.add(ms);
}

function fly(f: Omit<Flight, 'land' | 'fit' | 'lift'> & { fit?: Flight['fit']; lift?: number }, onStart?: (d: Draft) => void, onLand?: (d: Draft) => void): void {
  const flight: Flight = { fit: 'box', lift: 0.5, ...f, land: f.start + FLY_MS };
  flights.push(flight);
  cueSet.add(flight.start);
  cueSet.add(flight.land);
  cueSet.add(flight.land + LINGER);
  if (onStart) at(flight.start, onStart);
  if (onLand) at(flight.land, onLand);
}

const rowOf = (d: Draft, id: DocId): RowModel | undefined => d.dash.rows.find((r) => r.id === id);
const bump = (r: RowModel | undefined): void => {
  if (r) r.pulse += 1;
};
const reading = (id: DocId): RowModel => ({ id, shown: { ...NONE_SHOWN }, status: 'reading', note: null, merging: false, twice: false, pulse: 1 });

/* Chapter 1: everything arrives. Eight documents, faster and faster, then the rest of the month at once. */
const ARRIVALS: [DocId, number][] = [
  ['tp', 600],
  ['screwfix', 1400],
  ['wickes', 2050],
  ['jewson', 2570],
  ['skips', 2990],
  ['aplant', 3340],
  ['aplant2', 3640],
  ['toolstation', 3900],
];
for (const [doc, start] of ARRIVALS) {
  fly(
    { id: `in-${doc}`, start, from: SEL.src(doc), to: SEL.listThumb, art: { kind: 'doc', doc } },
    (d) => {
      d.lanes.gone[doc] = true;
    },
    (d) => {
      d.dash.rows.unshift(reading(doc));
    },
  );
}
const BURST_LANES = ['post', 'email', 'whatsapp'] as const;
const BURST = 12;
for (let i = 0; i < BURST; i += 1) {
  const start = 4250 + i * 45;
  const first = i === 0;
  fly(
    {
      id: `burst-${i}`,
      start,
      from: first ? SEL.src('cityplumbing') : SEL.burst(BURST_LANES[i % 3]),
      to: SEL.listMore,
      art: first ? { kind: 'scan-extra' } : { kind: 'particle', tone: i },
      lift: 0.3,
    },
    first
      ? (d) => {
          d.lanes.gone.cityplumbing = true;
        }
      : undefined,
    // The rest of the month rolls in with the burst: 96, then 208, then all 304.
    i === 0 || i === 5 || i === BURST - 1
      ? (d) => {
          d.dash.more = i === 0 ? 96 : i === 5 ? 208 : MONTH.more;
        }
      : undefined,
  );
}

/* Chapter 2: one invoice read in detail, then the rest. */
at(INVOICE.open, (d) => {
  d.lanes.open = true;
});
for (const k of [INVOICE.zoom, INVOICE.zoom + INVOICE.zoomMs, INVOICE.beam, INVOICE.beam + INVOICE.beamMs, INVOICE.back, INVOICE.gone]) cueSet.add(k);
const TP = DOCS.tp;
const FIELD_TEXT: Record<'supplier' | 'date' | 'amount' | 'vat', { text: string; mono: boolean }> = {
  supplier: { text: TP.supplier, mono: false },
  date: { text: '8 Oct 2026', mono: false },
  amount: { text: gbp(TP.amount), mono: true },
  vat: { text: `VAT ${gbp(TP.vat)}`, mono: true },
};
for (const f of ['supplier', 'date', 'amount', 'vat'] as const) {
  fly(
    { id: `field-${f}`, start: LIFT_AT[f], from: SEL.field(f), to: SEL.cell('tp', f), art: { kind: 'chip', text: FIELD_TEXT[f].text, tone: 'paper', mono: FIELD_TEXT[f].mono }, fit: 'centre', lift: 0.12 },
    undefined,
    (d) => {
      const r = rowOf(d, 'tp');
      if (r) {
        r.shown = { ...r.shown, [f]: true };
        bump(r);
      }
    },
  );
}
at(TP_DONE, (d) => {
  const r = rowOf(d, 'tp');
  if (r) {
    r.shown = { ...ALL_SHOWN };
    r.status = 'done';
    bump(r);
  }
});
at(INVOICE.gone, (d) => {
  d.lanes.open = false;
});
// The scan sweeps down the list; each row it passes is read. Two are read but held back to check.
const SWEEP_ORDER: DocId[] = ['toolstation', 'aplant2', 'aplant', 'skips', 'jewson', 'wickes', 'screwfix'];
SWEEP_ORDER.forEach((id, i) => {
  at(SWEEP.first + i * SWEEP.gap, (d) => {
    const r = rowOf(d, id);
    if (!r) return;
    r.shown = { ...ALL_SHOWN };
    r.status = id === 'toolstation' || id === 'aplant2' ? 'checking' : 'done';
    bump(r);
  });
});
at(SWEEP.moreDone, (d) => {
  d.dash.moreDone = MONTH.more;
});
cueSet.add(SWEEP.start);
cueSet.add(SWEEP.start + SWEEP.ms);

/* Chapter 3: bank lines matched to their documents; the duplicate merges. */
export interface Connector {
  id: string;
  slot: number;
  doc: DocId;
  start: number;
}
export const CONNECTORS: Connector[] = [];
BANK_AT.forEach(([id, start], i) => {
  const line = bankLine(id);
  fly(
    { id: `bank-${id}`, start, from: SEL.src(id), to: SEL.bankSlot(i), art: { kind: 'bank', line: id }, lift: 0.15 },
    (d) => {
      d.lanes.gone[id] = true;
    },
    (d) => {
      d.dash.bank.lines.push(id);
      d.dash.bank.pulse += 1;
    },
  );
  const land = start + FLY_MS;
  CONNECTORS.push({ id: `link-${id}`, slot: i, doc: line.doc, start: land });
  for (const k of [land + CONNECT.draw + CONNECT.hold, land + CONNECT.draw + CONNECT.hold + CONNECT.fade]) cueSet.add(k);
  at(land + CONNECT.tick, (d) => {
    const r = rowOf(d, line.doc);
    if (r) {
      r.note = 'matched';
      bump(r);
    }
  });
});
at(DUP.twice, (d) => {
  for (const id of ['aplant', 'aplant2'] as const) {
    const r = rowOf(d, id);
    if (r) r.twice = true;
  }
});
at(DUP.merge, (d) => {
  const r = rowOf(d, 'aplant2');
  if (r) r.merging = true;
});
at(DUP.gone, (d) => {
  d.dash.rows = d.dash.rows.filter((r) => r.id !== 'aplant2');
  const r = rowOf(d, 'aplant');
  if (r) {
    r.twice = false;
    r.note = 'duplicate';
    bump(r);
  }
});
at(BULK_AT, (d) => {
  d.dash.bank.inBulk = MONTH.bankMatchedInBulk;
  d.dash.bank.pulse += 1;
  for (const [id, note] of [
    ['wickes', 'matched'],
    ['toolstation', 'matched'],
    ['skips', 'cash'],
  ] as const) {
    const r = rowOf(d, id);
    if (r) r.note = note;
  }
});
at(FLAG_AT, (d) => {
  d.lanes.flagged = true;
});

/* Chapter 4: the payment with no receipt is chased, and the receipt comes back. */
fly(
  { id: 'missing-b_speedy', start: MISSING_AT, from: SEL.src('b_speedy'), to: SEL.missing, art: { kind: 'bank', line: 'b_speedy' }, lift: 0.2 },
  (d) => {
    d.lanes.gone.b_speedy = true;
  },
  (d) => {
    d.dash.missing = { state: 'missing', pulse: d.dash.missing.pulse + 1 };
  },
);
for (const k of [CHASE.open, CHASE.type, CHASE.type + CHASE.typeMs, CHASE.send, CHASE.gone]) cueSet.add(k);
at(CHASING_AT, (d) => {
  d.dash.missing = { state: 'chasing', pulse: d.dash.missing.pulse + 1 };
});
at(REPLY_AT, (d) => {
  d.lanes.reply = true;
});
fly(
  { id: 'in-speedy', start: REPLY_FLY, from: SEL.src('speedy'), to: SEL.listThumb, art: { kind: 'doc', doc: 'speedy' } },
  (d) => {
    d.lanes.gone.speedy = true;
  },
  (d) => {
    d.dash.rows.unshift({ id: 'speedy', shown: { ...ALL_SHOWN }, status: 'done', note: 'matched', merging: false, twice: false, pulse: 1 });
    d.dash.bank.inBulk += 1;
    d.dash.bank.pulse += 1;
  },
);
at(SORTED_AT, (d) => {
  d.dash.missing = { state: 'sorted', pulse: d.dash.missing.pulse + 1 };
});

/* Chapter 5: the one question. */
fly(
  { id: 'ask-toolstation', start: ASK_FLY, from: SEL.thumb('toolstation'), to: SEL.askThumb, art: { kind: 'doc', doc: 'toolstation' }, lift: 0.35 },
  undefined,
  (d) => {
    d.dash.ask = { state: 'asking', pulse: d.dash.ask.pulse + 1 };
    const r = rowOf(d, 'toolstation');
    if (r) {
      r.status = 'needs_ok';
      bump(r);
    }
  },
);
for (const k of [CURSOR.in, CURSOR.move, CURSOR.move + CURSOR.moveMs, CURSOR.release, CURSOR.out, CURSOR.out + CURSOR.outMs]) cueSet.add(k);
at(CURSOR.press, (d) => {
  d.dash.ask = { state: 'pressed', pulse: d.dash.ask.pulse };
});
fly(
  { id: 'answer', start: ANSWER_FLY, from: SEL.askAnswer, to: SEL.cell('toolstation', 'note'), art: { kind: 'chip', text: MONTH.project, tone: 'mint' }, fit: 'centre', lift: 0.15 },
  undefined,
  (d) => {
    d.dash.ask = { state: 'answered', pulse: d.dash.ask.pulse + 1 };
    const r = rowOf(d, 'toolstation');
    if (r) {
      r.status = 'done';
      r.note = 'project';
      bump(r);
    }
  },
);

/* Chapter 6: the VAT return fills, the month-end email is ready, and the time shrinks. */
const VAT_ROWS: DocId[] = ['speedy', 'toolstation', 'aplant', 'jewson', 'wickes', 'screwfix', 'tp'];
VAT_ROWS.forEach((doc, i) => {
  fly({ id: `vat-${doc}`, start: VAT_FLY + i * VAT_GAP, from: SEL.cell(doc, 'vat'), to: SEL.vat, art: { kind: 'chip', text: gbp(DOCS[doc].vat), tone: 'brass', mono: true }, fit: 'centre', lift: 0.12 });
});
fly({ id: 'vat-sales', start: SALES_FLY, from: SEL.src('xero'), to: SEL.vat, art: { kind: 'chip', text: `Sales VAT ${gbp(MONTH.vatOnSales)}`, tone: 'brass', mono: true }, fit: 'centre', lift: 0.12 });
at(VAT_READY, (d) => {
  d.dash.vat = { state: 'ready', pulse: d.dash.vat.pulse + 1 };
});
at(OUTBOX.open, (d) => {
  d.dash.outbox = { state: 'drafting', attached: [] };
});
const ATTACH_TEXT = { books: 'Books', vat: 'VAT return', docs: `${MONTH.more + 8} documents` } as const;
for (const [k, from, start] of ATTACH_AT) {
  fly({ id: `attach-${k}`, start, from, to: SEL.attach(k), art: { kind: 'chip', text: ATTACH_TEXT[k], tone: 'paper' }, fit: 'centre', lift: 0.2 }, undefined, (d) => {
    d.dash.outbox = { ...d.dash.outbox, attached: [...d.dash.outbox.attached, k] };
  });
}
at(OUTBOX.ready, (d) => {
  d.dash.outbox = { ...d.dash.outbox, state: 'ready' };
});
for (const k of [BAR.in, BAR.shrink, BAR.shrink + BAR.shrinkMs, BAR.label, BAR.cut]) cueSet.add(k);
for (const ch of CHAPTERS) {
  cueSet.add(ch.start);
  cueSet.add(ch.still);
  for (const [offset] of ch.focus) cueSet.add(ch.start + offset);
}

export const ATTACH_LABEL = ATTACH_TEXT;
export const FLIGHTS: readonly Flight[] = flights.sort((a, b) => a.start - b.start);
export const CUES: readonly number[] = Array.from(cueSet)
  .filter((c) => c >= 0 && c <= LOOP)
  .sort((a, b) => a - b);

function initialLanes(): LaneModel {
  return { gone: {}, reply: false, flagged: false, open: false };
}

const SNAPSHOTS: Snapshot[] = (() => {
  const ordered = [...events].sort((a, b) => a.at - b.at || a.seq - b.seq);
  const draft: Draft = { dash: emptyModel(), lanes: initialLanes() };
  const out: Snapshot[] = [{ t: 0, dash: structuredClone(draft.dash), lanes: structuredClone(draft.lanes) }];
  let i = 0;
  while (i < ordered.length) {
    const t = ordered[i].at;
    while (i < ordered.length && ordered[i].at === t) {
      ordered[i].fn(draft);
      i += 1;
    }
    const snap = { t, dash: structuredClone(draft.dash), lanes: structuredClone(draft.lanes) };
    if (out[out.length - 1].t === t) out[out.length - 1] = snap;
    else out.push(snap);
  }
  return out;
})();

/** The dashboard and the lanes at time t. */
export function stateAt(t: number): Snapshot {
  let lo = 0;
  let hi = SNAPSHOTS.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (SNAPSHOTS[mid].t <= t) lo = mid;
    else hi = mid - 1;
  }
  return SNAPSHOTS[lo];
}

/** The flights in the air (or just landing) at time t. */
export function flightsAt(t: number): Flight[] {
  return FLIGHTS.filter((f) => t >= f.start && t < f.land + LINGER);
}

/** The last cue at or before ms. */
export function cueAtOrBefore(ms: number): number {
  let best = 0;
  for (const c of CUES) {
    if (c <= ms) best = c;
    else break;
  }
  return best;
}
