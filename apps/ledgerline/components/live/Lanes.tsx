'use client';

import type { ReactNode } from 'react';
import { Check, FileText, Landmark, Mail, Mailbox, MessageCircle, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { gbp } from '@/lib/format';
import { Spot, useFx } from '@/components/dashboard/fx';
import { BANK, type DocId } from '@/lib/live/month';
import type { LaneModel, Region } from '@/lib/live/timeline';
import { ART_SIZE, DocArt, Fit, ScanExtra } from './art';

/**
 * Where the paperwork comes from: four sources, each holding a few real-looking
 * items. Each item leaves its lane when it flies into the dashboard; what is
 * left behind is either nothing, or (for email) the message with its
 * attachment marked as filed.
 */

export const LANE_H = 147;

export function Lanes({ lanes }: { lanes: LaneModel }) {
  return (
    <div className="flex h-full flex-col">
      <h2 className="flex h-5 items-center text-[13px] font-semibold uppercase tracking-[0.08em] text-mid">Where your paperwork comes from</h2>
      <div className="mt-3 flex flex-col gap-3">
        <EmailLane lanes={lanes} />
        <WhatsAppLane lanes={lanes} />
        <PostLane lanes={lanes} />
        <BankLane lanes={lanes} />
      </div>
    </div>
  );
}

function Lane({ id, icon: Icon, label, meta, metaTone, children }: { id: Region; icon: LucideIcon; label: string; meta: string; metaTone?: string; children: ReactNode }) {
  return (
    <Spot id={id} className="card flex flex-col px-3.5 pb-3 pt-2.5" style={{ height: LANE_H }}>
      <div className="flex h-[22px] shrink-0 items-center gap-2">
        <span className="flex h-[22px] w-[22px] items-center justify-center rounded-6 bg-white/[0.06] text-mid">
          <Icon size={13} strokeWidth={2} aria-hidden />
        </span>
        <span className="text-[14px] font-semibold text-hi">{label}</span>
        <span className={cn('ml-auto text-[12px] transition-colors duration-300', metaTone ?? 'text-lo')}>{meta}</span>
      </div>
      <div className="relative mt-2 min-h-0 flex-1">{children}</div>
    </Spot>
  );
}

/** Shown once a lane has nothing left in it. */
function AllIn({ on, text, dark }: { on: boolean; text: string; dark?: boolean }) {
  return (
    <div
      aria-hidden={!on}
      className={cn('pointer-events-none absolute inset-0 flex items-center justify-center gap-2 text-[13px] font-medium transition-opacity duration-300', dark ? 'text-paper-muted' : 'text-mid')}
      style={{ opacity: on ? 1 : 0, transitionDelay: on ? '250ms' : '0ms' }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-signal text-ink-950">
        <Check size={12} strokeWidth={3} aria-hidden />
      </span>
      {text}
    </div>
  );
}

/** An invisible point inside a lane that the rest of the month streams out of. */
function BurstPoint({ lane }: { lane: 'email' | 'whatsapp' | 'post' }) {
  return <span aria-hidden data-burst={lane} className="pointer-events-none absolute left-1/2 top-1/2 h-[28px] w-[22px] -translate-x-1/2 -translate-y-1/2" />;
}

/* ------------------------------------------------------------------ */
/* Email                                                               */
/* ------------------------------------------------------------------ */

interface Email {
  doc: DocId;
  sender: string;
  subject: string;
  time: string;
  accent: string;
}

const EMAILS: Email[] = [
  { doc: 'aplant', sender: 'A-Plant', subject: 'Invoice AP 774120', time: '09:15', accent: '#C2410C' },
  { doc: 'jewson', sender: 'Jewson Accounts', subject: 'Your invoice INV 0047213', time: '09:02', accent: '#0B5E3A' },
  { doc: 'tp', sender: 'Travis Perkins', subject: 'Tax invoice 6610482', time: '08:47', accent: '#1F4E8C' },
];
const REPLY: Email = { doc: 'speedy', sender: 'Sam, Speedy Hire', subject: 'Re: Receipt for 12 October', time: 'Just now', accent: '#B5331F' };
const EMAIL_ROW = 32.5;

function EmailLane({ lanes }: { lanes: LaneModel }) {
  const { snap } = useFx();
  const list = lanes.reply ? [REPLY, ...EMAILS] : EMAILS;
  const fresh = list.slice(0, 3).filter((e) => !lanes.gone[e.doc]).length;
  return (
    <Lane id="lane:email" icon={Mail} label="Email" meta={fresh > 0 ? `${fresh} new` : 'All filed'} metaTone={fresh > 0 ? undefined : 'text-signal'}>
      <div className="relative h-full overflow-hidden rounded-8 bg-paper text-paper-ink">
        {[REPLY, ...EMAILS].map((e) => {
          const i = list.indexOf(e);
          const here = i >= 0;
          const gone = !!lanes.gone[e.doc];
          const open = lanes.open && e.doc === 'tp';
          return (
            <div
              key={e.doc}
              className={cn(
                'absolute inset-x-0 top-0 flex h-[30px] items-center gap-2 border-b border-paper-rule/80 px-2',
                !snap && 'transition-[transform,opacity,background-color] duration-[420ms] ease-out-expo',
                open && 'bg-signal/[0.18]',
              )}
              style={{ transform: `translateY(${here ? i * EMAIL_ROW : -EMAIL_ROW}px)`, opacity: here ? 1 : 0 }}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-sans text-[12px] font-bold text-white" style={{ background: e.accent }}>
                {e.sender.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[12px] leading-none">
                <span className="font-semibold">{e.sender}</span>
                <span className="text-paper-muted"> · {e.subject}</span>
              </span>
              <span data-src={e.doc} className="relative h-[22px] w-[84px] shrink-0">
                <span
                  className="absolute inset-0 inline-flex items-center gap-1 rounded-4 border border-paper-rule bg-paper-fill px-1.5 text-[12px] font-medium transition-opacity duration-150"
                  style={{ opacity: gone ? 0 : 1 }}
                >
                  <FileText size={12} strokeWidth={2} aria-hidden className="shrink-0 text-prop-pdf" />
                  Invoice.pdf
                </span>
                <span
                  className="absolute inset-0 inline-flex items-center gap-1 text-[12px] font-semibold text-signal-deep transition-opacity duration-300"
                  style={{ opacity: gone ? 1 : 0, transitionDelay: gone ? '200ms' : '0ms' }}
                >
                  <Check size={12} strokeWidth={3} aria-hidden />
                  Filed
                </span>
              </span>
              <span className="w-[52px] shrink-0 whitespace-nowrap text-right text-[12px] leading-none text-paper-muted">{e.time}</span>
            </div>
          );
        })}
        <BurstPoint lane="email" />
      </div>
    </Lane>
  );
}

/* ------------------------------------------------------------------ */
/* WhatsApp                                                            */
/* ------------------------------------------------------------------ */

const CHATS: { doc: DocId; sender: string; colour: string; caption: string; time: string }[] = [
  { doc: 'screwfix', sender: 'Jamie', colour: '#7DD3FC', caption: 'Screwfix', time: '08:14' },
  { doc: 'skips', sender: 'Mo', colour: '#F9A8D4', caption: 'The skip', time: '08:31' },
  { doc: 'toolstation', sender: 'Jamie', colour: '#7DD3FC', caption: 'Receipt', time: '08:52' },
];

function WhatsAppLane({ lanes }: { lanes: LaneModel }) {
  const left = CHATS.filter((c) => !lanes.gone[c.doc]).length;
  return (
    <Lane id="lane:whatsapp" icon={MessageCircle} label="WhatsApp" meta={left > 0 ? 'Jamie and Mo, site' : 'All filed'} metaTone={left > 0 ? undefined : 'text-signal'}>
      <div className="relative h-full overflow-hidden rounded-8 p-1.5" style={{ background: '#0B141A' }}>
        <div className="flex h-full gap-1.5">
          {CHATS.map((c) => {
            const gone = !!lanes.gone[c.doc];
            const box = { w: 54, h: 70 };
            return (
              <div
                key={c.doc}
                className="flex w-[122px] shrink-0 gap-1.5 rounded-[8px] p-1.5 transition-opacity duration-200"
                style={{ background: '#202C33', opacity: gone ? 0 : 1 }}
              >
                <div data-src={c.doc} className="shrink-0" style={{ width: box.w, height: box.h }}>
                  <Fit {...ART_SIZE[c.doc === 'skips' ? 'hand' : 'photo']} box={box}>
                    <DocArt doc={c.doc} />
                  </Fit>
                </div>
                <div className="flex min-w-0 flex-col justify-between py-0.5">
                  <span className="text-[12px] font-semibold leading-none" style={{ color: c.colour }}>
                    {c.sender}
                  </span>
                  <span className="text-[12px] leading-tight text-hi/85">{c.caption}</span>
                  <span className="text-[12px] leading-none text-mid">{c.time}</span>
                </div>
              </div>
            );
          })}
        </div>
        <AllIn on={left === 0} text="All 3 photos are in Ledgerline" />
        <BurstPoint lane="whatsapp" />
      </div>
    </Lane>
  );
}

/* ------------------------------------------------------------------ */
/* Post and scans                                                      */
/* ------------------------------------------------------------------ */

const SCANS: { id: DocId | 'cityplumbing'; rot: number }[] = [
  { id: 'wickes', rot: -4 },
  { id: 'aplant2', rot: 3 },
  { id: 'cityplumbing', rot: -2 },
];

function PostLane({ lanes }: { lanes: LaneModel }) {
  const left = SCANS.filter((s) => !lanes.gone[s.id]).length;
  return (
    <Lane id="lane:post" icon={Mailbox} label="Post & scans" meta={left > 0 ? `${left} scanned this morning` : 'All filed'} metaTone={left > 0 ? undefined : 'text-signal'}>
      <div className="relative h-full overflow-hidden rounded-8 border border-dashed border-white/10 bg-white/[0.02]">
        <div className="flex h-full items-center justify-center gap-6">
          {SCANS.map((s) => (
            <div
              key={s.id}
              data-src={s.id}
              data-rot={s.rot}
              className="h-[86px] w-[70px] shrink-0 transition-opacity duration-200"
              style={{ transform: `rotate(${s.rot}deg)`, opacity: lanes.gone[s.id] ? 0 : 1 }}
            >
              <Fit {...ART_SIZE.scan} box={{ w: 70, h: 86 }}>
                {s.id === 'cityplumbing' ? <ScanExtra /> : <DocArt doc={s.id} />}
              </Fit>
            </div>
          ))}
        </div>
        <AllIn on={left === 0} text="All 3 letters are in Ledgerline" />
        <BurstPoint lane="post" />
      </div>
    </Lane>
  );
}

/* ------------------------------------------------------------------ */
/* Bank                                                                */
/* ------------------------------------------------------------------ */

function BankLane({ lanes }: { lanes: LaneModel }) {
  // A line is matched once it has gone to its paperwork; Speedy's only once the chased receipt is in.
  const matched = (id: string): boolean => Boolean(lanes.gone[id]) && (id !== 'b_speedy' || Boolean(lanes.gone.speedy));
  const chasing = Boolean(lanes.gone.b_speedy) && !lanes.gone.speedy;
  const flagged = lanes.flagged && !lanes.gone.b_speedy;
  const all = BANK.every((b) => matched(b.id));
  return (
    <Lane
      id="lane:bank"
      icon={Landmark}
      label="Bank"
      meta={all ? 'All accounted for' : chasing ? 'Asking for 1 receipt' : flagged ? '1 payment has no receipt' : 'Business account, October'}
      metaTone={all ? 'text-signal' : chasing ? 'text-amber' : flagged ? 'text-alert' : undefined}
    >
      <div className="relative h-full overflow-hidden rounded-8 bg-paper px-2.5 py-[3px] font-mono text-paper-ink">
        {BANK.map((b) => {
          const done = matched(b.id);
          const asking = chasing && b.id === 'b_speedy';
          const red = flagged && b.id === 'b_speedy';
          return (
            <div
              key={b.id}
              data-src={b.id}
              className={cn(
                'flex h-[17.6px] items-center gap-2 border-b border-paper-rule/70 text-[12px] leading-none transition-[color,background-color] duration-200 last:border-b-0',
                red && 'bg-alert/10',
                asking && 'bg-amber/15',
                done && 'text-paper-muted',
              )}
            >
              <span className="w-[44px] shrink-0 text-paper-muted">{b.date}</span>
              <span className={cn('min-w-0 flex-1 truncate', done ? 'font-normal' : 'font-semibold')}>{b.details}</span>
              {red ? <span className="shrink-0 font-sans text-[12px] font-semibold text-[#C2341F]">No receipt</span> : null}
              {asking ? <span className="shrink-0 font-sans text-[12px] font-semibold text-[#A14A00]">Asking for receipt</span> : null}
              {done ? (
                <span className="inline-flex shrink-0 items-center gap-1 font-sans text-[12px] font-semibold text-signal-deep">
                  <Check size={12} strokeWidth={3} aria-hidden />
                  Matched
                </span>
              ) : null}
              <span className="tnum shrink-0">−{gbp(b.amount).slice(1)}</span>
            </div>
          );
        })}
      </div>
    </Lane>
  );
}
