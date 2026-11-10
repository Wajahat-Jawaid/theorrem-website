'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useIsoLayoutEffect } from '@/lib/agent';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  /** Preferred side; flips when there is no room. */
  side?: 'top' | 'bottom' | 'right';
  delay?: number;
  className?: string;
  /** Renders the trigger wrapper as a block element. */
  block?: boolean;
  disabled?: boolean;
}

interface Position {
  top: number;
  left: number;
  arrowLeft: number;
  arrowTop: number;
  placement: 'top' | 'bottom' | 'right';
}

const GAP = 10;
const EDGE = 8;

/**
 * Dark floating label with a pointer, shown after a 300ms hover or on
 * keyboard focus. Rendered in a portal so card overflow never clips it.
 */
export function Tooltip({ content, children, side = 'top', delay = 300, className, block, disabled }: TooltipProps) {
  const id = useId();
  const trigger = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLDivElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Position | null>(null);

  const show = useCallback(() => {
    if (disabled) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(true), delay);
  }, [delay, disabled]);
  const hide = useCallback(() => {
    clearTimeout(timer.current);
    setOpen(false);
    setPos(null);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') hide();
    };
    const onScroll = (): void => hide();
    window.addEventListener('keydown', onKey);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [open, hide]);

  useIsoLayoutEffect(() => {
    if (!open || !trigger.current || !bubble.current) return;
    const r = trigger.current.getBoundingClientRect();
    const b = bubble.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let placement: Position['placement'] = side;
    if (placement === 'right' && r.right + GAP + b.width > vw - EDGE) placement = 'top';
    if (placement === 'top' && r.top - GAP - b.height < EDGE) placement = 'bottom';
    if (placement === 'bottom' && r.bottom + GAP + b.height > vh - EDGE && r.top - GAP - b.height >= EDGE) placement = 'top';
    if (placement === 'right') {
      const top = Math.min(Math.max(EDGE, r.top + r.height / 2 - b.height / 2), vh - b.height - EDGE);
      setPos({ top, left: r.right + GAP, arrowLeft: -5, arrowTop: r.top + r.height / 2 - top - 5, placement });
      return;
    }
    const centre = r.left + r.width / 2;
    const left = Math.min(Math.max(EDGE, centre - b.width / 2), vw - b.width - EDGE);
    const top = placement === 'top' ? r.top - GAP - b.height : r.bottom + GAP;
    setPos({ top, left, arrowLeft: Math.min(Math.max(12, centre - left - 5), b.width - 22), arrowTop: placement === 'top' ? b.height - 5 : -5, placement });
  }, [open, side, content]);

  const Wrapper = block ? 'div' : 'span';

  return (
    <>
      <Wrapper
        ref={trigger as React.RefObject<HTMLSpanElement & HTMLDivElement>}
        className={cn(block ? 'block' : 'inline-flex max-w-full', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        aria-describedby={open ? id : undefined}
      >
        {children}
      </Wrapper>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={bubble}
              id={id}
              role="tooltip"
              className={cn(
                'pointer-events-none fixed z-tooltip max-w-tooltip rounded-8 border border-white/10 bg-ink-800 px-3.5 py-2.5 text-small text-hi shadow-float',
                !pos && 'invisible',
              )}
              style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0 }}
            >
              {content}
              {pos ? (
                <span
                  aria-hidden
                  className={cn(
                    'absolute h-2.5 w-2.5 rotate-45 border-white/10 bg-ink-800',
                    pos.placement === 'top' && 'border-b border-r',
                    pos.placement === 'bottom' && 'border-l border-t',
                    pos.placement === 'right' && 'border-b border-l',
                  )}
                  style={{ left: pos.arrowLeft, top: pos.arrowTop }}
                />
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
