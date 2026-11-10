"use client";

import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Captions,
  RotateCcw,
  Play,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { STORY, screenFor, useDemo, type Screen } from "@/lib/demo-store";
import { DUR, EASE } from "@/lib/motion";

/** One line the presenter never has to say. */
const CAPTIONS: Record<Screen, string> = {
  overview:
    "Ledgerline turns a month of paperwork into a clean ledger and ready-to-send emails.",
  review: "When Ledgerline isn't sure, it asks you, and shows you why.",
  paperwork: "Ledgerline chases missing paperwork, so you don't have to.",
  vat: "Every month, this is all you'll see.",
  documents: "Every document this month, read, sorted and filed.",
};

const IDLE_MS = 2000;

function storyIndex(screen: Screen): number {
  const i = STORY.findIndex((s) => s.screen === screen);
  return i === -1 ? 0 : i;
}

/**
 * Presenter mode: ← and → walk the four screens, Space replays the current
 * screen's peak, R resets everything, C toggles a one-line caption. The bar
 * appears on any mouse movement or key and hides after 2 seconds idle.
 */
export function Presenter() {
  const pathname = usePathname();
  const router = useRouter();
  const { replay, reset, captions, toggleCaptions, autoplay } = useDemo();
  const screen = screenFor(pathname);
  const index = storyIndex(screen);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>();

  const wake = useCallback(() => {
    setVisible(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setVisible(false), IDLE_MS);
  }, []);

  const go = useCallback(
    (step: number) => {
      const next = Math.min(STORY.length - 1, Math.max(0, index + step));
      if (next !== index || screen === "documents")
        router.push(STORY[next].href);
    },
    [index, router, screen],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]'))
        return;
      if (document.querySelector('[aria-modal="true"]')) return;
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          go(1);
          break;
        case "ArrowLeft":
          e.preventDefault();
          go(-1);
          break;
        case " ":
          // Space on a focused control presses it, as it always does.
          if (
            target?.closest(
              'button, a, [role="button"], [role="switch"], summary',
            )
          )
            return;
          // All documents has no peak to replay; Space scrolls the list as usual.
          if (screen === "documents") return;
          e.preventDefault();
          replay(screen);
          break;
        case "r":
        case "R":
          reset();
          break;
        case "c":
        case "C":
          toggleCaptions();
          break;
        default:
          return;
      }
      wake();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, replay, reset, screen, toggleCaptions, wake]);

  useEffect(() => {
    window.addEventListener("mousemove", wake, { passive: true });
    return () => {
      window.removeEventListener("mousemove", wake);
      clearTimeout(hideTimer.current);
    };
  }, [wake]);

  return (
    <>
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-bar flex justify-center px-4"
      >
        <AnimatePresence>
          {captions ? (
            <motion.p
              key={screen}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: DUR.medium, ease: EASE.outExpo }}
              className="max-w-[760px] rounded-full border border-white/[0.08] bg-ink-900/95 px-5 py-2.5 text-center text-lead font-medium text-hi shadow-float"
            >
              {CAPTIONS[screen]}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      {/* Centred by a flex row, not a translate: the motion transform below would replace it. */}
      <div className="pointer-events-none fixed inset-x-0 bottom-5 z-bar flex justify-center px-4">
        <motion.div
          role="toolbar"
          aria-label="Presenter controls"
          className={cn(
            "w-max",
            visible ? "pointer-events-auto" : "pointer-events-none",
          )}
          initial={false}
          animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 8 }}
          transition={{ duration: DUR.small, ease: EASE.outExpo }}
          onFocus={wake}
        >
          <div className="flex items-center gap-1 rounded-full border border-white/[0.08] bg-ink-900 p-1 text-small text-mid shadow-float">
            <BarButton
              label="Previous screen"
              kbd="←"
              onClick={() => go(-1)}
              disabled={index === 0 && screen !== "documents"}
              reason="Already on the first screen"
            >
              <ChevronLeft size={16} strokeWidth={1.75} aria-hidden />
            </BarButton>
            <span className="tnum min-w-[150px] whitespace-nowrap px-2 text-center font-medium text-hi">
              {index + 1}/{STORY.length} · {STORY[index].label}
            </span>
            <BarButton
              label="Next screen"
              kbd="→"
              onClick={() => go(1)}
              disabled={index === STORY.length - 1}
              reason="Already on the last screen"
            >
              <ChevronRight size={16} strokeWidth={1.75} aria-hidden />
            </BarButton>
            <span aria-hidden className="mx-1 h-5 w-px bg-white/10" />
            {screen === "documents" ? null : (
              <BarButton
                label="Replay this screen"
                kbd="Space"
                onClick={() => replay(screen)}
                wide
              >
                <Play size={14} strokeWidth={1.75} aria-hidden />
                Replay
              </BarButton>
            )}
            <BarButton
              label={captions ? "Hide caption" : "Show caption"}
              kbd="C"
              onClick={toggleCaptions}
              pressed={captions}
              wide
            >
              <Captions size={15} strokeWidth={1.75} aria-hidden />
              Caption
            </BarButton>
            <BarButton
              label="Reset everything"
              kbd="R"
              onClick={() => reset()}
              wide
            >
              <RotateCcw size={14} strokeWidth={1.75} aria-hidden />
              Reset
            </BarButton>
            {autoplay ? (
              <span className="px-3 text-[12px] text-lo">
                Playing on its own · press any key to take over
              </span>
            ) : null}
          </div>
        </motion.div>
      </div>
    </>
  );
}

function BarButton({
  label,
  kbd,
  onClick,
  disabled,
  reason,
  pressed,
  wide,
  children,
}: {
  label: string;
  kbd: string;
  onClick: () => void;
  disabled?: boolean;
  /** Shown as the tooltip while disabled, so it says why. */
  reason?: string;
  pressed?: boolean;
  wide?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={`${label} (${kbd})`}
      aria-pressed={pressed}
      title={disabled && reason ? reason : `${label} · ${kbd}`}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-8 items-center justify-center gap-1.5 rounded-full transition-colors duration-micro ease-out hover:bg-white/[0.06] hover:text-hi disabled:opacity-35 disabled:hover:bg-transparent",
        wide ? "px-3" : "w-8",
        pressed && "bg-white/[0.08] text-hi",
      )}
    >
      {children}
      {wide ? (
        <kbd className="ml-0.5 rounded-4 border border-white/10 px-1 font-mono text-[11px] text-lo">
          {kbd}
        </kbd>
      ) : null}
    </button>
  );
}
