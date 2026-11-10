'use client';

import type { ReactNode } from 'react';
import NumberFlow from '@number-flow/react';
import { Check, CopyMinus, FileText, Inbox, Landmark, Paperclip, SendHorizontal, Tag } from 'lucide-react';
import { cn } from '@/lib/cn';
import { gbp } from '@/lib/format';
import { useBusiness } from '@/lib/demo-store';
import { counters, type Counters, type DashboardModel, type RowModel, type RowStatus } from '@/lib/live/model';
import { DOCS, MONTH, TIME, bankLine, type DocId } from '@/lib/live/month';
import { LogoGlyph } from '@/components/shell/Logo';
import { DocArt, Fit, artSize } from '@/components/live/art';
import { Glow, Spot, useEntering, useFx } from './fx';

/**
 * The Ledgerline dashboard: four counters, the month's documents, and four
 * cards for the bank, missing paperwork, questions and VAT. The live demo
 * runs this inside its app window; /dashboard shows it at full size with the
 * finished month. Same components, same data, either way.
 */

type Mode = 'demo' | 'page';

const ROW_H = 48;
export const DEMO_ROWS = 8;
const COLS = 'grid-cols-[34px_minmax(0,1fr)_60px_80px_138px]';
const COLS_PAGE = 'grid-cols-[34px_minmax(0,1fr)_88px_142px] md:grid-cols-[34px_minmax(0,1fr)_72px_104px_148px]';

export function Dashboard({ model, mode, actions }: { model: DashboardModel; mode: Mode; actions?: ReactNode }) {
  const c = counters(model);
  return (
    <div className={cn('flex flex-col', mode === 'demo' ? 'h-full' : 'min-h-0')}>
      <AppHeader mode={mode} actions={actions} />
      <div className={cn('flex min-h-0 flex-1 flex-col', mode === 'demo' ? 'gap-3 px-4 pb-3.5 pt-3.5' : 'gap-5 pt-6')}>
        <CounterStrip c={c} mode={mode} />
        <div className={cn('grid min-h-0 flex-1', mode === 'demo' ? 'grid-cols-[minmax(0,1fr)_232px] gap-3' : 'gap-5 lg:grid-cols-[minmax(0,1fr)_340px]')}>
          <DocumentsList model={model} c={c} mode={mode} />
          <div className={cn('flex min-h-0 flex-col', mode === 'demo' ? 'gap-2.5' : 'gap-4')}>
            <BankCard model={model} c={c} mode={mode} />
            <MissingCard model={model} mode={mode} />
            <AskCard model={model} c={c} mode={mode} />
            <VatCard model={model} c={c} mode={mode} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

function AppHeader({ mode, actions }: { mode: Mode; actions?: ReactNode }) {
  const business = useBusiness();
  return (
    <header className={cn('flex shrink-0 items-center gap-3', mode === 'demo' ? 'h-10 border-b border-white/[0.06] px-4' : 'flex-wrap gap-y-3 border-b border-white/[0.06] pb-5')}>
      {mode === 'demo' ? (
        <>
          <span className="inline-flex items-center gap-1.5">
            <LogoGlyph className="h-[18px] w-[18px]" />
            <span className="font-display text-[13px] font-bold tracking-[0.06em] text-hi">LEDGERLINE</span>
          </span>
          <span aria-hidden className="h-4 w-px bg-white/10" />
          <span className="min-w-0 truncate text-[13px] font-medium text-hi">
            {business.shortName}
            <span className="text-lo"> · {MONTH.label} 2026</span>
          </span>
        </>
      ) : (
        <h1 className="min-w-0 font-display text-h3 text-hi">
          {MONTH.label} 2026 <span className="text-mid">· {business.shortName}</span>
        </h1>
      )}
      <span className="ml-auto flex shrink-0 items-center gap-3">
        {actions}
        {mode === 'demo' ? (
          <>
            <span data-src="xero" className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 text-[12px] font-medium text-hi">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
              Xero connected
            </span>
            <span aria-hidden className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-[12px] font-semibold text-hi">
              {business.initials}
            </span>
          </>
        ) : null}
      </span>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Counters                                                            */
/* ------------------------------------------------------------------ */

function CounterStrip({ c, mode }: { c: Counters; mode: Mode }) {
  const { snap } = useFx();
  const tiles: { id: 'count:in' | 'count:auto' | 'count:ok' | 'count:saved'; label: string; value: number; aside: string; tone?: string; src?: string; hours?: boolean }[] = [
    { id: 'count:in', label: 'Documents in', value: c.docsIn, aside: MONTH.label, src: 'count-in' },
    { id: 'count:auto', label: 'Done automatically', value: c.doneAuto, aside: 'no typing', tone: c.doneAuto > 0 ? 'text-signal' : undefined },
    { id: 'count:ok', label: 'Needs your OK', value: c.needsOk, aside: c.needsOk > 0 ? 'waiting' : 'all clear', tone: c.needsOk > 0 ? 'text-amber' : undefined },
    { id: 'count:saved', label: 'Time saved', value: c.savedHours, aside: 'this month', hours: true },
  ];
  return (
    <div className={cn('grid shrink-0', mode === 'demo' ? 'h-16 grid-cols-4 gap-2.5' : 'grid-cols-2 gap-4 lg:grid-cols-4')}>
      {tiles.map((tile) => (
        <Spot key={tile.id} id={tile.id} className={cn('card relative flex flex-col justify-between px-3.5', mode === 'demo' ? 'py-2.5' : 'gap-3 px-5 py-4')}>
          <span className={cn('font-medium text-mid', mode === 'demo' ? 'text-[12px] leading-4' : 'text-small')}>{tile.label}</span>
          {/* Demo: NumberFlow's mask padding makes the number's line box 38px; pin it to 26px so the tile stays the 64px (h-16) its strip reserves. */}
          <span className={cn('flex items-baseline justify-between gap-2', mode === 'demo' && 'h-[26px]')}>
            <span data-src={tile.src} className={cn('tnum font-semibold', mode === 'demo' ? 'h-[26px] text-[26px]' : 'text-[34px]', 'leading-none', tile.tone ?? 'text-hi')}>
              <NumberFlow
                value={tile.value}
                animated={!snap}
                locales="en-GB"
                format={tile.hours ? { minimumFractionDigits: 1, maximumFractionDigits: 1 } : undefined}
                suffix={tile.hours ? ' h' : undefined}
                transformTiming={{ duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
                spinTiming={{ duration: 650, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }}
              />
            </span>
            <span className="truncate text-[12px] text-lo">{tile.aside}</span>
          </span>
          <Glow pulse={tile.value} />
        </Spot>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Documents                                                           */
/* ------------------------------------------------------------------ */

function DocumentsList({ model, c, mode }: { model: DashboardModel; c: Counters; mode: Mode }) {
  const { snap } = useFx();
  const shown = model.rows.filter((r) => !r.merging).length;
  const bodyRows = mode === 'demo' ? DEMO_ROWS : model.rows.length;
  return (
    <Spot id="list" data-list="" className="card relative flex min-h-0 flex-col overflow-hidden">
      <div className="flex h-9 shrink-0 items-center justify-between px-3.5">
        <span className="flex items-baseline gap-2">
          <span data-src="books" className="text-[14px] font-semibold text-hi">
            Documents
          </span>
          <span className="text-[12px] text-lo">{MONTH.label}, newest first</span>
        </span>
        <span className="flex items-center gap-1.5 text-[12px] text-lo">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
          Added to Xero as they’re done
        </span>
      </div>
      <div className={cn('grid h-[26px] shrink-0 items-center gap-x-2 border-y border-white/[0.06] px-3 text-[12px] text-lo', mode === 'demo' ? COLS : COLS_PAGE)}>
        <span />
        <span>Supplier</span>
        <span className={mode === 'page' ? 'max-md:hidden' : undefined}>Date</span>
        <span className="text-right">Amount</span>
        <span>Status</span>
      </div>
      <div data-list-body="" className="relative shrink-0" style={{ height: bodyRows * ROW_H }}>
        {/* Where each arriving document lands: the top row's thumbnail. */}
        <div aria-hidden data-dst="list-thumb" className="pointer-events-none absolute left-3 top-[3px] h-[42px] w-[34px] opacity-0" />
        {model.rows.map((r, i) => (
          <Row key={r.id} r={r} index={i} mode={mode} snap={snap} />
        ))}
        {model.rows.length === 0 ? <EmptyList /> : null}
      </div>
      <div className="mt-auto flex h-8 shrink-0 items-center justify-between gap-3 border-t border-white/[0.06] px-3.5 text-[12px]">
        <span className="flex items-center gap-2 text-mid">
          <span aria-hidden data-dst="list-more" className="inline-block h-6 w-[18px]" />
          {model.more > 0 ? (
            <span>
              +{' '}
              <span className="tnum font-semibold text-hi">
                <NumberFlow value={model.more} animated={!snap} locales="en-GB" />
              </span>{' '}
              more this month
            </span>
          ) : (
            <span className="text-lo">The rest of the month lands here too</span>
          )}
        </span>
        <span className="tnum text-lo">
          {shown} of {c.docsIn} shown
        </span>
      </div>
    </Spot>
  );
}

function EmptyList() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-12 border border-dashed border-white/15 text-lo">
        <Inbox size={18} strokeWidth={1.75} aria-hidden />
      </span>
      <span className="text-[14px] font-medium text-mid">Your paperwork lands here</span>
      <span className="text-[12px] text-lo">Nothing to forward, nothing to type, nothing to sort</span>
    </div>
  );
}

const SOURCE_LABEL = { email: 'Email', whatsapp: 'WhatsApp', post: 'Post' } as const;

const STATUS: Record<RowStatus, { label: string; tone: string }> = {
  reading: { label: 'Reading…', tone: 'text-mid' },
  checking: { label: 'Checking', tone: 'text-amber' },
  needs_ok: { label: 'Needs your OK', tone: 'text-amber' },
  done: { label: 'Done automatically', tone: 'text-signal' },
};

function StatusMark({ status }: { status: RowStatus }) {
  if (status === 'done')
    return (
      <span className="inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-signal text-ink-950">
        <Check size={9} strokeWidth={3.5} aria-hidden />
      </span>
    );
  if (status === 'reading') return <span className="ll-reading h-2 w-2 shrink-0 rounded-full bg-signal" />;
  if (status === 'checking') return <span className="h-2 w-2 shrink-0 rounded-full border-[1.5px] border-amber" />;
  return <span className="h-2 w-2 shrink-0 rounded-full bg-amber" />;
}

/** Two values in one place: the first until `on`, then the second. Both are laid out, so nothing moves. */
function Swap({ on, before, after, cell, end, className }: { on: boolean; before: ReactNode; after: ReactNode; cell?: string; end?: boolean; className?: string }) {
  return (
    <span className={cn('grid min-w-0', end ? 'justify-items-end' : 'justify-items-start', className)}>
      <span className="max-w-full truncate transition-opacity duration-200 [grid-area:1/1]" style={{ opacity: on ? 0 : 1 }} aria-hidden={on}>
        {before}
      </span>
      <span data-cell={cell} className="max-w-full truncate transition-opacity duration-200 [grid-area:1/1]" style={{ opacity: on ? 1 : 0 }} aria-hidden={!on}>
        {after}
      </span>
    </span>
  );
}

function Row({ r, index, mode, snap }: { r: RowModel; index: number; mode: Mode; snap: boolean }) {
  const d = DOCS[r.id];
  const entering = useEntering();
  const y = index * ROW_H + (r.merging ? ROW_H : 0);
  const status = r.twice && r.id === 'aplant2' ? { label: 'Sent twice', tone: 'text-amber' } : STATUS[r.status];
  const vatText = d.vat > 0 ? `VAT ${gbp(d.vat)}` : 'No VAT';
  return (
    <div
      data-row={r.id}
      className={cn('absolute inset-x-0 top-0', !snap && 'transition-[transform,opacity] ease-out-expo', r.merging ? 'duration-[420ms]' : 'duration-[380ms]', entering && 'll-row-in')}
      style={{ height: ROW_H, transform: `translateY(${y}px)`, opacity: r.merging ? 0 : 1, zIndex: r.merging ? 2 : 1 }}
    >
      <div
        className={cn(
          'relative grid h-full items-center gap-x-2 border-b border-white/[0.05] px-3 transition-colors duration-200',
          mode === 'demo' ? COLS : COLS_PAGE,
          r.twice && 'bg-amber/[0.08] shadow-[inset_0_0_0_1.5px_rgba(255,181,71,0.85)]',
        )}
      >
        <div data-thumb={r.id} className="h-[42px] w-[34px]">
          <Fit {...artSize(r.id)} box={{ w: 34, h: 42 }}>
            <DocArt doc={r.id} />
          </Fit>
        </div>

        <span className="flex min-w-0 flex-col gap-0.5">
          <Swap on={r.shown.supplier} cell={`${r.id}:supplier`} className="text-[13px] font-semibold leading-[17px] text-hi" before={d.from} after={d.supplier} />
          <Swap on={r.shown.category} cell={`${r.id}:category`} className="text-[12px] leading-[15px] text-mid" before={d.fromDetail} after={d.category} />
        </span>

        <span className={cn('flex min-w-0 flex-col gap-0.5', mode === 'page' && 'max-md:hidden')}>
          <Swap on={r.shown.date} cell={`${r.id}:date`} className="text-[12.5px] leading-[17px] text-hi" before={<span className="text-mid">Today</span>} after={d.date} />
          <span className="truncate text-[12px] leading-[15px] text-lo">{SOURCE_LABEL[d.source]}</span>
        </span>

        <span className="flex min-w-0 flex-col items-end gap-0.5">
          <Swap
            end
            on={r.shown.amount}
            cell={`${r.id}:amount`}
            className="tnum font-mono text-[13px] font-semibold leading-[17px] text-hi"
            before={<span className="font-sans text-[12px] font-normal text-lo">Reading</span>}
            after={gbp(d.amount)}
          />
          <Swap end on={r.shown.vat} cell={`${r.id}:vat`} className="tnum font-mono text-[12px] leading-[15px] text-lo" before={<span>&nbsp;</span>} after={vatText} />
        </span>

        <span className="flex min-w-0 flex-col gap-0.5">
          <span data-cell={`${r.id}:status`} className={cn('flex min-w-0 items-center gap-1.5 text-[12.5px] font-semibold leading-[17px]', status.tone)}>
            <StatusMark status={r.twice && r.id === 'aplant2' ? 'checking' : r.status} />
            <span className="truncate">{status.label}</span>
          </span>
          <Note r={r} />
        </span>

        <Glow pulse={r.pulse} />
      </div>
    </div>
  );
}

/** The line under the status: how the document was settled. */
function Note({ r }: { r: RowModel }) {
  const notes: { key: NonNullable<RowModel['note']>; node: ReactNode }[] = [
    {
      key: 'matched',
      node: (
        <span className="flex items-center gap-1 text-mid">
          <Landmark size={11} strokeWidth={2} aria-hidden className="text-signal" />
          Bank matched
        </span>
      ),
    },
    {
      key: 'duplicate',
      node: (
        <span className="flex items-center gap-1 text-mid">
          <CopyMinus size={11} strokeWidth={2} aria-hidden className="text-signal" />
          Duplicate removed
        </span>
      ),
    },
    { key: 'cash', node: <span className="text-lo">Paid in cash</span> },
    {
      key: 'project',
      node: (
        <span className="flex items-center gap-1 font-medium text-signal">
          <Tag size={11} strokeWidth={2} aria-hidden />
          {MONTH.project}
        </span>
      ),
    },
  ];
  return (
    <span data-cell={`${r.id}:note`} className="grid min-w-0 justify-items-start text-[12px] leading-[15px]">
      {notes.map((n) => (
        <span
          key={n.key}
          data-cell={n.key === 'project' ? `${r.id}:project` : undefined}
          className="max-w-full truncate transition-opacity duration-200 [grid-area:1/1]"
          style={{ opacity: r.note === n.key ? 1 : 0 }}
          aria-hidden={r.note !== n.key}
        >
          {n.node}
        </span>
      ))}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* The four cards                                                      */
/* ------------------------------------------------------------------ */

function Card({ id, card, mode, tone, children }: { id: Parameters<typeof Spot>[0]['id']; card: string; mode: Mode; tone?: 'alert' | 'signal' | 'amber'; children: ReactNode }) {
  return (
    <Spot
      id={id}
      data-card={card}
      className={cn(
        'card relative flex min-h-0 flex-col px-3 py-2.5 transition-[box-shadow,opacity]',
        mode === 'demo' ? 'flex-1' : 'min-h-[132px] px-4 py-3.5',
        tone === 'alert' && 'shadow-[inset_0_0_0_1px_rgba(255,107,91,0.45)]',
        tone === 'amber' && 'shadow-[inset_0_0_0_1px_rgba(255,181,71,0.5)]',
        tone === 'signal' && 'shadow-[inset_0_0_0_1px_rgba(75,227,160,0.45)]',
      )}
    >
      {children}
    </Spot>
  );
}

function CardHead({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="flex h-[18px] shrink-0 items-center justify-between gap-2">
      <span className="truncate text-[13px] font-semibold text-hi">{title}</span>
      {right ? <span className="tnum flex shrink-0 items-center gap-1.5 text-[12.5px] text-mid">{right}</span> : null}
    </div>
  );
}

function BankCard({ model, c, mode }: { model: DashboardModel; c: Counters; mode: Mode }) {
  const { snap } = useFx();
  const all = c.bankMatched >= MONTH.bankPayments;
  return (
    <Card id="card:bank" card="bank" mode={mode} tone={all ? 'signal' : undefined}>
      <CardHead
        title="Bank matched"
        right={
          <>
            <span className={cn('font-semibold', c.bankMatched > 0 ? 'text-hi' : 'text-mid')}>
              <NumberFlow value={c.bankMatched} animated={!snap} locales="en-GB" />
            </span>
            <span className="text-lo">of {MONTH.bankPayments}</span>
          </>
        }
      />
      <div className="relative mt-2 flex flex-col gap-[2px]">
        {[0, 1, 2, 3].map((i) => {
          const id = model.bank.lines[i];
          const line = id ? bankLine(id) : null;
          return (
            <div key={i} data-bank-slot={i} className="relative flex h-[15px] items-center gap-1.5 text-[12px] leading-none" style={{ opacity: line ? 1 : 0 }}>
              {line ? (
                <>
                  <Check size={12} strokeWidth={3} aria-hidden className="shrink-0 text-signal" />
                  <span className="min-w-0 flex-1 truncate text-hi">{DOCS[line.doc].supplier}</span>
                  <span className="tnum shrink-0 font-mono text-mid">{gbp(line.amount)}</span>
                  <Glow pulse={1} className="-inset-x-1 -inset-y-px rounded-4" />
                </>
              ) : null}
            </div>
          );
        })}
        {model.bank.lines.length === 0 ? (
          <p className="absolute inset-0 flex flex-col justify-center gap-1 text-[12px] leading-snug text-lo">
            <span className="text-mid">Bank feed connected</span>
            Every payment gets paired with its paperwork.
          </p>
        ) : null}
      </div>
      <Glow pulse={model.bank.pulse} />
    </Card>
  );
}

function MissingCard({ model, mode }: { model: DashboardModel; mode: Mode }) {
  const { state } = model.missing;
  const speedy = DOCS.speedy;
  const open = state === 'missing' || state === 'chasing';
  return (
    <Card id="card:missing" card="missing" mode={mode} tone={open ? 'alert' : state === 'sorted' ? 'signal' : undefined}>
      <CardHead
        title="Missing paperwork"
        right={
          open ? (
            <>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-alert" />
              <span className="font-semibold text-alert">1</span>
            </>
          ) : (
            <span className="text-lo">{state === 'sorted' ? 'All in' : 'None'}</span>
          )
        }
      />
      <div className="relative mt-2 min-h-0 flex-1">
        {/* Where the payment with no receipt lands. */}
        <div aria-hidden data-dst="missing" className="pointer-events-none absolute inset-x-0 top-0 h-[18px] opacity-0" />
        {state === 'none' ? (
          <p className="flex flex-col gap-1 text-[12px] leading-snug text-lo">
            <span className="text-[13px] text-mid">Nothing missing</span>
            We check every payment has a receipt.
          </p>
        ) : (
          <div className="flex flex-col gap-1">
            <span className="flex items-baseline justify-between gap-2 text-[13px] font-semibold text-hi">
              <span className="truncate">{speedy.supplier}</span>
              <span className="tnum shrink-0 font-mono">{gbp(speedy.amount)}</span>
            </span>
            {state === 'sorted' ? (
              <span className="flex items-center gap-1.5 text-[12px] font-medium text-signal">
                <Check size={12} strokeWidth={3} aria-hidden />
                Receipt in from Sam, filed
              </span>
            ) : (
              <span className="text-[12px] font-medium text-alert">{speedy.date} · No receipt yet</span>
            )}
            {state === 'chasing' ? (
              <span className="flex items-center gap-1.5 text-[12px] text-amber">
                <SendHorizontal size={11} strokeWidth={2} aria-hidden />
                Reminder sent to Sam
              </span>
            ) : state === 'missing' ? (
              <span className="text-[12px] text-lo">Asking the supplier…</span>
            ) : (
              <span className="text-[12px] text-lo">Nothing else is missing</span>
            )}
          </div>
        )}
      </div>
      <Glow pulse={model.missing.pulse} />
    </Card>
  );
}

function AskCard({ model, c, mode }: { model: DashboardModel; c: Counters; mode: Mode }) {
  const { state } = model.ask;
  const doc = DOCS.toolstation;
  const asking = state === 'asking' || state === 'pressed';
  return (
    <Card id="card:ok" card="ok" mode={mode} tone={asking ? 'amber' : undefined}>
      <CardHead
        title="Needs your OK"
        right={
          c.needsOk > 0 ? (
            <>
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-amber" />
              <span className="font-semibold text-amber">{c.needsOk}</span>
            </>
          ) : (
            <span className="text-lo">{state === 'answered' ? 'All answered' : 'None'}</span>
          )
        }
      />
      <div className="relative mt-2 flex min-h-0 flex-1 gap-2.5">
        <div aria-hidden={state === 'none'} data-dst="ask-thumb" className="h-[44px] w-[36px] shrink-0" style={{ opacity: state === 'none' ? 0 : 1, display: state === 'none' && mode === 'page' ? 'none' : undefined }}>
          <Fit {...artSize('toolstation')} box={{ w: 36, h: 44 }}>
            <DocArt doc="toolstation" />
          </Fit>
        </div>
        {state === 'none' ? (
          <p className="absolute inset-0 flex flex-col gap-1 text-[12px] leading-snug text-lo">
            <span className="text-[13px] text-mid">Nothing needs you</span>
            We only ask when we can’t be sure.
          </p>
        ) : asking ? (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="truncate text-[12px] text-mid">
              {doc.supplier} · <span className="tnum font-mono">{gbp(doc.amount)}</span>
            </span>
            <span className="text-[13px] font-semibold leading-tight text-hi">{MONTH.project} or office?</span>
            <span className="mt-0.5 flex gap-1.5">
              <span
                data-src="ask-answer"
                className={cn(
                  'inline-flex h-6 items-center rounded-6 border px-2 text-[12px] font-semibold transition-colors duration-150',
                  state === 'pressed' ? 'border-signal bg-signal text-ink-950' : 'border-white/15 bg-white/[0.06] text-hi',
                )}
              >
                {MONTH.project}
              </span>
              <span className="inline-flex h-6 items-center rounded-6 border border-white/15 bg-white/[0.06] px-2 text-[12px] font-semibold text-hi">Office</span>
            </span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="flex items-center gap-1.5 text-[13px] font-semibold text-signal">
              <Check size={13} strokeWidth={3} aria-hidden />
              Filed to the {MONTH.project}
            </span>
            <span className="truncate text-[12px] text-mid">
              {doc.supplier} · <span className="tnum font-mono">{gbp(doc.amount)}</span>
            </span>
            <span className="text-[12px] text-lo">Nothing else needs you.</span>
          </div>
        )}
      </div>
      <Glow pulse={model.ask.pulse} />
    </Card>
  );
}

function VatCard({ model, c, mode }: { model: DashboardModel; c: Counters; mode: Mode }) {
  const { snap } = useFx();
  const ready = model.vat.state === 'ready';
  const read = c.docsIn === 0 ? 0 : c.doneAuto / c.docsIn;
  return (
    <Card id="card:vat" card="vat" mode={mode} tone={ready ? 'signal' : undefined}>
      <CardHead title="VAT return" right={<span className="text-lo">{MONTH.label}</span>} />
      <div data-dst="vat" className="relative mt-1.5 flex min-h-0 flex-1 flex-col justify-between">
        {ready ? (
          <>
            <span className="flex items-baseline justify-between text-[12px]">
              <span className="text-mid">To pay HMRC</span>
              <span className="text-lo">Due 7 Dec</span>
            </span>
            <span data-src="vat-card" className="tnum self-start font-mono text-[22px] font-semibold leading-none text-brass">
              <NumberFlow value={MONTH.vatToPay} animated={!snap} locales="en-GB" format={{ style: 'currency', currency: 'GBP' }} />
            </span>
            <span className="inline-flex h-5 items-center gap-1 self-start rounded-full bg-signal/15 pl-1 pr-2 text-[12px] font-semibold text-signal">
              <Check size={11} strokeWidth={3} aria-hidden />
              Ready to file
            </span>
          </>
        ) : (
          <>
            <span data-src="vat-card" className="text-[13px] text-mid">
              Getting ready
            </span>
            <span className="h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
              <span className={cn('block h-full origin-left rounded-full bg-signal/70', !snap && 'transition-transform duration-700 ease-out-expo')} style={{ transform: `scaleX(${read})` }} />
            </span>
            <span className="tnum text-[12px] text-lo">
              {c.doneAuto} of {c.docsIn} documents read
            </span>
          </>
        )}
      </div>
      <Glow pulse={model.vat.pulse} />
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* The month-end email and the time it took                            */
/* ------------------------------------------------------------------ */

export function MonthEmail({ model, className }: { model: DashboardModel; className?: string }) {
  const business = useBusiness();
  const { outbox } = model;
  const attach: { k: 'books' | 'vat' | 'docs'; label: string; icon: ReactNode }[] = [
    { k: 'books', label: 'Books', icon: <FileText size={12} strokeWidth={2} aria-hidden /> },
    { k: 'vat', label: 'VAT return', icon: <FileText size={12} strokeWidth={2} aria-hidden /> },
    { k: 'docs', label: `${MONTH.more + 8} documents`, icon: <Paperclip size={12} strokeWidth={2} aria-hidden /> },
  ];
  return (
    <div className={cn('paper flex flex-col overflow-hidden rounded-12 text-paper-ink', className)}>
      <div className="flex h-8 shrink-0 items-center justify-between border-b border-paper-rule bg-paper-fill px-3 text-[12px] font-semibold text-paper-muted">
        <span>To your accountant</span>
        {outbox.state === 'ready' ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-signal/15 px-2 py-0.5 text-[12px] font-semibold text-signal-deep">
            <Check size={11} strokeWidth={3} aria-hidden />
            Ready to send
          </span>
        ) : (
          <span className="text-paper-muted">Drafting…</span>
        )}
      </div>
      <div className="flex flex-col gap-1 border-b border-paper-rule px-3 py-2 text-[12px]">
        <span>
          <span className="text-paper-muted">To </span>
          <span className="font-semibold">
            {MONTH.accountant.name}, {MONTH.accountant.role.toLowerCase()}
          </span>
        </span>
        <span>
          <span className="text-paper-muted">Subject </span>
          <span className="font-semibold">{MONTH.label} is done</span>
        </span>
      </div>
      <p className="px-3 pt-2 text-[12.5px] leading-[1.45]">
        Hi {MONTH.accountant.first}, {MONTH.label}’s books are up to date in Xero and the VAT return is ready to file. Everything is attached.
        <br />
        {business.ownerFirstName}
      </p>
      <div className="flex flex-wrap gap-1.5 px-3 pb-3 pt-2.5">
        {attach.map((a) => {
          const on = outbox.attached.includes(a.k);
          return (
            <span
              key={a.k}
              data-dst={`attach-${a.k}`}
              className="inline-flex h-6 items-center gap-1 rounded-6 border border-paper-rule bg-paper-fill px-1.5 text-[12px] font-medium transition-opacity duration-150"
              style={{ opacity: on ? 1 : 0 }}
            >
              {a.icon}
              {a.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

/** The time bar: the example month by hand, and with Ledgerline. `shrink` runs 0 to 1. */
export function TimeBar({ shrink, showMinutes, showCut, className }: { shrink: number; showMinutes: boolean; showCut: boolean; className?: string }) {
  const ratio = TIME.minutes / (TIME.hours * 60);
  return (
    <div className={cn('rounded-12 border border-white/[0.08] bg-ink-900 px-5 py-4 shadow-float', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="flex items-center gap-2.5">
            <span className="text-[15px] font-medium text-mid">Time on paperwork</span>
            <span className="rounded-full border border-white/10 px-2 py-0.5 text-[12px] font-medium text-lo">Example month</span>
          </span>
          <span className="text-[12px] text-lo">The same 312 documents, by hand and with Ledgerline</span>
        </div>
        <span className="tnum font-display text-[40px] font-semibold leading-none tracking-[-0.02em] text-signal transition-opacity duration-300" style={{ opacity: showCut ? 1 : 0 }}>
          −{TIME.cut}%
        </span>
      </div>
      <div className="hatch relative mt-4 h-3.5 overflow-hidden rounded-full bg-white/[0.04]">
        {/* Slid left inside the clipped track rather than scaled, so the short bar keeps its round end. */}
        <div className="absolute inset-0 rounded-full bg-mid" style={{ transform: `translateX(${-(1 - ratio) * shrink * 100}%)` }}>
          {/* Grey while it is your time, mint once it is ours. */}
          <div className="absolute inset-0 rounded-full bg-signal" style={{ opacity: Math.min(1, shrink * 1.6) }} />
        </div>
      </div>
      <div className="mt-2.5 flex items-baseline justify-between">
        <span className="tnum text-[20px] font-semibold text-signal transition-opacity duration-300" style={{ opacity: showMinutes ? 1 : 0 }}>
          {TIME.minutes} minutes
        </span>
        <span className="tnum relative text-[20px] font-semibold text-hi transition-opacity duration-300" style={{ opacity: shrink >= 1 ? 0.45 : 1 }}>
          {TIME.hours} hours
          <span className="absolute inset-x-0 top-1/2 h-[1.5px] origin-left bg-hi transition-transform duration-500" style={{ transform: `scaleX(${shrink >= 1 ? 1 : 0})` }} />
        </span>
      </div>
    </div>
  );
}

export type { DocId };
