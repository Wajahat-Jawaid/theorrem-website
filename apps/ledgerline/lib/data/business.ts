import type { Business, Person } from '../types';

/** The signed-in person: the owner, not a bookkeeper. */
export const owner: Person = {
  name: 'David Mercer',
  firstName: 'David',
  initials: 'DM',
  role: 'Managing Director',
  email: 'dmercer@mercerconstruction.co.uk',
};

/** The site manager who holds the company fuel card. */
export const siteManager: Person = {
  name: 'Jamie Cole',
  firstName: 'Jamie',
  initials: 'JC',
  role: 'Site Manager',
  email: 'jamie.cole@mercerconstruction.co.uk',
};

export const business: Business = {
  name: 'Mercer Construction Ltd',
  shortName: 'Mercer Construction',
  address: 'Unit 7, Rippleside Commercial Estate, Barking IG11 0RJ',
  vatNumber: 'GB 284 1937 06',
  owner,
  accounts: 'Xero',
};

/** Where Mercer's materials are delivered. */
export const SITES = ['Unit 4, Barking Riverside', '22 Abbey Road, Barking IG11 7BT', 'Plot 9, Beam Park, Rainham'] as const;

/** How every reminder email is signed: by the owner, sent by Ledgerline. */
export function signOff(firstName: string, shortName: string): string {
  return `Many thanks, ${firstName} (sent by Ledgerline for ${shortName})`;
}

export const SIGN_OFF = signOff(owner.firstName, business.shortName);
