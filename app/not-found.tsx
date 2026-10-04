import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-mist p-6 text-center">
      <div>
        <h1 className="font-display text-3xl font-semibold">Page not found</h1>
        <p className="mt-2 text-ink-muted">The page you’re looking for doesn’t exist or has moved.</p>
        <Link href="/app" className="mt-6 inline-flex h-10 items-center rounded-xl bg-brand-600 px-4 text-sm font-medium text-white">Go to dashboard</Link>
      </div>
    </main>
  );
}
