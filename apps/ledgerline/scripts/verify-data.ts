import { documents } from '../lib/data/documents';
import { processingArrivals } from '../lib/data/arrivals';
import { reminders } from '../lib/data/reminders';
import { vatReturn } from '../lib/data/vat';
import { feed } from '../lib/data/activity';

/**
 * Loads every data module, which runs the arithmetic assertions (net + VAT =
 * total on every record, line items sum to net, the status mix, the See it
 * work total, the fuel receipts and the VAT return), then prints a summary.
 */
const pence = (v: number): number => Math.round(v * 100);
const byStatus = new Map<string, number>();
for (const d of documents) byStatus.set(d.status, (byStatus.get(d.status) ?? 0) + 1);
const visible = documents.filter((d) => d.status === 'done').reduce((s, d) => s + pence(d.gross), 0);
const run = processingArrivals.filter((d) => d.status === 'done').reduce((s, d) => s + pence(d.gross), 0);

process.stdout.write(
  [
    `documents ${documents.length}: ${[...byStatus].map(([k, v]) => `${k}=${v}`).join(' ')}`,
    `done records add up to ${(visible / 100).toFixed(2)}`,
    `see it work: ${processingArrivals.length} documents, ${(run / 100).toFixed(2)} added`,
    `reminders ${reminders.length}, feed ${feed.length}`,
    `vat to pay ${((pence(vatReturn.boxes.b1) - pence(vatReturn.boxes.b4)) / 100).toFixed(2)}`,
    'all checks passed',
    '',
  ].join('\n'),
);
