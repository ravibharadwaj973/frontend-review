'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AuthShell } from '@/components/app/AuthShell';
import { Button, Field, Input } from '@/components/ui';
import { useAuth } from '@/lib/auth';

function LoginQuery({ onDestination, onExpired }: { onDestination: (value: string) => void; onExpired: (value: string) => void }) {
  const params = useSearchParams();
  useEffect(() => {
    const value = params.get('next') || '';
    onDestination(/^\/app(\/[A-Za-z0-9/_-]*)?$/.test(value) ? value : '/app');
    if (params.get('expired')) onExpired('Your session expired. Sign in again.');
  }, [params, onDestination, onExpired]);
  return null;
}

function LoginForm() {
  const { login, user, loading } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [next, setNext] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && next) router.replace(next);
  }, [loading, user, router, next]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await login(email, password);
      router.push(next || '/app');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4">
      <Suspense fallback={null}><LoginQuery onDestination={setNext} onExpired={setError} /></Suspense>
      <Field label="Email">
        <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </Field>
      <Field label="Password">
        <Input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </Field>
      {error && <p role="alert" className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
      <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <AuthShell title="Welcome back" subtitle="Sign in to see your reviews and requests." footer={<>New to ReviewRankr? <Link href="/signup" prefetch={false} className="font-medium text-brand-600 hover:underline">Create an account</Link></>}>
      <LoginForm />
    </AuthShell>
  );
}
