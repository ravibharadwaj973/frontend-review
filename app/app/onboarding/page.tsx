'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button, Field, Input, Panel, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/format';
import { AiMark, Skeleton } from '@/components/ui';
import { FoundServicesList, useServiceDiscovery } from '@/components/app/ServiceFinder';

const STEPS = ['Your business', 'Services', 'Google'];

export default function Onboarding() {
  const { business, setBusiness } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState({ phone: business?.phone || '', line1: business?.address?.line1 || '', city: business?.address?.city || '', website: business?.links?.website || '' });
  const discovery = useServiceDiscovery();

  const saveInfo = async () => {
    setBusy(true);
    try {
      const res = await api('/business', { method: 'PATCH', body: { phone: info.phone, address: { line1: info.line1, city: info.city }, links: { website: info.website } } });
      setBusiness(res.business);
      setStep(1);
      discovery.find('ai');
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };
  const saveServices = async () => {
    setBusy(true);
    try {
      if (discovery.selected) await discovery.save();
      setStep(2);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <ol className="mb-8 flex items-center gap-3">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 items-center gap-3">
            <span className={cx('flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold', i < step ? 'bg-brand-500 text-white' : i === step ? 'bg-brand-600 text-white' : 'bg-line text-ink-muted')}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</span>
            <span className={cx('text-sm font-medium', i === step ? 'text-ink' : 'text-ink-muted')}>{s}</span>
            {i < STEPS.length - 1 && <span className="h-px flex-1 bg-line" />}
          </li>
        ))}
      </ol>

      {step === 0 && (
        <Panel>
          <h1 className="font-display text-2xl font-semibold">Welcome, {business?.name}</h1>
          <p className="mt-1 text-ink-muted">A few details so replies and review requests sound right.</p>
          <div className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone"><Input value={info.phone} onChange={(e) => setInfo({ ...info, phone: e.target.value })} inputMode="tel" /></Field>
              <Field label="City"><Input value={info.city} onChange={(e) => setInfo({ ...info, city: e.target.value })} /></Field>
            </div>
            <Field label="Street address"><Input value={info.line1} onChange={(e) => setInfo({ ...info, line1: e.target.value })} /></Field>
            <Field label="Website (optional)"><Input type="url" value={info.website} onChange={(e) => setInfo({ ...info, website: e.target.value })} placeholder="https://" /></Field>
          </div>
          <div className="mt-6 flex justify-between"><Button variant="ghost" onClick={() => { setStep(1); discovery.find('ai'); }}>Skip</Button><Button onClick={saveInfo} loading={busy}>Continue</Button></div>
        </Panel>
      )}

      {step === 1 && (
        <Panel>
          <h1 className="font-display text-2xl font-semibold">What do you offer?</h1>
          <p className="mt-1 text-ink-muted">Here’s what a {business?.category?.toLowerCase() || 'business'} like yours usually offers. Untick what you don’t do and set your prices — you can change everything later.</p>
          <div className="mt-6">
            {discovery.loading ? (
              <div className="space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-32" /><Skeleton className="h-5 w-32" /><Skeleton className="h-24" /></div>
            ) : discovery.items.length ? (
              <>
                <AiMark className="mb-3" label={discovery.model === 'catalog' ? 'Starter list for your business type' : 'Suggested by AI — check before adding'} />
                <div className="thin-scroll max-h-[420px] overflow-y-auto pr-1"><FoundServicesList items={discovery.items} setItems={discovery.setItems} /></div>
              </>
            ) : (
              <Button variant="secondary" onClick={() => discovery.find('ai')}>Suggest my services</Button>
            )}
          </div>
          <div className="mt-6 flex justify-between"><Button variant="ghost" onClick={() => setStep(2)}>Skip</Button><Button onClick={saveServices} loading={busy} disabled={discovery.loading}>Add {discovery.selected} services</Button></div>
        </Panel>
      )}

      {step === 2 && (
        <Panel>
          <h1 className="font-display text-2xl font-semibold">Connect your Google profile</h1>
          <p className="mt-1 text-ink-muted">Bring in your reviews, or explore with a demo connection first.</p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button size="lg" onClick={() => router.push('/app/google')}>Connect Google</Button>
            <Button size="lg" variant="ghost" onClick={() => router.push('/app')}>I’ll do it later</Button>
          </div>
        </Panel>
      )}
    </div>
  );
}
