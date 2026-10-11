'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { Plus, RefreshCw } from 'lucide-react';
import { Button, Field, Input, Modal, PageHeader, Segmented, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';

const value = (v: number | null) => v === null ? 'Unavailable' : v.toLocaleString();

export default function PerformancePage() {
  const [days, setDays] = useState('30');
  const { data, error, mutate } = useSWR(`/performance?days=${days}`);
  const [activityId, setActivityId] = useState('');
  const [window, setWindow] = useState('14');
  const { data: comparison, error: compareError } = useSWR(activityId ? `/performance/compare?id=${encodeURIComponent(activityId)}&days=${window}` : null);
  const [metric, setMetric] = useState('WEBSITE_CLICKS');
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('website');
  const [completedAt, setCompletedAt] = useState('');
  const [busy, setBusy] = useState('');
  const toast = useToast();
  const action = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); } };
  const points = (data?.snapshot?.series?.[metric] || []).filter((p: any) => p.date >= data.current.start && p.date <= data.current.end);
  const max = Math.max(1, ...points.map((p: any) => p.value));
  return <>
    <PageHeader title="Google Performance" subtitle="Reported visibility and customer actions for the connected location." actions={<Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} disabled={!data?.connected || !!busy} loading={busy === 'refresh'} onClick={() => action('refresh', async () => { await mutate(await api(`/performance?days=${days}&refresh=1`), false); })}>Refresh Google data</Button>} />
    <Segmented value={days} onChange={setDays} options={[{ value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />
    {error && <p role="alert" className="my-5 text-sm text-rose">{error.message}</p>}
    {!data && !error && <Skeleton className="mt-6 h-64" />}
    {data && !data.connected && <Link href="/app/google" className="mt-6 block text-sm font-medium text-brand-600">Connect Google Business Profile to load performance</Link>}
    {data?.connected && <div className="space-y-7 pt-5">
      <p className="text-sm text-ink-muted">{data.title} / {data.current.start} to {data.current.end} / Checked {new Date(data.snapshot.fetchedAt).toLocaleString()}</p>
      <section className="border-y border-line py-4"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-ink-muted"><tr><th className="py-2">Metric</th><th className="px-3">Current period</th><th className="px-3">Previous period</th><th className="px-3">Change</th></tr></thead><tbody className="divide-y divide-line">{data.comparison.map((m: any) => <tr key={m.metric}><td className="min-w-[170px] py-3 font-medium">{m.label}</td><td className="px-3">{value(m.after.value)}<span className="mt-1 block whitespace-nowrap text-xs text-ink-muted">{m.after.days}/{m.after.expectedDays} days reported</span></td><td className="px-3">{value(m.before.value)}<span className="mt-1 block whitespace-nowrap text-xs text-ink-muted">{m.before.days}/{m.before.expectedDays} days reported</span></td><td className="px-3">{m.change === null ? 'Unavailable' : `${m.change > 0 ? '+' : ''}${m.change}%`}</td></tr>)}</tbody></table></div></section>
      <section><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Daily trend</h2><Select className="w-auto max-w-full" value={metric} onChange={(e) => setMetric(e.target.value)} aria-label="Trend metric">{data.comparison.map((m: any) => <option key={m.metric} value={m.metric}>{m.label}</option>)}</Select></div>{points.length ? <div className="mt-4 max-h-80 overflow-auto"><ul className="space-y-2">{points.map((p: any) => <li key={p.date} className="grid grid-cols-[82px_minmax(0,1fr)_60px] items-center gap-3 text-xs"><span className="text-ink-muted">{p.date}</span><div className="h-3 bg-line-soft"><div className="h-full bg-brand-500" style={{ width: `${p.value / max * 100}%` }} /></div><span className="text-right tabular-nums">{p.value.toLocaleString()}</span></li>)}</ul></div> : <p className="mt-3 text-sm text-ink-muted">No dated values returned for this metric.</p>}</section>
      <section className="border-t border-line pt-5"><h2 className="font-display text-lg font-semibold">Search terms{data.keywords?.month ? ` / ${data.keywords.month}` : ''}</h2>{data.keywords?.error ? <p className="mt-3 text-sm text-ink-muted">{data.keywords.error}</p> : <ul className="mt-3 max-h-72 overflow-auto divide-y divide-line">{data.keywords.items.map((k: any) => <li key={k.searchKeyword} className="flex justify-between gap-3 py-2 text-sm"><span>{k.searchKeyword}</span><span className="text-ink-muted">{k.insightsValue?.value ?? (k.insightsValue?.threshold ? `Below ${k.insightsValue.threshold}` : 'Unavailable')}</span></li>)}</ul>}{!data.keywords?.error && !data.keywords.items.length && <p className="mt-3 text-sm text-ink-muted">Google returned no search terms for the month.</p>}</section>
      <section className="border-t border-line pt-5"><div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Completed activity comparison</h2><Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)}>Record completed activity</Button></div><div className="mt-4 flex flex-wrap gap-3"><Select className="min-w-0 flex-1" value={activityId} onChange={(e) => setActivityId(e.target.value)} aria-label="Completed activity"><option value="">Choose a completed activity</option>{data.activities.map((a: any) => <option key={a.id} value={a.id}>{new Date(a.completedAt).toLocaleDateString()} / {a.title} / {a.source === 'google' ? 'Google confirmed' : 'Owner recorded'}</option>)}</Select><Select className="w-auto" value={window} onChange={(e) => setWindow(e.target.value)} aria-label="Comparison window">{['7', '14', '28'].map((days) => <option key={days} value={days}>{days} days each side</option>)}</Select></div>{compareError && <p className="mt-3 text-sm text-rose">{compareError.message}</p>}{comparison && <><p className="mt-4 text-xs text-ink-muted">Before: {comparison.windows.before.start} to {comparison.windows.before.end} / After: {comparison.windows.after.start} to {comparison.windows.after.end}{!comparison.windows.elapsed ? ' / After-period still in progress' : ''}</p><ul className="mt-3 divide-y divide-line">{comparison.metrics.map((m: any) => <li key={m.metric} className="flex flex-wrap justify-between gap-2 py-3 text-sm"><span>{m.label}</span><span>{value(m.before.value)} → {value(m.after.value)} / {m.change === null ? 'Comparison incomplete or zero baseline' : `${m.change > 0 ? '+' : ''}${m.change}%`}</span></li>)}</ul></>}</section>
      <p className="text-xs text-ink-muted">Call clicks are call-button interactions, not confirmed completed calls. Changes around an activity do not establish causation. Missing dates remain unknown; percentage changes require complete periods and a nonzero baseline. These metrics do not reveal Google’s ranking formula.</p>
    </div>}
    <Modal open={open} onClose={() => setOpen(false)} title="Record completed activity" footer={<><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button loading={busy === 'activity'} disabled={!title.trim() || !completedAt} onClick={() => action('activity', async () => { await api('/performance/activities', { body: { title, kind, completedDate: completedAt } }); setOpen(false); setTitle(''); setCompletedAt(''); await mutate(); })}>Record completion</Button></>}><div className="space-y-4"><Field label="Completed work"><Input value={title} maxLength={160} onChange={(e) => setTitle(e.target.value)} /></Field><Field label="Activity type"><Select value={kind} onChange={(e) => setKind(e.target.value)}><option value="website">Website improvement</option><option value="directory">Directory correction</option><option value="community">Community activity</option><option value="other">Other completed work</option></Select></Field><Field label="Completion date"><Input type="date" value={completedAt} onChange={(e) => setCompletedAt(e.target.value)} /></Field></div></Modal>
  </>;
}
