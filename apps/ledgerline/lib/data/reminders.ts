import type { Reminder } from '../types';
import { bst } from './builder';
import { SIGN_OFF, siteManager } from './business';
import { supplier } from './suppliers';
import { REMINDER_LIMIT } from '../constants';
import { VAT_RATE } from './categories';
import { assertReminders } from './validate';

/** The three pieces of paperwork we are chasing for Mercer Construction. */

const howdens = supplier('howdens');
const okafor = supplier('okafor-groundworks');

export const REMINDER_IDS = {
  fuel: 'rem_fuel_receipts',
  howdensCard: 'rem_howdens_card',
  okafor: 'rem_okafor_utr',
} as const;

export const reminders: Reminder[] = [
  {
    id: REMINDER_IDS.fuel,
    sentTo: `${siteManager.name}, ${siteManager.role}`,
    missing: '4 fuel receipts from the company fuel card, £312.40 total',
    missingShort: '4 receipts',
    feedName: siteManager.name,
    feedFor: '4 fuel receipts',
    items: [
      { id: 'fuel_1', date: '2026-10-02', description: 'Shell, Barking', amount: 78.4 },
      { id: 'fuel_2', date: '2026-10-07', description: 'BP, Rainham', amount: 81.15 },
      { id: 'fuel_3', date: '2026-10-11', description: 'Shell, Dagenham', amount: 74.6 },
      { id: 'fuel_4', date: '2026-10-15', description: 'BP, Ilford Lane', amount: 78.25 },
    ],
    stage: 2,
    of: REMINDER_LIMIT,
    lastSentAt: bst('2026-10-21', 8, 20),
    nextOn: '2026-10-23',
    email: {
      toName: siteManager.name,
      toAddress: siteManager.email,
      subject: '4 fuel receipts from the company card',
      lines: [
        `Hi ${siteManager.firstName},`,
        "We're missing 4 fuel receipts from the company card, £312.40 in total.",
        'A photo of each receipt is fine. Just reply to this email.',
        SIGN_OFF,
      ],
    },
    status: 'open',
    documentId: null,
    reply: null,
  },
  {
    id: REMINDER_IDS.howdensCard,
    sentTo: 'Howdens Joinery accounts team',
    missing: 'Invoice for a £4,180.00 card payment on 3 Oct',
    missingShort: 'Invoice',
    feedName: 'Howdens',
    feedFor: 'a card payment invoice',
    items: [{ id: 'howdens_1', date: '2026-10-03', description: 'Howdens Joinery, card payment', amount: 4180 }],
    stage: 1,
    of: REMINDER_LIMIT,
    lastSentAt: bst('2026-10-20', 14, 5),
    nextOn: '2026-10-26',
    email: {
      toName: 'Howdens Joinery accounts team',
      toAddress: howdens.email,
      subject: 'Invoice for our card payment on 3 Oct',
      lines: [
        'Hello,',
        'We paid £4,180.00 by card on 3 Oct but have no invoice for it.',
        'Could you email a copy of the invoice to this address?',
        SIGN_OFF,
      ],
    },
    status: 'open',
    documentId: null,
    reply: null,
  },
  {
    id: REMINDER_IDS.okafor,
    sentTo: okafor.name,
    missing: 'Tax reference (UTR) needed before we can pay them correctly',
    missingShort: 'Tax reference',
    feedName: okafor.shortName,
    feedFor: 'their tax reference',
    items: [{ id: 'okafor_1', date: null, description: 'Their 10-digit tax reference (UTR)', amount: null }],
    stage: 2,
    of: REMINDER_LIMIT,
    lastSentAt: bst('2026-10-17', 10, 15),
    nextOn: '2026-10-22',
    email: {
      toName: okafor.name,
      toAddress: okafor.email,
      subject: 'Your tax reference (UTR)',
      lines: [
        'Hello,',
        'We need your 10-digit tax reference (UTR) so we can pay you correctly.',
        "It's on letters from HMRC, or in your HMRC online account.",
        SIGN_OFF,
      ],
    },
    status: 'open',
    documentId: null,
    reply: null,
  },
];

assertReminders(reminders);

/**
 * The one reply that lands while you watch the Missing paperwork screen:
 * Howdens send the invoice for the 3 Oct card payment, at their usual VAT rate.
 */
export const LIVE_REPLY = {
  reminderId: REMINDER_IDS.howdensCard,
  from: 'Howdens Joinery accounts team',
  name: howdens.name,
  vatRate: VAT_RATE[howdens.defaultVat],
} as const;
