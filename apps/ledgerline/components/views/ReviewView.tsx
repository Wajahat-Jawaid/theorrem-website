'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, animate, motion, useMotionValue } from 'framer-motion';
import { AlertCircle, ArrowLeft, ArrowRight, Check, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Document, ReadField, ReviewChoice, ReviewItem } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useAppData, useUi } from '@/lib/store';
import { useIsoLayoutEffect } from '@/lib/agent';
import { useDemo, useDemoCommand, useReplay, type Entrance } from '@/lib/demo-store';
import { amountsCheck, needsOkQueue, parseAmount } from '@/lib/derive';
import { reviewItemFor } from '@/lib/data/reviewItems';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { categoryLabel, vatLabel } from '@/lib/data/categories';
import { dateLong, gbp, time } from '@/lib/format';
import { EASE, SPRING } from '@/lib/motion';
import { IconButton } from '@/components/ui/Button';
import { Tooltip } from '@/components/ui/Tooltip';
import { HighlightProvider, InvoiceSheet, useHighlight, type HighlightKey } from '@/components/domain/InvoiceSheet';
import { ReadRow } from '@/components/domain/ReadRow';

const FIELDS: { field: ReadField; label: string }[] = [
  { field: 'supplier', label: 'Supplier' },
  { field: 'invoiceNumber', label: 'Invoice no.' },
  { field: 'invoiceDate', label: 'Date' },
  { field: 'net', label: 'Before VAT' },
  { field: 'vat', label: 'VAT' },
  { field: 'gross', label: 'Total' },
];

function readValue(d: Document, field: ReadField): string {
  switch (field) {
    case 'supplier':
      return getSupplier(d.supplierId).name;
    case 'invoiceNumber':
      return d.invoiceNumber;
    case 'invoiceDate':
      return dateLong(d.invoiceDate);
    case 'net':
      return gbp(d.net);
    case 'vat':
      return gbp(d.vat);
    case 'gross':
      return gbp(d.gross);
  }
}

/** What the row shows: the owner's edit, with amounts written the usual way once we can read them. */
function shownValue(d: Document, field: ReadField, edit: string | undefined): string {
  if (edit === undefined) return readValue(d, field);
  if (field === 'net' || field === 'vat' || field === 'gross') {
    const amount = parseAmount(edit);
    return amount === null ? edit : gbp(amount);
  }
  return edit;
}

/** The decision card's beats after "Looks right": the seal stamps, then the paper flies into Xero in the nav. */
const STAMP_HOLD_MS = 420;
const FLIGHT_MS = 560;
const WALK_START_MS = 700;
const WALK_STEP_MS = 1300;

const isTyping = (t: EventTarget | null): boolean => t instanceof HTMLElement && t.closest('input, textarea, select, [contenteditable="true"]') !== null;
const isControl = (t: EventTarget | null): boolean => t instanceof HTMLElement && t.closest('button, a, summary, [role="button"]') !== null;

/* ------------------------------------------------------------------ */
/* /review: the first open item, or the empty stage                     */
/* ------------------------------------------------------------------ */

export function ReviewIndex() {
  const { state } = useAppData();
  const router = useRouter();
  const first = needsOkQueue(state.documents)[0];
  useEffect(() => {
    if (first) router.replace(`/review/${first.id}`);
  }, [first, router]);
  if (first) return null;
  return <AllClear />;
}

function AllClear() {
  return (
    <section className="flex min-h-[calc(100svh-56px-6rem)] flex-col items-center justify-center text-center">
      <motion.span
        aria-hidden
        className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-signal/10 text-signal shadow-glow"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING.snap, delay: 0.15 }}
      >
        <Check size={30} strokeWidth={2} />
      </motion.span>
      <h1 className="mt-8 font-display text-h1-sm text-hi 2xl:text-h1">All clear.</h1>
      <p className="mt-3 text-lead text-mid">Nothing else needs you this month.</p>
      <Link href="/paperwork" className="mt-10 inline-flex items-center gap-2 rounded-8 text-small font-medium text-mid transition-colors duration-micro hover:text-hi">
        See the paperwork we&apos;re chasing for you
        <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
      </Link>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* /review/[id]: the decision card                                      */
/* ------------------------------------------------------------------ */

export function ReviewView({ id }: { id: string }) {
  const { state } = useAppData();
  const [replays, setReplays] = useState(0);
  // Space shows the card arriving again, with its reasons walked through.
  useReplay('review', () => setReplays((n) => n + 1));
  const d = state.documents.find((x) => x.id === id);
  const item = reviewItemFor(id);
  if (!d || !item) return null;
  return <DecisionCard key={`${d.id}-${replays}`} d={d} item={item} replayed={replays > 0} />;
}

type Phase = 'open' | 'stamp' | 'fly' | 'gone';

function DecisionCard({ d, item, replayed }: { d: Document; item: ReviewItem; replayed: boolean }) {
  const { state, dispatch, toast, nowIso } = useAppData();
  const { reducedMotion } = useUi();
  const { takeEntrance, setEntrance, pulseXero } = useDemo();
  const router = useRouter();
  const [entrance] = useState<Entrance>(() => (replayed ? { kind: 'next' } : takeEntrance(d.id)));
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>('open');
  const [showAll, setShowAll] = useState(false);
  const stage = useRef<HTMLDivElement>(null);
  const paperBox = useRef<HTMLDivElement>(null);
  const live = useRef<HTMLParagraphElement>(null);
  const s = getSupplier(d.supplierId);
  const leaving = phase !== 'open';
  const open = d.status === 'needs_ok' || leaving;

  const queue = needsOkQueue(state.documents);
  const frozen = useRef<{ position: number; total: number } | null>(null);
  const livePosition = queue.findIndex((x) => x.id === d.id);
  const position = frozen.current?.position ?? livePosition;
  const total = frozen.current?.total ?? queue.length;
  const prev = livePosition > 0 ? queue[livePosition - 1] : null;
  const next = livePosition >= 0 && livePosition < queue.length - 1 ? queue[livePosition + 1] : null;

  const edits = state.edits[d.id];
  const check = amountsCheck(d, edits);
  const choice = item.choices.find((c) => c.id === choiceId) ?? null;
  const canApprove = d.status === 'needs_ok' && !leaving && choice !== null && choice.action.type !== 'hold' && check.ok;
  const blocked = !choice ? 'Pick an answer above first.' : !check.ok ? "The amounts don't add up yet. Open all fields to check them." : null;

  /** On to the next card still waiting, sliding up from below; or the empty stage. */
  const advance = useCallback(
    (exclude: string) => {
      const rest = needsOkQueue(state.documents).filter((x) => x.id !== exclude);
      if (rest[0]) {
        setEntrance(rest[0].id, { kind: 'next' });
        router.push(`/review/${rest[0].id}`);
      } else router.push('/review');
    },
    [router, setEntrance, state.documents],
  );

  const pick = (c: ReviewChoice): void => {
    if (d.status !== 'needs_ok' || leaving) return;
    if (c.action.type === 'hold') {
      // Keep this card as it was while the next one loads, rather than flashing its settled state.
      frozen.current = { position: livePosition, total: queue.length };
      setPhase('gone');
      dispatch({ type: 'hold', id: d.id, at: nowIso() });
      toast('info', `Held. We'll ask ${s.shortName} about it.`, "It's on Missing paperwork until they reply.");
      advance(d.id);
      return;
    }
    setChoiceId(c.id);
  };

  const askForCopy = (): void => {
    if (d.status !== 'needs_ok' || leaving) return;
    frozen.current = { position: livePosition, total: queue.length };
    setPhase('gone');
    dispatch({ type: 'request_copy', id: d.id, at: nowIso() });
    toast('info', `We've asked ${s.shortName} for a clearer copy`, "It's on Missing paperwork until they reply.");
    advance(d.id);
  };

  // The approval itself is dispatched once the paper lands in Xero, so the nav badge counts down as it arrives.
  const approval = useRef<{ at: string; category: Document['category'] } | null>(null);
  const finish = useCallback(() => {
    const a = approval.current;
    if (!a) return;
    approval.current = null;
    dispatch({ type: 'approve', id: d.id, at: a.at, category: a.category });
    pulseXero();
    setPhase('gone');
    advance(d.id);
  }, [advance, d.id, dispatch, pulseXero]);

  const approve = (): void => {
    if (!canApprove || !choice) return;
    approval.current = { at: nowIso(), category: choice.action.type === 'category' ? choice.action.code : d.category };
    frozen.current = { position: livePosition, total: queue.length };
    if (live.current) live.current.textContent = `Added to Xero: ${s.shortName}, ${gbp(check.gross)}.`;
    if (reducedMotion) {
      finish();
      return;
    }
    setPhase('stamp');
  };

  // Seal, a beat to read it, then the flight.
  useEffect(() => {
    if (phase !== 'stamp') return undefined;
    const t = setTimeout(() => setPhase('fly'), STAMP_HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  useDemoCommand('review:choose', () => {
    const lean = item.choices.find((c) => c.action.type !== 'hold');
    if (lean) pick(lean);
  });
  useDemoCommand('review:approve', () => approve());

  // 1, 2, 3 pick an answer; Enter adds it to Xero.
  const keys = useRef({ pick, approve });
  keys.current = { pick, approve };
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || isTyping(e.target)) return;
      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= item.choices.length) {
        e.preventDefault();
        keys.current.pick(item.choices[n - 1]);
      } else if (e.key === 'Enter' && !isControl(e.target)) {
        e.preventDefault();
        keys.current.approve();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item.choices]);

  return (
    <HighlightProvider regions={item.evidence.map((e) => e.region)} marks={showAll}>
      <p ref={live} aria-live="polite" className="sr-only" />
      <motion.div
        initial={entrance?.kind === 'next' && !reducedMotion ? { y: 72, opacity: 0 } : false}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="flex h-14 items-center justify-between gap-4 pt-2">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 rounded-6 text-small font-medium text-mid transition-colors duration-micro hover:text-hi">
            <ArrowLeft size={16} strokeWidth={1.75} aria-hidden />
            Overview
          </Link>
          {open && position >= 0 ? (
            <nav aria-label="Needs your OK" className="flex items-center gap-2">
              <IconButton label="Previous" disabled={!prev || leaving} onClick={() => prev && router.push(`/review/${prev.id}`)}>
                <ChevronLeft size={18} strokeWidth={1.75} aria-hidden />
              </IconButton>
              <span className="tnum min-w-14 text-center text-small font-medium text-mid">
                {position + 1} of {total}
              </span>
              <IconButton label="Next" disabled={!next || leaving} onClick={() => next && router.push(`/review/${next.id}`)}>
                <ChevronRight size={18} strokeWidth={1.75} aria-hidden />
              </IconButton>
            </nav>
          ) : null}
        </div>

        <div ref={stage} className="relative mx-auto mt-4 grid max-w-[1080px] items-start gap-10 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12">
          <div className="min-w-0 lg:sticky lg:top-[72px]">
            <FlyingPaper
              doc={d}
              box={paperBox}
              entrance={reducedMotion ? null : entrance}
              phase={phase}
              onLanded={finish}
            />
          </div>

          <motion.div
            className="min-w-0"
            animate={{ opacity: phase === 'fly' || phase === 'gone' ? 0 : 1 }}
            transition={{ duration: 0.2, ease: EASE.inQuart }}
          >
            {open ? (
              <section aria-labelledby="question" className="rounded-20 border border-white/[0.06] bg-ink-800/80 p-6 shadow-card">
                <p className="eyebrow flex items-center gap-2">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
                  {s.shortName} {d.layout} · {gbp(d.gross)}
                </p>
                <h1 id="question" className="mt-3 font-display text-[28px] font-semibold leading-[1.12] tracking-[-0.02em] text-hi">
                  {item.question}
                </h1>
                {item.hint ? <p className="mt-2 text-body text-mid">{item.hint}</p> : null}
                <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-signal/10 px-3 py-1.5 text-small font-medium text-signal">
                  <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
                  {item.lean}
                </p>

                <Reasons item={item} walk={!reducedMotion && !leaving} />

                <div role="group" aria-label={item.question} className="mt-5 flex flex-col gap-2.5">
                  {item.choices.map((c, i) => (
                    <ChoiceButton key={c.id} choice={c} index={i} selected={c.id === choiceId} disabled={leaving} onPick={() => pick(c)} />
                  ))}
                </div>

                <div className="mt-5">
                  <Tooltip content={blocked} disabled={canApprove || leaving || !blocked} block>
                    <button
                      type="button"
                      aria-disabled={!canApprove}
                      onClick={approve}
                      className={cn(
                        'inline-flex h-14 w-full items-center justify-center gap-2 rounded-12 text-lead font-semibold transition-colors duration-micro',
                        canApprove ? 'bg-brass text-ink-950 shadow-brass hover:bg-[#EAC36E] active:bg-brass-deep' : 'cursor-not-allowed bg-brass/25 text-ink-950/60',
                      )}
                    >
                      Looks right — add to Xero
                      <kbd className="ml-1 rounded-4 border border-ink-950/25 px-1.5 font-mono text-[12px] font-medium">Enter</kbd>
                    </button>
                  </Tooltip>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={askForCopy}
                      disabled={leaving}
                      className="rounded-6 text-small font-medium text-mid transition-colors duration-micro hover:text-hi disabled:text-lo"
                    >
                      Ask for a clearer copy
                    </button>
                    <button
                      type="button"
                      aria-expanded={showAll}
                      aria-controls="all-fields"
                      onClick={() => setShowAll((v) => !v)}
                      className="inline-flex items-center gap-1 rounded-6 text-small font-medium text-mid transition-colors duration-micro hover:text-hi"
                    >
                      {showAll ? 'Hide fields' : `Show all ${FIELDS.length} fields`}
                      <ChevronDown size={15} strokeWidth={1.75} aria-hidden className={cn('transition-transform duration-small', showAll && 'rotate-180')} />
                    </button>
                  </div>
                </div>

                <AnimatePresence initial={false}>
                  {showAll ? (
                    <motion.div
                      id="all-fields"
                      key="fields"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, transition: { duration: 0.12 } }}
                      transition={{ duration: 0.2, ease: EASE.outExpo }}
                      className="mt-5 overflow-hidden rounded-12 border border-white/[0.06] bg-ink-900/60"
                    >
                      {FIELDS.map(({ field, label }) => (
                        <ReadRow
                          key={field}
                          field={field}
                          label={label}
                          value={shownValue(d, field, edits?.[field])}
                          detail={field === 'vat' ? vatLabel(d.vatCode) : null}
                          flagged={check.flagged.includes(field)}
                          readOnly={leaving}
                          onCommit={(value) => dispatch({ type: 'edit_field', id: d.id, field, value })}
                        />
                      ))}
                      <ul className="flex flex-col gap-2 border-t border-white/[0.06] px-5 py-4">
                        <CheckLine ok={check.ok}>{check.ok ? `Adds up: ${check.message}` : `Doesn't add up: ${check.message}`}</CheckLine>
                        <CheckLine ok>Not a duplicate</CheckLine>
                        <CheckLine ok={item.timesBought > 0}>
                          {item.timesBought > 0 ? `You've bought from ${s.shortName} ${item.timesBought} times` : `First time you've bought from ${s.shortName}`}
                        </CheckLine>
                      </ul>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </section>
            ) : (
              <Settled d={d} queueNext={queue[0] ?? null} />
            )}
          </motion.div>

          <Connector stage={stage} hidden={leaving} />
        </div>
      </motion.div>
    </HighlightProvider>
  );
}

/* ------------------------------------------------------------------ */
/* The paper: fitted to the screen, zoomed out of its thumbnail, flown  */
/* into Xero                                                            */
/* ------------------------------------------------------------------ */

function FlyingPaper({
  doc,
  box,
  entrance,
  phase,
  onLanded,
}: {
  doc: Document;
  box: RefObject<HTMLDivElement>;
  entrance: Entrance;
  phase: Phase;
  onLanded: () => void;
}) {
  const holder = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ k: number; w: number; h: number } | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const scale = useMotionValue(1);
  const zoomed = useRef(false);

  // Fit the first page to the column and to the height left under the nav, so the whole page is in view.
  useIsoLayoutEffect(() => {
    const el = holder.current;
    const body = inner.current;
    if (!el || !body) return undefined;
    const measure = (): void => {
      const w = body.offsetWidth;
      const h = body.offsetHeight;
      // Layout position, not the box on screen: a card sliding up is still translated by its entrance here.
      let docTop = 0;
      for (let n: HTMLElement | null = el; n; n = n.offsetParent as HTMLElement | null) docTop += n.offsetTop;
      const room = window.innerHeight - Math.max(docTop, 72) - 28;
      const k = Math.max(0.42, Math.min(1, 560 / w, el.clientWidth / w, room / h));
      setFit((f) => (f && f.k === k && f.w === w && f.h === h ? f : { k, w, h }));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [doc.id]);

  // Zoom out of the Overview thumbnail it was opened from.
  useIsoLayoutEffect(() => {
    if (!fit || zoomed.current || entrance?.kind !== 'zoom' || !box.current) return;
    zoomed.current = true;
    const to = box.current.getBoundingClientRect();
    const from = entrance.rect;
    const k = from.width / to.width;
    x.set(from.x - to.left);
    y.set(from.y - to.top);
    scale.set(k);
    const spring = { type: 'spring', stiffness: 260, damping: 28 } as const;
    animate(x, 0, spring);
    animate(y, 0, spring);
    animate(scale, 1, spring);
  }, [fit]);

  // Into the Xero stack in the nav. The paper is lifted out to the top layer first,
  // so it passes over the nav rather than under its glass.
  const [flight, setFlight] = useState<Flight | null>(null);
  useIsoLayoutEffect(() => {
    if (phase !== 'fly' || !box.current || !fit) return;
    const target = document.getElementById('xero-target');
    if (!target) {
      onLanded();
      return;
    }
    const r = box.current.getBoundingClientRect();
    const t = target.getBoundingClientRect();
    const k = Math.max(0.03, (t.height * 0.9) / r.height);
    setFlight({
      left: r.left,
      top: r.top,
      dx: t.left + 6 - r.left,
      dy: t.top + t.height / 2 - (r.height * k) / 2 - r.top,
      k,
    });
    // The springs settle a little after the paper is visibly home; land on the clock, not on rest.
    const landed = setTimeout(onLanded, FLIGHT_MS);
    return () => clearTimeout(landed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const sheet = (
    <div className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${fit?.k ?? 1})` }}>
      <InvoiceSheet doc={doc} />
    </div>
  );

  return (
    <div ref={holder} className="w-full" style={{ height: fit ? fit.h * fit.k : undefined }}>
      <motion.div
        ref={box}
        className="relative mx-auto"
        style={{
          x,
          y,
          scale,
          transformOrigin: '0 0',
          width: fit ? fit.w * fit.k : undefined,
          height: fit ? fit.h * fit.k : undefined,
          visibility: fit && !flight ? 'visible' : 'hidden',
        }}
      >
        <div ref={inner} className="absolute left-0 top-0 origin-top-left" style={{ transform: `scale(${fit?.k ?? 1})` }}>
          <InvoiceSheet doc={doc} />
        </div>
        <AnimatePresence>{phase === 'stamp' ? <Seal key="seal" /> : null}</AnimatePresence>
      </motion.div>
      {flight && fit
        ? createPortal(
            <motion.div
              aria-hidden
              className="pointer-events-none fixed z-overlay"
              style={{ left: flight.left, top: flight.top, width: fit.w * fit.k, height: fit.h * fit.k, transformOrigin: '0 0' }}
              initial={{ x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 }}
              animate={{ x: flight.dx, y: flight.dy, scale: flight.k, rotate: -8, opacity: 0.25 }}
              transition={{
                x: { type: 'spring', stiffness: 260, damping: 26 },
                scale: { type: 'spring', stiffness: 260, damping: 26 },
                y: { duration: 0.52, ease: EASE.outExpo },
                rotate: { duration: 0.52, ease: EASE.outExpo },
                opacity: { duration: 0.52, ease: EASE.inQuart },
              }}
            >
              {sheet}
              <Seal settled />
            </motion.div>,
            document.body,
          )
        : null}
    </div>
  );
}

interface Flight {
  left: number;
  top: number;
  dx: number;
  dy: number;
  k: number;
}

/** The brass seal: stamps on at 1.4×, settles in 180ms. */
function Seal({ settled = false }: { settled?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <motion.div
        className="flex flex-col items-center rounded-12 border-[3px] border-brass-deep bg-paper/80 px-7 py-4 text-brass-deep"
        initial={settled ? false : { scale: 1.4, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: -8 }}
        transition={{ duration: 0.18, ease: EASE.outExpo }}
      >
        <Check size={30} strokeWidth={2.5} />
        <span className="mt-1 font-display text-[22px] font-bold uppercase tracking-[0.06em]">Added to Xero</span>
      </motion.div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The panel                                                            */
/* ------------------------------------------------------------------ */

/**
 * "Why I'm asking": each line tied to the part of the paper it is about.
 * On arrival the lines are walked through once; hovering any line takes over.
 */
function Reasons({ item, walk }: { item: ReviewItem; walk: boolean }) {
  const { active, source, set } = useHighlight();
  const taken = useRef(false);

  useEffect(() => {
    if (!walk) return undefined;
    const timers = item.evidence.map((e, i) =>
      setTimeout(() => {
        if (!taken.current) set(`ev:${e.region}`, 'walk');
      }, WALK_START_MS + WALK_STEP_MS * i),
    );
    timers.push(
      setTimeout(() => {
        if (!taken.current) set(null, 'walk');
      }, WALK_START_MS + WALK_STEP_MS * item.evidence.length),
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk]);

  useEffect(() => {
    if (source === 'pane' || source === 'sheet') taken.current = true;
  }, [source]);

  return (
    <div className="mt-6">
      <p className="eyebrow">Why I&apos;m asking</p>
      <ul className="mt-2.5 flex flex-col gap-1">
        {item.evidence.map((e) => {
          const key: HighlightKey = `ev:${e.region}`;
          const on = active === key;
          return (
            <li key={e.region}>
              <button
                type="button"
                data-hl-from={key}
                onMouseEnter={() => set(key, 'pane')}
                onMouseLeave={() => set(null, 'pane')}
                onFocus={() => set(key, 'pane')}
                onBlur={() => set(null, 'pane')}
                aria-pressed={on}
                aria-label={`${e.text} Shows where on the invoice.`}
                className={cn(
                  '-mx-3 flex w-[calc(100%+1.5rem)] items-start gap-3 rounded-8 px-3 py-2 text-left text-small transition-colors duration-micro',
                  on ? 'bg-signal/[0.07] text-hi' : 'text-mid hover:text-hi',
                )}
              >
                <span aria-hidden className={cn('mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-micro', on ? 'bg-signal' : 'bg-white/25')} />
                {e.text}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ChoiceButton({ choice, index, selected, disabled, onPick }: { choice: ReviewChoice; index: number; selected: boolean; disabled: boolean; onPick: () => void }) {
  const hold = choice.action.type === 'hold';
  return (
    <button
      type="button"
      aria-pressed={hold ? undefined : selected}
      aria-keyshortcuts={String(index + 1)}
      disabled={disabled}
      onClick={onPick}
      className={cn(
        'flex h-16 w-full items-center gap-4 rounded-12 border px-4 text-left transition-[background-color,border-color,box-shadow] duration-small ease-out disabled:cursor-default',
        selected ? 'border-signal/50 bg-signal/[0.08] shadow-glow' : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.06]',
      )}
    >
      <kbd
        className={cn(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-6 border font-mono text-[13px] font-medium',
          selected ? 'border-signal/60 text-signal' : 'border-white/15 text-mid',
        )}
      >
        {index + 1}
      </kbd>
      <span className="min-w-0 flex-1">
        <span className="block text-lead font-semibold text-hi">{choice.label}</span>
        {choice.detail ? <span className="block text-[13px] text-lo">{choice.detail}</span> : null}
      </span>
      {selected ? <Check size={20} strokeWidth={2.25} aria-hidden className="shrink-0 text-signal" /> : null}
    </button>
  );
}

/** An item that has left the queue, opened from a link. */
function Settled({ d, queueNext }: { d: Document; queueNext: Document | null }) {
  const s = getSupplier(d.supplierId);
  const text =
    d.status === 'done' && d.addedAt
      ? `Added to Xero on ${dateLong(d.addedAt)} at ${time(d.addedAt)}, filed under ${categoryLabel(d.category)}.`
      : d.status === 'on_hold'
        ? `On hold. We've asked ${s.shortName} about it.`
        : 'Nothing to do here.';
  return (
    <section className="rounded-20 border border-white/[0.06] bg-ink-800/80 p-6 shadow-card">
      <p className="eyebrow">
        {s.shortName} {d.layout} · {gbp(d.gross)}
      </p>
      <p className="mt-3 flex items-start gap-3 text-lead font-medium text-hi">
        <Check size={20} strokeWidth={2} className="mt-1 shrink-0 text-signal" aria-hidden />
        {text}
      </p>
      {queueNext ? (
        <Link
          href={`/review/${queueNext.id}`}
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-8 border border-white/10 bg-white/[0.04] px-4 text-small font-semibold text-hi transition-colors duration-micro hover:bg-white/[0.08]"
        >
          Next one that needs your OK
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : d.status === 'on_hold' ? (
        <Link
          href="/paperwork"
          className="mt-6 inline-flex h-10 items-center gap-2 rounded-8 border border-white/10 bg-white/[0.04] px-4 text-small font-semibold text-hi transition-colors duration-micro hover:bg-white/[0.08]"
        >
          See the reminder
          <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
        </Link>
      ) : null}
    </section>
  );
}

function CheckLine({ ok, children }: { ok: boolean; children: string }) {
  return (
    <li className={cn('flex items-start gap-2.5 text-small', ok ? 'text-mid' : 'text-amber')}>
      <span aria-hidden className={cn('mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full', ok ? 'bg-signal/15 text-signal' : 'text-amber')}>
        {ok ? <Check size={11} strokeWidth={2.75} /> : <AlertCircle size={15} strokeWidth={2} />}
      </span>
      <span className="tnum min-w-0">{children}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* The hairline from a line in the panel to its part of the paper       */
/* ------------------------------------------------------------------ */

interface Line {
  key: string;
  d: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
}

function Connector({ stage, hidden }: { stage: RefObject<HTMLDivElement>; hidden: boolean }) {
  const { active: current } = useHighlight();
  // Once the paper is on its way to Xero there is nothing left to point at.
  const active = hidden ? null : current;
  const [line, setLine] = useState<Line | null>(null);

  useIsoLayoutEffect(() => {
    const root = stage.current;
    if (!active || !root) {
      setLine(null);
      return undefined;
    }
    const measure = (): void => {
      const a = root.querySelector<HTMLElement>(`[data-hl-from="${active}"]`);
      const b = root.querySelector<HTMLElement>(`[data-hl="${active}"]`);
      if (!a || !b) {
        setLine(null);
        return;
      }
      const sr = root.getBoundingClientRect();
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      const from = { x: ar.left - sr.left - 4, y: ar.top + Math.min(ar.height / 2, 16) - sr.top };
      const to = { x: br.right - sr.left + 6, y: br.top + br.height / 2 - sr.top };
      // Side by side only; stacked on a narrow screen there is nothing to join.
      if (from.x - to.x < 24) {
        setLine(null);
        return;
      }
      const bend = Math.min(80, (from.x - to.x) / 2);
      setLine({ key: active, from, to, d: `M ${from.x} ${from.y} C ${from.x - bend} ${from.y}, ${to.x + bend} ${to.y}, ${to.x} ${to.y}` });
    };
    measure();
    window.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, [active, stage]);

  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 hidden h-full w-full overflow-visible lg:block">
      <AnimatePresence>
        {line ? (
          <motion.g key={line.key} initial={{ opacity: 1 }} exit={{ opacity: 0, transition: { duration: 0.12 } }}>
            <motion.path
              d={line.d}
              fill="none"
              stroke="#4BE3A0"
              strokeOpacity={0.7}
              strokeWidth={1}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.25, ease: EASE.outExpo }}
            />
            <circle cx={line.from.x} cy={line.from.y} r={2.5} fill="#4BE3A0" />
            <motion.circle cx={line.to.x} cy={line.to.y} r={3} fill="#4BE3A0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.1 }} />
          </motion.g>
        ) : null}
      </AnimatePresence>
    </svg>
  );
}
