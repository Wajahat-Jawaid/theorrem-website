'use client';

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Document, EvidenceRegion, LineItem, ReadField, VatCode } from '@/lib/types';
import { cn } from '@/lib/cn';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { termsText, vatPence } from '@/lib/data/builder';
import { VAT_RATE } from '@/lib/data/categories';
import { business as defaultBusiness } from '@/lib/data/business';
import { useBusiness } from '@/lib/demo-store';
import { dateShort, money } from '@/lib/format';

/* ------------------------------------------------------------------ */
/* The link between the paper and the panel beside it                   */
/* ------------------------------------------------------------------ */

/** A part of the paper: an evidence region ("ev:lines") or one of the six values we read ("field:net"). */
export type HighlightKey = `ev:${EvidenceRegion}` | `field:${ReadField}`;
export type HighlightSource = 'pane' | 'sheet' | 'walk';

interface HighlightValue {
  active: HighlightKey | null;
  source: HighlightSource | null;
  set: (key: HighlightKey | null, source: HighlightSource) => void;
  /** The regions the question points at; only these are outlined on the paper. */
  regions: EvidenceRegion[];
  /** Box the six values on the paper. Off until the owner opens the full list. */
  marks: boolean;
}

const HighlightContext = createContext<HighlightValue>({ active: null, source: null, set: () => undefined, regions: [], marks: false });

export function HighlightProvider({ regions, marks, children }: { regions: EvidenceRegion[]; marks: boolean; children: ReactNode }) {
  const [state, setState] = useState<{ active: HighlightKey | null; source: HighlightSource | null }>({ active: null, source: null });
  const set = useCallback((key: HighlightKey | null, source: HighlightSource) => setState({ active: key, source: key ? source : null }), []);
  const value = useMemo(() => ({ ...state, set, regions, marks }), [state, set, regions, marks]);
  return <HighlightContext.Provider value={value}>{children}</HighlightContext.Provider>;
}

export function useHighlight(): HighlightValue {
  return useContext(HighlightContext);
}

/** A value we read. Boxed in mint once the full list is open; glows while its row is hovered. */
function Mark({ field, children }: { field: ReadField; children: ReactNode }) {
  const { active, set, marks } = useHighlight();
  const key: HighlightKey = `field:${field}`;
  const on = active === key;
  return (
    <span
      data-hl={key}
      onMouseEnter={marks ? () => set(key, 'sheet') : undefined}
      onMouseLeave={marks ? () => set(null, 'sheet') : undefined}
      className={cn(
        '-mx-0.5 rounded-2 px-0.5 transition-colors duration-small ease-out',
        marks && 'shadow-mark',
        on ? 'bg-doc-mark-strong' : marks ? 'bg-doc-mark' : 'bg-transparent',
      )}
    >
      {children}
    </span>
  );
}

/**
 * A part of the paper a "why I'm asking" line points at. Outlined faintly
 * while the question is open; glows and pulses twice while its line is hovered.
 */
function Region({ id, className, children }: { id: EvidenceRegion; className?: string; children: ReactNode }) {
  const { active, set, regions } = useHighlight();
  const key: HighlightKey = `ev:${id}`;
  const linked = regions.includes(id);
  const on = active === key;
  return (
    <div
      data-hl={key}
      onMouseEnter={linked ? () => set(key, 'sheet') : undefined}
      onMouseLeave={linked ? () => set(null, 'sheet') : undefined}
      className={cn('relative', className)}
    >
      {children}
      {linked ? (
        <span
          aria-hidden
          className={cn(
            'pointer-events-none absolute -inset-1.5 rounded-4 transition-[background-color,box-shadow] duration-small ease-out',
            on
              ? 'bg-signal/[0.14] shadow-[0_0_0_1.5px_rgba(23,122,80,0.85),0_0_22px_rgba(75,227,160,0.45)]'
              : 'shadow-[0_0_0_1px_rgba(23,122,80,0.28)]',
          )}
        >
          {on ? <span className="absolute inset-0 rounded-4 opacity-0 shadow-[0_0_0_6px_rgba(75,227,160,0.35)] motion-safe:animate-ring-pulse" /> : null}
        </span>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sheet content                                                       */
/* ------------------------------------------------------------------ */

const CODE: Record<VatCode, string> = { S20: 'S', Z0: 'Z', EX: 'E', RC: 'RC' };

const qty = (n: number): string => (Number.isInteger(n) ? String(n) : n.toFixed(2));

function vatGroups(lines: LineItem[]): { code: VatCode; net: number; vat: number }[] {
  const map = new Map<VatCode, number>();
  for (const l of lines) map.set(l.vatCode, (map.get(l.vatCode) ?? 0) + Math.round(l.net * 100));
  return [...map.entries()].map(([code, p]) => ({ code, net: p / 100, vat: vatPence(p, VAT_RATE[code]) / 100 }));
}

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-doc-muted">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function SheetHeader({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  return (
    <div className="flex items-start justify-between gap-6 border-b-2 border-doc-ink pb-4">
      <Region id="supplier" className="min-w-0">
        <div className="text-doc-xl font-bold text-doc-ink">
          <Mark field="supplier">{s.tradingName}</Mark>
        </div>
        <div className="mt-1 text-doc-sm text-doc-muted">{s.name}</div>
        <div className="mt-2 text-doc-sm leading-snug text-doc-muted">
          {s.address.map((line) => (
            <div key={line}>{line}</div>
          ))}
          <div className="mt-1">
            {s.phone} · {s.email}
          </div>
        </div>
      </Region>
      <div className="w-[190px] shrink-0 text-right">
        <div className="text-doc-xl font-bold uppercase text-doc-ink">{d.sheetTitle}</div>
        <dl className="mt-2 flex flex-col gap-0.5 text-left text-doc-sm text-doc-ink">
          <Meta label="Invoice no.">
            <span className="font-bold">
              <Mark field="invoiceNumber">{d.invoiceNumber}</Mark>
            </span>
          </Meta>
          <Meta label="Invoice date">
            <Mark field="invoiceDate">{dateShort(d.invoiceDate)}</Mark>
          </Meta>
          {d.accountNumber ? <Meta label="Account no.">{d.accountNumber}</Meta> : null}
          {d.purchaseOrder ? (
            <Region id="order">
              <Meta label="Your order">{d.purchaseOrder}</Meta>
            </Region>
          ) : null}
          {d.dueDate ? <Meta label="Due date">{dateShort(d.dueDate)}</Meta> : null}
        </dl>
      </div>
    </div>
  );
}

function Addresses({ d }: { d: Document }) {
  const business = useBusiness();
  return (
    <div className="mt-4 grid grid-cols-2 gap-6 text-doc-sm text-doc-ink">
      <div>
        <div className="mb-1 text-doc-xs font-bold uppercase text-doc-muted">Invoice to</div>
        <div className="font-bold">{business.name}</div>
        {/* A personalised name has no address on file, so none is printed. */}
        {business.personalised ? null : <div className="text-doc-muted">{defaultBusiness.address}</div>}
      </div>
      <Region id="deliverTo">
        <div className="mb-1 text-doc-xs font-bold uppercase text-doc-muted">{d.deliverySite ? 'Deliver to' : 'Account contact'}</div>
        <div className="font-bold">{d.deliverySite ?? business.ownerName}</div>
        {d.deliverySite ? <div className="text-doc-muted">Site contact: {business.ownerName}</div> : null}
      </Region>
    </div>
  );
}

function LineTable({ d }: { d: Document }) {
  return (
    <Region id="lines" className="mt-5">
      <table className="w-full border-collapse text-doc-sm text-doc-ink">
        <thead>
          <tr className="border-b border-doc-rule bg-doc-fill text-left text-doc-xs font-bold uppercase text-doc-muted">
            <th className="px-2 py-1.5 font-bold">Description</th>
            <th className="px-2 py-1.5 text-right font-bold">Qty</th>
            <th className="px-2 py-1.5 text-right font-bold">Unit price</th>
            <th className="px-2 py-1.5 text-center font-bold">VAT</th>
            <th className="px-2 py-1.5 text-right font-bold">Net</th>
          </tr>
        </thead>
        <tbody>
          {d.lineItems.map((l) => (
            <tr key={l.id} className="border-b border-doc-rule align-top">
              <td className="px-2 py-1.5">
                {l.description}
                {l.unit !== 'item' ? <span className="text-doc-muted"> ({l.unit})</span> : null}
              </td>
              <td className="tnum px-2 py-1.5 text-right">{qty(l.quantity)}</td>
              <td className="tnum px-2 py-1.5 text-right">{money(l.unitPrice)}</td>
              <td className="px-2 py-1.5 text-center">{CODE[l.vatCode]}</td>
              <td className="tnum px-2 py-1.5 text-right">{money(l.net)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Region>
  );
}

function Totals({ d }: { d: Document }) {
  const groups = vatGroups(d.lineItems);
  const reverse = groups.some((g) => g.code === 'RC');
  return (
    <div className="mt-4 flex justify-end">
      <dl className="w-64 text-doc-md text-doc-ink">
        <div className="flex justify-between border-b border-doc-rule py-1">
          <dt className="text-doc-muted">Goods total</dt>
          <dd className="tnum">
            <Mark field="net">{money(d.net)}</Mark>
          </dd>
        </div>
        <div className="flex justify-between border-b border-doc-rule py-1">
          <dt className="text-doc-muted">{groups.length > 1 ? 'VAT total' : reverse ? 'VAT (reverse charge)' : `VAT at ${VAT_RATE[groups[0]?.code ?? 'S20']}%`}</dt>
          <dd className="tnum">
            <Mark field="vat">{money(d.vat)}</Mark>
          </dd>
        </div>
        <Region id="total">
          <div className="flex justify-between py-1.5 text-doc-lg font-bold">
            <dt>
              Total due <span className="text-doc-sm font-normal text-doc-muted">GBP</span>
            </dt>
            <dd className="tnum">
              <Mark field="gross">{money(d.gross)}</Mark>
            </dd>
          </div>
        </Region>
      </dl>
    </div>
  );
}

function SheetFooter({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  return (
    <div className="mt-auto border-t border-doc-rule pt-3 text-doc-xs leading-relaxed text-doc-muted">
      <p>
        {d.supplierVat ? `VAT registration no. ${d.supplierVat} · ` : 'Not registered for VAT · '}
        Registered in England and Wales no. {s.companyNumber}
      </p>
      <p>Registered office: {s.registeredOffice}</p>
    </div>
  );
}

function InvoicePage({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  return (
    <>
      <SheetHeader d={d} />
      <Addresses d={d} />
      <LineTable d={d} />
      <Totals d={d} />
      <div className="mt-5 space-y-1 text-doc-sm text-doc-ink">
        <p>
          <span className="font-bold">Terms: </span>
          {termsText(s.terms)}
        </p>
        {d.sheetNotes.map((n) => (
          <p key={n} className="text-doc-muted">
            {n}
          </p>
        ))}
      </div>
      {d.pageCount > 1 ? <p className="mt-4 text-right text-doc-xs text-doc-muted">Page 1 of {d.pageCount}</p> : null}
    </>
  );
}

function ReceiptSheet({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  const groups = vatGroups(d.lineItems);
  return (
    <div className="font-mono text-doc-sm text-doc-ink">
      <Region id="supplier" className="text-center">
        <div className="text-doc-lg font-bold">
          <Mark field="supplier">{s.tradingName.toUpperCase()}</Mark>
        </div>
        {s.address.slice(0, 3).map((line) => (
          <div key={line} className="text-doc-muted">
            {line}
          </div>
        ))}
        <div className="mt-2 font-bold">{d.sheetTitle.toUpperCase()}</div>
      </Region>
      <div className="my-3 border-t border-dashed border-doc-rule" />
      <div className="flex justify-between">
        <span>
          <Mark field="invoiceDate">{dateShort(d.invoiceDate)}</Mark>
        </span>
        <span>
          No. <Mark field="invoiceNumber">{d.invoiceNumber}</Mark>
        </span>
      </div>
      <div className="my-3 border-t border-dashed border-doc-rule" />
      <Region id="lines">
        {d.lineItems.map((l) => (
          <div key={l.id} className="flex justify-between gap-3 py-0.5">
            <span className="min-w-0">
              {l.quantity !== 1 ? `${qty(l.quantity)} x ` : ''}
              {l.description}
            </span>
            <span className="tnum shrink-0">{money(l.net)}</span>
          </div>
        ))}
      </Region>
      <div className="my-3 border-t border-dashed border-doc-rule" />
      <div className="flex justify-between">
        <span>NET</span>
        <span className="tnum">
          <Mark field="net">{money(d.net)}</Mark>
        </span>
      </div>
      {groups.map((g) => (
        <div key={g.code} className="flex justify-between text-doc-muted">
          <span>
            VAT {CODE[g.code]} {VAT_RATE[g.code]}%
          </span>
          <span className="tnum">
            <Mark field="vat">{money(g.vat)}</Mark>
          </span>
        </div>
      ))}
      <Region id="total">
        <div className="mt-1 flex justify-between text-doc-md font-bold">
          <span>TOTAL GBP</span>
          <span className="tnum">
            <Mark field="gross">{money(d.gross)}</Mark>
          </span>
        </div>
      </Region>
      <div className="my-3 border-t border-dashed border-doc-rule" />
      <div className="text-center text-doc-muted">
        {d.supplierVat ? <div>VAT REG {d.supplierVat}</div> : null}
        {d.sheetNotes.map((n) => (
          <div key={n}>{n}</div>
        ))}
        <div className="mt-2">Thank you for your custom</div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The sheet                                                           */
/* ------------------------------------------------------------------ */

export const PAGE_W = 595;
export const PAGE_H = 842;
export const RECEIPT_W = 300;

/** The first page as it arrived: an A4 trade invoice or a till receipt, on paper. */
export function InvoiceSheet({ doc, className }: { doc: Document; className?: string }) {
  const receipt = doc.layout === 'receipt';
  return (
    <div
      className={cn('flex flex-col rounded-2 bg-paper font-doc text-doc-base text-paper-ink shadow-paper', receipt ? 'px-6 py-7' : 'px-10 py-9', className)}
      style={receipt ? { width: RECEIPT_W } : { width: PAGE_W, minHeight: PAGE_H }}
    >
      {receipt ? <ReceiptSheet d={doc} /> : <InvoicePage d={doc} />}
      {!receipt ? <SheetFooter d={doc} /> : null}
    </div>
  );
}
