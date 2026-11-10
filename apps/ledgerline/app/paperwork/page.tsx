import type { Metadata } from 'next';
import { PaperworkView } from '@/components/views/PaperworkView';

export const metadata: Metadata = { title: 'Missing paperwork' };

export default function Page() {
  return <PaperworkView />;
}
