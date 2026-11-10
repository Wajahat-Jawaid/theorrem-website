import type { Metadata } from 'next';
import { VatView } from '@/components/views/VatView';

export const metadata: Metadata = { title: 'VAT' };

export default function Page() {
  return <VatView />;
}
