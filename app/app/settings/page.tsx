'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Sparkles } from 'lucide-react';
import { Badge, Button, Field, Input, PageHeader, Panel, Select, Toggle, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { TONES } from '@/lib/constants';
import { cx } from '@/lib/format';

export default function SettingsPage() {
  const { business, setBusiness, user, refresh } = useAuth();
  const toast = useToast();
  const { data: ai } = useSWR('/ai/status');
  const [voice, setVoice] = useState<any>(business?.voice || {});
  const [automation, setAutomation] = useState<any>(business?.automation || {});
  const [reviewLink, setReviewLink] = useState(business?.reviewLink || '');
  const [account, setAccount] = useState({ name: user?.name || '', currentPassword: '', newPassword: '' });
  const [busy, setBusy] = useState('');

  useEffect(() => {
    setVoice(business?.voice || {});
    setAutomation(business?.automation || {});
    setReviewLink(business?.reviewLink || '');
  }, [business]);

  const saveBusiness = async (name: string, body: any) => {
    setBusy(name);
    try {
      const res = await api('/business', { method: 'PATCH', body });
      setBusiness(res.business);
      toast('Settings saved');
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const saveAccount = async () => {
    setBusy('account');
    try {
      const body: any = { name: account.name };
      if (account.newPassword) Object.assign(body, { currentPassword: account.currentPassword, newPassword: account.newPassword });
      await api('/auth/me', { method: 'PATCH', body });
      setAccount({ ...account, currentPassword: '', newPassword: '' });
      await refresh();
      toast('Account updated');
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="How ReviewRankr writes for you, what it does automatically, and your account." />
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Voice for replies and messages">
          <div className="space-y-2">
            {TONES.map((t) => (
              <label key={t.value} className={cx('flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors', voice.tone === t.value ? 'border-brand-500 bg-brand-50' : 'border-line hover:border-brand-200')}>
                <input type="radio" name="tone" className="mt-1 accent-brand-500" checked={voice.tone === t.value} onChange={() => setVoice({ ...voice, tone: t.value })} />
                <span><span className="block font-medium">{t.label}</span><span className="block text-sm text-ink-muted">“{t.example}”</span></span>
              </label>
            ))}
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Sign-off" hint="Added to the end of replies"><Input value={voice.signOff || ''} onChange={(e) => setVoice({ ...voice, signOff: e.target.value })} placeholder="— Team Glow Studio" /></Field>
            <Field label="Language">
              <Select value={voice.language || 'English'} onChange={(e) => setVoice({ ...voice, language: e.target.value })}>
                {['English', 'Hindi', 'Hinglish', 'Tamil', 'Telugu', 'Marathi', 'Bengali', 'Kannada', 'Malayalam', 'Gujarati', 'Punjabi'].map((l) => <option key={l}>{l}</option>)}
              </Select>
            </Field>
          </div>
          <Field className="mt-4" label="Never say" hint="Phrases or promises the AI must avoid"><Input value={voice.avoid || ''} onChange={(e) => setVoice({ ...voice, avoid: e.target.value })} placeholder="discounts, “we apologise for the inconvenience”" /></Field>
          <div className="mt-5 flex justify-end"><Button onClick={() => saveBusiness('voice', { voice })} loading={busy === 'voice'}>Save voice</Button></div>
        </Panel>

        <div className="space-y-6">
          <Panel title="Automation">
            <div className="divide-y divide-line-soft">
              <Toggle checked={automation.autoAnalyze !== false} onChange={(v) => setAutomation({ ...automation, autoAnalyze: v })} label="Analyse new reviews" description="Sentiment, services and issues for every review as it arrives." />
              <Toggle checked={automation.autoDraftReplies !== false} onChange={(v) => setAutomation({ ...automation, autoDraftReplies: v })} label="Draft replies automatically" description="AI writes a reply for every new review. Your reply rules decide which ones post by themselves." />
              <div className="flex items-start justify-between gap-6 py-3">
                <span>
                  <span className="block text-[15px] font-medium text-ink">Post AI replies automatically</span>
                  <span className="mt-0.5 block text-sm text-ink-muted">Choose by star rating which replies post by themselves and which wait for you.</span>
                </span>
                <Link href="/app/autopilot" className="shrink-0 text-sm font-medium text-brand-600 hover:underline">Reply rules →</Link>
              </div>
            </div>
            <Field className="mt-3" label="Suggest asking for a review after" hint="Customers appear under “Ready to ask” once this time has passed since their visit">
              <Select value={String(automation.requestDelayHours ?? 2)} onChange={(e) => setAutomation({ ...automation, requestDelayHours: Number(e.target.value) })}>
                {[[0, 'Straight away'], [1, '1 hour'], [2, '2 hours'], [4, '4 hours'], [24, 'Next day'], [48, '2 days']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <div className="mt-5 flex justify-end"><Button onClick={() => saveBusiness('auto', { automation })} loading={busy === 'auto'}>Save automation</Button></div>
          </Panel>

          <Panel title="Google review link">
            <Field hint="Filled in automatically when you connect Google. Set it by hand if you haven’t connected yet.">
              <Input type="url" value={reviewLink} onChange={(e) => setReviewLink(e.target.value)} placeholder="https://search.google.com/local/writereview?placeid=…" />
            </Field>
            <div className="mt-4 flex justify-end"><Button variant="secondary" onClick={() => saveBusiness('link', { reviewLink })} loading={busy === 'link'}>Save link</Button></div>
          </Panel>

          <Panel title="AI engine">
            <div className="flex items-center gap-3 text-sm">
              <Sparkles className="h-5 w-5 text-violet" />
              {ai ? (ai.configured ? <span>Groq · <span className="font-medium">{ai.model}</span> <Badge tone="good" className="ml-1">Connected</Badge></span> : <span>Built-in writer <Badge tone="warn" className="ml-1">Add GROQ_API_KEY for full AI</Badge></span>) : '…'}
            </div>
          </Panel>
        </div>

        <Panel title="Your account">
          <div className="space-y-4">
            <Field label="Name"><Input value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} /></Field>
            <Field label="Email"><Input value={user?.email || ''} disabled /></Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Current password"><Input type="password" value={account.currentPassword} onChange={(e) => setAccount({ ...account, currentPassword: e.target.value })} autoComplete="current-password" /></Field>
              <Field label="New password" hint="At least 8 characters"><Input type="password" value={account.newPassword} onChange={(e) => setAccount({ ...account, newPassword: e.target.value })} autoComplete="new-password" /></Field>
            </div>
          </div>
          <div className="mt-5 flex justify-end"><Button onClick={saveAccount} loading={busy === 'account'}>Update account</Button></div>
        </Panel>
      </div>
      <p className="mt-8 flex gap-4 text-xs text-ink-muted">
        <Link href="/privacy-policy" className="hover:text-brand-600">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-brand-600">Terms of Service</Link>
      </p>
    </>
  );
}