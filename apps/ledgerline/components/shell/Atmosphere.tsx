import { cn } from '@/lib/cn';

/**
 * The stage lighting: CSS only, no WebGL. A mint glow top right that drifts
 * ±3% over 18 seconds, a faint brass glow bottom left, the forest mid-tone
 * between them, all on the #050B09 canvas. Fixed behind everything.
 * Dimmed while a decision card is open.
 */
export function AuroraBackground({ dim = false }: { dim?: boolean }) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-ink-950">
      <div
        className="absolute -inset-[6%] animate-aurora will-change-transform"
        style={{ background: 'radial-gradient(60% 50% at 72% 28%, rgba(75,227,160,0.16), transparent 70%)' }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(45% 40% at 18% 82%, rgba(226,182,92,0.09), transparent 70%), radial-gradient(70% 60% at 50% 55%, rgba(11,61,46,0.28), transparent 75%)',
        }}
      />
      {/* Focus mode: the lights go down to 15% while a decision is on screen. */}
      <div className={cn('absolute inset-0 bg-ink-950 transition-opacity duration-[450ms] ease-out', dim ? 'opacity-85' : 'opacity-0')} />
    </div>
  );
}

/** feTurbulence noise, tiled once as an image: removes the flat "template" feel. */
const NOISE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='180' height='180'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 1 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")";

export function Grain() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 z-overlay opacity-[0.035] mix-blend-overlay" style={{ backgroundImage: NOISE }} />;
}

/** Darkens the edges of the hero only, so the paper is the brightest thing on screen. */
export function StageVignette({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('pointer-events-none absolute inset-y-0 left-1/2 w-screen -translate-x-1/2', className)}
      style={{ background: 'radial-gradient(120% 90% at 50% 40%, transparent 55%, rgba(0,0,0,0.55) 100%)' }}
    />
  );
}
