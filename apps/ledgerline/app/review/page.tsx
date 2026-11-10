import type { Metadata } from 'next';
import { ReviewIndex } from '@/components/views/ReviewView';

export const metadata: Metadata = { title: 'Needs your OK' };

export default function Page() {
  return <ReviewIndex />;
}
