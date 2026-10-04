/** @type {import('next').NextConfig} */
const API_URL = (process.env.API_URL || 'http://localhost:4000').replace(/\/$/, '');

const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  async rewrites() {
    // The browser talks to /api on the same origin; Next forwards to the Express API.
    return [
      { source: '/api/:path*', destination: `${API_URL}/api/:path*` },
      { source: '/uploads/:path*', destination: `${API_URL}/uploads/:path*` },
    ];
  },
  images: { unoptimized: true },
};

export default nextConfig;
