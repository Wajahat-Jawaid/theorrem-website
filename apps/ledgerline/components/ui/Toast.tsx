'use client';

import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAppData, useUi } from '@/lib/store';
import type { Toast as ToastData, ToastKind } from '@/lib/state';

const TILE: Record<ToastKind, { className: string; icon: typeof Info }> = {
  success: { className: 'bg-signal/10 text-signal', icon: CheckCircle2 },
  info: { className: 'bg-white/[0.06] text-hi', icon: Info },
  warning: { className: 'bg-amber/15 text-amber', icon: AlertCircle },
};

function ToastCard({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const timer = setTimeout(() => close.current(), 4000);
    return () => clearTimeout(timer);
  }, [toast.id]);
  const { className, icon: Icon } = TILE[toast.kind];
  return (
    <div className="pointer-events-auto flex w-full items-start gap-3 rounded-12 border border-white/[0.08] bg-ink-800 p-4 shadow-float">
      <span className={cn('inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-8', className)} aria-hidden>
        <Icon size={18} strokeWidth={1.75} />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="text-small font-semibold text-hi">{toast.title}</div>
        {toast.body ? <div className="mt-0.5 text-small text-mid">{toast.body}</div> : null}
      </div>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={onClose}
        className="-mr-1 -mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-8 text-mid transition-colors duration-micro ease-out hover:bg-white/[0.06] hover:text-hi"
      >
        <X size={16} strokeWidth={1.75} aria-hidden />
      </button>
    </div>
  );
}

/** Top-right stack under the nav, 380 wide, each dismissing after 4s. Kept away from the bottom, where the presenter bar lives. */
export function ToastStack() {
  const { state, dispatch } = useAppData();
  const { reducedMotion } = useUi();
  return (
    <div aria-live="polite" role="status" className="pointer-events-none fixed right-6 top-[72px] z-toast flex w-toast max-w-toast flex-col gap-3">
      <AnimatePresence initial={false}>
        {state.toasts.map((t) => (
          <motion.div
            key={t.id}
            layout={!reducedMotion}
            initial={reducedMotion ? false : { opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, x: 24 }}
            transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
          >
            <ToastCard toast={t} onClose={() => dispatch({ type: 'toast_dismiss', id: t.id })} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
