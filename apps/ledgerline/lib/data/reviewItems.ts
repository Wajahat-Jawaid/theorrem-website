import type { Document, ReviewItem, VatCode } from '../types';
import { assemble, bst, type LineSpec } from './builder';
import { SITES } from './business';
import { CHECK_LIMIT } from '../constants';
import { gbp, gbpWhole } from '../format';

/**
 * The three documents that need the owner's OK, each with a full invoice
 * sheet addressed to Mercer Construction Ltd and the one question we ask.
 */

const L = (description: string, quantity: number, unit: string, unitPrice: number, vatCode: VatCode = 'S20'): LineSpec => ({
  description,
  quantity,
  unit,
  unitPrice,
  vatCode,
});

const lump = (description: string, net: number, vatCode: VatCode = 'S20'): LineSpec => ({
  description,
  quantity: 1,
  unit: 'item',
  unitPrice: net,
  net,
  vatCode,
});

export const REVIEW_IDS = {
  travisPerkins: 'doc_3f9a1c2e',
  howdens: 'doc_7b20e4d1',
  varney: 'doc_5d6e2b90',
} as const;

const travisPerkins = assemble({
  id: REVIEW_IDS.travisPerkins,
  supplierId: 'travis-perkins',
  status: 'needs_ok',
  origin: 'month',
  receivedAt: bst('2026-10-20', 16, 40),
  invoiceDate: '2026-10-14',
  invoiceNumber: 'INV-TP-884210',
  accountNumber: 'MERC0412',
  purchaseOrder: 'MC-2026-0417',
  deliverySite: SITES[0],
  pageCount: 2,
  lines: [
    L('Celcon Standard Block 7N 440x215x100mm', 480, 'each', 1.86),
    L('Ready-mixed mortar, 1 tonne bulk bag', 6, 'bag', 98.5),
    L('Treated sawn timber C24 47x150mm, 4.8m', 60, 'length', 14.2),
    L('Hydraulic lime NHL 3.5 25kg', 20, 'bag', 17.85),
    L('Polythene DPC 450mm x 30m', 15, 'roll', 30),
  ],
  category: null,
});

const howdens = assemble({
  id: REVIEW_IDS.howdens,
  supplierId: 'howdens',
  status: 'needs_ok',
  origin: 'month',
  receivedAt: bst('2026-10-16', 16, 22),
  invoiceDate: '2026-10-15',
  invoiceNumber: 'HJ-4418207',
  accountNumber: 'MERC-2207',
  purchaseOrder: 'MC-2026-0422',
  deliverySite: SITES[2],
  pageCount: 2,
  lines: [
    L('Clerkenwell Gloss Grey base unit 600mm', 48, 'unit', 198),
    L('Greenwich Matt Graphite wall unit 500mm', 36, 'unit', 146),
    L('Solid oak worktop 3000x620x40mm', 18, 'length', 304),
    L('Lamona stainless steel single oven', 6, 'each', 336),
    L('Lamona induction hob 600mm', 6, 'each', 289),
    L('Lamona integrated fridge freezer 70/30', 6, 'each', 412),
    lump('Plinth, end panels and cornice, 6 kitchens', 2112.67),
  ],
  category: '310',
});

const varney = assemble({
  id: REVIEW_IDS.varney,
  supplierId: 'varney-tiling',
  status: 'needs_ok',
  origin: 'month',
  receivedAt: bst('2026-10-21', 8, 37),
  invoiceDate: '2026-10-19',
  invoiceNumber: 'VTS-0041',
  deliverySite: SITES[1],
  lines: [lump('Wall and floor tiling labour, bathrooms and WCs, 22 Abbey Road', 4200), lump('Tile adhesive, grout and trims', 1550)],
  category: null,
});

export const reviewDocs: Document[] = [travisPerkins, howdens, varney];

/** How Travis Perkins invoices were filed before: the split behind the question. */
const TP_HISTORY = { materials: 31, subcontractor: 15 } as const;

const wholePercent = (part: number, whole: number): number => Math.round((part / whole) * 100);

/** Varney's labour line against the whole invoice before VAT. */
const varneyLabour = varney.lineItems[0].net;

export const reviewItems: ReviewItem[] = [
  {
    docId: REVIEW_IDS.travisPerkins,
    order: 1,
    question: 'Is this building materials or subcontractor work?',
    hint: "You've used both for Travis Perkins before.",
    reason: 'Materials or subcontractor work?',
    timesBought: TP_HISTORY.materials + TP_HISTORY.subcontractor,
    lean: `I'm ${wholePercent(TP_HISTORY.materials, TP_HISTORY.materials + TP_HISTORY.subcontractor)}% sure it's building materials`,
    evidence: [
      {
        region: 'supplier',
        text: `You've filed Travis Perkins as building materials ${TP_HISTORY.materials} times and as subcontractor work ${TP_HISTORY.subcontractor} times.`,
      },
      { region: 'lines', text: 'The lines are blocks, mortar, timber, lime and DPC.' },
      { region: 'deliverTo', text: `It was delivered to ${SITES[0]}, against your order ${travisPerkins.purchaseOrder}.` },
    ],
    choices: [
      { id: 'materials', label: 'Building materials', detail: `used ${TP_HISTORY.materials} times`, action: { type: 'category', code: '310' } },
      { id: 'subcontractor', label: 'Subcontractor work', detail: `used ${TP_HISTORY.subcontractor} times`, action: { type: 'category', code: '320' } },
    ],
  },
  {
    docId: REVIEW_IDS.howdens,
    order: 2,
    question: `This is over your ${gbpWhole(CHECK_LIMIT)} check limit. Were you expecting it?`,
    hint: null,
    reason: `Over your ${gbpWhole(CHECK_LIMIT)} check limit`,
    timesBought: 42,
    lean: `Your order ${howdens.purchaseOrder} is on it`,
    evidence: [
      { region: 'total', text: `It's ${gbp(howdens.gross)}, over your ${gbpWhole(CHECK_LIMIT)} check limit.` },
      { region: 'lines', text: 'Units, worktops and appliances for 6 kitchens.' },
      { region: 'order', text: `It quotes your order ${howdens.purchaseOrder}, delivered to ${SITES[2]}.` },
    ],
    choices: [
      { id: 'expected', label: "Yes, it's expected", detail: null, action: { type: 'confirm' } },
      { id: 'hold', label: 'No, hold it', detail: null, action: { type: 'hold' } },
    ],
  },
  {
    docId: REVIEW_IDS.varney,
    order: 3,
    question: "First time we've seen Varney Tiling. What do they do for you?",
    hint: null,
    reason: 'First invoice from them',
    timesBought: 0,
    lean: `I'm ${wholePercent(varneyLabour, varney.net)}% sure it's subcontractor work`,
    evidence: [
      { region: 'supplier', text: "It's the first invoice we've seen from Varney Tiling Services, so there's no history to go on." },
      { region: 'lines', text: `${gbp(varneyLabour)} of the ${gbp(varney.net)} before VAT is labour.` },
      { region: 'deliverTo', text: `The work was at ${SITES[1].split(',')[0]}, one of your sites.` },
    ],
    choices: [
      { id: 'subcontractor', label: 'Subcontractor work', detail: null, action: { type: 'category', code: '320' } },
      { id: 'materials', label: 'Building materials', detail: null, action: { type: 'category', code: '310' } },
    ],
  },
];

const byDoc = new Map(reviewItems.map((r) => [r.docId, r]));

export function reviewItemFor(docId: string): ReviewItem | undefined {
  return byDoc.get(docId);
}
