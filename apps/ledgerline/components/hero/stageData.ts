import type { Document } from '@/lib/types';
import { documents } from '@/lib/data/documents';
import { ANCHOR_IDS } from '@/lib/data/documents';
import { supplier as getSupplier } from '@/lib/data/suppliers';
import { categoryLabel, VAT_RATE } from '@/lib/data/categories';
import { dateLong, gbp } from '@/lib/format';

/**
 * The invoice the Overview reads in detail: this morning's first document, a
 * real record already counted in the month. The stage re-enacts reading it;
 * it never adds to the counters.
 */

function doc(id: string): Document {
  const found = documents.find((d) => d.id === id);
  if (!found) throw new Error(`Stage points at a missing document ${id}`);
  return found;
}

/** The hero: Speedy Hire's invoice, the first thing in this morning (07:54). */
export const HERO_DOC = doc(ANCHOR_IDS.speedyToday);

export type FieldKey = 'supplier' | 'date' | 'category' | 'net' | 'vat' | 'gross';

/** In the order the beam reaches them, top of the paper to the bottom. */
export const FIELD_ORDER: FieldKey[] = ['supplier', 'date', 'category', 'net', 'vat', 'gross'];

export interface StageField {
  label: string;
  value: string;
}

function vatLabel(d: Document): string {
  const codes = new Set(d.lineItems.map((l) => l.vatCode));
  if (codes.size !== 1) return 'VAT';
  return `VAT (${VAT_RATE[d.vatCode]}%)`;
}

/** The six values as the ledger card writes them. */
export function stageFields(d: Document): Record<FieldKey, StageField> {
  return {
    supplier: { label: 'Supplier', value: getSupplier(d.supplierId).shortName },
    date: { label: 'Date', value: dateLong(d.invoiceDate) },
    category: { label: 'Category', value: categoryLabel(d.category) },
    net: { label: 'Net', value: gbp(d.net) },
    vat: { label: vatLabel(d), value: gbp(d.vat) },
    gross: { label: 'Total', value: gbp(d.gross) },
  };
}

/** "Speedy Hire invoice", "Screwfix receipt". */
export function docTitle(d: Document): string {
  return `${getSupplier(d.supplierId).shortName} ${d.layout}`;
}

