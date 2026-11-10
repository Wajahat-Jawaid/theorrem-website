/** Old links from the previous screens land on the nearest page that exists now. */
const REVIEW_IDS = ['doc_3f9a1c2e', 'doc_7b20e4d1', 'doc_5d6e2b90'];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  trailingSlash: false,
  async redirects() {
    return [
      ...REVIEW_IDS.map((id) => ({ source: `/inbox/${id}`, destination: `/review/${id}`, permanent: false })),
      { source: '/inbox', destination: '/documents', permanent: false },
      { source: '/inbox/:path*', destination: '/documents', permanent: false },
      { source: '/chasers', destination: '/paperwork', permanent: false },
      { source: '/chasers/:path*', destination: '/paperwork', permanent: false },
      { source: '/clients', destination: '/dashboard', permanent: false },
      { source: '/clients/:path*', destination: '/dashboard', permanent: false },
      { source: '/activity', destination: '/dashboard', permanent: false },
      { source: '/activity/:path*', destination: '/dashboard', permanent: false },
      { source: '/rules', destination: '/dashboard', permanent: false },
      { source: '/rules/:path*', destination: '/dashboard', permanent: false },
    ];
  },
};

export default nextConfig;
