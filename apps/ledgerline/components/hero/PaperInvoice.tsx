'use client';

import { forwardRef, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/cn';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { VAT_RATE } from '@/lib/data/categories';
import { useBusiness } from '@/lib/demo-store';
import { dateShort, money } from '@/lib/format';
import type { FieldKey } from './stageData';

/**
 * A real-looking supplier document, drawn as paper: an invoice on the hero,
 * or a till receipt. Each of the six values the agent reads carries
 * data-pf so the scan beam and the field chips can find it.
 */

/** A value on the paper; a mint outline draws round it as the beam passes. */
function PF({ k, on, instant, children, className }: { k: FieldKey; on: boolean; instant: boolean; children: ReactNode; className?: string }) {
  return (
    <span data-pf={k} className={cn('relative inline-block', className)}>
      <motion.span
        aria-hidden
        className="pointer-events-none absolute -inset-x-[3px] -inset-y-[2px] rounded-4 bg-signal-soft"
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ duration: instant ? 0 : 0.22 }}
      />
      <svg aria-hidden className="pointer-events-none absolute -inset-x-[3px] -inset-y-[2px] h-[calc(100%+4px)] w-[calc(100%+6px)] overflow-visible">
        <motion.rect
          width="100%"
          height="100%"
          rx="3"
          fill="none"
          stroke="#4BE3A0"
          strokeWidth="1.5"
          initial={false}
          animate={{ pathLength: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: instant ? 0 : 0.22, ease: 'easeOut' }}
        />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

interface PaperInvoiceProps {
  doc: Document;
  outlined: FieldKey[];
  /** Jump straight to the final look, no transitions. */
  instant?: boolean;
  className?: string;
  children?: ReactNode;
}

export const PaperInvoice = forwardRef<HTMLDivElement, PaperInvoiceProps>(function PaperInvoice({ doc: d, outlined, instant = false, className, children }, ref) {
  const on = (k: FieldKey): boolean => outlined.includes(k);
  return d.layout === 'receipt' ? (
    <ReceiptPaper ref={ref} d={d} on={on} instant={instant} className={className}>
      {children}
    </ReceiptPaper>
  ) : (
    <InvoicePaper ref={ref} d={d} on={on} instant={instant} className={className}>
      {children}
    </InvoicePaper>
  );
});

interface SheetProps {
  d: Document;
  on: (k: FieldKey) => boolean;
  instant: boolean;
  className?: string;
  children?: ReactNode;
}

const InvoicePaper = forwardRef<HTMLDivElement, SheetProps>(function InvoicePaper({ d, on, instant, className, children }, ref) {
  const s = getSupplier(d.supplierId);
  const biz = useBusiness();
  const rate = VAT_RATE[d.vatCode];
  return (
    <div ref={ref} className={cn('paper relative w-[300px] overflow-hidden px-6 pb-5 pt-6 font-doc', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <PF k="supplier" on={on('supplier')} instant={instant} className="text-[15px] font-bold leading-tight tracking-[-0.01em]">
            {s.tradingName}
          </PF>
          <div className="mt-1 text-[8px] leading-[11px] text-paper-muted">
            {s.address.slice(0, 2).join(', ')}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold tracking-[0.12em]">INVOICE</div>
          <div className="mt-0.5 font-mono text-[9px] text-paper-muted">{d.invoiceNumber}</div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 border-t border-paper-rule pt-3 text-[8.5px] leading-[12px]">
        <div className="min-w-0">
          <div className="text-[7.5px] font-bold uppercase tracking-[0.08em] text-paper-muted">Invoice to</div>
          <div className="truncate font-bold">{biz.name}</div>
          {d.deliverySite ? <div className="truncate text-paper-muted">Deliver to {d.deliverySite}</div> : null}
        </div>
        <div className="text-right">
          <div className="text-[7.5px] font-bold uppercase tracking-[0.08em] text-paper-muted">Date</div>
          <PF k="date" on={on('date')} instant={instant} className="font-mono text-[10px] font-medium">
            {dateShort(d.invoiceDate)}
          </PF>
        </div>
      </div>

      <PF k="category" on={on('category')} instant={instant} className="mt-5 block">
        <table className="w-full border-collapse text-[8.5px] leading-[12px]">
          <thead>
            <tr className="border-b border-paper-rule text-left text-[7.5px] uppercase tracking-[0.06em] text-paper-muted">
              <th className="pb-1 font-bold">Description</th>
              <th className="pb-1 text-right font-bold">Qty</th>
              <th className="pb-1 text-right font-bold">Net</th>
            </tr>
          </thead>
          <tbody>
            {d.lineItems.slice(0, 4).map((l) => (
              <tr key={l.id} className="border-b border-paper-rule/70 align-top">
                <td className="py-1 pr-2">{l.description}</td>
                <td className="tnum py-1 text-right font-mono">{l.quantity}</td>
                <td className="tnum py-1 pl-2 text-right font-mono">{money(l.net)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </PF>

      <dl className="ml-auto mt-4 w-[150px] text-[9px] leading-[13px]">
        <div className="flex items-center justify-between py-1">
          <dt className="text-paper-muted">Net</dt>
          <dd>
            <PF k="net" on={on('net')} instant={instant} className="tnum font-mono">
              {money(d.net)}
            </PF>
          </dd>
        </div>
        <div className="flex items-center justify-between py-1">
          <dt className="text-paper-muted">VAT {rate}%</dt>
          <dd>
            <PF k="vat" on={on('vat')} instant={instant} className="tnum font-mono">
              {money(d.vat)}
            </PF>
          </dd>
        </div>
        <div className="mt-1 flex items-center justify-between border-t border-paper-ink pt-1.5 text-[11px] font-bold">
          <dt>Total GBP</dt>
          <dd>
            <PF k="gross" on={on('gross')} instant={instant} className="tnum font-mono">
              {money(d.gross)}
            </PF>
          </dd>
        </div>
      </dl>

      <div className="mt-5 border-t border-paper-rule pt-2 text-[7px] leading-[10px] text-paper-muted">
        {d.supplierVat ? `VAT registration no. ${d.supplierVat}` : 'Not registered for VAT'} · Company no. {s.companyNumber}
      </div>
      {children}
    </div>
  );
});

const ReceiptPaper = forwardRef<HTMLDivElement, SheetProps>(function ReceiptPaper({ d, on, instant, className, children }, ref) {
  const s = getSupplier(d.supplierId);
  const rate = VAT_RATE[d.vatCode];
  return (
    <div ref={ref} className={cn('paper relative w-[220px] overflow-hidden px-5 pb-5 pt-5 font-mono text-[9px] leading-[13px]', className)}>
      <div className="text-center">
        <PF k="supplier" on={on('supplier')} instant={instant} className="text-[12px] font-semibold tracking-[0.04em]">
          {s.tradingName.toUpperCase()}
        </PF>
        <div className="mt-0.5 text-paper-muted">{s.address[s.address.length - 1]}</div>
        <div className="mt-1.5 font-semibold">{d.sheetTitle.toUpperCase()}</div>
      </div>
      <div className="my-2.5 border-t border-dashed border-paper-rule" />
      <div className="flex justify-between">
        <PF k="date" on={on('date')} instant={instant}>
          {dateShort(d.invoiceDate)}
        </PF>
        <span className="text-paper-muted">{d.invoiceNumber}</span>
      </div>
      <div className="my-2.5 border-t border-dashed border-paper-rule" />
      <PF k="category" on={on('category')} instant={instant} className="block">
        {d.lineItems.slice(0, 4).map((l) => (
          <div key={l.id} className="flex justify-between gap-2 py-px">
            <span className="min-w-0 truncate">{l.description}</span>
            <span className="tnum shrink-0">{money(l.net)}</span>
          </div>
        ))}
      </PF>
      <div className="my-2.5 border-t border-dashed border-paper-rule" />
      <div className="flex items-center justify-between py-0.5">
        <span>NET</span>
        <PF k="net" on={on('net')} instant={instant} className="tnum">
          {money(d.net)}
        </PF>
      </div>
      <div className="flex items-center justify-between py-0.5 text-paper-muted">
        <span>VAT {rate}%</span>
        <PF k="vat" on={on('vat')} instant={instant} className="tnum text-paper-ink">
          {money(d.vat)}
        </PF>
      </div>
      <div className="mt-1 flex items-center justify-between py-0.5 text-[11px] font-semibold">
        <span>TOTAL</span>
        <PF k="gross" on={on('gross')} instant={instant} className="tnum">
          {money(d.gross)}
        </PF>
      </div>
      <div className="mt-3 text-center text-[8px] text-paper-muted">{d.supplierVat ? `VAT REG ${d.supplierVat}` : 'Thank you'}</div>
      {children}
    </div>
  );
});
