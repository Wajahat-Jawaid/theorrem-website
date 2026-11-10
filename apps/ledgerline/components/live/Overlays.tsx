'use client';

import { useRef, useState } from 'react';
import { SendHorizontal } from 'lucide-react';
import { cn } from '@/lib/cn';
import { gbp } from '@/lib/format';
import { useIsoLayoutEffect } from '@/lib/agent';
import { useBusiness } from '@/lib/demo-store';
import { DOCS } from '@/lib/live/month';
import { BAR, CHASE, CONNECT, CONNECTORS, CURSOR, INVOICE, LIST_SWEEP, type Connector, type Snapshot } from '@/lib/live/timeline';
import { MonthEmail, TimeBar } from '@/components/dashboard/Dashboard';
import { useFx } from '@/components/dashboard/fx';
import { clamp01, easeIn, easeInOut, easeOut, measure, spring, useClock, useFrame, type StageRect } from './clock';
import { DenseInvoice, INVOICE_H, INVOICE_W } from './DenseInvoice';

/**
 * What happens on top of the dashboard: the invoice opened out of its email
 * and scanned, the scan passing down the list, the lines between payments and
 * documents, the chase email, the cursor that answers the question, the
 * month-end email and the time bar. Each is mounted only while its moment
 * lasts, and moves on the demo clock, so pausing stops it mid-move.
 */
export function Overlays({ state }: { state: Snapshot }) {
  const { t } = useClock();
  return (
    <>
      {t >= INVOICE.zoom && t < INVOICE.gone ? <InvoiceZoom /> : null}
      {t >= LIST_SWEEP.start && t < LIST_SWEEP.start + LIST_SWEEP.ms ? <ListSweep /> : null}
      {CONNECTORS.filter((c) => t >= c.start && t < c.start + CONNECT.draw + CONNECT.hold + CONNECT.fade).map((c) => (
        <ConnectorLine key={c.id} c={c} />
      ))}
      {t >= CHASE.open && t < CHASE.gone ? <ChaseEmail /> : null}
      {t >= CURSOR.in && t < CURSOR.out + CURSOR.outMs ? <Cursor /> : null}
      {state.dash.outbox.state !== 'none' ? <MonthEmailOverlay state={state} /> : null}
      {t >= BAR.in ? <TimeBarOverlay /> : null}
    </>
  );
}

function useStageRect(selector: string): StageRect | null {
  const { stage, scale } = useClock();
  const [rect, setRect] = useState<StageRect | null>(null);
  useIsoLayoutEffect(() => {
    setRect(measure(stage.current?.querySelector(selector) ?? null, stage.current, scale()));
  }, [selector]);
  return rect;
}

const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;

/* ------------------------------------------------------------------ */
/* Chapter 2: the invoice, opened and scanned                          */
/* ------------------------------------------------------------------ */

/** Where the invoice sits while it is read: over the WhatsApp and post lanes, which are quiet by now. */
const PAPER = { x: 73, y: 214, w: 320, h: Math.round((320 * INVOICE_H) / INVOICE_W) } as const;
const K_PAPER = PAPER.w / INVOICE_W;
const BAND = 70;

function InvoiceZoom() {
  const from = useStageRect('[data-src="tp"]');
  const box = useRef<HTMLDivElement>(null);
  const beam = useRef<HTMLDivElement>(null);
  const marks = useRef<{ el: HTMLElement; y: number }[] | null>(null);

  useFrame((now) => {
    const node = box.current;
    if (!node || !from) return;
    if (!marks.current) {
      const paper = node.getBoundingClientRect();
      marks.current = Array.from(node.querySelectorAll<HTMLElement>('[data-mark]')).map((el) => {
        const r = el.getBoundingClientRect();
        return { el, y: ((r.top + r.height / 2 - paper.top) / paper.height) * INVOICE_H };
      });
    }
    const opening = now < INVOICE.back;
    const p = opening ? spring(now - INVOICE.zoom) : 1 - easeIn(clamp01((now - INVOICE.back) / INVOICE.backMs));
    const s0 = from.h / PAPER.h;
    const cx = lerp(from.x + from.w / 2, PAPER.x + PAPER.w / 2, p);
    const cy = lerp(from.y + from.h / 2, PAPER.y + PAPER.h / 2, p);
    const s = lerp(s0, 1, p);
    node.style.transform = `translate3d(${(cx - PAPER.w / 2).toFixed(2)}px, ${(cy - PAPER.h / 2).toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${(-1.4 * clamp01(p)).toFixed(2)}deg)`;
    node.style.opacity = String(opening ? 1 : clamp01(p * 3));
    node.style.visibility = 'visible';

    // The scan: once down the page. Its bright edge lights each value as it reaches it.
    const bp = (now - INVOICE.beam) / INVOICE.beamMs;
    const edge = bp * (INVOICE_H + BAND);
    if (beam.current) {
      beam.current.style.opacity = bp > 0 && bp < 1 ? String(Math.min(1, bp * 10, (1 - bp) * 10)) : '0';
      beam.current.style.transform = `translateY(${(edge - BAND).toFixed(1)}px)`;
    }
    for (const m of marks.current) m.el.style.opacity = now >= INVOICE.beam && edge >= m.y && opening ? '1' : '0';
  });

  return (
    <div ref={box} aria-hidden className="absolute left-0 top-0 z-[40] will-change-transform" style={{ width: PAPER.w, height: PAPER.h, transformOrigin: 'center', visibility: 'hidden' }}>
      <div className="paper relative h-full w-full overflow-hidden">
        <div className="absolute left-0 top-0" style={{ width: INVOICE_W, height: INVOICE_H, transform: `scale(${K_PAPER})`, transformOrigin: '0 0' }}>
          <DenseInvoice />
          <div ref={beam} aria-hidden className="pointer-events-none absolute inset-x-0 top-0 opacity-0" style={{ height: BAND }}>
            <div className="w-full" style={{ height: BAND - 2, background: 'linear-gradient(to bottom, rgba(75,227,160,0), rgba(75,227,160,0.22))' }} />
            <div className="h-[2px] w-full bg-signal" style={{ boxShadow: '0 0 14px 3px rgba(75,227,160,0.5)' }} />
          </div>
        </div>
      </div>
      <span className="absolute -top-3 left-3 inline-flex h-6 items-center gap-1.5 rounded-full border border-signal/50 bg-ink-900 px-2.5 text-[12px] font-semibold text-signal shadow-paper-sm">
        <span aria-hidden className="ll-reading h-1.5 w-1.5 rounded-full bg-signal" />
        Reading the invoice
      </span>
    </div>
  );
}

/** The same scan, passing down the list: every row it crosses is read. */
function ListSweep() {
  const body = useStageRect('[data-list-body]');
  const line = useRef<HTMLDivElement>(null);
  useFrame((now) => {
    if (!line.current || !body) return;
    const p = clamp01((now - LIST_SWEEP.start) / LIST_SWEEP.ms);
    line.current.style.transform = `translateY(${(p * body.h - 40).toFixed(1)}px)`;
    line.current.style.opacity = String(Math.min(1, p * 12, (1 - p) * 8));
  });
  if (!body) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute z-[30] overflow-hidden" style={{ left: body.x, top: body.y, width: body.w, height: body.h }}>
      <div ref={line} className="absolute inset-x-0 top-0 opacity-0" style={{ height: 42 }}>
        <div className="h-10 w-full" style={{ background: 'linear-gradient(to bottom, rgba(75,227,160,0), rgba(75,227,160,0.16))' }} />
        <div className="h-[2px] w-full bg-signal" style={{ boxShadow: '0 0 12px 2px rgba(75,227,160,0.5)' }} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 3: a line from each payment to its document                 */
/* ------------------------------------------------------------------ */

function ConnectorLine({ c }: { c: Connector }) {
  const { stage, scale } = useClock();
  const path = useRef<SVGPathElement>(null);
  const dots = useRef<(SVGCircleElement | null)[]>([]);
  useFrame((now) => {
    const root = stage.current;
    const p = path.current;
    if (!root || !p) return;
    const k = scale();
    const a = measure(root.querySelector(`[data-bank-slot="${c.slot}"]`), root, k);
    const b = measure(root.querySelector(`[data-cell="${c.doc}:status"]`), root, k);
    if (!a || !b) return;
    const x1 = a.x - 3;
    const y1 = a.y + a.h / 2;
    const x2 = b.x - 8;
    const y2 = b.y + b.h / 2 + 2;
    const bend = Math.max(40, Math.abs(x1 - x2) * 0.5);
    p.setAttribute('d', `M ${x1.toFixed(1)} ${y1.toFixed(1)} C ${(x1 - bend).toFixed(1)} ${y1.toFixed(1)}, ${(x2 + bend).toFixed(1)} ${y2.toFixed(1)}, ${x2.toFixed(1)} ${y2.toFixed(1)}`);
    const len = p.getTotalLength();
    const draw = easeOut(clamp01((now - c.start) / CONNECT.draw));
    const fade = 1 - clamp01((now - c.start - CONNECT.draw - CONNECT.hold) / CONNECT.fade);
    p.style.strokeDasharray = `${len}`;
    p.style.strokeDashoffset = `${len * (1 - draw)}`;
    p.style.opacity = String(fade);
    const [d1, d2] = dots.current;
    d1?.setAttribute('cx', String(x1));
    d1?.setAttribute('cy', String(y1));
    d2?.setAttribute('cx', String(x2));
    d2?.setAttribute('cy', String(y2));
    if (d1) d1.style.opacity = String(fade);
    if (d2) d2.style.opacity = String(draw >= 1 ? fade : 0);
  });
  return (
    <svg aria-hidden className="pointer-events-none absolute left-0 top-0 z-[45] overflow-visible" width={1280} height={800} viewBox="0 0 1280 800">
      <path ref={path} fill="none" stroke="#4BE3A0" strokeWidth={2} strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 4px rgba(75,227,160,0.6))' }} />
      <circle ref={(n) => {
          dots.current[0] = n;
        }} r={3.5} fill="#4BE3A0" />
      <circle ref={(n) => {
          dots.current[1] = n;
        }} r={3.5} fill="#4BE3A0" style={{ opacity: 0 }} />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 4: the chase email types itself and goes                    */
/* ------------------------------------------------------------------ */

const CHASE_W = 300;

function ChaseEmail() {
  const { t } = useClock();
  const business = useBusiness();
  const card = useStageRect('[data-card="missing"]');
  const lane = useStageRect('[data-burst="email"]');
  const box = useRef<HTMLDivElement>(null);
  const typed = useRef<HTMLSpanElement>(null);
  const rest = useRef<HTMLSpanElement>(null);
  const caret = useRef<HTMLSpanElement>(null);
  const speedy = DOCS.speedy;
  const body = `Hi Sam,\n\nCould you send me the receipt for our ${gbp(speedy.amount)} payment on 12 October?\n\nThanks so much,\n${business.ownerFirstName}`;
  const pos = card ? { x: card.x - CHASE_W - 14, y: Math.max(130, card.y - 34) } : null;

  useFrame((now) => {
    const node = box.current;
    if (!node || !pos) return;
    const open = easeOut(clamp01((now - CHASE.open) / 260));
    const f = clamp01((now - CHASE.fly) / CHASE.flyMs);
    const go = easeIn(f);
    const tx = lane ? (lane.x + lane.w / 2 - (pos.x + CHASE_W / 2)) * go : 0;
    const ty = lane ? (lane.y + lane.h / 2 - (pos.y + 110)) * go - Math.sin(Math.PI * f) * 60 : 0;
    node.style.transform = `translate3d(${(pos.x + tx).toFixed(1)}px, ${(pos.y + ty + (1 - open) * 10).toFixed(1)}px, 0) scale(${(lerp(0.96, 1, open) * lerp(1, 0.22, go)).toFixed(4)})`;
    node.style.opacity = String(open * (1 - clamp01((f - 0.55) / 0.45)));
    node.style.visibility = 'visible';
    const n = Math.round(clamp01((now - CHASE.type) / CHASE.typeMs) * body.length);
    if (typed.current && typed.current.textContent !== body.slice(0, n)) {
      typed.current.textContent = body.slice(0, n);
      if (rest.current) rest.current.textContent = body.slice(n);
    }
    if (caret.current) caret.current.style.opacity = n > 0 && n < body.length ? '1' : '0';
  });

  if (!pos) return null;
  const sent = t >= CHASE.send;
  return (
    <div ref={box} aria-hidden className="paper absolute left-0 top-0 z-[46] flex flex-col overflow-hidden rounded-12 will-change-transform" style={{ width: CHASE_W, transformOrigin: 'center', visibility: 'hidden' }}>
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-paper-rule bg-paper-fill px-3 text-[12px] font-semibold text-paper-muted">
        <span>New message</span>
        <span className="text-[12px] font-medium">Written by Ledgerline</span>
      </div>
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-paper-rule px-3 text-[12px]">
        <span className="text-paper-muted">To</span>
        <span className="rounded-full bg-paper-fill px-2 py-0.5 font-medium">Sam, Speedy Hire</span>
      </div>
      <div className="flex h-7 shrink-0 items-center gap-2 border-b border-paper-rule px-3 text-[12px]">
        <span className="text-paper-muted">Subject</span>
        <span className="font-semibold">Receipt for 12 October</span>
      </div>
      <p className="whitespace-pre-line px-3 pt-2 text-[13px] leading-[1.4]">
        <span ref={typed} />
        <span ref={caret} aria-hidden className="ml-px inline-block h-[1.05em] w-[1.5px] translate-y-[2px] bg-paper-ink opacity-0" />
        <span ref={rest} className="opacity-0">
          {body}
        </span>
      </p>
      <div className="flex justify-end px-3 pb-3 pt-1">
        <span
          className={cn(
            'inline-flex h-8 items-center gap-1.5 rounded-8 px-3.5 text-[13px] font-semibold transition-[background-color,transform] duration-150',
            sent ? 'scale-95 bg-signal-deep text-white' : 'bg-ink-900 text-hi',
          )}
        >
          Send
          <SendHorizontal size={13} strokeWidth={2} aria-hidden />
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 5: the cursor that answers the question                     */
/* ------------------------------------------------------------------ */

function Cursor() {
  const target = useStageRect('[data-src="ask-answer"]');
  const arrow = useRef<HTMLDivElement>(null);
  const ring = useRef<HTMLSpanElement>(null);
  useFrame((now) => {
    const node = arrow.current;
    if (!node || !target) return;
    const tx = target.x + target.w * 0.55;
    const ty = target.y + target.h * 0.6;
    const sx = tx + 170;
    const sy = ty + 130;
    const p = easeInOut(clamp01((now - CURSOR.move) / CURSOR.moveMs));
    const u = 1 - p;
    const cx = (sx + tx) / 2 + 40;
    const cy = (sy + ty) / 2 - 30;
    const x = u * u * sx + 2 * u * p * cx + p * p * tx;
    const y = u * u * sy + 2 * u * p * cy + p * p * ty;
    const pressed = now >= CURSOR.press && now < CURSOR.release;
    const fadeIn = clamp01((now - CURSOR.in) / 200);
    const fadeOut = 1 - clamp01((now - CURSOR.out) / CURSOR.outMs);
    node.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) scale(${pressed ? 0.86 : 1})`;
    node.style.opacity = String(fadeIn * fadeOut);
    node.style.visibility = 'visible';
    if (ring.current) {
      const r = clamp01((now - CURSOR.press) / 420);
      ring.current.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) translate(-50%, -50%) scale(${(0.4 + r * 1.4).toFixed(3)})`;
      ring.current.style.opacity = now >= CURSOR.press && r < 1 ? String(0.7 * (1 - r)) : '0';
    }
  });
  if (!target) return null;
  return (
    <>
      <span ref={ring} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[55] h-10 w-10 rounded-full border-2 border-signal opacity-0" />
      <div ref={arrow} aria-hidden className="pointer-events-none absolute left-0 top-0 z-[56] will-change-transform" style={{ visibility: 'hidden', transformOrigin: '0 0' }}>
        <svg width="22" height="26" viewBox="0 0 22 26" className="drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]">
          <path d="M2 1.5 L2 21 L7.2 16.4 L10.6 24 L14 22.6 L10.7 15.1 L18 15.1 Z" fill="#FFFFFF" stroke="#050B09" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Chapter 6: the month-end email and the time bar                     */
/* ------------------------------------------------------------------ */

function MonthEmailOverlay({ state }: { state: Snapshot }) {
  const { snap } = useFx();
  const [entering] = useState(!snap);
  const bank = useStageRect('[data-card="bank"]');
  if (!bank) return null;
  return (
    <div className={cn('absolute z-[44]', entering && 'll-pop')} style={{ left: bank.x - 8, top: bank.y - 8, width: bank.w + 16 }}>
      <MonthEmail model={state.dash} className="shadow-float" />
    </div>
  );
}

function TimeBarOverlay() {
  const { t } = useClock();
  const { snap } = useFx();
  const [entering] = useState(!snap);
  const list = useStageRect('[data-list]');
  const [shrink, setShrink] = useState(0);
  useFrame((now) => {
    const p = easeInOut(clamp01((now - BAR.shrink) / BAR.shrinkMs));
    setShrink((s) => (s === p ? s : p));
  });
  if (!list) return null;
  const h = 150;
  return (
    <div className={cn('absolute z-[44]', entering && 'll-pop')} style={{ left: list.x + 14, top: list.y + list.h - h - 44, width: list.w - 28 }}>
      <TimeBar shrink={shrink} showMinutes={t >= BAR.label} showCut={t >= BAR.cut} />
    </div>
  );
}
