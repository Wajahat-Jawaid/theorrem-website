import type { VatReturn } from '../types';
import { assertVat } from './validate';

/**
 * Mercer Construction's return for August to October 2026, as it stands in
 * Xero today. Boxes 3 and 5 are worked out from these in derive.ts.
 */
export const vatReturn: VatReturn = {
  periodStart: '2026-08-01',
  periodEnd: '2026-10-31',
  dueDate: '2026-12-07',
  boxes: {
    b1: 84_312.6,
    b2: 0,
    b4: 51_904.18,
    b6: 421_563,
    b7: 268_415,
    b8: 0,
    b9: 0,
  },
  documentsIn: 1_247,
  documentsExpected: 1_259,
};

assertVat(vatReturn);
