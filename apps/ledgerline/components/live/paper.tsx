import type { CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * The mess: real-looking paperwork drawn in CSS (till receipts, invoices, a
 * handwritten receipt pad) and the wear that makes it messy (creases, a
 * coffee ring, fold lines, a phone photo's shading). First drawn for the
 * story page's opening scene; the live demo's lanes are made of it.
 */

/** Handwriting, from what the machine has. */
export const HAND = "'Noteworthy', 'Bradley Hand', 'Segoe Print', 'Ink Free', 'Comic Sans MS', cursive";

/* ------------------------------------------------------------------ */
/* Wear                                                                */
/* ------------------------------------------------------------------ */

/** Crumpled paper: facets of shade and highlight at odd angles, multiplied over the sheet. */
export const CRUMPLE: CSSProperties = {
  backgroundImage: [
    'linear-gradient(104deg, transparent 22%, rgba(0,0,0,0.10) 23%, rgba(255,255,255,0.55) 24.5%, transparent 27%)',
    'linear-gradient(71deg, transparent 52%, rgba(0,0,0,0.09) 53%, rgba(255,255,255,0.45) 54.5%, transparent 57%)',
    'linear-gradient(162deg, transparent 38%, rgba(0,0,0,0.08) 39%, transparent 42%)',
    'linear-gradient(18deg, transparent 70%, rgba(0,0,0,0.08) 71%, transparent 74%)',
    'linear-gradient(135deg, rgba(0,0,0,0.00) 0%, rgba(0,0,0,0.07) 30%, rgba(0,0,0,0.00) 31%, rgba(0,0,0,0.05) 62%, rgba(0,0,0,0.0) 63%)',
    'radial-gradient(60% 45% at 28% 30%, rgba(255,255,255,0.35), transparent 70%)',
    'radial-gradient(70% 55% at 78% 82%, rgba(0,0,0,0.12), transparent 70%)',
  ].join(','),
};

/** A letter that came folded in three. */
export const FOLDS: CSSProperties = {
  backgroundImage: [
    'linear-gradient(to bottom, transparent 32.6%, rgba(0,0,0,0.10) 33.2%, rgba(255,255,255,0.6) 33.8%, transparent 35%)',
    'linear-gradient(to bottom, transparent 65.6%, rgba(0,0,0,0.09) 66.2%, rgba(255,255,255,0.55) 66.8%, transparent 68%)',
    'linear-gradient(to bottom, rgba(0,0,0,0.04), transparent 30%, rgba(0,0,0,0.035) 34%, transparent 64%, rgba(0,0,0,0.04) 67%, transparent)',
  ].join(','),
};

/** Paper that has sat in a van for a week. */
export const AGED: CSSProperties = {
  backgroundImage: 'radial-gradient(90% 80% at 50% 50%, rgba(214,190,140,0.10), rgba(170,140,90,0.22))',
};

export function CoffeeRing({ x, y, size, className }: { x: number; y: number; size: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('pointer-events-none absolute rounded-full', className)}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        background: [
          'radial-gradient(circle, transparent 60%, rgba(118,74,32,0.42) 64%, rgba(118,74,32,0.20) 67%, transparent 70%)',
          'radial-gradient(circle at 46% 54%, rgba(140,92,44,0.14) 0 58%, transparent 61%)',
        ].join(','),
      }}
    />
  );
}

/** A drip beside the ring. */
export function CoffeeDrop({ x, y, size }: { x: number; y: number; size: number }) {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute rounded-full"
      style={{ left: x, top: y, width: size, height: size * 0.8, background: 'radial-gradient(circle, rgba(118,74,32,0.30), rgba(118,74,32,0.12) 60%, transparent 72%)' }}
    />
  );
}

/** The light in a phone photo: a warm cast, dark corners and a glare. */
export const PHOTO_SHADE: CSSProperties = {
  backgroundImage: [
    'radial-gradient(40% 30% at 70% 22%, rgba(255,255,255,0.28), transparent 70%)',
    'radial-gradient(120% 100% at 50% 45%, transparent 45%, rgba(0,0,0,0.55) 100%)',
    'linear-gradient(rgba(255,176,90,0.12), rgba(255,176,90,0.12))',
  ].join(','),
};

/* ------------------------------------------------------------------ */
/* Paperwork                                                           */
/* ------------------------------------------------------------------ */

export interface ReceiptLine {
  what: string;
  amount: string;
}

/** A thermal till receipt. */
export function TillReceipt({
  shop,
  place,
  date,
  lines,
  total,
  className,
  style,
}: {
  shop: string;
  place: string;
  date: string;
  lines: ReceiptLine[];
  total: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={cn('px-2 pb-2 pt-2.5 font-mono text-[6.5px] leading-[9px] text-paper-ink', className)} style={style}>
      <div className="text-center text-[9px] font-bold leading-[11px] tracking-[0.04em]">{shop}</div>
      <div className="text-center text-paper-muted">{place}</div>
      <div className="mt-1 text-center text-paper-muted">{date}</div>
      <div className="my-1 border-t border-dashed border-paper-ink/30" />
      {lines.map((l) => (
        <div key={l.what} className="flex justify-between gap-1">
          <span className="truncate">{l.what}</span>
          <span className="shrink-0">{l.amount}</span>
        </div>
      ))}
      <div className="my-1 border-t border-dashed border-paper-ink/30" />
      <div className="flex justify-between text-[8px] font-bold leading-[10px]">
        <span>TOTAL</span>
        <span>{total}</span>
      </div>
      <div className="mt-1 text-center text-paper-muted">CARD ****4417</div>
      <div className="mt-1.5 flex justify-center gap-[1px]" aria-hidden>
        {[2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2].map((w, i) => (
          <span key={i} className="h-3 bg-paper-ink/80" style={{ width: w }} />
        ))}
      </div>
    </div>
  );
}

/** A supplier's invoice, drawn small. */
export function MiniInvoice({
  supplier,
  number,
  date,
  total,
  rows = 4,
  accent = '#1A1F1C',
  className,
}: {
  supplier: string;
  number: string;
  date: string;
  total: string;
  rows?: number;
  accent?: string;
  className?: string;
}) {
  return (
    <div className={cn('px-3 pb-3 pt-3 font-doc text-paper-ink', className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-bold leading-[12px]" style={{ color: accent }}>
          {supplier}
        </div>
        <div className="text-right text-[6px] font-bold leading-[8px] tracking-[0.12em]">INVOICE</div>
      </div>
      <div className="mt-1 h-[2px] w-1/2 rounded-full bg-paper-rule" />
      <div className="mt-[3px] h-[2px] w-1/3 rounded-full bg-paper-rule" />
      <div className="mt-2.5 flex justify-between font-mono text-[6px] leading-[8px] text-paper-muted">
        <span>{number}</span>
        <span>{date}</span>
      </div>
      <div className="mt-2 border-t border-paper-rule pt-1.5">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-2 py-[2px]">
            <span className="h-[2px] rounded-full bg-paper-ink/25" style={{ width: `${62 - ((i * 17) % 30)}%` }} />
            <span className="h-[2px] w-[18%] rounded-full bg-paper-ink/25" />
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-paper-ink pt-1 text-[7.5px] font-bold leading-[10px]">
        <span>Total</span>
        <span className="tnum font-mono">{total}</span>
      </div>
    </div>
  );
}

/** A page from a duplicate receipt book, filled in by hand. */
export function HandReceipt({ from, what, amount, date }: { from: string; what: string; amount: string; date: string }) {
  return (
    <div
      className="relative h-full w-full px-2.5 py-2 text-[#2A3A8C]"
      style={{
        fontFamily: HAND,
        backgroundColor: '#F4F1E6',
        backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0 15px, rgba(80,120,190,0.28) 15px 16px)',
        backgroundPositionY: '22px',
      }}
    >
      <div className="font-sans text-[6.5px] font-bold uppercase tracking-[0.1em] text-[#C0392B]">Receipt No. 0418</div>
      <div className="mt-[5px] text-[11px] leading-[16px]">{from}</div>
      <div className="text-[10px] leading-[16px]">{what}</div>
      <div className="text-[10px] leading-[16px]">{date}</div>
      <div className="text-[13px] font-bold leading-[16px]">{amount} paid</div>
      <div className="mt-0.5 text-[10px] leading-[16px] opacity-80">thanks — M.</div>
    </div>
  );
}
