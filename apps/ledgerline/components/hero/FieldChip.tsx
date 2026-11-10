'use client';

import { useRef, useState, type RefObject } from 'react';
import { motion } from 'framer-motion';
import { useIsoLayoutEffect } from '@/lib/agent';
import { EASE } from '@/lib/motion';
import type { FieldKey } from './stageData';

interface Flight {
  left: number;
  top: number;
  dx: number;
  dy: number;
}

interface FieldChipProps {
  /** The run whose paper the value leaves from; an exiting paper may still be on the stage. */
  runKey: number;
  field: FieldKey;
  value: string;
  /** The stage both the paper and the ledger card sit in. Chips are positioned in its coordinates. */
  stage: RefObject<HTMLDivElement>;
  speed: number;
  onLand: (field: FieldKey) => void;
}

/**
 * A value detaching from the paper and flying on a curve into its row on the
 * ledger card. The curve comes from x on a spring and y on an ease-out, so
 * the two axes arrive on different clocks.
 */
export function FieldChip({ runKey, field, value, stage, speed, onLand }: FieldChipProps) {
  const chip = useRef<HTMLDivElement>(null);
  const [flight, setFlight] = useState<Flight | null>(null);
  const landed = useRef(false);

  const land = (): void => {
    if (landed.current) return;
    landed.current = true;
    onLand(field);
  };

  useIsoLayoutEffect(() => {
    const st = stage.current;
    const el = chip.current;
    const from = st?.querySelector<HTMLElement>(`[data-run="${runKey}"] [data-pf="${field}"]`);
    const to = st?.querySelector<HTMLElement>(`[data-ledger-slot="${field}"]`);
    if (!st || !el || !from || !to) {
      land();
      return;
    }
    const sr = st.getBoundingClientRect();
    // The stage may be scaled down to fit its column; work in its own units.
    const k = sr.width / st.offsetWidth || 1;
    const fr = from.getBoundingClientRect();
    const tr = to.getBoundingClientRect();
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const left = (fr.left + fr.width / 2 - sr.left) / k - w / 2;
    const top = (fr.top + fr.height / 2 - sr.top) / k - h / 2;
    const toLeft = (tr.right - sr.left) / k - w + 8;
    const toTop = (tr.top + tr.height / 2 - sr.top) / k - h / 2;
    setFlight({ left, top, dx: toLeft - left, dy: toTop - top });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      ref={chip}
      aria-hidden
      className="pointer-events-none absolute left-0 top-0 z-10 whitespace-nowrap rounded-6 border border-signal/50 bg-ink-800 px-2 py-1 font-mono text-[12px] font-medium leading-none text-hi shadow-glow"
      style={flight ? { left: flight.left, top: flight.top } : { visibility: 'hidden' }}
      initial={{ x: 0, y: 0, opacity: 0, scale: 0.86 }}
      animate={flight ? { x: flight.dx, y: flight.dy, opacity: 1, scale: 1 } : undefined}
      transition={{
        x: { type: 'spring', stiffness: 260 * speed * speed, damping: 26 * speed },
        y: { duration: 0.52 / speed, ease: EASE.outExpo },
        opacity: { duration: 0.12 },
        scale: { duration: 0.2 / speed },
      }}
      onAnimationComplete={() => {
        if (flight) land();
      }}
    >
      {value}
    </motion.div>
  );
}
