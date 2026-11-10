/**
 * The example month the live demo and the full dashboard both show: October
 * at Mercer Construction. Every figure on either screen comes from here, so
 * the story at / and the dashboard at /dashboard always agree.
 *
 * Eight documents are drawn one by one; the rest of the month is counted in
 * MORE. Each amount is VAT-inclusive, and net + VAT = amount to the penny.
 */

export type Source = 'email' | 'whatsapp' | 'post';

/** How the document looked when it arrived: drives its artwork in the lane, in flight and as a row thumbnail. */
export type Art =
  | { kind: 'pdf'; number: string; accent: string }
  | { kind: 'photo'; place: string; lines: { what: string; amount: string }[]; crumpled?: boolean }
  | { kind: 'hand'; what: string }
  | { kind: 'scan'; number: string; accent: string; stained?: boolean; folded?: boolean };

export interface DocSpec {
  id: DocId;
  source: Source;
  /** What is known before it is read: who sent it, and what it is. */
  from: string;
  fromDetail: string;
  supplier: string;
  category: string;
  /** The date on the document. */
  date: string;
  amount: number;
  vat: number;
  art: Art;
}

export type DocId = 'tp' | 'screwfix' | 'wickes' | 'jewson' | 'skips' | 'aplant' | 'aplant2' | 'toolstation' | 'speedy';

export const DOCS: Record<DocId, DocSpec> = {
  tp: {
    id: 'tp',
    source: 'email',
    from: 'Travis Perkins',
    fromDetail: 'Invoice PDF',
    supplier: 'Travis Perkins',
    category: 'Materials',
    date: '8 Oct',
    amount: 1488,
    vat: 248,
    art: { kind: 'pdf', number: 'TP 6610482', accent: '#1F4E8C' },
  },
  screwfix: {
    id: 'screwfix',
    source: 'whatsapp',
    from: 'Jamie',
    fromDetail: 'Receipt photo',
    supplier: 'Screwfix',
    category: 'Materials',
    date: '3 Oct',
    amount: 86.4,
    vat: 14.4,
    art: {
      kind: 'photo',
      place: 'BARKING',
      lines: [
        { what: 'DRILL BITS SET', amount: '24.99' },
        { what: 'SDS CHISEL', amount: '18.49' },
        { what: 'SEALANT X4', amount: '27.92' },
        { what: 'GLOVES', amount: '15.00' },
      ],
    },
  },
  wickes: {
    id: 'wickes',
    source: 'post',
    from: 'Scanned letter',
    fromDetail: '1 page',
    supplier: 'Wickes',
    category: 'Materials',
    date: '14 Oct',
    amount: 318.66,
    vat: 53.11,
    art: { kind: 'scan', number: 'WK 210945', accent: '#1D5FA8', stained: true },
  },
  jewson: {
    id: 'jewson',
    source: 'email',
    from: 'Jewson Accounts',
    fromDetail: 'Invoice PDF',
    supplier: 'Jewson',
    category: 'Materials',
    date: '6 Oct',
    amount: 734.4,
    vat: 122.4,
    art: { kind: 'pdf', number: 'INV 0047213', accent: '#0B5E3A' },
  },
  skips: {
    id: 'skips',
    source: 'whatsapp',
    from: 'Mo',
    fromDetail: 'Receipt photo',
    supplier: 'Barking Skips',
    category: 'Skip hire',
    date: '10 Oct',
    amount: 180,
    vat: 0,
    art: { kind: 'hand', what: '8yd skip, 1 week' },
  },
  aplant: {
    id: 'aplant',
    source: 'email',
    from: 'A-Plant',
    fromDetail: 'Invoice PDF',
    supplier: 'A-Plant',
    category: 'Tool hire',
    date: '20 Oct',
    amount: 528,
    vat: 88,
    art: { kind: 'pdf', number: 'AP 774120', accent: '#C2410C' },
  },
  /** The same A-Plant invoice, posted as well as emailed. */
  aplant2: {
    id: 'aplant2',
    source: 'post',
    from: 'Scanned letter',
    fromDetail: '1 page',
    supplier: 'A-Plant',
    category: 'Tool hire',
    date: '20 Oct',
    amount: 528,
    vat: 88,
    art: { kind: 'scan', number: 'AP 774120', accent: '#C2410C', folded: true },
  },
  toolstation: {
    id: 'toolstation',
    source: 'whatsapp',
    from: 'Jamie',
    fromDetail: 'Receipt photo',
    supplier: 'Toolstation',
    category: 'Materials',
    date: '15 Oct',
    amount: 43.97,
    vat: 7.33,
    art: {
      kind: 'photo',
      place: 'DAGENHAM',
      crumpled: true,
      lines: [
        { what: 'WOOD SCREWS', amount: '12.98' },
        { what: 'WALL PLUGS', amount: '4.49' },
        { what: 'MASKING TAPE', amount: '8.50' },
        { what: 'DUST SHEETS', amount: '18.00' },
      ],
    },
  },
  /** The missing receipt, sent back by Sam when we ask for it. */
  speedy: {
    id: 'speedy',
    source: 'email',
    from: 'Sam, Speedy Hire',
    fromDetail: 'Receipt PDF',
    supplier: 'Speedy Hire',
    category: 'Tool hire',
    date: '12 Oct',
    amount: 214.8,
    vat: 35.8,
    art: { kind: 'pdf', number: 'SH 88214', accent: '#B5331F' },
  },
};

export type BankId = 'b_screwfix' | 'b_jewson' | 'b_tp' | 'b_speedy' | 'b_aplant';

export interface BankLine {
  id: BankId;
  date: string;
  details: string;
  amount: number;
  doc: DocId;
}

/** The statement lines in the bank lane, in date order. */
export const BANK: BankLine[] = [
  { id: 'b_screwfix', date: '03 Oct', details: 'SCREWFIX BARKING', amount: 86.4, doc: 'screwfix' },
  { id: 'b_jewson', date: '06 Oct', details: 'JEWSON LTD', amount: 734.4, doc: 'jewson' },
  { id: 'b_tp', date: '08 Oct', details: 'TRAVIS PERKINS', amount: 1488, doc: 'tp' },
  { id: 'b_speedy', date: '12 Oct', details: 'SPEEDY HIRE', amount: 214.8, doc: 'speedy' },
  { id: 'b_aplant', date: '20 Oct', details: 'A-PLANT HIRE', amount: 528, doc: 'aplant' },
];

export const bankLine = (id: BankId): BankLine => BANK.find((b) => b.id === id) as BankLine;

export const MONTH = {
  label: 'October',
  /** Documents in the month that are not drawn as rows. 304 + the 8 drawn = 312. */
  more: 304,
  /** Card payments, transfers and direct debits out of the business account in October. */
  bankPayments: 148,
  /** Of those, matched to paperwork in one go, beyond the five drawn in the bank lane. */
  bankMatchedInBulk: 143,
  vatOnSales: 18_240,
  vatOnCosts: 6_412.8,
  vatToPay: 11_827.2,
  /** An example month by hand: keying, filing, matching and chasing, in minutes. */
  manualMinutes: 990,
  /** The same month with Ledgerline: answering the odd question and reading the summary. */
  withUsMinutes: 54,
  accountant: { name: 'Priya Shah', first: 'Priya', role: 'Accountant' },
  project: 'Peckham job',
} as const;

/** Hours saved per document done, so the counter reaches the example month's 15.6 hours at 312. */
export const SAVED_HOURS_PER_DOC = (MONTH.manualMinutes - MONTH.withUsMinutes) / 60 / (MONTH.more + 8);

export const TIME = {
  hours: MONTH.manualMinutes / 60,
  minutes: MONTH.withUsMinutes,
  /** −95%: the share of the month's paperwork time that is gone. */
  cut: Math.round((1 - MONTH.withUsMinutes / MONTH.manualMinutes) * 100),
} as const;
