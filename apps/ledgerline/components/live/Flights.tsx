'use client';

import { useRef, useState } from 'react';
import { useIsoLayoutEffect } from '@/lib/agent';
import { DOCS } from '@/lib/live/month';
import { FLY_MS, LINGER, flightsAt, type Flight } from '@/lib/live/timeline';
import { ART_SIZE, BankStrip, Chip, DocArt, Particle, ScanExtra } from './art';
import { clamp01, measure, spring, useClock, useFrame } from './clock';

/**
 * Everything in the air. Each flight is a copy of the item, measured from the
 * element it leaves and the one it lands on, carried on an arc by a spring in
 * 600ms. Its content is drawn the whole way; it fades only after it lands,
 * as the real element appears under it.
 */
export function Flights() {
  const { t, reduced } = useClock();
  if (reduced) return null;
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-[50]">
      {flightsAt(t).map((f) => (
        <FlightView key={f.id} f={f} />
      ))}
    </div>
  );
}

interface Geo {
  x0: number;
  y0: number;
  cx: number;
  cy: number;
  x1: number;
  y1: number;
  s0: number;
  s1: number;
  r0: number;
  w: number;
  h: number;
}

function nativeSize(f: Flight): { w: number; h: number } | null {
  switch (f.art.kind) {
    case 'doc':
      return ART_SIZE[DOCS[f.art.doc].art.kind];
    case 'scan-extra':
      return ART_SIZE.scan;
    case 'particle':
      return ART_SIZE.particle;
    case 'bank':
      return ART_SIZE.bank;
    case 'chip':
      return null;
  }
}

function Art({ f }: { f: Flight }) {
  const a = f.art;
  switch (a.kind) {
    case 'doc':
      return <DocArt doc={a.doc} />;
    case 'scan-extra':
      return <ScanExtra />;
    case 'particle':
      return <Particle tone={a.tone} />;
    case 'bank':
      return <BankStrip id={a.line} />;
    case 'chip':
      return <Chip text={a.text} tone={a.tone} mono={a.mono} />;
  }
}

function FlightView({ f }: { f: Flight }) {
  const { stage, scale } = useClock();
  const el = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const geo = useRef<Geo | null>(null);
  const [lost, setLost] = useState(false);

  useIsoLayoutEffect(() => {
    const root = stage.current;
    if (!root) return;
    const k = scale();
    const from = root.querySelector<HTMLElement>(f.from);
    const to = root.querySelector<HTMLElement>(f.to);
    const a = measure(from, root, k);
    const b = measure(to, root, k);
    if (!a || !b) {
      setLost(true);
      return;
    }
    const native = nativeSize(f) ?? { w: inner.current?.offsetWidth ?? a.w, h: inner.current?.offsetHeight ?? a.h };
    const fit = (r: { w: number; h: number }): number => (f.fit === 'box' ? Math.min(r.w / native.w, r.h / native.h) : 1);
    const x0 = a.x + a.w / 2;
    const y0 = a.y + a.h / 2;
    const x1 = b.x + b.w / 2;
    const y1 = b.y + b.h / 2;
    const dist = Math.hypot(x1 - x0, y1 - y0);
    // The arc rises a quarter of the way it travels, at least a little, never a loop.
    const arc = Math.min(140, Math.max(28, dist * 0.24));
    geo.current = {
      x0,
      y0,
      cx: (x0 + x1) / 2,
      cy: Math.min(y0, y1) - arc,
      x1,
      y1,
      s0: fit(a),
      s1: fit(b),
      r0: Number(from?.dataset.rot ?? 0),
      w: native.w,
      h: native.h,
    };
  }, []);

  useFrame((now) => {
    const g = geo.current;
    const node = el.current;
    if (!g || !node) return;
    const ms = now - f.start;
    const p = spring(ms);
    const lin = clamp01(ms / FLY_MS);
    const u = 1 - p;
    const x = u * u * g.x0 + 2 * u * p * g.cx + p * p * g.x1;
    const y = u * u * g.y0 + 2 * u * p * g.cy + p * p * g.y1;
    const s = (g.s0 + (g.s1 - g.s0) * clamp01(p)) * (1 + f.lift * Math.sin(Math.PI * lin));
    const r = g.r0 * (1 - clamp01(p));
    const fade = ms <= FLY_MS ? 1 : 1 - clamp01((ms - FLY_MS) / LINGER);
    node.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, 0) scale(${s.toFixed(4)}) rotate(${r.toFixed(2)}deg)`;
    node.style.opacity = String(fade);
    node.style.visibility = 'visible';
  });

  if (lost) return null;
  const native = nativeSize(f);
  return (
    <div ref={el} className="absolute left-0 top-0 will-change-transform" style={{ transformOrigin: '0 0', visibility: 'hidden' }}>
      <div
        ref={inner}
        className="absolute left-0 top-0"
        style={native ? { width: native.w, height: native.h, transform: `translate(${-native.w / 2}px, ${-native.h / 2}px)` } : { transform: 'translate(-50%, -50%)' }}
      >
        <Art f={f} />
      </div>
    </div>
  );
}
