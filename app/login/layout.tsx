// A per-request nonce must never be served from cached sign-in HTML.
export const dynamic = 'force-dynamic';

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
