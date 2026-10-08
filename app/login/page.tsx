'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/app/AuthShell';
import { Button, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  // Where to go after signing in (only pages inside the app)
  const nextParam = params.get('next') || '';
  const next = /^\/app(\/[A-Za-z0-9/_-]*)?$/.test(nextParam) ? nextParam : '/app';

  useEffect(() => {
    if (params.get('demo')) {
      setEmail('demo@reviewrankr.app');
      setPassword('reviewrankr123');
    }
    if (params.get('expired')) setError('Your session expired. Sign in again.');
  }, [params]);

  useEffect(() => {
    if (!loading && user) router.replace(next);
  }, [loading, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.push(next);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label="Email">
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {error && <p className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
      {params.get('demo') && (
        <p className="text-xs text-ink-muted">Demo details are filled in. Run <code className="rounded bg-white px-1">npm run seed</code> in the backend first if sign-in fails.</p>
      )}
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your reviews and requests." footer={<>New to ReviewRankr? <Link href="/signup" className="font-medium text-brand-600 hover:underline">Create an account</Link></>}>
      <Suspense>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
