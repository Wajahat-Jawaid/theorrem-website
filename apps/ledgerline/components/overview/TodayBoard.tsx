'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Check } from 'lucide-react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useAppData } from '@/lib/store';
import { useDemo } from '@/lib/demo-store';
import { needsOkQueue, openReminders } from '@/lib/derive';
import { reviewItemFor } from '@/lib/data/reviewItems';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { dateLong, daysFromToday, gbp, plural, round, weekday } from '@/lib/format';
import { EASE, SPRING } from '@/lib/motion';

/** Below the fold: one scroll down, three cards. */
export function TodayBoard() {
  return (
    <section aria-labelledby="today-title" className="pb-6 pt-4">
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="today-title" className="font-display text-h2 text-hi">
          Today
        </h2>
        <Link href="/documents" className="inline-flex items-center gap-1.5 rounded-6 text-small font-medium text-mid transition-colors duration-micro hover:text-hi">
          All documents
          <ArrowRight size={15} strokeWidth={1.75} aria-hidden />
        </Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <BeforeAfterCard />
        <NeedsYouCard />
        <ChaseCard />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Doing it yourself vs with Ledgerline                                 */
/* ------------------------------------------------------------------ */

function BeforeAfterCard() {
  const { counts } = useAppData();
  const hours = round(counts.manualMinutes / 60, 1);
  const minutes = counts.minutesWithUs;
  // Drawn to scale, with a sliver kept visible so the short bar can be seen at all.
  const ratio = Math.max(0.025, minutes / counts.manualMinutes);
  return (
    <article className="card flex flex-col p-6">
      <p className="eyebrow">This month</p>
      <h3 className="mt-2 text-h3 text-hi">The same {counts.received} documents, two ways</h3>
      <div className="mt-6 flex flex-col gap-6">
        <Bar label="Doing it yourself" value={`${hours.toFixed(1)} hours of typing and filing`} ratio={1} tone="hatch" />
        <Bar label="With Ledgerline" value={`${plural(minutes, 'minute')}: approving ${plural(counts.touched, 'item')} and reading the summary`} ratio={ratio} tone="signal" />
      </div>
    </article>
  );
}

function Bar({ label, value, ratio, tone }: { label: string; value: string; ratio: number; tone: 'hatch' | 'signal' }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-small text-mid">{label}</span>
        <span className={cn('tnum text-right text-small font-semibold', tone === 'signal' ? 'text-signal' : 'text-hi')}>{value}</span>
      </div>
      <div className="mt-2 h-3 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          className={cn('h-full origin-left rounded-full', tone === 'hatch' ? 'hatch bg-white/[0.06]' : 'bg-signal')}
          style={{ width: `${ratio * 100}%` }}
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.6, ease: EASE.outExpo }}
        />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Needs you: the approvals as paper, fanned like cards                 */
/* ------------------------------------------------------------------ */

/** Card rotations by how many are fanned: three spread −6°, 0°, 6°. */
const FAN: Record<number, number[]> = { 1: [0], 2: [-4, 4], 3: [-6, 0, 6] };

function NeedsYouCard() {
  const { state } = useAppData();
  const { setEntrance } = useDemo();
  const router = useRouter();
  const queue = needsOkQueue(state.documents).slice(0, 3);
  const ids = queue.map((d) => d.id).join(',');
  // The decision card should be ready the moment a thumbnail is pressed.
  useEffect(() => {
    if (ids) ids.split(',').forEach((id) => router.prefetch(`/review/${id}`));
  }, [ids, router]);

  const open = (d: Document, el: HTMLElement): void => {
    const r = el.getBoundingClientRect();
    setEntrance(d.id, { kind: 'zoom', rect: { x: r.left, y: r.top, width: r.width, height: r.height } });
    router.push(`/review/${d.id}`);
  };

  return (
    <article className="card flex flex-col p-6">
      <p className="eyebrow flex items-center gap-2">
        {queue.length > 0 ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" /> : null}
        Needs your OK
      </p>
      <h3 className="mt-2 text-h3 text-hi">{queue.length > 0 ? `${plural(queue.length, 'thing')} only you can answer` : 'All clear'}</h3>
      {queue.length === 0 ? (
        <p className="mt-6 flex flex-1 items-center gap-2 text-body text-mid">
          <Check size={18} strokeWidth={2} className="text-signal" aria-hidden />
          Nothing else needs you this month.
        </p>
      ) : (
        <div className="relative mt-6 flex flex-1 items-end justify-center pb-1 pt-2">
          {queue.map((d, i) => {
            const s = getSupplier(d.supplierId);
            const item = reviewItemFor(d.id);
            const rotate = FAN[queue.length]?.[i] ?? 0;
            return (
              <motion.button
                key={d.id}
                type="button"
                onClick={(e) => open(d, e.currentTarget)}
                aria-label={`${s.shortName} ${d.layout}, ${gbp(d.gross)}: ${item?.reason ?? ''}`}
                className="paper relative -mx-1 flex h-[160px] w-[118px] shrink-0 flex-col p-2.5 text-left first:ml-0 last:mr-0"
                style={{ rotate, zIndex: i === 1 ? 2 : 1 }}
                whileHover={{ y: -8, rotate: rotate * 0.5, zIndex: 3, transition: { duration: 0.2, ease: EASE.outExpo } }}
                whileFocus={{ y: -8 }}
                transition={SPRING.snap}
              >
                <span className="truncate font-doc text-[11px] font-bold leading-tight">{s.tradingName}</span>
                <span className="mt-0.5 font-mono text-[8px] text-paper-muted">{d.invoiceNumber}</span>
                <span aria-hidden className="mt-3 flex flex-col gap-1.5">
                  {[0.9, 0.7, 0.8, 0.55].map((w) => (
                    <span key={w} className="h-[3px] rounded-full bg-paper-rule" style={{ width: `${w * 100}%` }} />
                  ))}
                </span>
                <span className="tnum mt-auto font-mono text-[12px] font-semibold">{gbp(d.gross)}</span>
                <span className="mt-1.5 line-clamp-2 rounded-2 bg-amber/25 px-1.5 py-1 text-[9px] font-semibold leading-tight text-paper-ink">{item?.reason}</span>
              </motion.button>
            );
          })}
        </div>
      )}
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Chase: who we are waiting on, and for what                          */
/* ------------------------------------------------------------------ */

function nextWhen(iso: string): string {
  const days = daysFromToday(iso);
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  if (days < 7) return `on ${weekday(iso)}`;
  return `on ${dateLong(iso)}`;
}

function ChaseCard() {
  const { state } = useAppData();
  const open = openReminders(state.reminders);
  const next = open
    .map((r) => r.nextOn)
    .filter((d): d is string => d !== null)
    .sort()[0];
  return (
    <Link href="/paperwork" className="card group flex flex-col p-6 transition-colors duration-micro hover:border-white/[0.1]">
      <p className="eyebrow flex items-center gap-2">
        {open.length > 0 ? <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-alert" /> : null}
        Missing paperwork
      </p>
      <h3 className="mt-2 text-h3 text-hi">{open.length > 0 ? `Chasing ${open.length} for you` : 'Nothing is missing'}</h3>
      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {open.slice(0, 3).map((r) => {
          const amount = r.items.reduce((s, i) => s + (i.amount ?? 0), 0);
          return (
            <li key={r.id} className="flex items-center gap-3">
              <span className="flex min-w-0 flex-1 items-baseline gap-2">
                <span className="truncate text-small text-hi">{r.feedName}</span>
                {amount > 0 ? <span className="tnum shrink-0 font-mono text-[12px] text-mid">{gbp(amount)}</span> : null}
              </span>
              <span className="inline-flex h-7 shrink-0 items-center rounded-2 border border-dashed border-white/20 px-2 text-[11px] text-lo">{r.missingShort} missing</span>
            </li>
          );
        })}
        {open.length === 0 ? (
          <li className="flex items-center gap-2 text-body text-mid">
            <Check size={18} strokeWidth={2} className="text-signal" aria-hidden />
            Every receipt is in.
          </li>
        ) : null}
      </ul>
      <p className="mt-5 flex items-center justify-between gap-3 border-t border-white/[0.06] pt-4 text-small text-mid">
        <span>{next ? `Next reminder goes ${nextWhen(next)}` : open.length > 0 ? 'All reminders sent' : 'We’ll tell you if anything goes astray'}</span>
        <ArrowRight size={16} strokeWidth={1.75} aria-hidden className="shrink-0 transition-transform duration-small group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}
