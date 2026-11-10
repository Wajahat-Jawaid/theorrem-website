'use client';

import { useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { useUi } from '@/lib/store';
import { useFocusTrap } from './focusTrap';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

/** Right-anchored, width 520, over the same backdrop as the modal. */
export function Drawer({ open, onClose, title, subtitle, children, footer }: DrawerProps) {
  const panel = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const { reducedMotion } = useUi();
  useFocusTrap(open, panel, onClose);
  if (typeof document === 'undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="drawer"
          className="fixed inset-0 z-overlay bg-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reducedMotion ? 0 : 0.22 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-full max-w-drawer flex-col border-l border-white/[0.08] bg-ink-900 shadow-float outline-none"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: reducedMotion ? 0 : 0.32, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5">
              <div className="min-w-0">
                <h2 id={titleId} className="text-h3 text-hi">
                  {title}
                </h2>
                {subtitle ? <div className="mt-1 font-mono text-mono text-mid">{subtitle}</div> : null}
              </div>
              <button type="button" aria-label="Close" onClick={onClose} className="-mr-2 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-8 text-mid transition-colors duration-micro ease-out hover:bg-white/[0.06] hover:text-hi">
                <X size={18} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {footer ? <div className="border-t border-white/[0.06] px-6 py-4">{footer}</div> : null}
          </motion.aside>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
