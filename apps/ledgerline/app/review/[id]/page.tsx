import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ReviewView } from '@/components/views/ReviewView';
import { reviewDocs } from '@/lib/data/reviewItems';
import { supplier } from '@/lib/data/suppliers';

/** Only the documents that ever need your OK have a page here; any other id is a 404. */
export const dynamicParams = false;

export function generateStaticParams(): { id: string }[] {
  return reviewDocs.map((d) => ({ id: d.id }));
}

export function generateMetadata({ params }: { params: { id: string } }): Metadata {
  const d = reviewDocs.find((x) => x.id === params.id);
  return { title: d ? `${supplier(d.supplierId).shortName} ${d.layout}` : 'Needs your OK' };
}

export default function Page({ params }: { params: { id: string } }) {
  if (!reviewDocs.some((d) => d.id === params.id)) notFound();
  return <ReviewView id={params.id} />;
}
