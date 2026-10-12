import { NextRequest, NextResponse } from 'next/server';
import { contentSecurityPolicy } from './lib/security-headers.mjs';

export function middleware(request: NextRequest) {
  const auth = ['/login', '/signup'].includes(request.nextUrl.pathname.replace(/\/$/, ''));
  const nonce = auth ? btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(18)))) : undefined;
  const policy = contentSecurityPolicy({ nonce, production: process.env.NODE_ENV === 'production', backendOrigin: process.env.NEXT_PUBLIC_BACKEND_ORIGIN || 'http://localhost:4000' });
  const headers = new Headers(request.headers);
  // Next.js reads this request header to nonce its hydration scripts.
  headers.set('Content-Security-Policy', policy);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set('Content-Security-Policy', policy);
  if (auth) response.headers.set('Cache-Control', 'private, no-store');
  return response;
}

export const config = { matcher: ['/((?!api|uploads|_next/static|_next/image|favicon.svg).*)'] };
