import type { Document, FeedEntry, Reminder } from '../types';
import { supplier } from './suppliers';
import { categoryLabel } from './categories';
import { documents, ANCHOR_IDS } from './documents';
import { REVIEW_IDS, reviewItemFor } from './reviewItems';
import { reminders, REMINDER_IDS } from './reminders';
import { dayMonth, gbp } from '../format';

/**
 * Sentences for the Overview feed, written from the records themselves so the
 * feed can never disagree with another screen.
 */

const article = (word: string): string => (/^[AEIOU]/i.test(word) ? 'an' : 'a');

/** "a Screwfix receipt", "an EE invoice". */
export function docNoun(d: Document): string {
  const name = supplier(d.supplierId).shortName;
  return `${article(name)} ${name} ${d.layout}`;
}

export function addedEntry(d: Document, at: string, id = `feed_added_${d.id}`): FeedEntry {
  return { id, at, kind: 'added', text: `Added ${docNoun(d)}, ${gbp(d.gross)}, to Xero`, detail: categoryLabel(d.category) };
}

export function skippedEntry(d: Document, original: Document, at: string, id = `feed_skipped_${d.id}`): FeedEntry {
  return { id, at, kind: 'skipped', text: `Skipped ${docNoun(d)} you'd already sent on ${dayMonth(original.receivedAt)}`, detail: null };
}

export function reminderEntry(r: Reminder, at: string, id = `feed_reminder_${r.id}_${at}`): FeedEntry {
  return { id, at, kind: 'reminder', text: `Sent a reminder to ${r.feedName} for ${r.feedFor}`, detail: null };
}

export function askedEntry(d: Document, at: string, id = `feed_asked_${d.id}`): FeedEntry {
  return { id, at, kind: 'asked', text: `Sent you ${docNoun(d)} to check`, detail: reviewItemFor(d.id)?.reason ?? null };
}

export function onHoldEntry(d: Document, at: string, id = `feed_on_hold_${d.id}`): FeedEntry {
  return { id, at, kind: 'on_hold', text: `Put ${docNoun(d)} on hold and asked ${supplier(d.supplierId).shortName} about it`, detail: null };
}

const doc = (id: string): Document => {
  const found = documents.find((d) => d.id === id);
  if (!found) throw new Error(`Feed points at a missing document ${id}`);
  return found;
};

const fuel = reminders.find((r) => r.id === REMINDER_IDS.fuel)!;

/** What we did today, newest first. */
export const feed: FeedEntry[] = [
  addedEntry(doc(ANCHOR_IDS.screwfixToday), doc(ANCHOR_IDS.screwfixToday).addedAt!),
  skippedEntry(doc(ANCHOR_IDS.jewsonDuplicate), doc(ANCHOR_IDS.jewsonOriginal), doc(ANCHOR_IDS.jewsonDuplicate).receivedAt),
  addedEntry(doc(ANCHOR_IDS.btToday), doc(ANCHOR_IDS.btToday).addedAt!),
  askedEntry(doc(REVIEW_IDS.varney), doc(REVIEW_IDS.varney).receivedAt),
  reminderEntry(fuel, fuel.lastSentAt, 'feed_reminder_fuel'),
  addedEntry(doc(ANCHOR_IDS.speedyToday), doc(ANCHOR_IDS.speedyToday).addedAt!),
].sort((a, b) => b.at.localeCompare(a.at));
