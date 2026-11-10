'use client';

import NumberFlow from '@number-flow/react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { useAppData } from '@/lib/store';
import { count, plural, round } from '@/lib/format';
import { CSS_EASE, EASE, HERO } from '@/lib/motion';

/**
 * The 90% moment: one bar for the month's paperwork time. It arrives full,
 * grey and hatched, at the hours it would take by hand, then shrinks to the
 * minutes left with Ledgerline, and the saving rolls in beside it in brass.
 */
export function WorkMeter({ now, skip, className }: { now: number; skip: boolean; className?: string }) {
  const { counts } = useAppData();
  const shown = skip || now >= HERO.meter;
  const manual = counts.manualMinutes;
  const left = counts.minutesWithUs;
  const hours = round(manual / 60, 1).toFixed(1);
  const saving = Math.round((1 - left / manual) * 100);
  // Drawn to scale, with a sliver kept so the short bar can be seen at all.
  const ratio = Math.max(0.025, left / manual);
  const t = (seconds: number): number => (skip ? 0 : seconds);
  const roll = { duration: skip ? 0 : 1000, easing: CSS_EASE.outExpo };

  return (
    <motion.div
      className={cn('max-w-[34rem]', className)}
      initial={false}
      animate={{ opacity: shown ? 1 : 0, y: shown ? 0 : 8 }}
      transition={{ duration: t(0.3), ease: EASE.outExpo }}
    >
      <p className="sr-only">
        Your paperwork time this month: {plural(left, 'minute')}, down from {hours} hours by hand, {saving}% less.
      </p>
      <div aria-hidden className="flex items-end gap-6">
        <div className="min-w-0 flex-1 pb-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-small text-mid">Your paperwork time this month</span>
            <span className="grid text-right text-small font-semibold">
              <motion.span
                className="tnum text-hi [grid-area:1/1]"
                initial={false}
                animate={{ opacity: shown ? 0 : 1 }}
                transition={{ duration: t(0.2), delay: t(0.55) }}
              >
                {hours} hours
              </motion.span>
              <motion.span
                className="tnum text-signal [grid-area:1/1]"
                initial={false}
                animate={{ opacity: shown ? 1 : 0 }}
                transition={{ duration: t(0.2), delay: t(0.6) }}
              >
                {plural(left, 'minute')}
              </motion.span>
            </span>
          </div>
          {/* Slid left inside the clipped track rather than scaled, so the short bar keeps its round ends. */}
          <div className="mt-2 h-3.5 overflow-hidden rounded-full bg-white/[0.04]">
            <motion.div
              className="relative h-full rounded-full"
              initial={false}
              animate={{ x: shown ? `${-(1 - ratio) * 100}%` : '0%' }}
              transition={{ duration: t(0.7), delay: t(0.3), ease: EASE.outExpo }}
            >
              <motion.span
                className="hatch absolute inset-0 rounded-full bg-white/[0.07]"
                initial={false}
                animate={{ opacity: shown ? 0 : 1 }}
                transition={{ duration: t(0.4), delay: t(0.35) }}
              />
              <motion.span
                className="absolute inset-0 rounded-full bg-signal"
                initial={false}
                animate={{ opacity: shown ? 1 : 0 }}
                transition={{ duration: t(0.4), delay: t(0.35) }}
              />
            </motion.div>
          </div>
        </div>
        <span className="shrink-0 font-sans text-counter-sm leading-none text-brass 2xl:text-counter">
          <NumberFlow value={shown ? saving : 0} prefix="−" suffix="%" animated={!skip} spinTiming={roll} transformTiming={roll} className="tnum" />
        </span>
      </div>
      <motion.p
        className="mt-3 text-small text-mid"
        initial={false}
        animate={{ opacity: shown ? 1 : 0 }}
        transition={{ duration: t(0.3), delay: t(0.5) }}
      >
        You approve {plural(counts.touched, 'thing')}. We do the other {count(counts.auto)}.
      </motion.p>
    </motion.div>
  );
}
