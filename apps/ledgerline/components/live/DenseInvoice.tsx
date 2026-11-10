import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { HAND } from './paper';

/**
 * A real trade invoice: small print, codes, two addresses, nine lines, bank
 * details and terms. First drawn for the story page's "Read for you" scene.
 * The four values we read carry data-field, and each has a mint glow
 * (data-mark) that the scan turns on as it passes.
 */

export const INVOICE_W = 372;
export const INVOICE_H = 428;

type Field = 'supplier' | 'date' | 'amount' | 'vat';

const LINES: [code: string, what: string, qty: string, unit: string, net: string][] = [
  ['104882', 'C24 TREATED 47X100 4.8M', '24', '12.85', '308.40'],
  ['220913', 'OSB3 BOARD 18MM 2440X1220', '12', '21.60', '259.20'],
  ['310457', 'PLASTERBOARD 12.5MM T/E', '30', '8.95', '268.50'],
  ['418820', 'CEMENT 25KG BAG', '10', '7.45', '74.50'],
  ['418905', 'SHARP SAND BULK BAG', '2', '54.00', '108.00'],
  ['551236', 'WOOD SCREWS 4X40 (200)', '6', '6.80', '40.80'],
  ['602281', 'DPC 450MM X 30M', '2', '18.30', '36.60'],
  ['900010', 'DELIVERY - BEAM PARK', '1', '45.00', '45.00'],
  ['900044', 'PALLET CHARGE', '4', '24.75', '99.00'],
];

function Mark({ k, className, children }: { k: Field; className?: string; children: ReactNode }) {
  return (
    <span data-field={k} className={cn('relative inline-block', className)}>
      <span
        aria-hidden
        data-mark={k}
        className="absolute -inset-x-[4px] -inset-y-[2px] rounded-4 bg-signal/25 opacity-0 ring-[1.5px] ring-signal transition-opacity duration-200"
        style={{ boxShadow: '0 0 16px rgba(75,227,160,0.55)' }}
      />
      <span className="relative">{children}</span>
    </span>
  );
}

export function DenseInvoice() {
  return (
    <div className="relative h-full px-5 pb-4 pt-5 font-doc text-paper-ink">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-6 w-6 shrink-0 rounded-[3px] bg-[#1F4E8C]" />
            <Mark k="supplier" className="text-[17px] font-bold leading-none tracking-[-0.01em] text-[#1F4E8C]">
              Travis Perkins
            </Mark>
          </div>
          <div className="mt-1 text-[6px] leading-[8px] text-paper-muted">
            Travis Perkins Trading Co Ltd · Lodge Way House, Northampton NN5 7UG
            <br />
            Barking branch: River Road, Barking IG11 0DS · 020 8594 1122
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-[11px] font-bold tracking-[0.1em]">TAX INVOICE</div>
          <table className="ml-auto mt-1 text-[6px] leading-[8.5px]">
            <tbody>
              {[
                ['Invoice no', '6610482'],
                ['Account', 'MER0047'],
                ['Order ref', 'BEAM PK 09'],
              ].map(([a, b]) => (
                <tr key={a}>
                  <td className="pr-2 text-paper-muted">{a}</td>
                  <td className="font-mono">{b}</td>
                </tr>
              ))}
              <tr>
                <td className="pr-2 text-paper-muted">Invoice date</td>
                <td className="font-mono">
                  <Mark k="date" className="text-[7.5px] font-bold">
                    08/10/2026
                  </Mark>
                </td>
              </tr>
              <tr>
                <td className="pr-2 text-paper-muted">Tax point</td>
                <td className="font-mono">08/10/2026</td>
              </tr>
              <tr>
                <td className="pr-2 text-paper-muted">Page</td>
                <td className="font-mono">1 of 1</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 border-t border-paper-rule pt-2 text-[6px] leading-[8px]">
        <div>
          <div className="font-bold uppercase tracking-[0.06em] text-paper-muted">Invoice to</div>
          <div className="font-bold">Mercer Construction Ltd</div>
          <div>Unit 7, Rippleside Commercial Estate</div>
          <div>Barking IG11 0RJ</div>
        </div>
        <div>
          <div className="font-bold uppercase tracking-[0.06em] text-paper-muted">Deliver to</div>
          <div className="font-bold">Plot 9, Beam Park</div>
          <div>New Road, Rainham RM13 8GJ</div>
          <div>Site contact: J. Cole 07700 900418</div>
        </div>
      </div>

      <table className="mt-3 w-full border-collapse text-[6px] leading-[9px]">
        <thead>
          <tr className="border-y border-paper-ink/60 text-left font-bold uppercase tracking-[0.04em]">
            <th className="py-[2px] pr-1">Code</th>
            <th className="py-[2px] pr-1">Description</th>
            <th className="py-[2px] pr-1 text-right">Qty</th>
            <th className="py-[2px] pr-1 text-right">Price</th>
            <th className="py-[2px] text-right">Net</th>
          </tr>
        </thead>
        <tbody className="font-mono">
          {LINES.map(([code, what, qty, unit, net]) => (
            <tr key={code} className="border-b border-paper-rule/80">
              <td className="py-[2px] pr-1 text-paper-muted">{code}</td>
              <td className="py-[2px] pr-1">{what}</td>
              <td className="py-[2px] pr-1 text-right">{qty}</td>
              <td className="py-[2px] pr-1 text-right">{unit}</td>
              <td className="py-[2px] text-right">{net}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="max-w-[150px] text-[5.5px] leading-[7.5px] text-paper-muted">
          Goods remain the property of Travis Perkins Trading Co Ltd until paid in full. Payment due 30 days end of month. Pallets charged unless returned
          within 28 days. Discrepancies must be reported within 48 hours of delivery. E&amp;OE.
        </div>
        <table className="shrink-0 text-[7px] leading-[11px]">
          <tbody>
            <tr>
              <td className="pr-3 text-paper-muted">Goods</td>
              <td className="tnum text-right font-mono">1,240.00</td>
            </tr>
            <tr>
              <td className="pr-3 text-paper-muted">VAT @ 20%</td>
              <td className="tnum text-right font-mono">
                <Mark k="vat" className="text-[8px] font-bold">
                  248.00
                </Mark>
              </td>
            </tr>
            <tr className="border-t border-paper-ink">
              <td className="pr-3 pt-[2px] font-bold">Total due £</td>
              <td className="tnum pt-[2px] text-right font-mono">
                <Mark k="amount" className="text-[9.5px] font-bold">
                  1,488.00
                </Mark>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-3 border-t border-paper-rule pt-1.5 text-[5.5px] leading-[7.5px] text-paper-muted">
        Pay by BACS: Barclays Bank plc · Sort code 20-00-00 · Account 43918265 · Quote 6610482 as reference
        <br />
        VAT reg no GB 408 5561 14 · Registered in England no. 00733503 · Registered office as above
      </div>

      {/* Someone's stamp and pen, as it came off the van's dashboard. */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[120px] top-[214px] -rotate-[14deg] rounded-[3px] border-2 border-[#C0392B]/45 px-1.5 py-0.5 font-sans text-[11px] font-bold tracking-[0.12em] text-[#C0392B]/45"
      >
        RECEIVED 10 OCT
      </span>
      <span aria-hidden className="pointer-events-none absolute bottom-[78px] left-[30px] -rotate-6 text-[13px] text-[#2A3A8C]/80" style={{ fontFamily: HAND }}>
        Beam Pk — check qty!
      </span>
    </div>
  );
}
