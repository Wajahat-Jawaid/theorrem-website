'use client';

import Link from 'next/link';
import { useEffect, useReducer, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { AlertCircle, ArrowRight, Check, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppData, useUi } from '@/lib/store';
import { useIsoLayoutEffect, useTimers } from '@/lib/agent';
import { useDemoCommand, useReplay } from '@/lib/demo-store';
import { vatFigures } from '@/lib/derive';
import { vatReturn } from '@/lib/data/vat';
import { count, dateFull, monthLong, parts, plural, time } from '@/lib/format';
import { CSS_EASE, EASE, SPRING } from '@/lib/motion';
import { NextCard } from '@/components/shell/NextCard';
import { PageTitle } from '@/components/shell/PageTitle';

const FIGURES = vatFigures(vatReturn);
const PERIOD = `${monthLong(vatReturn.periodStart)} to ${monthLong(vatReturn.periodEnd)} ${parts(vatReturn.periodEnd).y}`;
const DUE = parts(vatReturn.dueDate);
const DUE_SHORT = `${DUE.d} ${monthLong(vatReturn.dueDate)}`;
const READY_PCT = Math.floor(FIGURES.readiness * 100);

type BoxNo = 1 | 2 | 3 | 4 | 6 | 7 | 8 | 9;

interface Tile {
  box: BoxNo;
  label: string;
  value: number;
  /** HMRC takes boxes 6 to 9 in whole pounds. */
  whole: boolean;
}

/** Laid out two to a row, in HMRC's order, with Box 5 on its own to the right. */
const TILES: Tile[] = [
  { box: 1, label: 'VAT on sales', value: FIGURES.b1, whole: false },
  { box: 2, label: 'VAT on goods from the EU (NI only)', value: FIGURES.b2, whole: false },
  { box: 3, label: 'Total VAT due', value: FIGURES.b3, whole: false },
  { box: 4, label: 'VAT reclaimed on costs', value: FIGURES.b4, whole: false },
  { box: 6, label: 'Sales before VAT', value: FIGURES.b6, whole: true },
  { box: 7, label: 'Costs before VAT', value: FIGURES.b7, whole: true },
  { box: 8, label: 'Goods sold to the EU (NI only)', value: FIGURES.b8, whole: true },
  { box: 9, label: 'Goods bought from the EU (NI only)', value: FIGURES.b9, whole: true },
];

/**
 * The stream: sales documents into boxes 1 and 6, purchase documents into
 * boxes 4 and 7, three each, 120ms apart. Each box rolls to its figure once
 * its last document lands; Box 3 follows Box 1, and Box 5 resolves last.
 */
const FED: BoxNo[] = [6, 1, 7, 4];
const PER_BOX = 3;
const STREAM: { id: number; box: BoxNo }[] = Array.from({ length: PER_BOX * FED.length }, (_, i) => ({ id: i, box: FED[i % FED.length] }));
const STREAM_START_MS = 250;
const STREAM_STAGGER_MS = 120;
const BOX3_AFTER_MS = 250;
const BOX5_AFTER_MS = 450;

interface Assembly {
  landed: Partial<Record<BoxNo, number>>;
  resolved: (BoxNo | 5)[];
}

type AssemblyAction = { type: 'land'; box: BoxNo } | { type: 'resolve'; box: BoxNo | 5 } | { type: 'all' } | { type: 'reset' };

const EMPTY: Assembly = { landed: {}, resolved: [2, 8, 9] };
const ALL: Assembly = { landed: Object.fromEntries(FED.map((b) => [b, PER_BOX])), resolved: [1, 2, 3, 4, 5, 6, 7, 8, 9] };

function assemble(s: Assembly, a: AssemblyAction): Assembly {
  switch (a.type) {
    case 'land': {
      const n = (s.landed[a.box] ?? 0) + 1;
      return { landed: { ...s.landed, [a.box]: n }, resolved: n >= PER_BOX && !s.resolved.includes(a.box) ? [...s.resolved, a.box] : s.resolved };
    }
    case 'resolve':
      return s.resolved.includes(a.box) ? s : { ...s, resolved: [...s.resolved, a.box] };
    case 'all':
      return ALL;
    case 'reset':
      return EMPTY;
  }
}

export function VatView() {
  const { state, counts, dispatch, nowIso } = useAppData();
  const { reducedMotion } = useUi();
  const { later, clear } = useTimers();
  const [run, setRun] = useState(0);
  const [assembly, act] = useReducer(assemble, EMPTY);
  const [justSent, setJustSent] = useState(false);
  const tiles = useRef<Partial<Record<BoxNo, HTMLDivElement | null>>>({});
  const sent = state.vatSentAt !== null;
  const done = (b: BoxNo | 5): boolean => assembly.resolved.includes(b);
  const complete = done(5);

  // Under reduced motion the return is simply there.
  useIsoLayoutEffect(() => {
    if (reducedMotion) act({ type: 'all' });
  }, [reducedMotion, run]);

  useEffect(() => {
    if (done(1) && !done(3)) later(() => act({ type: 'resolve', box: 3 }), BOX3_AFTER_MS);
    if (done(3) && done(4) && !done(5)) later(() => act({ type: 'resolve', box: 5 }), BOX5_AFTER_MS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assembly.resolved]);

  useReplay('vat', () => {
    clear();
    act({ type: 'reset' });
    setRun((n) => n + 1);
    // So the next send shimmers afresh.
    setJustSent(false);
  });

  const send = (): void => {
    if (sent) return;
    // Sent before the boxes have filled: show the finished return at once rather than file a £0 one.
    if (!complete) act({ type: 'all' });
    dispatch({ type: 'vat_send', at: nowIso() });
    setJustSent(true);
  };
  useDemoCommand('vat:send', send);

  return (
    <div className="pt-10">
      <PageTitle
        eyebrow={`VAT · ${PERIOD}`}
        title="Your VAT return, assembled."
        action={<Readiness complete={complete} instant={reducedMotion} />}
      />

      <div className="relative mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.3fr)]">
        {TILES.map((t) => (
            <BoxTile
              key={t.box}
              tile={t}
              resolved={done(t.box)}
              instant={reducedMotion}
              tileRef={(el) => {
                tiles.current[t.box] = el;
              }}
            />
        ))}
        <Box5 resolved={complete} sent={sent} shimmer={justSent && !reducedMotion} sentAt={state.vatSentAt} onSend={send} />
        {reducedMotion ? null : <SourceStream key={run} tiles={tiles} onLand={(box) => act({ type: 'land', box })} />}
      </div>

      <section aria-label="What's in" className="card mt-4 grid gap-6 p-6 lg:grid-cols-[minmax(0,1fr)_auto]">
        <ul className="flex flex-col gap-2.5">
          <CheckItem ok show={complete}>
            {`${count(counts.auto)} of ${count(counts.received)} documents this month read and filed for you`}
          </CheckItem>
          <CheckItem ok={counts.needsOk === 0} show={complete} href={counts.needsOk > 0 ? '/review' : undefined}>
            {counts.needsOk === 0
              ? `${plural(counts.touched, 'approval')} done`
              : `${count(counts.needsOk)} ${counts.needsOk === 1 ? 'document needs' : 'documents need'} your OK`}
          </CheckItem>
          <CheckItem ok={counts.missing === 0} show={complete} href={counts.missing > 0 ? '/paperwork' : undefined}>
            {counts.missing === 0 ? 'Nothing missing' : `${plural(counts.missing, 'document')} still being chased`}
          </CheckItem>
        </ul>
        <p className="flex items-center gap-2 self-end text-small text-mid">
          <ShieldCheck size={18} strokeWidth={1.75} className="shrink-0 text-signal" aria-hidden />
          CIS deductions and reverse charge are handled for you.
        </p>
      </section>

      <NextCard href="/dashboard" title="Back to overview" eyebrow={null} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The boxes                                                            */
/* ------------------------------------------------------------------ */

const money = (whole: boolean) => ({ style: 'currency', currency: 'GBP', minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 }) as const;
const ROLL = { duration: 900, easing: CSS_EASE.outExpo };

function BoxTile({ tile, resolved, instant, tileRef }: { tile: Tile; resolved: boolean; instant: boolean; tileRef: (el: HTMLDivElement | null) => void }) {
  const zero = tile.value === 0;
  return (
    <div
      ref={tileRef}
      role="group"
      aria-label={`Box ${tile.box}, ${tile.label}`}
      className={cn(
        // The small paper shadow: the full one reaches across the gap onto the tile beside it.
        'paper flex min-h-[92px] flex-col justify-between px-4 py-3.5 shadow-paper-sm transition-opacity duration-medium',
        !resolved && !zero && 'opacity-80',
      )}
    >
      <p className="flex items-baseline gap-2 text-[12px] leading-tight">
        <span className="shrink-0 font-mono font-medium text-paper-muted">Box {tile.box}</span>
        <span className="min-w-0 text-paper-ink">{tile.label}</span>
      </p>
      <p className="tnum mt-2 text-[22px] font-semibold leading-none text-paper-ink">
        <NumberFlow value={resolved ? tile.value : 0} format={money(tile.whole)} locales="en-GB" animated={!instant} spinTiming={ROLL} transformTiming={ROLL} />
      </p>
    </div>
  );
}

function Box5({ resolved, sent, shimmer, sentAt, onSend }: { resolved: boolean; sent: boolean; shimmer: boolean; sentAt: string | null; onSend: () => void }) {
  const owed = FIGURES.toPay >= 0;
  return (
    <div
      role="group"
      aria-label="Box 5"
      className="relative flex flex-col justify-between overflow-hidden rounded-20 border border-brass/25 bg-ink-800/90 p-7 shadow-card lg:col-start-3 lg:row-span-4 lg:row-start-1"
    >
      <div>
        <p className="eyebrow">Box 5 · {owed ? 'Net VAT to pay' : 'Net VAT to reclaim'}</p>
        <p className="tnum mt-5 text-box5-sm text-brass 2xl:text-box5">
          <NumberFlow value={resolved ? FIGURES.b5 : 0} format={money(false)} locales="en-GB" spinTiming={{ duration: 1200, easing: CSS_EASE.outExpo }} transformTiming={{ duration: 1200, easing: CSS_EASE.outExpo }} />
        </p>
        <motion.p
          className="mt-4 text-lead text-mid"
          initial={false}
          animate={{ opacity: resolved ? 1 : 0, y: resolved ? 0 : 6 }}
          transition={{ duration: 0.4, delay: resolved ? 0.6 : 0, ease: EASE.outExpo }}
        >
          {owed ? `to pay HMRC by ${DUE_SHORT}.` : `back from HMRC for ${PERIOD}.`} Ready when you are.
        </motion.p>
      </div>

      <div className="mt-8">
        <AnimatePresence mode="wait" initial={false}>
          {sent ? (
            <motion.p
              key="sent"
              role="status"
              className="flex items-start gap-3 rounded-12 border border-signal/30 bg-signal/[0.08] px-5 py-4 text-body font-medium text-hi"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={SPRING.snap}
            >
              <Check size={20} strokeWidth={2.25} className="mt-0.5 shrink-0 text-signal" aria-hidden />
              <span>
                Ready in Xero — submit through Making Tax Digital in one click.
                {sentAt ? <span className="mt-0.5 block text-small font-normal text-mid">Sent to Xero at {time(sentAt)}</span> : null}
              </span>
            </motion.p>
          ) : (
            <motion.button
              key="send"
              type="button"
              onClick={onSend}
              className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-12 bg-brass px-7 text-lead font-semibold text-ink-950 shadow-brass transition-colors duration-micro hover:bg-[#EAC36E] active:bg-brass-deep"
              exit={{ opacity: 0, scale: 0.98, transition: { duration: 0.12 } }}
            >
              Send to Xero for filing
              <ArrowRight size={19} strokeWidth={2} aria-hidden />
            </motion.button>
          )}
        </AnimatePresence>
        <p className="mt-3 text-[13px] text-lo">Due {dateFull(vatReturn.dueDate)}. Nothing goes to HMRC until you submit it in Xero.</p>
      </div>

      {shimmer ? (
        <span aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-20">
          <span className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-brass/20 to-transparent motion-safe:animate-shimmer" />
        </span>
      ) : null}
    </div>
  );
}

/** A ring that closes as the last box fills: how much of the quarter's paperwork is in. */
function Readiness({ complete, instant }: { complete: boolean; instant: boolean }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg viewBox="0 0 64 64" width="64" height="64" aria-hidden className="-rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        <motion.circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke="#4BE3A0"
          strokeWidth="5"
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: complete ? c * (1 - FIGURES.readiness) : c }}
          transition={instant ? { duration: 0 } : { duration: 0.9, ease: EASE.outExpo }}
        />
      </svg>
      <div>
        <p className="tnum text-h3 text-hi">
          <NumberFlow value={complete ? READY_PCT : 0} suffix="%" animated={!instant} /> ready
        </p>
        <p className="tnum text-small text-mid">
          {count(vatReturn.documentsIn)} of {count(vatReturn.documentsExpected)} documents in for the quarter
        </p>
      </div>
    </div>
  );
}

function CheckItem({ ok, show, href, children }: { ok: boolean; show: boolean; href?: string; children: string }) {
  const body = (
    <>
      <span aria-hidden className={cn('inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full', ok ? 'bg-signal/15 text-signal' : 'text-amber')}>
        {ok ? <Check size={12} strokeWidth={2.75} /> : <AlertCircle size={17} strokeWidth={2} />}
      </span>
      <span className="tnum">{children}</span>
      {href ? <ArrowRight size={15} strokeWidth={1.75} aria-hidden /> : null}
    </>
  );
  return (
    <motion.li initial={false} animate={{ opacity: show ? 1 : 0.35 }} transition={{ duration: 0.3 }}>
      {href ? (
        <Link href={href} className={cn('inline-flex items-center gap-2.5 rounded-6 text-body hover:underline', ok ? 'text-hi' : 'text-amber')}>
          {body}
        </Link>
      ) : (
        <span className={cn('inline-flex items-center gap-2.5 text-body', ok ? 'text-hi' : 'text-amber')}>{body}</span>
      )}
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */
/* Source documents streaming in from the left edge                     */
/* ------------------------------------------------------------------ */

interface Flight {
  id: number;
  box: BoxNo;
  left: number;
  top: number;
  dx: number;
  dy: number;
  delay: number;
}

const THUMB = { w: 22, h: 30 } as const;

function SourceStream({ tiles, onLand }: { tiles: RefObject<Partial<Record<BoxNo, HTMLDivElement | null>>>; onLand: (box: BoxNo) => void }) {
  const [flights, setFlights] = useState<Flight[]>([]);
  const landed = useRef(new Set<number>());
  // Its own box covers the grid exactly; the grid's ref is not attached yet when this first lays out.
  const layer = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const root = layer.current;
    const map = tiles.current;
    if (!root || !map) return undefined;
    const gr = root.getBoundingClientRect();
    const plan: Flight[] = [];
    for (const s of STREAM) {
      const el = map[s.box];
      if (!el) continue;
      const tr = el.getBoundingClientRect();
      // From just inside the window's left edge, at a height near the box it feeds.
      const left = -gr.left + 8;
      const top = tr.top - gr.top + tr.height / 2 - THUMB.h / 2 + ((s.id * 37) % 60) - 30;
      const toLeft = tr.left - gr.left + tr.width - 52 - (s.id % PER_BOX) * 10;
      const toTop = tr.top - gr.top + tr.height - THUMB.h - 10;
      plan.push({ id: s.id, box: s.box, left, top, dx: toLeft - left, dy: toTop - top, delay: STREAM_START_MS + s.id * STREAM_STAGGER_MS });
    }
    setFlights(plan);
    // Land on the clock as well, in case a frame is dropped while the tab is hidden.
    const timers = plan.map((f) => setTimeout(() => land(f), f.delay + 700));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const land = (f: Flight): void => {
    if (landed.current.has(f.id)) return;
    landed.current.add(f.id);
    onLand(f.box);
  };

  return (
    <div ref={layer} aria-hidden className="pointer-events-none absolute inset-0 z-10">
      {flights.map((f) => (
        <motion.span
          key={f.id}
          className="paper absolute p-1"
          style={{ left: f.left, top: f.top, width: THUMB.w, height: THUMB.h }}
          initial={{ x: 0, y: 0, opacity: 0, rotate: -8 }}
          animate={{ x: f.dx, y: f.dy, opacity: [0, 1, 1, 0], rotate: 0 }}
          transition={{
            delay: f.delay / 1000,
            x: { ...SPRING.fly, delay: f.delay / 1000 },
            y: { duration: 0.6, ease: EASE.outExpo, delay: f.delay / 1000 },
            opacity: { duration: 0.65, times: [0, 0.1, 0.8, 1], delay: f.delay / 1000 },
            rotate: { duration: 0.6, delay: f.delay / 1000 },
          }}
          onAnimationComplete={() => land(f)}
        >
          <span className="block h-[2px] w-4/5 rounded-full bg-paper-rule" />
          <span className="mt-[3px] block h-[2px] w-3/5 rounded-full bg-paper-rule" />
          <span className="mt-[3px] block h-[2px] w-2/3 rounded-full bg-paper-rule" />
        </motion.span>
      ))}
    </div>
  );
}
