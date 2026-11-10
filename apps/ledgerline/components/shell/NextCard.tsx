import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface NextCardProps {
  href: string;
  /** The next beat, as the presenter would say it. */
  title: string;
  /** Omitted on the card that loops back to the start. */
  eyebrow?: string | null;
}

/** Every page ends with one of these: the presenter can walk the whole story by clicking only them. */
export function NextCard({ href, title, eyebrow = 'Next' }: NextCardProps) {
  return (
    <Link
      href={href}
      className="card group mt-10 flex items-center justify-between gap-6 p-5 transition-colors duration-micro ease-out hover:border-white/[0.12] hover:bg-ink-800"
    >
      <span className="min-w-0">
        {eyebrow ? <span className="eyebrow block">{eyebrow}</span> : null}
        <span className="mt-0.5 block text-h3 text-hi">{title}</span>
      </span>
      <span
        aria-hidden
        className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 text-hi transition-transform duration-small ease-out-expo group-hover:translate-x-1"
      >
        <ArrowRight size={18} strokeWidth={1.75} />
      </span>
    </Link>
  );
}
