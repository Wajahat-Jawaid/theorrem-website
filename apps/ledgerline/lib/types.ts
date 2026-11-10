/** One business: Mercer Construction Ltd, seen by its owner. */

export interface Person {
  name: string;
  firstName: string;
  initials: string;
  role: string;
  email: string;
}

export interface Business {
  name: string;
  shortName: string;
  address: string;
  vatNumber: string;
  owner: Person;
  accounts: 'Xero';
}

/** The seven categories a document can be sorted into. Codes stay in data for the HMRC boxes, never in the UI. */
export type CategoryCode = '310' | '320' | '325' | '433' | '449' | '453' | '489';

export interface Category {
  code: CategoryCode;
  /** The accounting name, kept for Xero. */
  name: string;
  /** The plain label shown to the owner. */
  label: string;
}

export type VatCode = 'S20' | 'Z0' | 'EX' | 'RC';

export interface CatalogueItem {
  description: string;
  unit: string;
  min: number;
  max: number;
  maxQty: number;
  kind?: 'labour' | 'materials';
}

export type DocLayout = 'invoice' | 'receipt';
export type PaymentTerms = 'EOM30' | 'NET30' | 'NET14' | 'NET7' | 'PAID' | 'DD';

export interface Supplier {
  id: string;
  name: string;
  tradingName: string;
  shortName: string;
  vatNumber: string | null;
  companyNumber: string;
  address: string[];
  registeredOffice: string;
  email: string;
  phone: string;
  defaultCategory: CategoryCode;
  defaultVat: VatCode;
  terms: PaymentTerms;
  invoicePrefix: string;
  layout: DocLayout;
  catalogue: CatalogueItem[];
}

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  net: number;
  vatCode: VatCode;
}

/**
 * done: added to Xero. needs_ok: waiting on the owner. skipped: a duplicate
 * we did not add. on_hold: taken out of the queue while we ask the supplier.
 */
export type DocStatus = 'done' | 'needs_ok' | 'skipped' | 'on_hold';

export interface Document {
  id: string;
  supplierId: string;
  layout: DocLayout;
  sheetTitle: string;
  sheetNotes: string[];
  pageCount: number;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string | null;
  accountNumber: string | null;
  purchaseOrder: string | null;
  deliverySite: string | null;
  supplierVat: string | null;
  receivedAt: string;
  /** When it was added to Xero; null until then. */
  addedAt: string | null;
  net: number;
  vat: number;
  gross: number;
  vatCode: VatCode;
  category: CategoryCode | null;
  lineItems: LineItem[];
  status: DocStatus;
  /** True once the owner approved it from Needs your OK. */
  approvedByYou: boolean;
  duplicateOf: string | null;
  /**
   * month: one of the 312 documents already counted in the month counters in
   * constants. session: arrived while the app is open, so it adds to them.
   * Spending sorted adds the gross of session documents and of anything the
   * owner approves, since neither is in the month's figure yet.
   */
  origin: 'month' | 'session';
}

/** The six values we read and show beside the invoice. */
export type ReadField = 'supplier' | 'invoiceNumber' | 'invoiceDate' | 'net' | 'vat' | 'gross';

export type ReviewAction = { type: 'category'; code: CategoryCode } | { type: 'confirm' } | { type: 'hold' };

/** A part of the invoice sheet the agent points at when it explains a question. */
export type EvidenceRegion = 'supplier' | 'lines' | 'deliverTo' | 'order' | 'total';

/** One "why I'm asking" line, tied to the part of the invoice it is about. */
export interface Evidence {
  region: EvidenceRegion;
  text: string;
}

export interface ReviewChoice {
  id: string;
  label: string;
  detail: string | null;
  action: ReviewAction;
}

export interface ReviewItem {
  docId: string;
  /** Position in the queue. */
  order: number;
  question: string;
  hint: string | null;
  /** One short line for the Overview card. */
  reason: string;
  /** Previous purchases from this supplier. */
  timesBought: number;
  /** The agent's leaning, in one line, worked out from the evidence below. */
  lean: string;
  evidence: Evidence[];
  choices: ReviewChoice[];
}

export interface MissingItem {
  id: string;
  date: string | null;
  description: string;
  amount: number | null;
}

export interface ReminderEmail {
  toName: string;
  toAddress: string;
  subject: string;
  lines: string[];
}

/** A supplier's reply that brought the missing document back, matched to its bank line. */
export interface ReminderReply {
  at: string;
  net: number;
  vat: number;
  gross: number;
}

export interface Reminder {
  id: string;
  sentTo: string;
  /** What is missing, one line. */
  missing: string;
  /** What is missing, in two or three words: "4 receipts", "Invoice". */
  missingShort: string;
  /** Used in the feed: "Sent a reminder to Jamie Cole for 4 fuel receipts". */
  feedName: string;
  feedFor: string;
  items: MissingItem[];
  stage: number;
  of: number;
  lastSentAt: string;
  nextOn: string | null;
  email: ReminderEmail;
  status: 'open' | 'sorted';
  documentId: string | null;
  /** Set when the reply came in while the app was open. */
  reply: ReminderReply | null;
}

export type FeedKind = 'added' | 'skipped' | 'reminder' | 'asked' | 'on_hold';

export interface FeedEntry {
  id: string;
  at: string;
  kind: FeedKind;
  text: string;
  detail: string | null;
}

export interface VatBoxes {
  b1: number;
  b2: number;
  b4: number;
  b6: number;
  b7: number;
  b8: number;
  b9: number;
}

export interface VatReturn {
  periodStart: string;
  periodEnd: string;
  dueDate: string;
  boxes: VatBoxes;
  documentsIn: number;
  documentsExpected: number;
}
