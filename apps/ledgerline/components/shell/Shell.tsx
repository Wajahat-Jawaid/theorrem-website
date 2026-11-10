'use client';

import type { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { MotionConfig } from 'framer-motion';
import { cn } from '@/lib/cn';
import { screenFor } from '@/lib/demo-store';
import { ToastStack } from '@/components/ui/Toast';
import { AuroraBackground, Grain } from './Atmosphere';
import { Header } from './Header';
import { Presenter } from './Presenter';

/**
 * The dark stage, the glass nav, the page body and the presenter layer.
 * MotionConfig honours the OS "Reduce motion" setting for every transform.
 * The live demo at / is one fixed screen with no nav or presenter controls.
 */
export function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const demo = pathname === '/';
  const focus = screenFor(pathname) === 'review';
  return (
    <MotionConfig reducedMotion="user">
      <AuroraBackground dim={focus} />
      <div className={cn('relative z-stage', demo ? 'lg:h-[100svh] lg:overflow-hidden' : 'min-h-screen')}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-tooltip focus:rounded-8 focus:bg-ink-800 focus:px-4 focus:py-2 focus:text-small focus:font-semibold focus:text-hi"
        >
          Skip to content
        </a>
        {demo ? null : <Header />}
        <main id="main" tabIndex={-1} className={cn('outline-none', demo ? 'w-full' : 'mx-auto max-w-content px-6 pb-24 lg:px-10')}>
          {children}
        </main>
      </div>
      {demo ? null : <Presenter />}
      <ToastStack />
      <Grain />
    </MotionConfig>
  );
}
