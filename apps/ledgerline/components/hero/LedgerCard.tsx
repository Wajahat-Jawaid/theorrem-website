'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Document } from '@/lib/types';
import { cn } from '@/lib/cn';
import { time } from '@/lib/format';
import { DUR, EASE } from '@/lib/motion';
import { BorderBeam } from '@/components/ui/BorderBeam';
import { FIELD_ORDER, docTitle, stageFields, type FieldKey } from './stageData';

interface LedgerCardProps {
  doc: Document | null;
  /** Changes with each document, so the rows clear and refill. */
  runKey: number;
  landed: FieldKey[];
  posted: boolean;
  instant: boolean;
  className?: string;
}

/** "Ready for Xero": the six values land here one by one, then it posts. */
export function LedgerCard({ doc, runKey, landed, posted, instant, className }: LedgerCardProps) {
  const fields = doc ? stageFields(doc) : null;
  return (
    <div className={cn('card relative w-[236px] p-4', posted && 'border-signal/30', className)}>
      <div className="flex items-center justify-between gap-2">
        <span className="eyebrow">Ready for Xero</span>
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal/70" />
      </div>
      <div className="mt-1 h-5 truncate text-small font-medium text-hi">
        <AnimatePresence mode="wait" initial={false}>
          {doc ? (
            <motion.span key={runKey} className="block truncate" initial={instant ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: DUR.small }}>
              {docTitle(doc)}
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
      <dl className="mt-3">
        {FIELD_ORDER.map((key) => {
          const isIn = fields !== null && landed.includes(key);
          return (
            <div key={key} className="flex h-[30px] items-center justify-between gap-3 border-t border-white/[0.05]">
              <dt className="text-[12px] text-lo">{fields ? fields[key].label : ''}</dt>
              <dd data-ledger-slot={key} className="relative min-w-[64px] text-right font-mono text-[12px] font-medium text-hi">
                {isIn && fields ? (
                  <motion.span
                    key={`${runKey}-${key}`}
                    className="-mr-1 inline-block rounded-4 px-1"
                    initial={instant ? false : { backgroundColor: 'rgba(75,227,160,0.45)' }}
                    animate={{ backgroundColor: 'rgba(75,227,160,0)' }}
                    transition={{ duration: 0.35, ease: 'easeOut' }}
                  >
                    {fields[key].value}
                  </motion.span>
                ) : (
                  <span aria-hidden className="inline-block h-[3px] w-10 rounded-full bg-white/[0.06] align-middle" />
                )}
              </dd>
            </div>
          );
        })}
      </dl>
      <div className="mt-3 flex h-8 items-center border-t border-white/[0.05] pt-3">
        <AnimatePresence mode="wait" initial={false}>
          {posted && doc ? (
            <motion.span
              key={`posted-${runKey}`}
              className="inline-flex items-center gap-1.5 text-small font-semibold text-signal"
              initial={instant ? false : { opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.medium, ease: EASE.outExpo }}
            >
              <Check size={15} strokeWidth={2.5} aria-hidden />
              Posted to Xero
              {doc.addedAt ? <span className="font-normal text-lo">· {time(doc.addedAt)}</span> : null}
            </motion.span>
          ) : (
            <motion.span key="waiting" className="text-small text-lo" initial={instant ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {doc ? 'Reading…' : 'Waiting for mail'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {posted && !instant ? <BorderBeam key={`beam-${runKey}`} /> : null}
    </div>
  );
}
