/**
 * "Today" for the whole application. Every relative date, countdown and
 * period boundary is derived from this one value.
 */
export const TODAY_ISO = '2026-10-21T09:42:00+01:00';
export const TODAY = new Date(TODAY_ISO);
export const TODAY_DATE = '2026-10-21';
export const TODAY_MS = TODAY.getTime();

export const MONTH_START = '2026-10-01';
export const MONTH_LABEL = 'October';

/**
 * October to date, as counted at TODAY. The documents in lib/data are a
 * consistent subset of these: the latest 60 of the 312.
 */
export const MONTH = {
  /** Every document received this month. */
  documentsReceived: 312,
  /** Spending on the documents already added to Xero this month. */
  spendingSorted: 184_920.4,
  /** Reminders we sent this month, and the documents they brought back. */
  remindersSent: 14,
  documentsBack: 12,
} as const;

/** Keying and filing time each document would take by hand: the full bar on the Overview work meter. */
export const MINUTES_PER_DOCUMENT = 3.2;

/** Time the owner spends on one approval. */
export const MINUTES_PER_APPROVAL = 2;

/** Time the owner spends reading the month's summary. With the approvals, this is all that is left to do. */
export const MINUTES_READING_SUMMARY = 48;

/** Anything over this is checked with the owner before it goes to Xero. */
export const CHECK_LIMIT = 5000;

/** Reminders go out at most three times. */
export const REMINDER_LIMIT = 3;

/** A supplier's reply lands this long after the reminders go. */
export const REPLY_DELAY_MS = 2_500;
