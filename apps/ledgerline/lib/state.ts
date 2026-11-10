import type { CategoryCode, Document, FeedEntry, ReadField, Reminder } from './types';
import { documents as seedDocuments } from './data/documents';
import { reminders as seedReminders, LIVE_REPLY } from './data/reminders';
import { feed as seedFeed, addedEntry, onHoldEntry, reminderEntry } from './data/activity';
import { supplier as getSupplier } from './data/suppliers';
import { SIGN_OFF } from './data/business';
import { workingDayAfter } from './data/builder';
import { REMINDER_LIMIT } from './constants';
import { gbp } from './format';
import { amountsCheck, replyFigures } from './derive';

export type ToastKind = 'success' | 'info' | 'warning';
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

export interface AppState {
  documents: Document[];
  reminders: Reminder[];
  feed: FeedEntry[];
  /** Values the owner changed on Needs your OK, as typed. */
  edits: Record<string, Partial<Record<ReadField, string>>>;
  /** Reminders sent from this screen since the page loaded. */
  remindersSentNow: number;
  /** When the VAT return was sent to Xero for filing. */
  vatSentAt: string | null;
  toasts: Toast[];
  toastSeq: number;
}

export function initialState(): AppState {
  return {
    documents: seedDocuments,
    reminders: seedReminders,
    feed: seedFeed,
    edits: {},
    remindersSentNow: 0,
    vatSentAt: null,
    toasts: [],
    toastSeq: 0,
  };
}

export type Action =
  | { type: 'approve'; id: string; at: string; category: CategoryCode | null }
  | { type: 'hold'; id: string; at: string }
  | { type: 'request_copy'; id: string; at: string }
  | { type: 'edit_field'; id: string; field: ReadField; value: string }
  | { type: 'reminder_send'; id: string; at: string }
  | { type: 'reminder_reply'; id: string; at: string }
  /** Puts every seed reminder back as it was this morning, so the chase can be shown again. */
  | { type: 'chase_reset' }
  | { type: 'vat_send'; at: string }
  /** Everything back to the moment the page loaded. */
  | { type: 'reset' }
  | { type: 'toast'; kind: ToastKind; title: string; body?: string }
  | { type: 'toast_dismiss'; id: number };

function pushToast(state: AppState, kind: ToastKind, title: string, body?: string): AppState {
  const id = state.toastSeq + 1;
  return { ...state, toastSeq: id, toasts: [...state.toasts.slice(-2), { id, kind, title, body }] };
}

function withFeed(state: AppState, entries: FeedEntry[]): AppState {
  return { ...state, feed: [...entries, ...state.feed].sort((a, b) => b.at.localeCompare(a.at)) };
}

/** Takes a document out of the queue and starts a reminder to its supplier. */
function holdWithReminder(state: AppState, id: string, at: string, kind: 'confirm' | 'copy'): AppState {
  const d = state.documents.find((x) => x.id === id);
  if (!d || d.status !== 'needs_ok') return state;
  const s = getSupplier(d.supplierId);
  const team = `${s.shortName} accounts team`;
  const reminder: Reminder =
    kind === 'confirm'
      ? {
          id: `rem_hold_${d.id}`,
          sentTo: team,
          missing: `Confirmation of invoice ${d.invoiceNumber} for ${gbp(d.gross)}`,
          missingShort: 'Confirmation',
          feedName: s.shortName,
          feedFor: `invoice ${d.invoiceNumber}`,
          items: [{ id: `${d.id}_confirm`, date: d.invoiceDate, description: `${s.shortName} invoice ${d.invoiceNumber}`, amount: d.gross }],
          stage: 1,
          of: REMINDER_LIMIT,
          lastSentAt: at,
          nextOn: workingDayAfter(at.slice(0, 10), 3),
          email: {
            toName: team,
            toAddress: s.email,
            subject: `Invoice ${d.invoiceNumber} for ${gbp(d.gross)}`,
            lines: ['Hello,', `We've received invoice ${d.invoiceNumber} for ${gbp(d.gross)}.`, 'Could you confirm what it covers before we pay it?', SIGN_OFF],
          },
          status: 'open',
          documentId: d.id,
          reply: null,
        }
      : {
          id: `rem_copy_${d.id}`,
          sentTo: team,
          missing: `A clearer copy of invoice ${d.invoiceNumber}`,
          missingShort: 'Clearer copy',
          feedName: s.shortName,
          feedFor: `a clearer copy of ${d.invoiceNumber}`,
          items: [{ id: `${d.id}_copy`, date: d.invoiceDate, description: `${s.shortName} invoice ${d.invoiceNumber}`, amount: d.gross }],
          stage: 1,
          of: REMINDER_LIMIT,
          lastSentAt: at,
          nextOn: workingDayAfter(at.slice(0, 10), 3),
          email: {
            toName: team,
            toAddress: s.email,
            subject: `A clearer copy of invoice ${d.invoiceNumber}`,
            lines: ['Hello,', `Could you send a clearer copy of invoice ${d.invoiceNumber}?`, 'The original PDF is ideal. Just reply to this email.', SIGN_OFF],
          },
          status: 'open',
          documentId: d.id,
          reply: null,
        };
  const documents = state.documents.map((x) => (x.id === id ? { ...x, status: 'on_hold' as const } : x));
  const reminders = [...state.reminders.filter((r) => r.id !== reminder.id), reminder];
  const entries = kind === 'confirm' ? [onHoldEntry(d, at)] : [reminderEntry(reminder, at)];
  return withFeed({ ...state, documents, reminders }, entries);
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'approve': {
      const d = state.documents.find((x) => x.id === action.id);
      if (!d || d.status !== 'needs_ok') return state;
      const check = amountsCheck(d, state.edits[d.id]);
      if (!check.ok) return state;
      const category = action.category ?? d.category;
      if (!category) return state;
      const approved: Document = {
        ...d,
        status: 'done',
        approvedByYou: true,
        addedAt: action.at,
        category,
        net: check.net,
        vat: check.vat,
        gross: check.gross,
      };
      const documents = state.documents.map((x) => (x.id === d.id ? approved : x));
      return withFeed({ ...state, documents }, [addedEntry(approved, action.at, `feed_added_${d.id}_${action.at}`)]);
    }
    case 'hold':
      return holdWithReminder(state, action.id, action.at, 'confirm');
    case 'request_copy':
      return holdWithReminder(state, action.id, action.at, 'copy');
    case 'edit_field':
      return { ...state, edits: { ...state.edits, [action.id]: { ...state.edits[action.id], [action.field]: action.value } } };
    case 'reminder_send': {
      const r = state.reminders.find((x) => x.id === action.id);
      if (!r || r.status !== 'open' || r.stage >= r.of) return state;
      const stage = r.stage + 1;
      const updated: Reminder = { ...r, stage, lastSentAt: action.at, nextOn: stage >= r.of ? null : workingDayAfter(action.at.slice(0, 10), 3) };
      return withFeed(
        { ...state, reminders: state.reminders.map((x) => (x.id === r.id ? updated : x)), remindersSentNow: state.remindersSentNow + 1 },
        [reminderEntry(updated, action.at)],
      );
    }
    case 'reminder_reply': {
      const r = state.reminders.find((x) => x.id === action.id);
      if (!r || r.status !== 'open' || r.id !== LIVE_REPLY.reminderId) return state;
      const gross = r.items.reduce((sum, item) => sum + (item.amount ?? 0), 0);
      const reply = { at: action.at, ...replyFigures(gross, LIVE_REPLY.vatRate) };
      const updated: Reminder = { ...r, status: 'sorted', nextOn: null, reply };
      const entry: FeedEntry = {
        id: `feed_reply_${r.id}_${action.at}`,
        at: action.at,
        kind: 'added',
        text: `${r.feedName} sent ${r.feedFor}, matched to the bank line`,
        detail: `VAT ${gbp(reply.vat)}`,
      };
      return withFeed({ ...state, reminders: state.reminders.map((x) => (x.id === r.id ? updated : x)) }, [entry]);
    }
    case 'chase_reset': {
      const seed = new Map(seedReminders.map((r) => [r.id, r]));
      return { ...state, reminders: state.reminders.map((r) => seed.get(r.id) ?? r), remindersSentNow: 0 };
    }
    case 'vat_send':
      return state.vatSentAt ? state : { ...state, vatSentAt: action.at };
    case 'reset':
      return initialState();
    case 'toast':
      return pushToast(state, action.kind, action.title, action.body);
    case 'toast_dismiss':
      return { ...state, toasts: state.toasts.filter((x) => x.id !== action.id) };
    default:
      return state;
  }
}
