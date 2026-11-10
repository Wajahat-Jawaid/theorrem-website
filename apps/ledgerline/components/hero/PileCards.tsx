'use client';

import { motion } from 'framer-motion';
import { FileSpreadsheet, Landmark, Mail, Mailbox, MessageCircle, StickyNote, type LucideIcon } from 'lucide-react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/cn';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { dateShort, dayMonth, initials, money, time } from '@/lib/format';
import type { PileItem, Source } from './pileData';

/**
 * How each piece of October's paperwork looks in the pile: an email with its
 * PDF, a phone photo, a scanned letter with a coffee ring, a bank line with
 * nothing attached, a spreadsheet row and a sticky note.
 */

const SOURCE: Record<Source, { label: string; icon: LucideIcon }> = {
  email: { label: 'Email', icon: Mail },
  whatsapp: { label: 'WhatsApp', icon: MessageCircle },
  post: { label: 'Post', icon: Mailbox },
  bank: { label: 'Bank feed', icon: Landmark },
  sheet: { label: 'Spreadsheet', icon: FileSpreadsheet },
  note: { label: 'Note', icon: StickyNote },
};

/** Handwriting, from what the machine has. */
const HAND = "'Noteworthy', 'Bradley Hand', 'Segoe Print', 'Ink Free', 'Comic Sans MS', cursive";

export function PileCard({ item }: { item: PileItem }) {
  switch (item.kind) {
    case 'email':
      return item.doc ? <EmailCard d={item.doc} /> : null;
    case 'photo':
      return <PhotoCard d={item.doc} sender={item.sender} blurry={item.blurry} />;
    case 'post':
      return item.doc ? <PostCard d={item.doc} /> : null;
    case 'bank':
      return item.bank ? <BankLine {...item.bank} /> : null;
    case 'sheet':
      return item.sheet ? <SheetRow {...item.sheet} /> : null;
    case 'note':
      return <Note text={item.note ?? ''} />;
  }
}

/** The source tag on each piece; it lights up as the scan passes. */
export function SourceBadge({ source, lit, delay, instant }: { source: Source; lit: boolean; delay: number; instant: boolean }) {
  const { label, icon: Icon } = SOURCE[source];
  const body = (
    <>
      <Icon size={9} strokeWidth={2} aria-hidden />
      {label}
    </>
  );
  return (
    <span className="absolute -left-1.5 -top-2.5 z-10 inline-flex h-[17px] items-center gap-1 whitespace-nowrap rounded-full border border-white/10 bg-ink-900 px-1.5 text-[8px] font-semibold uppercase tracking-[0.06em] text-lo">
      {body}
      <motion.span
        aria-hidden
        className="absolute -inset-px inline-flex items-center gap-1 rounded-full border border-signal/60 bg-ink-900 px-1.5 text-signal shadow-glow"
        initial={false}
        animate={{ opacity: lit ? 1 : 0 }}
        transition={{ duration: instant ? 0 : 0.2, delay: instant ? 0 : delay }}
      >
        {body}
      </motion.span>
    </span>
  );
}

function EmailCard({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  const what = d.layout === 'receipt' ? 'Receipt' : 'Invoice';
  return (
    <div className="h-full w-full rounded-6 bg-paper px-2.5 py-2 text-paper-ink shadow-paper-sm">
      <div className="flex items-center gap-1.5">
        <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-paper-fill text-[6.5px] font-bold text-paper-muted">{initials(s.shortName)}</span>
        <span className="min-w-0 flex-1 truncate text-[9.5px] font-semibold">{s.shortName}</span>
        <span className="shrink-0 text-[7.5px] text-paper-muted">{time(d.receivedAt)}</span>
      </div>
      <div className="mt-1.5 truncate text-[9px] font-medium">
        {what} {d.invoiceNumber}
      </div>
      <div className="mt-1 h-[3px] w-3/4 rounded-full bg-paper-rule" />
      <div className="mt-2 inline-flex max-w-full items-center gap-1 rounded-4 border border-paper-rule px-1 py-0.5">
        <span className="shrink-0 rounded-[2px] bg-prop-pdf px-[3px] text-[6px] font-bold leading-[9px] text-white">PDF</span>
        <span className="truncate font-mono text-[7px]">{d.invoiceNumber}.pdf</span>
      </div>
    </div>
  );
}

/** A phone photo in a chat: the paper on a dark table, a little skewed, with creases. */
function PhotoCard({ d, sender, blurry }: { d?: Document; sender?: string; blurry?: boolean }) {
  const s = d ? getSupplier(d.supplierId) : null;
  return (
    <div className="flex h-full w-full flex-col rounded-8 bg-ink-700 p-1.5 shadow-paper-sm">
      {sender ? <div className="mb-1 truncate px-0.5 text-[8px] font-semibold text-signal">{sender}</div> : null}
      <div className="relative min-h-0 flex-1 overflow-hidden rounded-4 bg-ink-950">
        <div
          className="absolute inset-x-2.5 bottom-1 top-2 -rotate-3 skew-x-[-3deg] bg-paper px-2 py-2 font-mono text-[7px] leading-[10px] text-paper-ink"
          style={{
            filter: blurry ? 'blur(1.6px)' : undefined,
            backgroundImage:
              'linear-gradient(118deg, transparent 38%, rgba(0,0,0,0.07) 39%, transparent 42%), linear-gradient(62deg, transparent 55%, rgba(0,0,0,0.06) 56%, transparent 60%)',
          }}
        >
          {d && s ? (
            <>
              <div className="truncate text-center text-[8px] font-bold">{s.shortName.toUpperCase()}</div>
              <div className="mt-0.5 truncate text-center text-paper-muted">{d.layout === 'receipt' ? dateShort(d.invoiceDate) : `INVOICE ${d.invoiceNumber}`}</div>
              <Bars n={3} className="mt-2" />
              <div className="mt-2 flex justify-between font-bold">
                <span>TOTAL</span>
                <span>{money(d.gross)}</span>
              </div>
            </>
          ) : (
            <>
              {/* Too blurred to read: no figures drawn, only the shape of a till receipt. */}
              <div className="mx-auto h-2 w-10 rounded-[1px] bg-paper-ink/70" />
              <Bars n={5} className="mt-2" />
              <div className="mt-2 ml-auto h-2 w-8 rounded-[1px] bg-paper-ink/70" />
            </>
          )}
        </div>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/35" />
      </div>
    </div>
  );
}

/** A supplier's letter that came in the post, scanned, with a coffee ring on it. */
function PostCard({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  return (
    <div className="relative h-full w-full overflow-hidden bg-paper px-3 py-3 font-doc text-paper-ink shadow-paper-sm">
      <div className="truncate text-[9px] font-bold leading-tight">{s.tradingName}</div>
      <div className="mt-1 h-[3px] w-2/3 rounded-full bg-paper-rule" />
      <div className="mt-3 text-[7px] font-bold tracking-[0.1em]">INVOICE</div>
      <div className="font-mono text-[7px] text-paper-muted">{d.invoiceNumber}</div>
      <Bars n={4} className="mt-3" />
      <div className="mt-3 flex justify-between border-t border-paper-ink pt-1 text-[8px] font-bold">
        <span>Total</span>
        <span className="tnum font-mono">{money(d.gross)}</span>
      </div>
      <span aria-hidden className="absolute -right-3 bottom-5 h-[62px] w-[62px] rounded-full border-[3px] border-prop-coffee" />
      <span aria-hidden className="absolute bottom-0 left-0 right-0 h-6 bg-gradient-to-t from-black/[0.05] to-transparent" />
    </div>
  );
}

/** A payment in the bank feed with no receipt behind it yet. */
function BankLine({ date, payee, amount }: { date: string; payee: string; amount: number }) {
  return (
    <div className="h-full w-full rounded-8 border border-white/10 bg-ink-800 px-2.5 py-2 shadow-paper-sm">
      <div className="flex items-center gap-2 font-mono text-[9px]">
        <span className="shrink-0 text-lo">{dayMonth(date).toUpperCase()}</span>
        <span className="min-w-0 flex-1 truncate text-hi">{payee.toUpperCase()}</span>
        <span className="tnum shrink-0 text-hi">−{money(amount)}</span>
      </div>
      <span className="mt-1 inline-flex rounded-full bg-amber/15 px-1.5 text-[7px] font-semibold leading-[13px] text-amber">No receipt</span>
    </div>
  );
}

/** One row from the spreadsheet kept on the side. */
function SheetRow({ date, what, amount, note }: { date: string; what: string; amount: number; note: string }) {
  const cell = 'truncate border-r border-prop-sheet-rule px-1 last:border-r-0';
  return (
    <div className="h-full w-full overflow-hidden rounded-2 border border-prop-sheet-rule bg-white font-sans text-[8.5px] leading-[17px] text-paper-ink shadow-paper-sm">
      <div className="grid grid-cols-[34px_1fr_48px_1fr] bg-prop-sheet text-center text-[7px] font-semibold text-paper-muted">
        {['A', 'B', 'C', 'D'].map((c) => (
          <span key={c} className={cell}>
            {c}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-[34px_1fr_48px_1fr] border-t border-prop-sheet-rule">
        <span className={cell}>{dateShort(date).slice(0, 5)}</span>
        <span className={cell}>{what}</span>
        <span className={cn(cell, 'tnum text-right')}>{money(amount)}</span>
        <span className={cell}>{note}</span>
      </div>
      <div className="grid h-[17px] grid-cols-[34px_1fr_48px_1fr] border-t border-prop-sheet-rule">
        {[0, 1, 2, 3].map((c) => (
          <span key={c} className={cell} />
        ))}
      </div>
    </div>
  );
}

function Note({ text }: { text: string }) {
  return (
    <div className="h-full w-full bg-prop-note px-3 py-3 shadow-paper-sm" style={{ fontFamily: HAND }}>
      <p className="text-[14px] leading-[1.2] text-prop-note-ink">{text}</p>
    </div>
  );
}

function Bars({ n, className }: { n: number; className?: string }) {
  return (
    <div className={cn('flex flex-col gap-[3px]', className)}>
      {Array.from({ length: n }, (_, i) => (
        <span key={i} className="h-[3px] rounded-full bg-paper-rule" style={{ width: `${92 - ((i * 23) % 40)}%` }} />
      ))}
    </div>
  );
}

/** The envelope a chase folds into, and the one at the start of each outbox row. */
export function Envelope({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 28 20" aria-hidden className={className}>
      <rect x="0.5" y="0.5" width="27" height="19" rx="1.5" fill="#FBFAF6" />
      <path d="M1 1.5 L14 11 L27 1.5" fill="none" stroke="#B8892E" strokeWidth="1.4" />
      <path d="M1 19 L10.5 9.5 M27 19 L17.5 9.5" fill="none" stroke="#E4E1D8" strokeWidth="1" />
    </svg>
  );
}
