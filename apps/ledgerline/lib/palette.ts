/**
 * Paper in the Dark. The colour tokens, shared by Tailwind and by any
 * component that needs a raw value for an SVG attribute or an animation.
 *
 * The app is a near-black green stage; every document, email and HMRC box is
 * drawn as bright paper so the eye lands on what the agent is reading.
 * Brass is reserved for pounds and the one primary action on each screen.
 */
export const palette = {
  transparent: 'transparent',
  current: 'currentColor',
  white: '#FFFFFF',
  black: '#000000',
  /** Surfaces: canvas, raised panels and nav, cards, hairlines. */
  ink: { 950: '#050B09', 900: '#0A1511', 800: '#10201A', 700: '#1C3229' },
  /** Text on the dark stage. Never pure white. */
  hi: '#ECF3EF',
  mid: '#9DB3A8',
  lo: '#5E7A6D',
  /** Agent activity: scan beam, ticks, active states. `deep` is the mint for text on paper. */
  signal: { DEFAULT: '#4BE3A0', soft: 'rgba(75,227,160,0.16)', deep: '#177A50' },
  /** Money figures and the primary action only. `deep` is brass on paper and the pressed state. */
  brass: { DEFAULT: '#E2B65C', deep: '#B8892E' },
  /** "Needs your OK" attention dots. */
  amber: '#FFB547',
  /** Missing paperwork and errors. */
  alert: '#FF6B5B',
  /** The old brand green survives as a mid-tone inside the aurora only. */
  forest: '#0B3D2E',
  paper: { DEFAULT: '#FBFAF6', ink: '#1A1F1C', rule: '#E4E1D8', muted: '#5F6660', fill: '#F3F1EA' },
  backdrop: 'rgba(2,6,5,0.72)',
  /** The Overview pile only: a sticky note, a coffee ring, a spreadsheet's header and a PDF tag. */
  prop: {
    note: '#F2DE7B',
    'note-ink': '#3A3522',
    coffee: 'rgba(122,82,40,0.32)',
    sheet: '#E4EEE8',
    'sheet-rule': '#CBD6CF',
    pdf: '#C9473A',
  },
  /** The supplier's own paperwork, drawn in the invoice viewer. */
  doc: {
    ink: '#1A1F1C',
    muted: '#5F6660',
    rule: '#E4E1D8',
    fill: '#F3F1EA',
    mark: 'rgba(75,227,160,0.16)',
    'mark-strong': 'rgba(75,227,160,0.40)',
  },
} as const;
