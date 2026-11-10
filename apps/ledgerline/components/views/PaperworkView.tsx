'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { Check, CircleCheck, Mail, Paperclip, Send } from 'lucide-react';
import type { Reminder } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useAppData, useUi } from '@/lib/store';
import { useIsoLayoutEffect, useTimers, useTypewriter } from '@/lib/agent';
import { useBusiness, useDemoCommand, useReplay } from '@/lib/demo-store';
import { canSend as sendable, reminderStats, replyFigures } from '@/lib/derive';
import { LIVE_REPLY } from '@/lib/data/reminders';
import { signOff } from '@/lib/data/business';
import { REPLY_DELAY_MS } from '@/lib/constants';
import { dateLong, dayMonth, daysFromToday, gbp, plural, relative, weekday } from '@/lib/format';
import { EASE, SPRING } from '@/lib/motion';
import { NextCard } from '@/components/shell/NextCard';
import { PageTitle } from '@/components/shell/PageTitle';

/**
 * The Chase. Each row: what it is for, an empty slot where the paperwork
 * should be, and the email we have drafted. "Send all" finishes each draft,
 * folds it into an envelope and sends it; a few seconds later Howdens reply,
 * their invoice drops into its slot, is read, and is matched to the bank line.
 */

type RowStage = 'draft' | 'typing' | 'fold' | 'sent';
type ReplyStage = 'none' | 'notice' | 'fly' | 'scan' | 'matched';

const STAGGER_MS = 220;
const FOLD_MS = 660;
const NOTICE_TO_FLIGHT_MS = 900;
const SCAN_MS = 600;

/** "on Monday" within the week, otherwise "on 2 Nov 2026". */
function onDay(iso: string): string {
  const days = daysFromToday(iso);
  if (days === 1) return 'tomorrow';
  return days > 1 && days < 7 ? `on ${weekday(iso)}` : `on ${dateLong(iso)}`;
}

export function PaperworkView() {
  const { state, dispatch, nowIso } = useAppData();
  const { reducedMotion } = useUi();
  const { later, clear } = useTimers();
  const [stages, setStages] = useState<Record<string, RowStage>>({});
  const [reply, setReply] = useState<ReplyStage>('none');
  const [announce, setAnnounce] = useState('');
  const batch = useRef<string[]>([]);
  const page = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLSpanElement>(null);
  const slots = useRef<Record<string, HTMLDivElement | null>>({});

  // Everything still open, and anything that came back while you watched.
  const rows = state.reminders.filter((r) => r.status === 'open' || r.reply !== null);
  const toSend = rows.filter(sendable);
  const stats = reminderStats(state.remindersSentNow, state.reminders);
  const live = state.reminders.find((r) => r.id === LIVE_REPLY.reminderId) ?? null;
  const sending = Object.values(stages).some((s) => s === 'typing' || s === 'fold');
  const sentNow = Object.values(stages).filter((s) => s === 'sent').length;

  const sendAll = useCallback(() => {
    if (sending || toSend.length === 0) return;
    const ids = toSend.map((r) => r.id);
    batch.current = ids;
    if (reducedMotion) {
      ids.forEach((id) => dispatch({ type: 'reminder_send', id, at: nowIso() }));
      setStages(Object.fromEntries(ids.map((id) => [id, 'sent' as const])));
      return;
    }
    ids.forEach((id, i) => later(() => setStages((s) => ({ ...s, [id]: 'typing' })), i * STAGGER_MS));
  }, [dispatch, later, nowIso, reducedMotion, sending, toSend]);

  const typed = useCallback((id: string) => setStages((s) => (s[id] === 'typing' ? { ...s, [id]: 'fold' } : s)), []);
  const folded = useCallback(
    (id: string) => {
      dispatch({ type: 'reminder_send', id, at: nowIso() });
      setStages((s) => ({ ...s, [id]: 'sent' }));
    },
    [dispatch, nowIso],
  );

  // Once the batch is out, the reply lands, if Howdens were in it.
  const batchDone = batch.current.length > 0 && batch.current.every((id) => stages[id] === 'sent');
  useEffect(() => {
    if (!batchDone) return;
    setAnnounce(`Sent ${plural(batch.current.length, 'reminder')}.`);
    if (!batch.current.includes(LIVE_REPLY.reminderId) || reply !== 'none') return;
    later(() => setReply('notice'), REPLY_DELAY_MS);
    later(() => setReply(reducedMotion ? 'matched' : 'fly'), REPLY_DELAY_MS + (reducedMotion ? 0 : NOTICE_TO_FLIGHT_MS));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [batchDone]);

  useEffect(() => {
    if (reply !== 'scan') return;
    later(() => setReply('matched'), SCAN_MS);
  }, [reply, later]);

  useEffect(() => {
    if (reply !== 'matched' || !live || live.status !== 'open') return;
    dispatch({ type: 'reminder_reply', id: live.id, at: nowIso() });
    setAnnounce(`${live.feedName} replied. Invoice matched to the bank line.`);
  }, [reply, live, dispatch, nowIso]);

  // Space puts the chase back to this morning and runs it again; the hands-free run presses Send.
  const sendLatest = useRef(sendAll);
  sendLatest.current = sendAll;
  useReplay('paperwork', () => {
    clear();
    batch.current = [];
    setStages({});
    setReply('none');
    dispatch({ type: 'chase_reset' });
    later(() => sendLatest.current(), 600);
  });
  useDemoCommand('paperwork:send', () => sendLatest.current());

  const subtitle =
    reply === 'matched'
      ? `${live?.feedName ?? 'They'} just replied. Invoice matched.`
      : live?.reply && reply === 'none'
        ? `${live.feedName} replied. Invoice matched.`
        : 'We draft the reminders, send them and match what comes back.';

  return (
    <div ref={page} className="relative pt-10">
      <p aria-live="polite" className="sr-only">
        {announce}
      </p>
      <PageTitle
        eyebrow="Missing paperwork"
        title="We'll chase them, so you don't have to."
        subtitle={
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={subtitle} className="block" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25, ease: EASE.outExpo }}>
              {subtitle}
            </motion.span>
          </AnimatePresence>
        }
        action={
          toSend.length > 0 || sending ? (
            <button
              type="button"
              onClick={sendAll}
              aria-disabled={sending}
              className={cn(
                'inline-flex h-14 items-center gap-2.5 rounded-12 px-7 text-lead font-semibold transition-colors duration-micro',
                sending ? 'cursor-default bg-brass/30 text-ink-950/70' : 'bg-brass text-ink-950 shadow-brass hover:bg-[#EAC36E] active:bg-brass-deep',
              )}
            >
              <Send size={18} strokeWidth={2} aria-hidden />
              {sending ? 'Sending…' : `Send all ${toSend.length} ${toSend.length === 1 ? 'reminder' : 'reminders'}`}
            </button>
          ) : sentNow > 0 ? (
            <p className="inline-flex h-14 items-center gap-2 text-small text-mid">
              <Check size={16} strokeWidth={2} className="text-signal" aria-hidden />
              {plural(sentNow, 'reminder')} sent · watching your inbox for replies
            </p>
          ) : null
        }
      />

      <p className="tnum mt-5 inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-1.5 text-small text-mid">
        <Mail size={15} strokeWidth={1.75} aria-hidden />
        <span>
          This month we sent <NumberFlow value={stats.sent} className="font-semibold text-hi" /> reminders and got{' '}
          <NumberFlow value={stats.back} className="font-semibold text-hi" /> documents back.
        </span>
      </p>

      <div className="relative mt-6 flex h-14 items-center justify-end">
        <AnimatePresence>
          {reply !== 'none' ? (
            <motion.div
              key="notice"
              role="status"
              className="flex items-center gap-3 rounded-12 border border-white/[0.08] bg-ink-800 py-2 pl-3 pr-4 shadow-float"
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={SPRING.drop}
            >
              <span aria-hidden className="inline-flex h-8 w-8 items-center justify-center rounded-8 bg-signal/10 text-signal">
                <Mail size={16} strokeWidth={1.75} />
              </span>
              <span className="text-small">
                <span className="font-semibold text-hi">Reply from {LIVE_REPLY.from}</span>
                <span className="text-mid"> · </span>
                <span ref={notice} className="inline-flex items-center gap-1 text-mid">
                  <Paperclip size={13} strokeWidth={1.75} aria-hidden />1 attachment
                </span>
              </span>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>

      {rows.length === 0 ? (
        <div className="card mt-4 flex flex-col items-center px-8 py-14 text-center">
          <CircleCheck size={28} strokeWidth={1.75} className="text-signal" aria-hidden />
          <h2 className="mt-4 text-h3 text-hi">Nothing is missing.</h2>
          <p className="mt-1 text-body text-mid">We&apos;ll let you know if anything goes astray.</p>
        </div>
      ) : (
        <>
          <div aria-hidden className="mt-3 hidden grid-cols-chase gap-6 px-5 lg:grid">
            <span className="eyebrow">What it&apos;s for</span>
            <span className="eyebrow">What&apos;s missing</span>
            <span className="eyebrow">What we&apos;re sending</span>
          </div>
          <ul aria-label="What we're chasing" className="mt-2 flex flex-col gap-3 overflow-x-clip">
            {rows.map((r) => (
              <ChaseRow
                key={r.id}
                r={r}
                stage={stages[r.id] ?? 'draft'}
                reply={r.id === LIVE_REPLY.reminderId ? (r.reply && reply === 'none' ? 'matched' : reply) : 'none'}
                instant={reducedMotion}
                slotRef={(el) => {
                  slots.current[r.id] = el;
                }}
                onTyped={() => typed(r.id)}
                onFolded={() => folded(r.id)}
              />
            ))}
          </ul>
        </>
      )}

      {reply === 'fly' ? <Attachment page={page} from={notice} to={() => slots.current[LIVE_REPLY.reminderId] ?? null} onLand={() => setReply('scan')} /> : null}

      <NextCard href="/vat" title="See your VAT return, assembled" />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One row                                                              */
/* ------------------------------------------------------------------ */

function ChaseRow({
  r,
  stage,
  reply,
  instant,
  slotRef,
  onTyped,
  onFolded,
}: {
  r: Reminder;
  stage: RowStage;
  reply: ReplyStage;
  instant: boolean;
  slotRef: (el: HTMLDivElement | null) => void;
  onTyped: () => void;
  onFolded: () => void;
}) {
  const matched = reply === 'matched';
  return (
    <motion.li
      layout="position"
      className={cn(
        'grid items-center gap-6 rounded-12 border p-5 transition-colors duration-medium lg:grid-cols-chase',
        matched ? 'border-signal/40 bg-signal/[0.05]' : 'border-white/[0.06] bg-ink-800/80',
      )}
    >
      <BankLines r={r} matched={matched} />
      <Slot r={r} reply={reply} slotRef={slotRef} />
      <div className="min-w-0">
        {matched ? (
          <p className="flex items-center gap-2 text-body font-medium text-signal">
            <Check size={18} strokeWidth={2.25} aria-hidden />
            Matched to bank line
          </p>
        ) : stage === 'sent' ? (
          <SentLine r={r} />
        ) : sendable(r) ? (
          <DraftEmail r={r} stage={stage} instant={instant} onTyped={onTyped} onFolded={onFolded} />
        ) : (
          <SentLine r={r} />
        )}
      </div>
    </motion.li>
  );
}

/** What the paperwork is for, written the way the bank or the card statement shows it. */
function BankLines({ r, matched }: { r: Reminder; matched: boolean }) {
  const lines = r.items.filter((i) => i.amount !== null);
  return (
    <div className="min-w-0">
      <p className="text-small font-semibold text-hi">{r.sentTo}</p>
      {lines.length > 0 ? (
        <ul className="mt-2 flex flex-col gap-1 font-mono text-[12px] text-mid">
          {lines.map((i) => (
            <li key={i.id} className="flex items-baseline gap-3">
              <span className="w-12 shrink-0 text-lo">{i.date ? dayMonth(i.date).toUpperCase() : ''}</span>
              <span className="min-w-0 flex-1 truncate">{i.description.toUpperCase()}</span>
              <span className={cn('tnum shrink-0', matched ? 'text-signal' : 'text-hi')}>{gbp(i.amount ?? 0)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-small text-mid">{r.missing}</p>
      )}
    </div>
  );
}

/** A dashed, paper-shaped gap where the document should be. It becomes paper when the reply lands. */
function Slot({ r, reply, slotRef }: { r: Reminder; reply: ReplyStage; slotRef: (el: HTMLDivElement | null) => void }) {
  const gross = r.items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const figures = r.reply ?? replyFigures(gross, LIVE_REPLY.vatRate);
  const paper = reply === 'scan' || reply === 'matched';
  return (
    <div ref={slotRef} className="relative h-[150px] w-[112px] shrink-0">
      {paper ? (
        <motion.div
          className="paper absolute inset-0 overflow-hidden px-2.5 py-3"
          initial={reply === 'scan' ? { opacity: 0, scale: 0.96 } : false}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
        >
          <p className="truncate font-doc text-[9px] font-bold">{r.feedName}</p>
          <p className="font-doc text-[7px] uppercase text-paper-muted">Invoice</p>
          <span aria-hidden className="mt-2 flex flex-col gap-1">
            {[0.9, 0.7, 0.8].map((w) => (
              <span key={w} className="h-[3px] rounded-full bg-paper-rule" style={{ width: `${w * 100}%` }} />
            ))}
          </span>
          <AnimatePresence>
            {reply === 'matched' ? (
              <motion.div className="absolute inset-x-2.5 bottom-3" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: EASE.outExpo }}>
                <p className="tnum font-mono text-[9px] text-paper-muted">VAT {gbp(figures.vat)}</p>
                <p className="tnum font-mono text-[11px] font-semibold">{gbp(figures.gross)}</p>
              </motion.div>
            ) : null}
          </AnimatePresence>
          {reply === 'scan' ? (
            <motion.span
              aria-hidden
              className="absolute inset-x-0 h-8 bg-gradient-to-b from-transparent to-signal/40"
              style={{ top: 0 }}
              initial={{ y: '-100%' }}
              animate={{ y: '480%' }}
              transition={{ duration: SCAN_MS / 1000, ease: EASE.scan }}
            >
              <span className="absolute inset-x-0 bottom-0 h-[2px] bg-signal" />
            </motion.span>
          ) : null}
        </motion.div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 rounded-2 border border-dashed border-white/20 px-2 text-center">
          <span className="text-[12px] font-medium text-mid">{r.missingShort}</span>
          <span className="text-[11px] text-lo">missing</span>
        </div>
      )}
    </div>
  );
}

/** Where the chase stands once the reminder is out: honest about what happens next. */
function SentLine({ r }: { r: Reminder }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
      <p className="flex items-center gap-2 text-body font-medium text-hi">
        <Check size={17} strokeWidth={2.25} className="text-signal" aria-hidden />
        Sent {relative(r.lastSentAt)} · reminder {r.stage} of {r.of}
      </p>
      <p className="mt-1 pl-[25px] text-small text-mid">
        {r.nextOn ? `We'll nudge again ${onDay(r.nextOn)}.` : "That was the last reminder. If there's no reply, it stays here."}
      </p>
    </motion.div>
  );
}

/**
 * The drafted email, on paper. Its sign-off types out at 18ms a character;
 * then it folds into an envelope and leaves to the right.
 */
function DraftEmail({ r, stage, instant, onTyped, onFolded }: { r: Reminder; stage: RowStage; instant: boolean; onTyped: () => void; onFolded: () => void }) {
  const biz = useBusiness();
  const body = r.email.lines.slice(0, -1);
  const last = signOff(biz.ownerFirstName, biz.shortName);
  const typing = stage !== 'draft';
  const shown = useTypewriter(last, typing, instant, onTyped);
  const folding = stage === 'fold';

  useEffect(() => {
    if (!folding) return undefined;
    const t = setTimeout(onFolded, FOLD_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [folding]);

  return (
    <motion.div
      className="paper relative max-w-[560px] origin-left px-5 py-4 font-sans text-[13px] leading-relaxed"
      animate={
        folding
          ? { scaleY: [1, 0.22, 0.22], scaleX: [1, 0.42, 0.42], x: [0, 0, 760], opacity: [1, 1, 0] }
          : { scaleY: 1, scaleX: 1, x: 0, opacity: 1 }
      }
      transition={folding ? { duration: FOLD_MS / 1000, times: [0, 0.4, 1], ease: [EASE.outExpo, EASE.inQuart] } : { duration: 0 }}
    >
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 border-b border-paper-rule pb-2 text-[12px]">
        <dt className="text-paper-muted">To</dt>
        <dd className="min-w-0 truncate">
          {r.email.toName} <span className="text-paper-muted">&lt;{r.email.toAddress}&gt;</span>
        </dd>
        <dt className="text-paper-muted">Subject</dt>
        <dd className="min-w-0 truncate font-semibold">{r.email.subject}</dd>
      </dl>
      <div className="mt-2">
        {body.map((line) => (
          <p key={line}>{line}</p>
        ))}
        <p className="min-h-[1.6em]">
          {shown}
          {shown.length < last.length ? <span aria-hidden className="ml-px inline-block h-[1.05em] w-[1.5px] translate-y-[2px] bg-paper-ink" /> : null}
        </p>
      </div>
      <span className="absolute right-4 top-3 text-[11px] text-paper-muted">
        Reminder {r.stage + 1} of {r.of}
      </span>
      {/* The envelope it folds into. */}
      <motion.svg
        aria-hidden
        viewBox="0 0 100 60"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full rounded-2"
        initial={false}
        animate={{ opacity: folding ? [0, 1, 1] : 0 }}
        transition={folding ? { duration: FOLD_MS / 1000, times: [0, 0.35, 1] } : { duration: 0 }}
      >
        <rect width="100" height="60" fill="#FBFAF6" />
        <path d="M0 0 L50 34 L100 0" fill="none" stroke="#B8892E" strokeWidth="1.6" vectorEffect="non-scaling-stroke" />
        <path d="M0 60 L38 26 M100 60 L62 26" fill="none" stroke="#E4E1D8" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
      </motion.svg>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* The attachment, from the reply into its slot                         */
/* ------------------------------------------------------------------ */

const CHIP = { w: 40, h: 52 } as const;

function Attachment({
  page,
  from,
  to,
  onLand,
}: {
  page: RefObject<HTMLDivElement>;
  from: RefObject<HTMLElement>;
  to: () => HTMLElement | null;
  onLand: () => void;
}) {
  const [path, setPath] = useState<{ left: number; top: number; dx: number; dy: number } | null>(null);
  const landed = useRef(false);
  const land = (): void => {
    if (landed.current) return;
    landed.current = true;
    onLand();
  };

  useIsoLayoutEffect(() => {
    const root = page.current;
    const a = from.current;
    const b = to();
    if (!root || !a || !b) {
      land();
      return;
    }
    const pr = root.getBoundingClientRect();
    const ar = a.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    // Scaled about its centre, so aim the centre at the slot's centre.
    const left = ar.left - pr.left;
    const top = ar.top - pr.top - CHIP.h / 2;
    const dx = br.left + br.width / 2 - pr.left - (left + CHIP.w / 2);
    const dy = br.top + br.height / 2 - pr.top - (top + CHIP.h / 2);
    setPath({ left, top, dx, dy });
    const t = setTimeout(land, 640);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return path ? (
    <motion.div
      aria-hidden
      className="paper pointer-events-none absolute z-10 p-1.5"
      style={{ left: path.left, top: path.top, width: CHIP.w, height: CHIP.h }}
      initial={{ x: 0, y: 0, scale: 0.6, rotate: -6 }}
      animate={{ x: path.dx, y: path.dy, scale: 2.8, rotate: 0 }}
      transition={{ x: SPRING.fly, y: { duration: 0.52, ease: EASE.outExpo }, scale: { duration: 0.52, ease: EASE.outExpo }, rotate: { duration: 0.52 } }}
      onAnimationComplete={land}
    >
      <span className="block h-[3px] w-4/5 rounded-full bg-paper-rule" />
      <span className="mt-1 block h-[3px] w-3/5 rounded-full bg-paper-rule" />
    </motion.div>
  ) : null;
}

