'use client';

import { motion } from 'framer-motion';

/**
 * One bright segment that runs once round the edge of its parent (which must
 * be position: relative), then fades. Never loops.
 */
export function BorderBeam({ radius = 12, color = '#4BE3A0', duration = 0.9 }: { radius?: number; color?: string; duration?: number }) {
  return (
    <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full overflow-visible">
      <motion.rect
        x="0.5"
        y="0.5"
        width="100%"
        height="100%"
        rx={radius}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="0.18 0.82"
        initial={{ strokeDashoffset: 0, opacity: 1 }}
        animate={{ strokeDashoffset: -1, opacity: [1, 1, 0] }}
        transition={{ duration, ease: 'easeInOut', opacity: { duration, times: [0, 0.8, 1] } }}
        style={{ filter: `drop-shadow(0 0 4px ${color})` }}
      />
    </svg>
  );
}
