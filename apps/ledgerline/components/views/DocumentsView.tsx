'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Check, CopyX, PauseCircle } from 'lucide-react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useAppData } from '@/lib/store';
import { filterDocs, type DocFilter } from '@/lib/derive';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { categoryLabel, vatLabel } from '@/lib/data/categories';
import { count, dateLong, dayMonth, gbp } from '@/lib/format';
import { Card } from '@/components/ui/Card';
import { Drawer } from '@/components/ui/Drawer';
import { Monogram } from '@/components/ui/Monogram';
import { StatusPill } from '@/components/ui/Pill';
import { NextCard } from '@/components/shell/NextCard';
import { PageTitle } from '@/components/shell/PageTitle';

const FILTERS: { id: DocFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'auto', label: 'Done automatically' },
  { id: 'needs_ok', label: 'Needs your OK' },
  { id: 'skipped', label: 'Skipped' },
];

const COLUMNS = 'grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1.3fr)] items-center gap-4 px-6';

function Row({ d }: { d: Document }) {
  const s = getSupplier(d.supplierId);
  return (
    <>
      <span className="flex min-w-0 items-center gap-3">
        <Monogram name={s.shortName} />
        <span className="truncate text-body font-semibold text-hi">{s.name}</span>
      </span>
      <span className="tnum text-body text-mid">{dateLong(d.receivedAt)}</span>
      <span className={cn('truncate text-body', d.category ? 'text-hi' : 'text-amber')}>{categoryLabel(d.category)}</span>
      <span className="tnum text-right text-body font-semibold text-hi">{gbp(d.gross)}</span>
      <span className="flex justify-end">
        <StatusPill doc={d} />
      </span>
    </>
  );
}

export function DocumentsView() {
  const { state, counts } = useAppData();
  const [filter, setFilter] = useState<DocFilter>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const docs = state.documents;
  const shown = filterDocs(docs, filter);
  const opened = openId ? docs.find((d) => d.id === openId) ?? null : null;

  return (
    <div className="pt-10">
      <PageTitle eyebrow="All documents" title="Every document this month." subtitle={`Showing the latest ${count(docs.length)} of ${count(counts.received)} this month.`} />

      <div role="group" aria-label="Show" className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const on = f.id === filter;
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={on}
              onClick={() => setFilter(f.id)}
              className={cn(
                'inline-flex h-10 items-center gap-2 rounded-full border px-4 text-small font-medium transition-colors duration-micro ease-out',
                on ? 'border-signal/40 bg-signal/10 text-hi' : 'border-white/[0.08] bg-white/[0.03] text-mid hover:bg-white/[0.06] hover:text-hi',
              )}
            >
              {f.label}
              <span className={cn('tnum text-[13px]', on ? 'text-signal' : 'text-lo')}>{count(filterDocs(docs, f.id).length)}</span>
            </button>
          );
        })}
      </div>

      <Card padded={false} className="mt-5 overflow-hidden">
        <div aria-hidden className={cn(COLUMNS, 'h-12 border-b border-white/[0.06] bg-ink-900/60 text-label uppercase tracking-[0.08em] text-lo')}>
          <span>Supplier</span>
          <span>Date</span>
          <span>Category</span>
          <span className="text-right">Total</span>
          <span className="text-right">Status</span>
        </div>
        {shown.length === 0 ? (
          <p className="px-6 py-10 text-center text-body text-mid">Nothing here this month.</p>
        ) : (
          <ul aria-label="Documents">
            {shown.map((d) => {
              const rowClass = cn(COLUMNS, 'h-15 w-full border-b border-white/[0.05] text-left transition-colors duration-micro ease-out hover:bg-white/[0.03]');
              const label = `${getSupplier(d.supplierId).name}, ${dateLong(d.receivedAt)}, ${gbp(d.gross)}`;
              return (
                <li key={d.id} className="[&:last-child>*]:border-b-0">
                  {d.status === 'needs_ok' ? (
                    <Link href={`/review/${d.id}`} aria-label={`${label}, needs your OK`} className={rowClass}>
                      <Row d={d} />
                    </Link>
                  ) : (
                    <button type="button" onClick={() => setOpenId(d.id)} aria-label={label} className={rowClass}>
                      <Row d={d} />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Drawer
        open={opened !== null}
        onClose={() => setOpenId(null)}
        title={opened ? `${getSupplier(opened.supplierId).shortName} ${opened.layout}` : ''}
        subtitle={opened ? opened.invoiceNumber : null}
      >
        {opened ? <DocDetail d={opened} /> : null}
      </Drawer>

      <NextCard href="/dashboard" title="Back to overview" eyebrow={null} />
    </div>
  );
}

function DocDetail({ d }: { d: Document }) {
  const { state } = useAppData();
  const s = getSupplier(d.supplierId);
  const original = d.duplicateOf ? state.documents.find((x) => x.id === d.duplicateOf) ?? null : null;
  const rows: [string, string][] = [
    ['Supplier', s.name],
    ['Invoice number', d.invoiceNumber],
    ['Date', dateLong(d.invoiceDate)],
    ['Before VAT', gbp(d.net)],
    ['VAT', `${gbp(d.vat)} · ${vatLabel(d.vatCode)}`],
    ['Total', gbp(d.gross)],
  ];

  let status: { icon: typeof Check; text: string };
  if (d.status === 'skipped') {
    const when = original?.addedAt ?? original?.receivedAt ?? null;
    status = { icon: CopyX, text: when ? `Already added on ${dayMonth(when)}, so we skipped it` : 'Already added, so we skipped it' };
  } else if (d.status === 'on_hold') {
    status = { icon: PauseCircle, text: `On hold while we ask ${s.shortName} about it` };
  } else {
    status = { icon: Check, text: d.addedAt ? `Added to Xero on ${dateLong(d.addedAt)}` : 'Added to Xero' };
  }
  const Icon = status.icon;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3 rounded-12 bg-signal/10 px-4 py-3 text-body font-medium text-signal">
        <Icon size={20} strokeWidth={1.75} className="shrink-0" aria-hidden />
        {status.text}
      </div>
      <dl className="divide-y divide-white/[0.06] rounded-12 border border-white/[0.06]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex min-h-13 items-center justify-between gap-4 px-4 py-2">
            <dt className="text-small text-mid">{label}</dt>
            <dd className="tnum text-right text-body font-semibold text-hi">{value}</dd>
          </div>
        ))}
      </dl>
      <p className="text-small text-mid">
        Category: <span className="font-semibold text-hi">{categoryLabel(d.category)}</span>
      </p>
    </div>
  );
}
