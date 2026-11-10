import Link from 'next/link';
import { FileSearch } from 'lucide-react';
import { IconTile } from '@/components/ui/IconTile';

export const metadata = { title: 'Page not found' };

export default function NotFound() {
  return (
    <div className="flex justify-center py-24">
      <div className="card w-full max-w-modal p-10 text-center">
        <div className="flex justify-center">
          <IconTile icon={FileSearch} />
        </div>
        <h1 className="mt-6 font-display text-h2 text-hi">We can&apos;t find that page</h1>
        <p className="mx-auto mt-2 max-w-prose text-body text-mid">The link may be old. Everything is on your overview.</p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-12 items-center rounded-12 bg-brass px-6 text-body font-semibold text-ink-950 shadow-brass transition-colors duration-micro ease-out hover:bg-[#EAC36E]"
          >
            Back to overview
          </Link>
          <Link
            href="/documents"
            className="inline-flex h-10 items-center self-center rounded-8 border border-white/10 bg-white/[0.04] px-4 text-small font-semibold text-hi transition-colors duration-micro ease-out hover:bg-white/[0.08]"
          >
            All documents
          </Link>
        </div>
      </div>
    </div>
  );
}
