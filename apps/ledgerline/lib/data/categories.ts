import type { Category, CategoryCode, VatCode } from '../types';

/**
 * Xero account codes, each with the plain label the owner sees. The code and
 * accounting name stay in data for Xero and the HMRC boxes; only the label is
 * ever rendered.
 */
export const categories: Category[] = [
  { code: '310', name: 'Materials purchased', label: 'Building materials' },
  { code: '320', name: 'Subcontractor costs', label: 'Subcontractor work' },
  { code: '325', name: 'Plant hire', label: 'Plant hire' },
  { code: '449', name: 'Motor vehicle expenses', label: 'Fuel and vehicles' },
  { code: '489', name: 'Telephone and internet', label: 'Phone and internet' },
  { code: '433', name: 'Insurance', label: 'Insurance' },
  { code: '453', name: 'Office expenses', label: 'Office costs' },
];

const byCode = new Map(categories.map((c) => [c.code, c]));

export function category(code: CategoryCode): Category {
  const found = byCode.get(code);
  if (!found) throw new Error(`Unknown category ${code}`);
  return found;
}

/** "Building materials", or "Waiting for you" while the owner has not chosen. */
export function categoryLabel(code: CategoryCode | null): string {
  return code ? category(code).label : 'Waiting for you';
}

export const VAT_RATE: Record<VatCode, number> = { S20: 20, Z0: 0, EX: 0, RC: 0 };

const VAT_LABEL: Record<VatCode, string> = {
  S20: 'VAT: 20%',
  Z0: 'VAT: 0%',
  EX: 'VAT: exempt',
  RC: 'VAT: reverse charge',
};

export function vatLabel(code: VatCode): string {
  return VAT_LABEL[code];
}
