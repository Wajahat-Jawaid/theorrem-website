'use client';

import { useEffect, useRef, useState } from 'react';
import { Check } from 'lucide-react';
import type { ReadField } from '@/lib/types';
import { cn } from '@/lib/cn';
import { useHighlight, type HighlightKey } from './InvoiceSheet';

interface ReadRowProps {
  field: ReadField;
  label: string;
  value: string;
  /** Shown beneath the value, such as "VAT: 20%". */
  detail?: string | null;
  flagged: boolean;
  readOnly?: boolean;
  onCommit: (value: string) => void;
}

/**
 * One value we read: click to change it, Enter keeps the change, Escape
 * undoes it. Hovering draws a line to the value on the paper, and the reverse.
 */
export function ReadRow({ field, label, value, detail, flagged, readOnly, onCommit }: ReadRowProps) {
  const { active, set } = useHighlight();
  const input = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const key: HighlightKey = `field:${field}`;
  const on = active === key;

  useEffect(() => setDraft(value), [value]);
  useEffect(() => {
    if (editing) input.current?.select();
  }, [editing]);

  const commit = (): void => {
    const next = draft.trim();
    if (next && next !== value) onCommit(next);
    else setDraft(value);
    setEditing(false);
  };

  return (
    <div
      data-hl-from={key}
      onMouseEnter={() => set(key, 'pane')}
      onMouseLeave={() => set(null, 'pane')}
      className={cn('flex min-h-14 items-center gap-4 border-b border-white/[0.06] px-5 py-2 transition-colors duration-micro ease-out last:border-b-0', on && 'bg-signal/[0.06]')}
    >
      <label htmlFor={`read-${field}`} className="w-24 shrink-0 text-small text-mid">
        {label}
      </label>
      <div className="min-w-0 flex-1">
        {editing && !readOnly ? (
          <input
            ref={input}
            id={`read-${field}`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onFocus={() => set(key, 'pane')}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                setDraft(value);
                setEditing(false);
              }
            }}
            className="h-9 w-full rounded-6 border border-signal/60 bg-ink-900 px-2.5 text-body font-semibold text-hi outline-none"
          />
        ) : (
          <button
            id={`read-${field}`}
            type="button"
            disabled={readOnly}
            onFocus={() => set(key, 'pane')}
            onBlur={() => set(null, 'pane')}
            onClick={() => setEditing(true)}
            aria-label={readOnly ? `${label}: ${value}` : `${label}: ${value}. Press to change.`}
            title={readOnly ? undefined : 'Click to change'}
            className="tnum -mx-2 block w-full min-w-0 rounded-6 px-2 py-1 text-left text-body font-semibold text-hi transition-colors duration-micro ease-out hover:bg-white/[0.04] hover:ring-1 hover:ring-white/10 disabled:cursor-default disabled:hover:bg-transparent disabled:hover:ring-0"
          >
            <span className="break-words">{value}</span>
          </button>
        )}
        {detail ? <div className="text-[13px] text-lo">{detail}</div> : null}
      </div>
      {flagged ? (
        <span className="inline-flex h-6 shrink-0 items-center rounded-full bg-amber/15 px-2.5 text-[12px] font-medium text-amber">Please check</span>
      ) : (
        <span className="inline-flex h-6 shrink-0 items-center gap-1 rounded-full bg-signal/10 px-2.5 text-[12px] font-medium text-signal">
          <Check size={13} strokeWidth={2.25} aria-hidden />
          Checked
        </span>
      )}
    </div>
  );
}
