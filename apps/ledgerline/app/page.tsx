import type { Metadata } from 'next';
import { LiveDemo } from '@/components/live/LiveDemo';

export const metadata: Metadata = { title: { absolute: 'Ledgerline · Your paperwork, done' } };

export default function Home() {
  return <LiveDemo />;
}
