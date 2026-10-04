'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthShell } from '@/components/app/AuthShell';
import { Button, Field, Input, Select } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CATEGORIES } from '@/lib/constants';

export default function SignupPage() {
  const { signup } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '', category: 'Beauty salon' });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    setErrors({});
    try {
      await signup(form);
      router.push('/app/onboarding');
    } catch (err: any) {
      setError(err.message);
      if (err.details) setErrors(err.details);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="Set up your business" subtitle="Takes about three minutes. You can connect Google afterwards." footer={<>Already have an account? <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Business name" error={errors.businessName}><Input value={form.businessName} onChange={set('businessName')} required placeholder="Glow Studio" /></Field>
          <Field label="Type of business">
            <Select value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
          </Field>
        </div>
        <Field label="Your name" error={errors.name}><Input value={form.name} onChange={set('name')} autoComplete="name" required /></Field>
        <Field label="Work email" error={errors.email}><Input type="email" value={form.email} onChange={set('email')} autoComplete="email" required /></Field>
        <Field label="Password" error={errors.password} hint="At least 8 characters"><Input type="password" value={form.password} onChange={set('password')} autoComplete="new-password" required minLength={8} /></Field>
        {error && !Object.keys(errors).length && <p className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
        <Button type="submit" size="lg" className="w-full" loading={busy}>Create account</Button>
      </form>
    </AuthShell>
  );
}
