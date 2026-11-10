import type { Document, Reminder, VatReturn } from '../types';
import { CHECK_LIMIT, MONTH, MONTH_START, TODAY_ISO } from '../constants';
import { linePence } from './builder';

const TODAY_MS = Date.parse(TODAY_ISO);
const MONTH_START_MS = Date.parse(`${MONTH_START}T00:00:00+01:00`);

const pence = (v: number): number => Math.round(v * 100);

/** Problems with a single record: arithmetic, dates and status. */
export function recordProblems(d: Document): string[] {
  const out: string[] = [];
  const lines = d.lineItems.reduce((s, l) => s + linePence({ quantity: l.quantity, unitPrice: l.unitPrice, net: l.net }), 0);
  if (lines !== pence(d.net)) out.push(`${d.id}: lines ${lines} ≠ net ${pence(d.net)}`);
  if (pence(d.net) + pence(d.vat) !== pence(d.gross)) out.push(`${d.id}: net + VAT ≠ total`);
  if (d.status === 'done' && !d.addedAt && d.origin === 'month') out.push(`${d.id}: done without a time`);
  if (d.status !== 'done' && d.addedAt) out.push(`${d.id}: added but not done`);
  if (d.addedAt && Date.parse(d.addedAt) < Date.parse(d.receivedAt)) out.push(`${d.id}: added before received`);
  if (d.status === 'skipped' && !d.duplicateOf) out.push(`${d.id}: skipped without an original`);
  return out;
}

/** Throws if the October records do not add up. Runs at module load and before every build. */
export function assertDataset(documents: Document[]): void {
  const problems: string[] = [];
  const ids = new Set<string>();
  for (const d of documents) {
    if (ids.has(d.id)) problems.push(`${d.id}: duplicate id`);
    ids.add(d.id);
    problems.push(...recordProblems(d));
    if (d.origin !== 'month') problems.push(`${d.id}: seed record not counted in the month`);
    if (Date.parse(d.receivedAt) > TODAY_MS) problems.push(`${d.id}: received after now`);
    if (Date.parse(d.receivedAt) < MONTH_START_MS) problems.push(`${d.id}: received before October`);
    if (d.addedAt && Date.parse(d.addedAt) > TODAY_MS) problems.push(`${d.id}: added after now`);
    if (d.status === 'done' && d.gross > CHECK_LIMIT) problems.push(`${d.id}: done automatically over the check limit`);
  }
  const byId = new Map(documents.map((d) => [d.id, d]));
  const seen = new Map<string, string>();
  for (const d of documents) {
    if (d.duplicateOf) {
      const original = byId.get(d.duplicateOf);
      if (!original) problems.push(`${d.id}: duplicate of a missing record`);
      else if (original.supplierId !== d.supplierId || original.invoiceNumber !== d.invoiceNumber || pence(original.gross) !== pence(d.gross))
        problems.push(`${d.id}: does not match the record it duplicates`);
      else if (original.receivedAt >= d.receivedAt) problems.push(`${d.id}: duplicate arrived before its original`);
      continue;
    }
    const key = `${d.supplierId}|${d.invoiceNumber}`;
    if (seen.has(key)) problems.push(`${d.id}: invoice number repeats ${seen.get(key)}`);
    seen.set(key, d.id);
  }
  const by = (s: Document['status']): number => documents.filter((d) => d.status === s).length;
  if (documents.length !== 60) problems.push(`${documents.length} documents, expected 60`);
  if (by('needs_ok') !== 3) problems.push(`${by('needs_ok')} need your OK, expected 3`);
  if (by('skipped') !== 2) problems.push(`${by('skipped')} skipped, expected 2`);
  if (by('done') !== 55) problems.push(`${by('done')} done automatically, expected 55`);
  // The visible records are a subset of the month counters.
  if (documents.length > MONTH.documentsReceived) problems.push('more records than documents received');
  const doneGross = documents.filter((d) => d.status === 'done').reduce((s, d) => s + pence(d.gross), 0);
  if (doneGross > pence(MONTH.spendingSorted)) problems.push(`records add up to ${doneGross / 100}, more than spending sorted`);
  if (problems.length > 0) {
    throw new Error(`October records do not add up:\n${problems.slice(0, 40).join('\n')}`);
  }
}

/** The six "See it work" documents: five added for £9,184.22 and one already added. */
export function assertArrivals(arrivals: Document[], documents: Document[]): void {
  const problems: string[] = arrivals.flatMap(recordProblems);
  const ids = new Set(documents.map((d) => d.id));
  for (const d of arrivals) {
    if (ids.has(d.id)) problems.push(`${d.id}: arrival reuses a seed id`);
    if (d.origin !== 'session') problems.push(`${d.id}: arrival counted in the month`);
    if (d.status === 'done' && d.gross > CHECK_LIMIT) problems.push(`${d.id}: arrival over the check limit`);
    if (d.duplicateOf && !ids.has(d.duplicateOf)) problems.push(`${d.id}: duplicate of a missing record`);
  }
  const added = arrivals.filter((d) => d.status === 'done');
  const total = added.reduce((s, d) => s + pence(d.gross), 0);
  if (arrivals.length !== 6 || added.length !== 5) problems.push('expected six arrivals, five added');
  if (total !== 918_422) problems.push(`arrivals add up to ${total / 100}, expected 9184.22`);
  if (problems.length > 0) throw new Error(`See it work records do not add up:\n${problems.join('\n')}`);
}

export function assertReminders(reminders: Reminder[]): void {
  const problems: string[] = [];
  for (const r of reminders) {
    if (r.stage < 1 || r.stage > r.of) problems.push(`${r.id}: stage ${r.stage} of ${r.of}`);
    if (Date.parse(r.lastSentAt) > TODAY_MS) problems.push(`${r.id}: sent after now`);
    if (r.email.lines.length !== 4) problems.push(`${r.id}: email is not four lines`);
  }
  const fuel = reminders.find((r) => r.id === 'rem_fuel_receipts');
  const fuelTotal = fuel ? fuel.items.reduce((s, i) => s + pence(i.amount ?? 0), 0) : 0;
  if (!fuel || fuel.items.length !== 4 || fuelTotal !== 31_240) problems.push(`fuel receipts add up to ${fuelTotal / 100}, expected 312.40`);
  if (problems.length > 0) throw new Error(`Reminders do not add up:\n${problems.join('\n')}`);
}

export function assertVat(ret: VatReturn): void {
  const due = pence(ret.boxes.b1) + pence(ret.boxes.b2) - pence(ret.boxes.b4);
  if (due !== 3_240_842) throw new Error(`VAT return does not add up: box 5 is ${due / 100}, expected 32408.42`);
  if (ret.documentsIn > ret.documentsExpected) throw new Error('VAT return has more documents in than expected');
}
