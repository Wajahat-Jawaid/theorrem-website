'use client';

import Link from 'next/link';
import { RotateCcw } from 'lucide-react';
import { FINAL_MODEL } from '@/lib/live/model';
import { Dashboard, MonthEmail, TimeBar } from '@/components/dashboard/Dashboard';

/**
 * /dashboard: the same dashboard the live demo fills, at full size, showing
 * the finished month it ends on.
 */
export function DashboardView() {
  return (
    <div className="pt-8">
      <Dashboard
        model={FINAL_MODEL}
        mode="page"
        actions={
          <Link
            href="/"
            className="inline-flex h-9 items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 text-small font-medium text-hi transition-colors duration-micro hover:bg-white/[0.1]"
          >
            <RotateCcw size={15} strokeWidth={2} aria-hidden />
            Watch the demo again
          </Link>
        }
      />
      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <MonthEmail model={FINAL_MODEL} />
        <div className="flex flex-col gap-2">
          <TimeBar shrink={1} showMinutes showCut />
          <p className="px-1 text-[12px] text-lo">Example month. Time on paperwork, before and with Ledgerline.</p>
        </div>
      </div>
    </div>
  );
}
