import type { Metadata } from 'next';
import { DocumentsView } from '@/components/views/DocumentsView';

export const metadata: Metadata = { title: 'All documents' };

export default function Page() {
  return <DocumentsView />;
}
