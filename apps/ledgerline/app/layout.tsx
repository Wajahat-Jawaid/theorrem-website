import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque } from 'next/font/google';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { AppDataProvider } from '@/lib/store';
import { DemoProvider } from '@/lib/demo-store';
import { Shell } from '@/components/shell/Shell';
import './globals.css';

// Display face; the optical-size axis tightens it at headline sizes.
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  axes: ['opsz'],
  variable: '--font-display',
  display: 'swap',
});

const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : 'http://localhost:3000';
const DESCRIPTION = 'Watch a month of receipts, invoices and bank lines from email, WhatsApp and the post sort themselves out, ready for your VAT return.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: 'Ledgerline · Your paperwork, done', template: '%s · Ledgerline' },
  description: DESCRIPTION,
  applicationName: 'Ledgerline',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    type: 'website',
    siteName: 'Ledgerline',
    title: 'Ledgerline · Your paperwork, done',
    description: DESCRIPTION,
    images: [{ url: '/og.jpg', width: 1200, height: 630, alt: 'The Ledgerline dashboard with October done: VAT return ready to file, accountant email ready to send.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ledgerline · Your paperwork, done',
    description: DESCRIPTION,
    images: ['/og.jpg'],
  },
};

export const viewport: Viewport = {
  themeColor: '#050B09',
  colorScheme: 'dark',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-GB" className={cn(display.variable, GeistSans.variable, GeistMono.variable)}>
      <body suppressHydrationWarning className="bg-ink-950 font-sans text-body text-hi antialiased">
        <AppDataProvider>
          <DemoProvider>
            <Shell>{children}</Shell>
          </DemoProvider>
        </AppDataProvider>
      </body>
    </html>
  );
}
