import type { Document, VatCode } from '../types';
import { assemble, bst, type LineSpec } from './builder';
import { SITES } from './business';
import { ANCHOR_IDS, cityPlumbingLines, documents } from './documents';
import { assertArrivals } from './validate';

/**
 * The six documents "See it work" reads: five added to Xero and one skipped
 * because it was already added on 16 Oct. Their times are set from the clock
 * when the run finishes.
 */

const L = (description: string, quantity: number, unit: string, unitPrice: number, vatCode: VatCode = 'S20'): LineSpec => ({
  description,
  quantity,
  unit,
  unitPrice,
  vatCode,
});

const ARRIVAL_TIME = bst('2026-10-21', 9, 42);

export const processingArrivals: Document[] = [
  assemble({
    id: 'doc_b5f81e3a',
    supplierId: 'wickes',
    status: 'done',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-20',
    invoiceNumber: 'WK-604417',
    purchaseOrder: 'MC-2026-0433',
    deliverySite: SITES[1],
    category: '310',
    lines: [
      L('Engineered oak flooring 14mm, pack 1.86m²', 42, 'pack', 58.75),
      L('Wickes vinyl matt emulsion, pure brilliant white 10L', 14, 'tub', 34.5),
      L('Tile backer board 6mm 1200x600mm', 24, 'board', 14.75),
      L('Concrete lintel 100x140mm, 1.2m', 8, 'each', 25.75),
    ],
  }),
  assemble({
    id: 'doc_d4e9b258',
    supplierId: 'selco',
    status: 'done',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-20',
    invoiceNumber: 'SEL-90433106',
    deliverySite: SITES[2],
    category: '310',
    lines: [
      L('Thermalite Shield block 100mm', 600, 'each', 2.19),
      L('Gyproc SoundBloc 12.5mm 2400x1200mm', 64, 'sheet', 15.85),
      L('Postcrete 20kg', 30, 'bag', 7.35),
      L('Ballast, bulk bag', 5, 'bag', 52.4),
      L('Unibond 800 multi-surface sealant, pack of 3', 3, 'pack', 22.99),
    ],
  }),
  assemble({
    id: 'doc_7d2e90c4',
    supplierId: 'screwfix',
    status: 'done',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-21',
    invoiceNumber: 'SFX4412807',
    category: '310',
    lines: [
      L('Twin and earth cable 2.5mm 50m', 4, 'drum', 54.99),
      L('Wago 221-413 lever connectors, pack of 50', 3, 'pack', 18.66),
      L('Turbo Gold PZ2 screws 5x70mm, box of 200', 2, 'box', 12.49),
      L('Dust sheets, pack of 3', 2, 'pack', 8.32),
      L('No Nonsense decorators caulk 380ml', 3, 'tube', 1.48),
    ],
  }),
  assemble({
    id: 'doc_0b98c4f6',
    supplierId: 'city-plumbing',
    status: 'skipped',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-15',
    invoiceNumber: 'CPS-741206',
    accountNumber: 'MERC-3307',
    purchaseOrder: 'MC-2026-0419',
    deliverySite: SITES[1],
    category: '310',
    lines: cityPlumbingLines,
    duplicateOf: ANCHOR_IDS.cityPlumbingOriginal,
  }),
  assemble({
    id: 'doc_c3a57e19',
    supplierId: 'speedy-hire',
    status: 'done',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-20',
    invoiceNumber: 'SPH-71448517',
    accountNumber: 'MERC-5512',
    deliverySite: SITES[0],
    category: '325',
    lines: [L('Genie GS-1932 electric scissor lift, 13–19 Oct', 1, 'week', 243.21), L('Delivery and collection, Barking', 2, 'trip', 77.73)],
  }),
  assemble({
    id: 'doc_5e0f2d84',
    supplierId: 'buildbase',
    status: 'done',
    origin: 'session',
    receivedAt: ARRIVAL_TIME,
    invoiceDate: '2026-10-20',
    invoiceNumber: 'BB-3418820',
    deliverySite: SITES[0],
    category: '310',
    lines: [
      L('Plasterboard 12.5mm tapered edge 2400x1200mm', 24, 'sheet', 9.85),
      L('C16 CLS studwork 38x89mm, 3.0m', 36, 'length', 6.45),
      L('Expanding foam 750ml, pack of 4', 4, 'pack', 18.47),
    ],
  }),
];

assertArrivals(processingArrivals, documents);
