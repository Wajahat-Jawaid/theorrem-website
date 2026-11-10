import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { gbp } from '@/lib/format';
import { DOCS, bankLine, type Art, type BankId, type DocId } from '@/lib/live/month';
import { AGED, CRUMPLE, CoffeeDrop, CoffeeRing, FOLDS, HandReceipt, MiniInvoice, PHOTO_SHADE, TillReceipt } from './paper';

/**
 * Each document as it arrived: a PDF page, a phone photo of a receipt, a
 * handwritten receipt pad, a crooked scan. One drawing per document, at one
 * native size, used in its source lane, in flight and as its row thumbnail,
 * so the thing that lands is visibly the thing that left.
 */

export const ART_SIZE: Record<Art['kind'] | 'particle' | 'bank', { w: number; h: number }> = {
  pdf: { w: 84, h: 108 },
  photo: { w: 72, h: 92 },
  hand: { w: 72, h: 92 },
  scan: { w: 84, h: 104 },
  particle: { w: 22, h: 28 },
  bank: { w: 208, h: 18 },
};

export function artSize(doc: DocId): { w: number; h: number } {
  return ART_SIZE[DOCS[doc].art.kind];
}

const dateOnPaper = (d: string): string => `${d} 2026`;

export function DocArt({ doc }: { doc: DocId }) {
  const spec = DOCS[doc];
  const { art } = spec;
  switch (art.kind) {
    case 'pdf':
      return <PdfPage supplier={spec.supplier} number={art.number} date={dateOnPaper(spec.date)} total={gbp(spec.amount)} accent={art.accent} />;
    case 'scan':
      return <ScanPage supplier={spec.supplier} number={art.number} date={dateOnPaper(spec.date)} total={gbp(spec.amount)} accent={art.accent} stained={art.stained} folded={art.folded} />;
    case 'photo':
      return (
        <PhotoFrame>
          <div
            className="absolute left-1/2 top-1/2 h-[150px] w-[92px] overflow-hidden bg-paper"
            style={{ transform: `translate(-50%, -46%) rotate(${art.crumpled ? -9 : 7}deg) scale(0.72)` }}
          >
            <TillReceipt shop={spec.supplier.toUpperCase()} place={art.place} date={`${spec.date.toUpperCase()} 2026`} lines={art.lines} total={gbp(spec.amount)} />
            <div aria-hidden className="absolute inset-0" style={CRUMPLE} />
            {art.crumpled ? <div aria-hidden className="absolute inset-0 rotate-180" style={{ ...CRUMPLE, opacity: 0.8 }} /> : null}
          </div>
        </PhotoFrame>
      );
    case 'hand':
      return (
        <PhotoFrame>
          <div className="absolute left-1/2 top-1/2 h-[128px] w-[112px] overflow-hidden" style={{ transform: 'translate(-50%, -50%) rotate(-7deg) scale(0.62)' }}>
            <HandReceipt from={spec.supplier} what={art.what} amount={gbp(spec.amount)} date={spec.date} />
            <div aria-hidden className="absolute inset-0" style={CRUMPLE} />
          </div>
        </PhotoFrame>
      );
  }
}

/** A phone photo: the paper on a dark table, a warm cast and dark corners. */
function PhotoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-[92px] w-[72px] overflow-hidden rounded-[6px]" style={{ background: 'linear-gradient(160deg, #3B3226, #1F1A14 60%, #2A2219)' }}>
      {children}
      <div aria-hidden className="pointer-events-none absolute inset-0" style={PHOTO_SHADE} />
    </div>
  );
}

function PdfPage({ supplier, number, date, total, accent }: { supplier: string; number: string; date: string; total: string; accent: string }) {
  return (
    <div className="relative h-[108px] w-[84px] overflow-hidden rounded-2 bg-paper shadow-paper-sm">
      <MiniInvoice supplier={supplier} number={number} date={date} total={total} accent={accent} rows={4} className="px-2.5 pt-4" />
      <span className="absolute right-1 top-1 rounded-[2px] bg-prop-pdf px-[3px] font-sans text-[6px] font-bold leading-[9px] text-white">PDF</span>
    </div>
  );
}

function ScanPage({
  supplier,
  number,
  date,
  total,
  accent,
  stained,
  folded,
}: {
  supplier: string;
  number: string;
  date: string;
  total: string;
  accent: string;
  stained?: boolean;
  folded?: boolean;
}) {
  return (
    <div className="relative h-[104px] w-[84px] overflow-hidden bg-paper shadow-paper-sm">
      <MiniInvoice supplier={supplier} number={number} date={date} total={total} accent={accent} rows={4} className="px-2.5 pt-3" />
      <div aria-hidden className="absolute inset-0" style={AGED} />
      {folded ? <div aria-hidden className="absolute inset-0" style={FOLDS} /> : null}
      {stained ? (
        <div aria-hidden className="absolute inset-0">
          <CoffeeRing x={30} y={44} size={50} />
          <CoffeeDrop x={18} y={84} size={9} />
        </div>
      ) : null}
      <div aria-hidden className="absolute inset-0" style={{ ...CRUMPLE, opacity: 0.6 }} />
      {/* A staple through the top corner. */}
      <span aria-hidden className="absolute left-1.5 top-1.5 h-[2px] w-2.5 -rotate-[30deg] rounded-full bg-[#8C9296]" />
    </div>
  );
}

/** One more scan from the post, part of the rest of the month. */
export function ScanExtra() {
  return <ScanPage supplier="City Plumbing" number="CP 552019" date="21 Oct 2026" total="£96.24" accent="#0E6BA8" folded />;
}

const PARTICLE_ACCENT = ['#1F4E8C', '#B5331F', '#0B5E3A', '#C2410C', '#007B85', '#1D5FA8'];

/** The rest of the month, as tiny pages. Each still reads as paper: a header bar and lines. */
export function Particle({ tone }: { tone: number }) {
  return (
    <div className="h-[28px] w-[22px] rounded-[2px] bg-paper px-[3px] pt-[3px] shadow-paper-sm">
      <span className="block h-[3px] w-3/4 rounded-full" style={{ background: PARTICLE_ACCENT[tone % PARTICLE_ACCENT.length] }} />
      {[0.9, 0.7, 0.85, 0.6].map((w) => (
        <span key={w} className="mt-[2.5px] block h-[1.5px] rounded-full bg-paper-ink/30" style={{ width: `${w * 100}%` }} />
      ))}
    </div>
  );
}

/** A payment, lifted off the statement. */
export function BankStrip({ id, className }: { id: BankId; className?: string }) {
  const line = bankLine(id);
  return (
    <div className={cn('flex h-[18px] w-[208px] items-center justify-between gap-2 rounded-4 bg-paper px-2 font-mono text-[12px] leading-none text-paper-ink shadow-paper-sm', className)}>
      <span className="truncate font-semibold">{line.details}</span>
      <span className="tnum shrink-0">−{gbp(line.amount).slice(1)}</span>
    </div>
  );
}

/** A value on the move: a read field, an answer, a VAT figure, an attachment. */
export function Chip({ text, tone, mono }: { text: string; tone: 'paper' | 'mint' | 'brass'; mono?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex h-7 items-center whitespace-nowrap rounded-8 px-2.5 text-[13.5px] font-semibold leading-none',
        tone === 'paper' && 'bg-paper text-paper-ink shadow-glow',
        tone === 'mint' && 'bg-signal text-ink-950 shadow-glow',
        tone === 'brass' && 'border border-brass/70 bg-ink-900 text-brass shadow-brass',
        mono && 'tnum font-mono text-[13px]',
      )}
    >
      {text}
    </span>
  );
}

/** Art drawn at its native size and scaled to fit a box, centred. */
export function Fit({ w, h, box, className, style, children }: { w: number; h: number; box: { w: number; h: number }; className?: string; style?: CSSProperties; children: ReactNode }) {
  const k = Math.min(box.w / w, box.h / h);
  return (
    <div className={cn('relative shrink-0', className)} style={{ width: box.w, height: box.h, ...style }}>
      <div className="absolute left-1/2 top-1/2" style={{ width: w, height: h, transform: `translate(-50%, -50%) scale(${k})` }}>
        {children}
      </div>
    </div>
  );
}
