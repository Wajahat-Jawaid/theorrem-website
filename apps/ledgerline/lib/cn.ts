import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display',
            'display-sm',
            'h1',
            'h1-sm',
            'h2',
            'h3',
            'counter',
            'counter-sm',
            'box5',
            'box5-sm',
            'lead',
            'body',
            'small',
            'label',
            'mono',
            'doc-xs',
            'doc-sm',
            'doc-base',
            'doc-md',
            'doc-lg',
            'doc-xl',
          ],
        },
      ],
      rounded: [{ rounded: ['none', '2', '4', '6', '8', '12', '20', 'full'] }],
      shadow: [{ shadow: ['paper', 'paper-sm', 'card', 'float', 'glow', 'brass', 'mark', 'none'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
