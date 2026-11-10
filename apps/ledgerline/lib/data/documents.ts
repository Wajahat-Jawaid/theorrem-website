import type { Document, Supplier, VatCode } from '../types';
import { supplier as getSupplier } from './suppliers';
import { addDays, assemble, bst, computeTotals, shiftIso, type LineSpec } from './builder';
import { createRng, fillPattern, type Rng } from './random';
import { SITES } from './business';
import { reviewDocs } from './reviewItems';
import { assertDataset } from './validate';
import { CHECK_LIMIT } from '../constants';

/**
 * The latest 60 of the 312 documents Mercer Construction sent in October:
 * 3 that need the owner's OK, 2 skipped duplicates and 55 done automatically.
 * A handful are written by hand because other screens point at them; the rest
 * are generated from fixed seeds, so every render produces the same records.
 */

const L = (description: string, quantity: number, unit: string, unitPrice: number, vatCode: VatCode = 'S20'): LineSpec => ({
  description,
  quantity,
  unit,
  unitPrice,
  vatCode,
});

export const ANCHOR_IDS = {
  screwfixToday: 'doc_4e1a7c92',
  jewsonOriginal: 'doc_19ad6e40',
  jewsonDuplicate: 'doc_d70b3c95',
  btToday: 'doc_6c2f91d8',
  speedyToday: 'doc_a8e3402b',
  toolstationOriginal: 'doc_2b7d5e16',
  toolstationDuplicate: 'doc_f40c8a63',
  cityPlumbingOriginal: 'doc_83d1f6a0',
} as const;

/** Added this morning; the first line of the Overview feed. */
const screwfixToday = assemble({
  id: ANCHOR_IDS.screwfixToday,
  supplierId: 'screwfix',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-21', 9, 11, 26),
  addedAt: bst('2026-10-21', 9, 12, 4),
  invoiceDate: '2026-10-21',
  invoiceNumber: 'SFX4411968',
  category: '310',
  lines: [
    L('Turbo Gold PZ2 screws 5x70mm, box of 200', 2, 'box', 12.49),
    L('Wago 221-413 lever connectors, pack of 50', 1, 'pack', 18.66),
    L('Dust sheets, pack of 3', 2, 'pack', 8.32),
    L('Duct tape 50mm x 50m', 1, 'roll', 9.89),
  ],
});

const jewsonLines = [
  L('Plasterboard 12.5mm tapered edge 2400x1200mm', 90, 'sheet', 10.45),
  L('C16 CLS studwork 38x89mm, 3.0m', 120, 'length', 6.4),
  L('Galvanised joist hanger 47x150mm', 40, 'each', 2.8),
];

const jewsonOriginal = assemble({
  id: ANCHOR_IDS.jewsonOriginal,
  supplierId: 'jewson',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-12', 10, 30, 12),
  addedAt: bst('2026-10-12', 10, 31, 2),
  invoiceDate: '2026-10-09',
  invoiceNumber: 'INV-4471',
  accountNumber: 'MERC-1180',
  purchaseOrder: 'MC-2026-0402',
  deliverySite: SITES[0],
  category: '310',
  lines: jewsonLines,
});

/** The same Jewson invoice sent again this morning: skipped. */
const jewsonDuplicate = assemble({
  id: ANCHOR_IDS.jewsonDuplicate,
  supplierId: 'jewson',
  status: 'skipped',
  origin: 'month',
  receivedAt: bst('2026-10-21', 9, 3, 18),
  invoiceDate: '2026-10-09',
  invoiceNumber: 'INV-4471',
  accountNumber: 'MERC-1180',
  purchaseOrder: 'MC-2026-0402',
  deliverySite: SITES[0],
  category: '310',
  lines: jewsonLines,
  duplicateOf: ANCHOR_IDS.jewsonOriginal,
});

const btToday = assemble({
  id: ANCHOR_IDS.btToday,
  supplierId: 'bt-business',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-21', 8, 45, 9),
  addedAt: bst('2026-10-21', 8, 46, 1),
  invoiceDate: '2026-10-19',
  invoiceNumber: 'BTB-GP448102',
  accountNumber: 'GP44810',
  category: '489',
  lines: [L('Business Full Fibre 500, monthly', 1, 'month', 62), L('Cloud Voice user licence, monthly', 3, 'user', 12)],
});

const speedyToday = assemble({
  id: ANCHOR_IDS.speedyToday,
  supplierId: 'speedy-hire',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-21', 7, 54, 22),
  addedAt: bst('2026-10-21', 7, 55, 10),
  invoiceDate: '2026-10-20',
  invoiceNumber: 'SPH-71448391',
  accountNumber: 'MERC-5512',
  purchaseOrder: 'MC-2026-0428',
  deliverySite: SITES[1],
  category: '325',
  lines: [L('Hilti TE 1000 breaker hire, 14–20 Oct', 1, 'week', 168.4), L('Delivery and collection, Barking', 2, 'trip', 77.73)],
});

const toolstationLines = [L('Rubble sacks, pack of 10', 4, 'pack', 4.32), L('PTFE tape 12m, pack of 10', 2, 'pack', 2.74)];

const toolstationOriginal = assemble({
  id: ANCHOR_IDS.toolstationOriginal,
  supplierId: 'toolstation',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-14', 12, 6, 40),
  addedAt: bst('2026-10-14', 12, 7, 15),
  invoiceDate: '2026-10-14',
  invoiceNumber: 'TS-590817',
  category: '310',
  lines: toolstationLines,
});

/** A second photo of the same Toolstation receipt, sent the next day: skipped. */
const toolstationDuplicate = assemble({
  id: ANCHOR_IDS.toolstationDuplicate,
  supplierId: 'toolstation',
  status: 'skipped',
  origin: 'month',
  receivedAt: bst('2026-10-15', 8, 2, 51),
  invoiceDate: '2026-10-14',
  invoiceNumber: 'TS-590817',
  category: '310',
  lines: toolstationLines,
  duplicateOf: ANCHOR_IDS.toolstationOriginal,
});

/** Sent again during "See it work", where it is skipped. */
export const cityPlumbingLines = [
  L('Worcester Greenstar 4000 30kW combi boiler', 1, 'each', 1124),
  L('Copper tube 15mm x 3m', 20, 'length', 19.85),
  L('Pegler Terrier TRV and lockshield set', 6, 'set', 15.9),
];

const cityPlumbingOriginal = assemble({
  id: ANCHOR_IDS.cityPlumbingOriginal,
  supplierId: 'city-plumbing',
  status: 'done',
  origin: 'month',
  receivedAt: bst('2026-10-16', 11, 48, 3),
  addedAt: bst('2026-10-16', 11, 48, 52),
  invoiceDate: '2026-10-15',
  invoiceNumber: 'CPS-741206',
  accountNumber: 'MERC-3307',
  purchaseOrder: 'MC-2026-0419',
  deliverySite: SITES[1],
  category: '310',
  lines: cityPlumbingLines,
});

const anchors: Document[] = [
  ...reviewDocs,
  screwfixToday,
  jewsonOriginal,
  jewsonDuplicate,
  btToday,
  speedyToday,
  toolstationOriginal,
  toolstationDuplicate,
  cityPlumbingOriginal,
];

/* ------------------------------------------------------------------ */
/* Generated records                                                   */
/* ------------------------------------------------------------------ */

/** Who Mercer buys from, by how often. */
const MIX: [supplierId: string, weight: number][] = [
  ['jewson', 9],
  ['screwfix', 8],
  ['toolstation', 5],
  ['selco', 5],
  ['buildbase', 4],
  ['wickes', 4],
  ['sig-roofing', 3],
  ['city-plumbing', 3],
  ['keyline', 3],
  ['speedy-hire', 4],
  ['hss-hire', 2],
  ['a-plant', 2],
  ['shell-fuel', 2],
  ['bp-fuel', 2],
  ['enterprise-flex', 1],
  ['ee', 1],
  ['amazon-business', 2],
  ['royal-mail', 1],
  ['hiscox', 0.5],
  ['teale-plastering', 1],
  ['hollis-scaffolding', 1],
];

/** Suppliers that bill a set number of times a month. */
const MONTHLY_CAP: Record<string, number> = {
  ee: 1,
  hiscox: 1,
  'shell-fuel': 2,
  'bp-fuel': 2,
  'enterprise-flex': 1,
  'teale-plastering': 2,
  'hollis-scaffolding': 2,
};

const GENERATED = 60 - anchors.length;

const rng = createRng(1_284);
const usedIds = new Set<string>(anchors.map((d) => d.id));
const usedInvoices = new Set<string>(anchors.map((d) => `${d.supplierId}|${d.invoiceNumber}`));

function newId(r: Rng): string {
  let id = `doc_${r.hex(8)}`;
  while (usedIds.has(id)) id = `doc_${r.hex(8)}`;
  usedIds.add(id);
  return id;
}

function newInvoiceNumber(s: Supplier, r: Rng): string {
  let n = fillPattern(s.invoicePrefix, r);
  while (usedInvoices.has(`${s.id}|${n}`)) n = fillPattern(s.invoicePrefix, r);
  usedInvoices.add(`${s.id}|${n}`);
  return n;
}

/** 1 to 20 October, weekdays far busier than weekends. */
const DAY_WEIGHTS: [string, number][] = Array.from({ length: 20 }, (_, i) => {
  const date = addDays('2026-10-01', i);
  const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
  return [date, weekday === 0 ? 0.18 : weekday === 6 ? 0.34 : 1];
});

function receivedTime(r: Rng): string {
  const date = r.weighted(DAY_WEIGHTS);
  const hour = r.weighted([
    [7, 3], [8, 7], [9, 9], [10, 9], [11, 8], [12, 7], [13, 7], [14, 8], [15, 8], [16, 8], [17, 6], [18, 3],
  ] as const);
  return bst(date, hour, r.int(0, 59), r.int(0, 59));
}

function makeLines(s: Supplier, r: Rng): LineSpec[] {
  const max = s.layout === 'receipt' ? 3 : 4;
  const count = Math.min(s.catalogue.length, r.int(1, max));
  const pool = [...s.catalogue];
  const lines: LineSpec[] = [];
  for (let i = 0; i < count; i += 1) {
    const item = pool.splice(r.int(0, pool.length - 1), 1)[0];
    const quantity = Math.max(1, Math.round(item.maxQty * r.next() ** 1.6));
    const unitPrice = Math.round((item.min + (item.max - item.min) * r.next()) * 100) / 100;
    lines.push({ description: item.description, quantity, unit: item.unit, unitPrice, vatCode: s.defaultVat });
  }
  return lines;
}

/** Keeps generated records under the check limit, as anything over it comes to the owner. */
function capLines(lines: LineSpec[], limit: number): LineSpec[] {
  const out = lines.map((l) => ({ ...l }));
  for (let guard = 0; computeTotals(out).gross > limit && guard < 60; guard += 1) {
    const biggest = out.reduce((a, b) => (a.quantity * a.unitPrice > b.quantity * b.unitPrice ? a : b));
    if (biggest.quantity > 1) biggest.quantity = Math.max(1, Math.floor(biggest.quantity / 2));
    else if (out.length > 1) out.splice(out.indexOf(biggest), 1);
    else biggest.unitPrice = Math.round(biggest.unitPrice * 50) / 100;
  }
  return out;
}

function generate(): Document[] {
  const counts = new Map<string, number>();
  const out: Document[] = [];
  for (let i = 0; i < GENERATED; i += 1) {
    const mix = MIX.filter(([id]) => MONTHLY_CAP[id] === undefined || (counts.get(id) ?? 0) < MONTHLY_CAP[id]);
    const s = getSupplier(rng.weighted(mix));
    counts.set(s.id, (counts.get(s.id) ?? 0) + 1);
    const receivedAt = receivedTime(rng);
    const lag = s.layout === 'receipt' ? rng.int(0, 1) : s.terms === 'DD' ? rng.int(2, 8) : rng.int(0, 5);
    const trade = s.defaultCategory === '310' || s.defaultCategory === '325';
    out.push(
      assemble({
        id: newId(rng),
        supplierId: s.id,
        status: 'done',
        origin: 'month',
        receivedAt,
        addedAt: shiftIso(receivedAt, rng.int(18, 95) * 1000),
        invoiceDate: addDays(receivedAt.slice(0, 10), -lag),
        invoiceNumber: newInvoiceNumber(s, rng),
        category: s.defaultCategory,
        lines: capLines(makeLines(s, rng), CHECK_LIMIT - 50),
        purchaseOrder: trade && s.layout === 'invoice' && rng.chance(0.55) ? `MC-2026-0${rng.int(300, 499)}` : null,
        deliverySite: trade && s.layout === 'invoice' && rng.chance(0.6) ? rng.pick(SITES) : null,
      }),
    );
  }
  return out;
}

/** The latest 60 documents, newest first. */
export const documents: Document[] = [...anchors, ...generate()].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

assertDataset(documents);
