'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
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
  const [showPassword, setShowPassword] = useState(false);
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
      <div className="relative">
        <Field label="Password">
          <Input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" className="pr-12" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </Field>
        <button
          type="button"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          aria-controls="login-password"
          aria-pressed={showPassword}
          title={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword(value => !value)}
          className="absolute bottom-0.5 right-0.5 flex h-9 w-10 items-center justify-center rounded-md text-ink-muted hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400"
        >
          {showPassword ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
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
