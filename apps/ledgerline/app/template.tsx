'use client';

import type { ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { DUR, EASE } from '@/lib/motion';

/**
 * Screen transitions are a zoom-in, never a hard cut. Under reduced motion
 * MotionConfig drops the scale and what is left is a 150ms fade.
 */
export default function Template({ children }: { children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.985 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={reduced ? { duration: 0.15 } : { duration: DUR.medium, ease: EASE.outExpo }}
    >
      {children}
    </motion.div>
  );
}
