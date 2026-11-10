'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import NumberFlow from '@number-flow/react';
import { cn } from '@/lib/cn';
import { useAppData } from '@/lib/store';
import { useDemo } from '@/lib/demo-store';
import { SPRING } from '@/lib/motion';
import { Wordmark } from './Logo';

interface NavItem {
  href: string;
  label: string;
  match: string;
  badge?: { count: number; tone: 'ok' | 'missing'; noun: string };
}

/** Glass, 56px, the four beats of the walk-through in order, then the Xero stack and the business. */
export function Header() {
  const pathname = usePathname();
  const { counts } = useAppData();
  const { business } = useDemo();
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);

  const items: NavItem[] = [
    { href: '/dashboard', label: 'Overview', match: '/dashboard' },
    { href: '/review', label: 'Needs your OK', match: '/review', badge: { count: counts.needsOk, tone: 'ok', noun: 'waiting' } },
    { href: '/paperwork', label: 'Missing paperwork', match: '/paperwork', badge: { count: counts.missing, tone: 'missing', noun: 'missing' } },
    { href: '/vat', label: 'VAT', match: '/vat' },
  ];
  return (
    <header className="sticky top-0 z-header border-b border-white/[0.06] bg-ink-900/70 backdrop-blur-md">
      <div className="mx-auto flex h-nav max-w-content items-center gap-5 px-6 lg:px-10 xl:gap-8">
        <Link href="/dashboard" aria-label="Ledgerline overview" className="shrink-0 rounded-6">
          <Wordmark />
        </Link>
        <nav aria-label="Main" className="min-w-0 overflow-x-auto">
          <ul className="flex items-center gap-0.5">
            {items.map((item) => {
              const active = pathname === item.match || pathname.startsWith(`${item.match}/`);
              const badge = item.badge;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'inline-flex h-8 items-center gap-2 whitespace-nowrap rounded-full px-3 text-small font-medium transition-colors duration-micro ease-out',
                      active ? 'bg-white/[0.08] text-hi' : 'text-mid hover:text-hi',
                    )}
                  >
                    {item.label}
                    <AnimatePresence initial={false}>
                      {badge && badge.count > 0 ? (
                        <motion.span
                          key="badge"
                          initial={{ opacity: 0, scale: 0.6 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={SPRING.snap}
                          className={cn(
                            'tnum inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[12px] font-semibold leading-none',
                            badge.tone === 'ok' ? 'bg-amber/15 text-amber' : 'bg-alert/15 text-alert',
                          )}
                        >
                          <span className="sr-only">, </span>
                          <NumberFlow value={badge.count} />
                          <span className="sr-only"> {badge.noun}</span>
                        </motion.span>
                      ) : null}
                    </AnimatePresence>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex shrink-0 items-center gap-4">
          <XeroStack />
          <span className={cn('flex items-center gap-3 transition-opacity duration-small', ready ? 'opacity-100' : 'opacity-0')}>
            <span
              aria-hidden
              title={`${business.ownerName}, ${business.name}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-ink-800 text-[12px] font-semibold text-hi"
            >
              {business.initials}
            </span>
            <span className="hidden text-small font-medium text-mid 2xl:inline">{business.name}</span>
            <span className="sr-only 2xl:hidden">{business.name}</span>
          </span>
        </div>
      </div>
    </header>
  );
}

/** Where approved documents land. Glows once each time one arrives. */
function XeroStack() {
  const { xeroPulse } = useDemo();
  return (
    <span id="xero-target" className="relative inline-flex h-8 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] pl-2 pr-3 text-small font-medium text-hi">
      <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden className="shrink-0">
        <rect x="5" y="2.5" width="9" height="11" rx="1" fill="#FBFAF6" opacity="0.35" />
        <rect x="3.5" y="4" width="9" height="11" rx="1" fill="#FBFAF6" opacity="0.6" />
        <rect x="2" y="5.5" width="9" height="11" rx="1" fill="#FBFAF6" />
      </svg>
      Xero
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-signal" />
      <span className="sr-only">, connected</span>
      {xeroPulse > 0 ? (
        <motion.span
          key={xeroPulse}
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-full"
          style={{ boxShadow: '0 0 0 1px rgba(75,227,160,0.9), 0 0 24px rgba(75,227,160,0.45)' }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      ) : null}
    </span>
  );
}
