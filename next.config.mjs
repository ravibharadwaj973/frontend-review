/** @type {import('next').NextConfig} */

/**
 * BACKEND_URL is the one setting that connects the website to the API.
 *   BACKEND_URL=https://api.yourbusiness.in
 * The browser only talks to this website; Next.js forwards /api/* and /uploads/*
 * to the backend, so no CORS setup is needed in the browser.
 * API_URL and NEXT_PUBLIC_API_URL are accepted as aliases. Read at build time.
 */
const raw = (process.env.BACKEND_URL || process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || '').trim();
let BACKEND_URL = (raw || 'http://localhost:4000').replace(/\/+$/, '');
// Only the origin is used: "https://api.x.in/api/health" or "https://api.x.in/api" become "https://api.x.in"
try {
  BACKEND_URL = new URL(BACKEND_URL).origin;
} catch {
  /* checked below */
}
console.log(`[reviewrankr] Forwarding /api and /uploads to ${BACKEND_URL}`);

if (!raw && (process.env.VERCEL || process.env.NODE_ENV === 'production') && process.env.npm_lifecycle_event === 'build') {
  // Fail loudly instead of deploying a site that can't reach its API
  if (process.env.VERCEL) {
    throw new Error('BACKEND_URL is not set. In Vercel → Project → Settings → Environment Variables, add BACKEND_URL = your backend address (e.g. https://api.yourbusiness.in), then redeploy.');
  }
  console.warn('[reviewrankr] BACKEND_URL is not set — using http://localhost:4000');
}
if (!/^https?:\/\//.test(BACKEND_URL)) {
  throw new Error(`BACKEND_URL must start with http:// or https:// (got "${BACKEND_URL}")`);
}

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  env: { NEXT_PUBLIC_BACKEND_ORIGIN: BACKEND_URL },
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${BACKEND_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${BACKEND_URL}/uploads/:path*` },
    ];
  },
  images: { unoptimized: true },
};

export default nextConfig;
