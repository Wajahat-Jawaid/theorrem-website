'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import { animate, motion, useMotionValue, useTransform } from 'framer-motion';
import { PIPELINE } from '@/lib/motion';
import type { FieldKey } from './stageData';

const TRAIL = 60;

interface ScanBeamProps {
  paper: RefObject<HTMLDivElement>;
  /** 1 on the hero, 2 for the quieter ambient documents. */
  speed: number;
  opacity: number;
  /** Called once per value, the moment the beam reaches it. */
  onCross: (key: FieldKey) => void;
  onDone: () => void;
}

/**
 * A 2px mint line with a 60px glow trail, sweeping the paper top to bottom.
 * It accelerates in (for capture), then runs at a constant speed, and reports
 * each value on the paper as it passes it. Not rendered under reduced motion.
 */
export function ScanBeam({ paper, speed, opacity, onCross, onDone }: ScanBeamProps) {
  const progress = useMotionValue(0);
  const [height, setHeight] = useState(0);
  const y = useTransform(progress, (p) => p * height - TRAIL);
  const handlers = useRef({ onCross, onDone });
  handlers.current = { onCross, onDone };

  useEffect(() => {
    const el = paper.current;
    if (!el) return undefined;
    setHeight(el.offsetHeight);
    const box = el.getBoundingClientRect();
    const fields = Array.from(el.querySelectorAll<HTMLElement>('[data-pf]')).map((f) => {
      const r = f.getBoundingClientRect();
      return { key: f.dataset.pf as FieldKey, at: (r.top + r.height * 0.5 - box.top) / box.height };
    });
    const crossed = new Set<FieldKey>();
    const cross = (p: number): void => {
      for (const f of fields) {
        if (!crossed.has(f.key) && p >= f.at) {
          crossed.add(f.key);
          handlers.current.onCross(f.key);
        }
      }
    };
    const unsubscribe = progress.on('change', cross);
    const controls = animate(progress, [0, 0.12, 1], {
      duration: PIPELINE.beamDuration / 1000 / speed,
      times: [0, 0.25, 1],
      ease: ['easeIn', 'linear'],
      onComplete: () => {
        cross(1);
        handlers.current.onDone();
      },
    });
    return () => {
      controls.stop();
      unsubscribe();
    };
  }, [paper, progress, speed]);

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" style={{ opacity }}>
      <motion.div className="absolute inset-x-0 top-0" style={{ y, height: TRAIL + 2 }}>
        <div className="h-[60px] w-full" style={{ background: 'linear-gradient(to bottom, rgba(75,227,160,0), rgba(75,227,160,0.22))' }} />
        <div className="h-[2px] w-full bg-signal" style={{ boxShadow: '0 0 12px 2px rgba(75,227,160,0.55)' }} />
      </motion.div>
    </div>
  );
}
