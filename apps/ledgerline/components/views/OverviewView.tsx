'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppData } from '@/lib/store';
import { useBusiness } from '@/lib/demo-store';
import { needsOkQueue } from '@/lib/derive';
import { MONTH_LABEL } from '@/lib/constants';
import { count } from '@/lib/format';
import { EASE, HERO } from '@/lib/motion';
import { StageVignette } from '@/components/shell/Atmosphere';
import { ChaosStage } from '@/components/hero/ChaosStage';
import { WorkMeter } from '@/components/hero/WorkMeter';
import { useHeroSequence } from '@/components/hero/useHeroSequence';
import { TodayBoard } from '@/components/overview/TodayBoard';

export function OverviewView() {
  const { counts, state } = useAppData();
  const business = useBusiness();
  const { now, skip, playKey, replay } = useHeroSequence();
  const queue = needsOkQueue(state.documents);
  const sentences = [`${count(counts.received)} documents arrived.`, `You touched ${count(counts.touched)}.`];
  const at = (t: number): boolean => now >= t;
  const fade = (t: number, delay = 0) => ({
    initial: false as const,
    animate: at(t) ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 },
    transition: { duration: skip ? 0 : 0.4, delay: skip ? 0 : delay, ease: EASE.outExpo },
  });

  return (
    <>
      <section aria-labelledby="hero-title" className="relative grid min-h-[calc(100svh-56px)] content-center items-center gap-x-12 gap-y-10 py-10 lg:grid-cols-12 lg:py-8">
        <StageVignette />

        <div className="relative min-w-0 lg:col-span-5">
          <motion.p className="eyebrow" {...fade(HERO.label)}>
            {business.name} · {MONTH_LABEL}
          </motion.p>

          <Headline id="hero-title" key={`h-${playKey}`} sentences={sentences} show={at(HERO.headline)} skip={skip} />

          <motion.p className="mt-5 max-w-[34rem] text-lead text-mid" {...fade(HERO.headline, 0.6)}>
            Ledgerline read, sorted and posted the rest to Xero — and drafted your VAT return.
          </motion.p>

          <WorkMeter now={now} skip={skip} className="mt-8 2xl:mt-10" />

          <div className="mt-8 flex min-h-14 flex-wrap items-center gap-x-6 gap-y-3 2xl:mt-10">
            {at(HERO.cta) ? (
              <>
                <motion.div {...fade(HERO.cta)} initial={skip ? false : { opacity: 0, y: 8 }}>
                  <NeedsOkCta count={queue.length} href={queue[0] ? `/review/${queue[0].id}` : '/documents'} skip={skip} />
                </motion.div>
                <motion.button
                  type="button"
                  onClick={replay}
                  title="Watch it again (Space)"
                  className="inline-flex h-10 items-center gap-2 rounded-8 px-1 text-small font-medium text-mid underline-offset-4 transition-colors duration-micro hover:text-hi hover:underline"
                  initial={skip ? false : { opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.4, delay: skip ? 0 : 0.5 }}
                >
                  <RotateCcw size={15} strokeWidth={1.75} aria-hidden />
                  Watch it again
                </motion.button>
              </>
            ) : null}
          </div>
        </div>

        <div className="relative min-w-0 lg:col-span-7">
          <ChaosStage key={playKey} now={now} skip={skip} />
        </div>
      </section>

      <TodayBoard />
    </>
  );
}

/**
 * Two sentences, word by word. Each word rises; each sentence comes out of
 * an 8px blur. Under reduced motion, or after the first play, it is simply there.
 */
function Headline({ id, sentences, show, skip }: { id: string; sentences: string[]; show: boolean; skip: boolean }) {
  const step = HERO.wordStagger / 1000;
  let index = 0;
  return (
    <h1 id={id} className="mt-4 font-display text-h1-sm text-hi lg:text-h1 2xl:text-display-sm">
      {sentences.map((sentence) => {
        const words = sentence.split(' ');
        const first = index;
        index += words.length;
        return (
          <motion.span
            key={sentence}
            className="block"
            initial={false}
            animate={{ filter: show ? 'blur(0px)' : 'blur(8px)' }}
            transition={{ duration: skip ? 0 : 0.52 + step * (words.length - 1), delay: skip ? 0 : first * step, ease: EASE.outExpo }}
          >
            {words.map((word, i) => (
              <span key={`${word}-${i}`}>
                <motion.span
                  className="inline-block"
                  initial={false}
                  animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: '0.3em' }}
                  transition={{ duration: skip ? 0 : 0.52, delay: skip ? 0 : (first + i) * step, ease: EASE.outExpo }}
                >
                  {word}
                </motion.span>
                {i < words.length - 1 ? ' ' : null}
              </span>
            ))}
          </motion.span>
        );
      })}
    </h1>
  );
}

/** The one brass action on the Overview: a dot for each thing waiting, pulsing once. */
function NeedsOkCta({ count: n, href, skip }: { count: number; href: string; skip: boolean }) {
  const label = n === 0 ? 'See every document' : `${count(n)} ${n === 1 ? 'needs' : 'need'} your OK`;
  return (
    <Link
      href={href}
      className="group inline-flex h-14 items-center gap-3 rounded-12 bg-brass px-7 text-lead font-semibold text-ink-950 shadow-brass transition-colors duration-micro hover:bg-[#EAC36E] active:bg-brass-deep"
    >
      {n > 0 ? (
        <span aria-hidden className="flex items-center gap-1">
          {Array.from({ length: Math.min(n, 5) }, (_, i) => (
            <span
              key={i}
              className={cn('h-2 w-2 rounded-full bg-amber shadow-[0_0_0_1.5px_rgba(5,11,9,0.55)]', !skip && 'motion-safe:animate-dot-pulse')}
              style={{ animationDelay: `${120 * i}ms` }}
            />
          ))}
        </span>
      ) : null}
      {label}
      <ArrowRight size={20} strokeWidth={2} aria-hidden className="transition-transform duration-small group-hover:translate-x-0.5" />
    </Link>
  );
}
