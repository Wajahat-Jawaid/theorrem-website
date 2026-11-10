import type { Config } from 'tailwindcss';
import { palette } from './lib/palette';

/**
 * Ledgerline design tokens: Paper in the Dark. A near-black green stage with
 * bright paper documents on it. Components reference these tokens, never raw
 * values. Motion tokens live in lib/motion.ts and are mirrored here for CSS.
 */
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    screens: {
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1440px',
    },
    colors: palette,
    fontFamily: {
      display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Helvetica', 'Arial', 'sans-serif'],
      mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      // The supplier's paperwork in the invoice viewer, not the interface.
      doc: ['Arial', 'Helvetica Neue', 'Helvetica', 'sans-serif'],
    },
    fontSize: {
      // Type scale at 1440px; the -sm steps are the same roles at x0.82 for 1280px.
      display: ['88px', { lineHeight: '0.95', letterSpacing: '-0.035em', fontWeight: '700' }],
      'display-sm': ['72px', { lineHeight: '0.95', letterSpacing: '-0.035em', fontWeight: '700' }],
      h1: ['56px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '600' }],
      'h1-sm': ['46px', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '600' }],
      h2: ['32px', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '600' }],
      h3: ['20px', { lineHeight: '1.3', fontWeight: '600' }],
      counter: ['64px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
      'counter-sm': ['52px', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '600' }],
      box5: ['72px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '600' }],
      'box5-sm': ['58px', { lineHeight: '1', letterSpacing: '-0.025em', fontWeight: '600' }],
      lead: ['18px', { lineHeight: '1.5' }],
      body: ['16px', { lineHeight: '1.55' }],
      small: ['14px', { lineHeight: '1.45' }],
      label: ['12px', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '500' }],
      mono: ['13px', { lineHeight: '1.5' }],
      // The invoice sheet, rendered at A4 scale.
      'doc-xs': ['8px', { lineHeight: '11px' }],
      'doc-sm': ['9px', { lineHeight: '13px' }],
      'doc-base': ['10px', { lineHeight: '14px' }],
      'doc-md': ['11px', { lineHeight: '15px' }],
      'doc-lg': ['13px', { lineHeight: '17px' }],
      'doc-xl': ['18px', { lineHeight: '22px' }],
    },
    borderRadius: {
      none: '0',
      // Paper is not rounded.
      2: '2px',
      4: '4px',
      // Chips.
      6: '6px',
      8: '8px',
      // Cards.
      12: '12px',
      // Stage panels.
      20: '20px',
      full: '9999px',
    },
    extend: {
      spacing: {
        4.5: '18px',
        13: '52px',
        14: '56px',
        15: '60px',
        16: '64px',
        18: '72px',
        content: '1360px',
        drawer: '520px',
        toast: '380px',
        tooltip: '280px',
      },
      maxWidth: {
        content: '1360px',
        drawer: '520px',
        modal: '560px',
        toast: 'calc(100vw - 32px)',
        tooltip: '280px',
        prose: '560px',
      },
      height: {
        nav: '56px',
      },
      gridTemplateColumns: {
        // Missing paperwork: what it's for | the empty slot | the email.
        chase: 'minmax(0,300px) 112px minmax(0,1fr)',
      },
      boxShadow: {
        paper: '0 40px 80px -20px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
        'paper-sm': '0 18px 36px -14px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.04)',
        card: 'inset 0 1px 0 rgba(255,255,255,0.05)',
        float: '0 24px 48px -16px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
        glow: '0 0 0 1px rgba(75,227,160,0.45), 0 0 28px rgba(75,227,160,0.22)',
        brass: '0 0 0 1px rgba(226,182,92,0.45), 0 14px 34px -12px rgba(226,182,92,0.45)',
        // A value we read, boxed in mint on the paper.
        mark: '0 0 0 1.5px rgba(75,227,160,0.9)',
        none: 'none',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16,1,0.3,1)',
        'in-quart': 'cubic-bezier(0.5,0,0.75,0)',
        scan: 'cubic-bezier(0.55,0,0.45,1)',
      },
      transitionDuration: {
        micro: '120ms',
        small: '200ms',
        medium: '320ms',
        large: '520ms',
        cinematic: '1200ms',
      },
      keyframes: {
        // The mint layer of the aurora drifts ±3% over 18s: almost imperceptible.
        aurora: {
          '0%': { transform: 'translate3d(-3%, -2%, 0)' },
          '100%': { transform: 'translate3d(3%, 2%, 0)' },
        },
        // Two pulses, then still. Never infinite.
        'ring-pulse': {
          // Opacity only, over a fixed ring the element carries itself.
          '0%': { opacity: '1' },
          '100%': { opacity: '0' },
        },
        'dot-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.6)', opacity: '0.55' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-120%) skewX(-18deg)' },
          '100%': { transform: 'translateX(220%) skewX(-18deg)' },
        },
      },
      animation: {
        aurora: 'aurora 18s ease-in-out infinite alternate',
        'dot-pulse': 'dot-pulse 0.9s ease-out 1',
        'dot-pulse-2': 'dot-pulse 0.9s ease-out 2',
        'ring-pulse': 'ring-pulse 1.1s ease-out 2',
        shimmer: 'shimmer 1.4s ease-in-out 1 both',
      },
      zIndex: {
        stage: '1',
        header: '30',
        bar: '40',
        overlay: '60',
        toast: '70',
        tooltip: '80',
      },
    },
  },
  // Shadow colour utilities are off: "shadow-paper" and "shadow-brass" are named shadows,
  // and would otherwise also match the paper and brass colours and tint the shadow with them.
  corePlugins: { boxShadowColor: false },
  plugins: [],
};

export default config;
