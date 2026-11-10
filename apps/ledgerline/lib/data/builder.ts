import type { CategoryCode, DocStatus, Document, LineItem, PaymentTerms, VatCode } from '../types';
import { supplier as getSupplier } from './suppliers';
import { VAT_RATE } from './categories';

/* ------------------------------------------------------------------ */
/* Arithmetic, in whole pence so every record adds up exactly.         */
/* ------------------------------------------------------------------ */

/** VAT on a net amount in pence, rounded half up (away from zero). */
export function vatPence(netPence: number, percent: number): number {
  const v = Math.floor((Math.abs(netPence) * percent + 50) / 100);
  return netPence < 0 ? -v : v;
}

export interface LineSpec {
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  vatCode: VatCode;
  /** Explicit line net, for lump-sum lines. */
  net?: number;
}

export function linePence(line: { quantity: number; unitPrice: number; net?: number }): number {
  if (line.net !== undefined) return Math.round(line.net * 100);
  const raw = line.quantity * line.unitPrice * 100;
  const abs = Math.floor(Math.abs(raw) + 0.5 + 1e-6);
  return raw < 0 ? -abs : abs;
}

export interface Totals {
  net: number;
  vat: number;
  gross: number;
}

/** VAT is worked out per rate on the document's net, as UK invoices do. */
export function computeTotals(lines: LineSpec[]): Totals {
  const groups = new Map<VatCode, number>();
  let netP = 0;
  for (const line of lines) {
    const p = linePence(line);
    netP += p;
    groups.set(line.vatCode, (groups.get(line.vatCode) ?? 0) + p);
  }
  let vatP = 0;
  groups.forEach((p, code) => {
    vatP += vatPence(p, VAT_RATE[code]);
  });
  return { net: netP / 100, vat: vatP / 100, gross: (netP + vatP) / 100 };
}

/* ------------------------------------------------------------------ */
/* Dates                                                               */
/* ------------------------------------------------------------------ */

const pad = (n: number): string => String(n).padStart(2, '0');

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + days));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function endOfMonth(iso: string): string {
  const [y, m] = iso.slice(0, 10).split('-').map(Number);
  const date = new Date(Date.UTC(y, m, 0));
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

/** The first Monday-to-Friday date at least `gap` days after `iso`. */
export function workingDayAfter(iso: string, gap: number): string {
  let date = addDays(iso, gap);
  for (;;) {
    const [y, m, d] = date.split('-').map(Number);
    const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
    if (day !== 0 && day !== 6) return date;
    date = addDays(date, 1);
  }
}

export function dueDateFor(terms: PaymentTerms, invoiceDate: string): string | null {
  switch (terms) {
    case 'EOM30':
      return addDays(endOfMonth(invoiceDate), 30);
    case 'NET30':
      return addDays(invoiceDate, 30);
    case 'NET14':
    case 'DD':
      return addDays(invoiceDate, 14);
    case 'NET7':
      return addDays(invoiceDate, 7);
    case 'PAID':
      return null;
  }
}

export function termsText(terms: PaymentTerms): string {
  switch (terms) {
    case 'EOM30':
      return 'Payment due 30 days from the end of the month of invoice.';
    case 'NET30':
      return 'Payment due within 30 days of the invoice date.';
    case 'NET14':
      return 'Payment due within 14 days of the invoice date.';
    case 'NET7':
      return 'Payment due within 7 days of the invoice date.';
    case 'DD':
      return 'This amount will be collected by Direct Debit on or after the due date.';
    case 'PAID':
      return 'Paid in full at the time of purchase.';
  }
}

/** An ISO timestamp in BST (every October record falls before 25 Oct). */
export function bst(date: string, hh: number, mm: number, ss = 0): string {
  return `${date}T${pad(hh)}:${pad(mm)}:${pad(ss)}+01:00`;
}

/** Moves a +01:00 timestamp by a number of milliseconds, keeping the +01:00 form. */
export function shiftIso(iso: string, ms: number): string {
  const d = new Date(Date.parse(iso) + ms + 3_600_000);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}T${pad(d.getUTCHours())}:${pad(
    d.getUTCMinutes(),
  )}:${pad(d.getUTCSeconds())}+01:00`;
}

/* ------------------------------------------------------------------ */
/* Document assembly                                                   */
/* ------------------------------------------------------------------ */

export interface DocSpec {
  id: string;
  supplierId: string;
  status: DocStatus;
  receivedAt: string;
  addedAt?: string | null;
  invoiceDate: string;
  invoiceNumber: string;
  lines: LineSpec[];
  category: CategoryCode | null;
  origin: Document['origin'];
  dueDate?: string | null;
  sheetTitle?: string;
  sheetNotes?: string[];
  pageCount?: number;
  accountNumber?: string | null;
  purchaseOrder?: string | null;
  deliverySite?: string | null;
  duplicateOf?: string | null;
}

function dominantVat(lines: LineSpec[]): VatCode {
  const byCode = new Map<VatCode, number>();
  for (const line of lines) byCode.set(line.vatCode, (byCode.get(line.vatCode) ?? 0) + Math.abs(linePence(line)));
  let best: VatCode = lines[0]?.vatCode ?? 'S20';
  let max = -1;
  byCode.forEach((value, code) => {
    if (value > max) {
      max = value;
      best = code;
    }
  });
  return best;
}

function defaultSheetTitle(layout: Document['layout'], vatRegistered: boolean, vatCode: VatCode): string {
  if (layout === 'receipt') return vatRegistered ? 'VAT Receipt' : 'Receipt';
  if (vatCode === 'EX') return 'Premium Notice';
  return vatRegistered ? 'VAT Invoice' : 'Invoice';
}

function defaultSheetNotes(vatCode: VatCode): string[] {
  if (vatCode === 'RC') return ['Reverse charge: customer to account to HMRC for the VAT. Section 55A VATA 1994 applies.'];
  if (vatCode === 'EX') return ['Exempt from VAT. Insurance premium tax included where applicable.'];
  if (vatCode === 'Z0') return ['Zero rated for VAT.'];
  return [];
}

export function assemble(spec: DocSpec): Document {
  const s = getSupplier(spec.supplierId);
  const totals = computeTotals(spec.lines);
  const vatCode = dominantVat(spec.lines);
  const lineItems: LineItem[] = spec.lines.map((line, i) => ({
    id: `${spec.id}-l${i + 1}`,
    description: line.description,
    quantity: line.quantity,
    unit: line.unit,
    unitPrice: line.unitPrice,
    net: linePence(line) / 100,
    vatCode: line.vatCode,
  }));
  return {
    id: spec.id,
    supplierId: spec.supplierId,
    layout: s.layout,
    sheetTitle: spec.sheetTitle ?? defaultSheetTitle(s.layout, Boolean(s.vatNumber), vatCode),
    sheetNotes: spec.sheetNotes ?? defaultSheetNotes(vatCode),
    pageCount: spec.pageCount ?? 1,
    invoiceNumber: spec.invoiceNumber,
    invoiceDate: spec.invoiceDate,
    dueDate: spec.dueDate !== undefined ? spec.dueDate : dueDateFor(s.terms, spec.invoiceDate),
    accountNumber: spec.accountNumber ?? null,
    purchaseOrder: spec.purchaseOrder ?? null,
    deliverySite: spec.deliverySite ?? null,
    supplierVat: s.vatNumber,
    receivedAt: spec.receivedAt,
    addedAt: spec.addedAt ?? null,
    net: totals.net,
    vat: totals.vat,
    gross: totals.gross,
    vatCode,
    category: spec.category,
    lineItems,
    status: spec.status,
    approvedByYou: false,
    duplicateOf: spec.duplicateOf ?? null,
    origin: spec.origin,
  };
}
