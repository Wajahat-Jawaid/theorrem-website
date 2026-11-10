'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { animate, motion, useMotionValue, useTransform, type MotionValue, type TargetAndTransition, type Transition } from 'framer-motion';
import { Check, FileText, Link2 } from 'lucide-react';
import type { Reminder } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useIsoLayoutEffect } from '@/lib/agent';
import { useAppData } from '@/lib/store';
import { canSend, openReminders } from '@/lib/derive';
import { MONTH_LABEL } from '@/lib/constants';
import { count, dayMonth, gbp, plural, time } from '@/lib/format';
import { EASE, HERO, PIPELINE, SPRING } from '@/lib/motion';
import { FieldChip } from './FieldChip';
import { LedgerCard } from './LedgerCard';
import { PaperInvoice } from './PaperInvoice';
import { ScanBeam } from './ScanBeam';
import { FIELD_ORDER, HERO_DOC, stageFields, type FieldKey } from './stageData';
import { Envelope, PileCard, SourceBadge } from './PileCards';
import {
  COL_W,
  COL_X,
  ENVELOPE,
  GROUPS,
  HERO_LANDS,
  HERO_ROW,
  LEDGER_W,
  OUTBOX_MORE_H,
  OUTBOX_ROW_H,
  OUTBOX_ROW_TOP,
  OUTBOX_SLOTS,
  OUTBOX_W,
  OUTBOX_X,
  PANEL_H,
  PANEL_TOP,
  PLACES,
  ROWS,
  ROW_BY_ID,
  ROW_H,
  ROW_LANDS,
  SIZE,
  STAGE_H,
  STAGE_W,
  centre,
  flight,
  pileFor,
  rowAt,
  type LedgerRow,
  type PileItem,
} from './pileData';

const sec = (ms: number): number => ms / 1000;

/** The detail invoice is read at this multiple of the pipeline's speed, so the whole read takes 1.8s. */
const DETAIL_SPEED = 1.6;
/** Where the detail invoice and its ledger card sit while it is read, in stage units. */
const PAPER = { x: 150, y: 44, w: 300, h: 320 } as const;
const CARD = { x: 504, y: 72, w: 236, h: 300 } as const;
/** Into a row: quick away, then a firm stop. */
const SNAP: [number, number, number, number] = [0.55, 0, 0.25, 1];
/** A piece of the pile, shrunk as it lands in its row. */
const LANDED_SCALE = 0.2;
/** The envelope a chase folds into, inside its piece of paper. */
const FOLD = { w: 70, h: 50 } as const;

interface ChaosStageProps {
  /** The latest hero beat reached, in ms from first paint. */
  now: number;
  /** Render the end state at once: reduced motion, or the hero already played in this tab. */
  skip: boolean;
  className?: string;
}

/**
 * Chaos to order. October's paperwork lies scattered and holds still long
 * enough to be recognised; a scan passes over it; one invoice is read in
 * detail; then the rest fly into a ledger by category, faster and faster,
 * a duplicate merges away, the chases fold into envelopes, and the outbox
 * fills. Transforms and opacity only, on 24 pieces.
 */
export function ChaosStage({ now, skip, className }: ChaosStageProps) {
  const { state, counts } = useAppData();
  const frame = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const open = openReminders(state.reminders);
  const openKey = open.map((r) => r.id).join(',');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pile = useMemo(() => pileFor(open), [openKey]);
  // The chases with a piece in the pile come first, so each envelope has a drawn row to land in.
  const inPile = new Set(pile.flatMap((i) => (i.to.kind === 'chase' ? [i.to.reminderId] : [])));
  const queue = [...open.filter((r) => inPile.has(r.id)), ...open.filter((r) => !inPile.has(r.id))];
  const shown = queue.slice(0, OUTBOX_SLOTS);
  const chaseRow = (reminderId: string): number => shown.findIndex((r) => r.id === reminderId);

  const reached = (t: number): boolean => skip || now >= t;
  const sorting = reached(HERO.sort);

  // Fit the fixed-size stage to its column.
  useIsoLayoutEffect(() => {
    const el = frame.current;
    if (!el) return undefined;
    const fit = (): void => setScale(Math.min(1, el.clientWidth / STAGE_W));
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // "Sorted 0 → 309", accelerating with the pile.
  const sorted = useMotionValue(skip ? counts.auto : 0);
  const sortedText = useTransform(sorted, (v) => count(Math.round(v)));
  useEffect(() => {
    if (skip) {
      sorted.set(counts.auto);
      return undefined;
    }
    if (!sorting) return undefined;
    const controls = animate(sorted, counts.auto, { duration: sec(HERO.outbox - HERO.sort - 200), ease: 'easeIn' });
    return () => controls.stop();
  }, [skip, sorting, counts.auto, sorted]);

  const heroItem = pile.find((i) => i.to.kind === 'detail');
  const byId = new Map(pile.map((i) => [i.id, i]));

  return (
    <div className={className}>
      <p className="sr-only">
        Your {MONTH_LABEL} paperwork: {count(counts.received)} items from {PLACES.length} places, sorted into your ledger by category, with{' '}
        {open.length === 1 ? 'one chase' : `${count(open.length)} chases`} and the month-end pack in the outbox.
      </p>
      <div ref={frame} aria-hidden className="relative w-full" style={{ height: STAGE_H * scale }}>
        <div ref={stage} className="absolute left-0 top-0 origin-top-left" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
          <motion.p
            className="absolute left-0 top-0 text-[14px] font-medium text-mid"
            initial={skip ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, ease: EASE.outExpo }}
          >
            Your {MONTH_LABEL} paperwork: <span className="text-hi">{count(counts.received)} items</span> from {PLACES.length} places.
          </motion.p>

          <Ledger sorting={sorting} skip={skip} sortedText={sortedText} />
          <Outbox shown={shown} more={queue.length - shown.length} received={counts.received} sorting={sorting} reveal={reached(HERO.outbox)} skip={skip} />

          {skip ? null : (
            <motion.div
              className="absolute inset-0 z-20"
              initial={false}
              animate={{ opacity: reached(HERO.detail) && !sorting ? 0.22 : 1 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            >
              {pile.map((item, i) => (
                <Piece key={item.id} item={item} index={i} now={now} into={item.to.kind === 'merge' ? byId.get(item.to.into) : undefined} chaseRow={item.to.kind === 'chase' ? chaseRow(item.to.reminderId) : -1} />
              ))}
            </motion.div>
          )}

          {!skip && reached(HERO.scan) && !sorting ? <ScanSweep /> : null}

          {!skip && heroItem && reached(HERO.detail) ? <DetailRead item={heroItem} stage={stage} sorting={sorting} /> : null}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The pile                                                            */
/* ------------------------------------------------------------------ */

function Piece({ item, index, now, into, chaseRow }: { item: PileItem; index: number; now: number; into?: PileItem; chaseRow: number }) {
  const size = SIZE[item.kind];
  const at = (t: number): boolean => now >= t;
  const rest = { x: 0, y: 0, rotate: item.rot, scale: 1, opacity: 1 };
  const enter = { duration: 0.3, delay: sec(index * HERO.pileStagger), ease: 'easeOut' };
  const c = centre(item);

  let target: TargetAndTransition = rest;
  let transition: Transition = enter;
  let folded = false;

  switch (item.to.kind) {
    case 'detail':
      if (at(HERO.detail)) {
        target = { ...rest, scale: 1.04, opacity: 0 };
        transition = { duration: 0.2, ease: 'easeOut' };
      }
      break;
    case 'row':
      if (at(HERO.sort)) {
        const f = flight(item.to.order);
        const dest = rowAt(item.to.row);
        const move = { delay: sec(f.start - HERO.sort), duration: sec(f.duration), ease: SNAP };
        target = { x: dest.x + 56 - c.x, y: dest.y + ROW_H / 2 - c.y, rotate: 0, scale: LANDED_SCALE, opacity: [1, 1, 0] };
        transition = { ...move, opacity: { ...move, ease: 'linear', times: [0, 0.75, 1] } };
      }
      break;
    case 'merge':
      if (into && at(HERO.merge)) {
        const to = centre(into);
        const move = { duration: 0.6, delay: 0.15, ease: EASE.outExpo, times: [0, 0.55, 1] };
        target = { x: [0, to.x - c.x, to.x - c.x], y: [0, to.y - c.y, to.y - c.y], rotate: [item.rot, into.rot, into.rot], scale: [1, 0.8, 0.8], opacity: [1, 1, 0] };
        transition = move;
      }
      break;
    case 'chase': {
      if (chaseRow < 0) break;
      const env = { x: OUTBOX_X + ENVELOPE.x + ENVELOPE.w / 2, y: PANEL_TOP + OUTBOX_ROW_TOP + chaseRow * OUTBOX_ROW_H + ENVELOPE.y + ENVELOPE.h / 2 };
      const dx = env.x - c.x;
      const dy = env.y - c.y;
      const shrink = ENVELOPE.w / FOLD.w;
      folded = at(HERO.fold);
      if (at(HERO.outbox)) {
        // Its row has its own envelope now.
        target = { x: dx, y: dy, rotate: 0, scale: shrink, opacity: 0 };
        transition = { duration: 0.2, delay: sec(chaseRow * HERO.outboxStagger) };
      } else if (folded) {
        target = { x: [0, 0, dx], y: [0, 0, dy], rotate: [item.rot, 0, 0], scale: [1, 1, shrink], opacity: 1 };
        transition = { duration: 0.8, times: [0, 0.3, 1], ease: 'easeInOut' };
      }
      break;
    }
  }

  const merging = (item.to.kind === 'merge' || item.id === mergeTarget(item)) && at(HERO.merge);
  const lit = at(HERO.scan);
  const litDelay = sec(HERO.scanDuration) * (c.x / STAGE_W);

  return (
    <motion.div
      className="absolute"
      style={{ left: item.x, top: item.y, width: size.w, height: size.h, zIndex: index, willChange: 'transform' }}
      initial={{ opacity: 0, rotate: item.rot }}
      animate={target}
      transition={transition}
    >
      <motion.div
        className="h-full w-full"
        style={{ filter: item.back ? 'blur(0.7px) brightness(0.82)' : undefined }}
        initial={false}
        animate={folded ? { scaleY: 0.1, opacity: 0 } : { scaleY: 1, opacity: 1 }}
        transition={{ duration: 0.22, ease: EASE.inQuart }}
      >
        <PileCard item={item} />
        <SourceBadge source={item.source} lit={lit} delay={litDelay} instant={false} />
      </motion.div>

      {item.to.kind === 'chase' ? (
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2"
          style={{ width: FOLD.w, height: FOLD.h, marginLeft: -FOLD.w / 2, marginTop: -FOLD.h / 2 }}
          initial={false}
          animate={folded ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.6 }}
          transition={{ duration: 0.2, delay: folded ? 0.12 : 0 }}
        >
          <Envelope className="h-full w-full drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]" />
        </motion.div>
      ) : null}

      {merging ? <AmberFlash /> : null}
      {item.to.kind === 'row' && item.id === mergeTarget(item) && at(HERO.merge) ? (
        <motion.span
          className="absolute -top-3 right-1 z-10 whitespace-nowrap rounded-full border border-amber/40 bg-ink-900 px-2 py-0.5 text-[9px] font-semibold text-amber"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.55 }}
        >
          Duplicate removed
        </motion.span>
      ) : null}
    </motion.div>
  );
}

/** The Jewson original is the one its copy merges into. */
function mergeTarget(item: PileItem): string | null {
  return item.to.kind === 'row' && ROW_BY_ID.get(item.to.row)?.tag ? item.id : null;
}

function AmberFlash() {
  return (
    <motion.span
      aria-hidden
      className="pointer-events-none absolute -inset-1 z-10 rounded-8 border-2 border-amber shadow-[0_0_18px_rgba(255,181,71,0.45)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: [0, 1, 0.3, 1, 0] }}
      transition={{ duration: 0.8, times: [0, 0.2, 0.45, 0.7, 1] }}
    />
  );
}

/** One mint line across the whole pile. The source tags light as it passes. */
function ScanSweep() {
  const d = sec(HERO.scanDuration);
  return (
    <motion.div
      aria-hidden
      className="pointer-events-none absolute bottom-0 left-0 top-6 z-30 w-[64px]"
      initial={{ x: -64, opacity: 0 }}
      animate={{ x: STAGE_W, opacity: [0, 1, 1, 0] }}
      transition={{ x: { duration: d, ease: 'linear' }, opacity: { duration: d, times: [0, 0.08, 0.88, 1] } }}
    >
      <div className="h-full w-full" style={{ background: 'linear-gradient(to right, rgba(75,227,160,0), rgba(75,227,160,0.16))' }} />
      <div className="absolute right-0 top-0 h-full w-[2px] bg-signal" style={{ boxShadow: '0 0 12px 2px rgba(75,227,160,0.55)' }} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* One invoice in detail                                               */
/* ------------------------------------------------------------------ */

/**
 * The Speedy Hire invoice lifts out of the pile, is scanned, and its six
 * values fly into a ledger card; then the read invoice drops into its row.
 */
function DetailRead({ item, stage, sorting }: { item: PileItem; stage: RefObject<HTMLDivElement>; sorting: boolean }) {
  const paper = useRef<HTMLDivElement>(null);
  const [scanning, setScanning] = useState(false);
  const [outlined, setOutlined] = useState<FieldKey[]>([]);
  const [flights, setFlights] = useState<FieldKey[]>([]);
  const [landed, setLanded] = useState<FieldKey[]>([]);
  const [posted, setPosted] = useState(false);
  const fields = stageFields(HERO_DOC);

  useEffect(() => {
    const id = setTimeout(() => setScanning(true), HERO.detailScanAfter);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (landed.length < FIELD_ORDER.length) return undefined;
    const id = setTimeout(() => setPosted(true), PIPELINE.posted);
    return () => clearTimeout(id);
  }, [landed.length]);

  const cross = useCallback((k: FieldKey) => {
    setOutlined((o) => (o.includes(k) ? o : [...o, k]));
    setFlights((f) => (f.includes(k) ? f : [...f, k]));
  }, []);
  const land = useCallback((k: FieldKey) => {
    setLanded((l) => (l.includes(k) ? l : [...l, k]));
    setFlights((f) => f.filter((x) => x !== k));
  }, []);

  const from = centre(item);
  const paperC = { x: PAPER.x + PAPER.w / 2, y: PAPER.y + PAPER.h / 2 };
  const dest = rowAt(HERO_ROW);
  const into = { x: dest.x + 56, y: dest.y + ROW_H / 2 };
  const drop = { duration: 0.42, ease: EASE.inQuart };

  return (
    <div className="absolute inset-0 z-40">
      <motion.div
        data-run="1"
        className="absolute"
        style={{ left: PAPER.x, top: PAPER.y, width: PAPER.w }}
        initial={{ x: from.x - paperC.x, y: from.y - paperC.y, scale: 0.4, rotate: item.rot, opacity: 0 }}
        animate={sorting ? { x: into.x - paperC.x, y: into.y - paperC.y, scale: 0.06, rotate: 0, opacity: 0 } : { x: 0, y: 0, scale: 1, rotate: -1.5, opacity: 1 }}
        transition={sorting ? drop : { ...SPRING.unfold, opacity: { duration: 0.15 } }}
      >
        <PaperInvoice ref={paper} doc={HERO_DOC} outlined={outlined}>
          {scanning && !sorting ? <ScanBeam paper={paper} speed={DETAIL_SPEED} opacity={1} onCross={cross} onDone={() => undefined} /> : null}
        </PaperInvoice>
      </motion.div>

      <motion.div
        className="absolute"
        style={{ left: CARD.x, top: CARD.y }}
        initial={{ opacity: 0, x: 12 }}
        animate={sorting ? { x: into.x - CARD.x - CARD.w / 2, y: into.y - CARD.y - CARD.h / 2, scale: 0.08, opacity: 0 } : { opacity: 1, x: 0 }}
        transition={sorting ? drop : { duration: 0.3, delay: 0.15, ease: EASE.outExpo }}
      >
        <LedgerCard doc={HERO_DOC} runKey={1} landed={landed} posted={posted} instant={false} />
      </motion.div>

      {flights.map((k) => (
        <FieldChip key={k} runKey={1} field={k} value={fields[k].value} stage={stage} speed={DETAIL_SPEED} onLand={land} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The ledger                                                          */
/* ------------------------------------------------------------------ */

function Ledger({ sorting, skip, sortedText }: { sorting: boolean; skip: boolean; sortedText: MotionValue<string> }) {
  const matches = ROWS.filter((r) => r.matches);
  return (
    <motion.div
      className="card absolute z-10"
      style={{ left: 0, top: PANEL_TOP, width: LEDGER_W, height: PANEL_H }}
      initial={false}
      animate={{ opacity: sorting ? 1 : 0 }}
      transition={{ duration: skip ? 0 : 0.35, ease: 'easeOut' }}
    >
      <div className="absolute inset-x-3.5 top-0 flex h-[36px] items-center justify-between border-b border-white/[0.06]">
        <span className="eyebrow text-[10px]">Ledger</span>
        <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-signal">
          <Check size={12} strokeWidth={2.5} aria-hidden />
          Sorted <motion.span className="tnum">{sortedText}</motion.span>
        </span>
      </div>

      {GROUPS.map((g) => (
        <div key={g.id} className="absolute flex items-end pb-1 text-[9.5px] font-semibold uppercase tracking-[0.08em] text-lo" style={{ left: COL_X[g.col], top: g.y, width: COL_W, height: 22 }}>
          {g.label}
        </div>
      ))}

      {ROWS.map((r) => (
        <Row key={r.id} r={r} show={sorting} delay={skip ? 0 : sec((ROW_LANDS[r.id] ?? HERO_LANDS) - HERO.sort)} skip={skip} />
      ))}

      <svg aria-hidden className="pointer-events-none absolute left-0 top-0 overflow-visible" width={LEDGER_W} height={PANEL_H}>
        {matches.map((r, j) => {
          const m = r.matches ? ROW_BY_ID.get(r.matches) : undefined;
          if (!m) return null;
          const x = COL_X[0] + COL_W + 2;
          const y1 = r.y + ROW_H / 2;
          const y2 = m.y + ROW_H / 2;
          const bulge = 11 - j * 2.5;
          const after = Math.max(ROW_LANDS[r.id] ?? 0, ROW_LANDS[m.id] ?? 0) + 80;
          return (
            <motion.path
              key={r.id}
              d={`M ${x} ${y1} C ${x + bulge} ${y1}, ${x + bulge} ${y2}, ${x} ${y2}`}
              fill="none"
              stroke="#4BE3A0"
              strokeOpacity={0.55}
              strokeWidth={1}
              initial={false}
              animate={{ pathLength: sorting ? 1 : 0, opacity: sorting ? 1 : 0 }}
              transition={{ duration: skip ? 0 : 0.3, delay: skip ? 0 : sec(after - HERO.sort), ease: 'easeOut' }}
            />
          );
        })}
      </svg>
    </motion.div>
  );
}

function Row({ r, show, delay, skip }: { r: LedgerRow; show: boolean; delay: number; skip: boolean }) {
  return (
    <motion.div
      className="absolute flex items-center gap-1.5 border-t border-white/[0.05] pr-0.5 text-[11px]"
      style={{ left: COL_X[r.col], top: r.y, width: COL_W, height: ROW_H }}
      initial={false}
      animate={{ opacity: show ? 1 : 0 }}
      transition={{ duration: skip ? 0 : 0.16, delay }}
    >
      {r.date ? <span className="tnum shrink-0 font-mono text-[10px] text-lo">{dayMonth(r.date)}</span> : null}
      <span className="min-w-0 truncate text-hi">{r.name}</span>
      {r.tag ? <span className="shrink-0 rounded-full bg-amber/15 px-1.5 text-[8.5px] font-semibold leading-[15px] text-amber">{r.tag}</span> : null}
      <span className="tnum ml-auto shrink-0 font-mono text-[10.5px] text-mid">{gbp(r.amount)}</span>
      {r.matches ? <Link2 size={11} strokeWidth={2} className="shrink-0 text-signal" aria-hidden /> : <Check size={11} strokeWidth={2.5} className="shrink-0 text-signal" aria-hidden />}
      {skip ? null : (
        <motion.span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-4 bg-signal/25"
          initial={false}
          animate={{ opacity: show ? [0, 1, 0] : 0 }}
          transition={{ duration: 0.5, delay, times: [0, 0.2, 1] }}
        />
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* The outbox                                                          */
/* ------------------------------------------------------------------ */

function Outbox({ shown, more, received, sorting, reveal, skip }: { shown: Reminder[]; more: number; received: number; sorting: boolean; reveal: boolean; skip: boolean }) {
  const rows = [
    ...shown.map((r) => ({ id: r.id, title: `To ${r.feedName}`, detail: r.email.subject, ready: canSend(r), sentAt: r.lastSentAt, pack: false })),
    { id: 'pack', title: 'Month-end pack → your accountant', detail: `PDF, ${count(received)} documents`, ready: true, sentAt: null, pack: true },
  ];
  // The count of the rest sits under the drawn chases, so the pack moves down by one short line.
  const moreTop = OUTBOX_ROW_TOP + shown.length * OUTBOX_ROW_H;
  const below = more > 0 ? OUTBOX_MORE_H : 0;
  const enter = (step: number) => ({
    initial: false as const,
    animate: reveal ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 },
    transition: { duration: skip ? 0 : 0.3, delay: skip ? 0 : sec(step * HERO.outboxStagger), ease: EASE.outExpo },
  });
  return (
    <motion.div
      className="card absolute z-10"
      style={{ left: OUTBOX_X, top: PANEL_TOP, width: OUTBOX_W, height: PANEL_H }}
      initial={false}
      animate={{ opacity: sorting ? 1 : 0 }}
      transition={{ duration: skip ? 0 : 0.35, ease: 'easeOut' }}
    >
      <div className="absolute inset-x-3.5 top-0 flex h-[36px] items-center justify-between border-b border-white/[0.06]">
        <span className="eyebrow text-[10px]">Outbox</span>
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
          Chasing
        </span>
      </div>
      {more > 0 ? (
        <motion.p
          className="absolute right-3.5 text-[10.5px] leading-[24px] text-mid"
          style={{ left: 52, top: moreTop, height: OUTBOX_MORE_H }}
          {...enter(shown.length)}
        >
          + {plural(more, 'more chase')}
        </motion.p>
      ) : null}
      {rows.map((row, i) => (
        <motion.div
          key={row.id}
          className="absolute inset-x-0"
          style={{ top: OUTBOX_ROW_TOP + i * OUTBOX_ROW_H + (row.pack ? below : 0), height: OUTBOX_ROW_H }}
          {...enter(row.pack && more > 0 ? i + 1 : i)}
        >
          {row.pack ? (
            <span className="absolute flex items-center justify-center rounded-2 bg-paper text-paper-ink" style={{ left: ENVELOPE.x, top: ENVELOPE.y - 4, width: ENVELOPE.w - 6, height: ENVELOPE.h + 8 }}>
              <FileText size={14} strokeWidth={1.75} aria-hidden />
            </span>
          ) : (
            <span className="absolute" style={{ left: ENVELOPE.x, top: ENVELOPE.y, width: ENVELOPE.w, height: ENVELOPE.h }}>
              <Envelope className="h-full w-full" />
            </span>
          )}
          <div className="absolute right-3.5 top-2.5 min-w-0" style={{ left: 52 }}>
            <p className="truncate text-[11.5px] font-medium text-hi">{row.title}</p>
            <p className="truncate text-[10.5px] text-mid">{row.detail}</p>
            <span
              className={cn(
                'mt-1.5 inline-flex rounded-full px-2 text-[9.5px] font-semibold leading-[17px]',
                row.ready ? 'bg-signal-soft text-signal' : 'bg-white/[0.05] text-mid',
              )}
            >
              {row.ready ? 'Ready to send' : `Sent ${row.sentAt ? time(row.sentAt) : ''}`}
            </span>
          </div>
        </motion.div>
      ))}
    </motion.div>
  );
}
