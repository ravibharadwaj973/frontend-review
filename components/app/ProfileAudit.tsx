'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ExternalLink, RefreshCw, Search, Upload, X } from 'lucide-react';
import { Badge, Button, Input, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

type Category = { name: string; displayName: string };
const labels: Record<string, string> = { complete: 'Complete', missing: 'Missing', mismatch: 'Differs from Google', review: 'Review', unknown: 'Unknown' };

export function ProfileAudit() {
  const { business, setBusiness } = useAuth();
  const { data, error, mutate } = useSWR('/business/audit');
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Category[]>([]);
  const [choice, setChoice] = useState('primary');
  const [categories, setCategories] = useState<{ primary?: Category; additional: Category[] }>({ additional: [] });
  useEffect(() => {
    const saved = business?.googleCategories?.primary?.name;
    setCategories({ primary: saved ? business.googleCategories.primary : data?.categories?.primaryCategory, additional: saved ? business.googleCategories.additional || [] : data?.categories?.additionalCategories || [] });
  }, [business, data?.categories]);
  const action = async (key: string, work: () => Promise<void>) => {
    setBusy(key);
    try { await work(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); }
  };
  const refresh = () => action('refresh', async () => {
    if (data?.connected) await api('/google/refresh', { method: 'POST' });
    await mutate();
  });
  const save = () => action('save', async () => {
    const res = await api('/business', { method: 'PATCH', body: { googleCategories: categories } });
    setBusiness(res.business);
    await mutate();
    toast('Categories saved');
  });
  const publish = () => action('publish', async () => {
    const saved = await api('/business', { method: 'PATCH', body: { googleCategories: categories } });
    setBusiness(saved.business);
    const res = await api('/google/push/profile', { body: { sections: ['categories'] } });
    await mutate();
    if (res.results.categories.status !== 'synced') throw new Error(res.results.categories.message);
    toast('Categories accepted by Google');
  });
  const find = () => action('search', async () => {
    setResults([]);
    const res = await api(`/google/categories?q=${encodeURIComponent(query.trim())}`);
    setResults(res.categories || []);
    if (!res.categories?.length) toast('No matching Google categories');
  });
  const choose = (category: Category) => {
    if (choice === 'primary') setCategories({ primary: category, additional: categories.additional.filter((c) => c.name !== category.name) });
    else if (category.name !== categories.primary?.name && !categories.additional.some((c) => c.name === category.name) && categories.additional.length < 9) setCategories({ ...categories, additional: [...categories.additional, category] });
  };
  if (error) return <div role="alert" className="py-6 text-sm text-rose">{error.message}<Button variant="ghost" onClick={() => mutate()}>Retry</Button></div>;
  if (!data) return <Skeleton className="h-80" />;
  const r = data.reputation;
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-5">
        <div><h2 className="font-display text-xl font-semibold">Profile completeness</h2><p className="mt-1 text-sm text-ink-muted">{data.completed} of {data.total} checks complete{data.fetchedAt ? ` / Google checked ${new Date(data.fetchedAt).toLocaleString()}` : ' / Google details unavailable'}{data.stale ? ' / Refresh needed' : ''}</p></div>
        <Button variant="secondary" icon={<RefreshCw className="h-4 w-4" />} loading={busy === 'refresh'} disabled={!!busy} onClick={refresh}>Refresh audit</Button>
      </div>
      {!data.connected && <Link href="/app/google" className="block text-sm font-medium text-brand-600">Connect Google Business Profile</Link>}
      <ul className="divide-y divide-line">
        {data.checks.map((check: any) => <li key={check.id} className="grid gap-2 py-3 sm:grid-cols-[180px_1fr_auto]">
          <span className="text-sm font-medium">{check.title}</span>
          <p className="text-sm text-ink-muted">{check.recommendation}</p>
          <a href={check.href} className="justify-self-start sm:justify-self-end" {...(check.href.startsWith('https:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Badge tone={check.status === 'complete' ? 'good' : check.status === 'unknown' ? undefined : 'warn'}>{labels[check.status]}</Badge></a>
        </li>)}
      </ul>
      <section className="border-t border-line pt-6">
        <h2 className="font-display text-lg font-semibold">Google categories</h2>
        <div className="mt-4 flex flex-wrap gap-2">
          <Input className="sm:max-w-xs" aria-label="Search Google categories" placeholder="Search category" value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && data.connected && query.trim().length >= 2 && !busy) find(); }} />
          <Select className="w-auto" value={choice} onChange={(e) => setChoice(e.target.value)} aria-label="Category type"><option value="primary">Primary</option><option value="secondary">Secondary</option></Select>
          <Button icon={<Search className="h-4 w-4" />} disabled={!data.connected || query.trim().length < 2 || !!busy} loading={busy === 'search'} onClick={find}>Search</Button>
        </div>
        {!!results.length && <ul className="mt-3 max-h-48 overflow-auto divide-y divide-line border-y border-line">{results.map((category) => <li key={category.name}><button className="w-full px-2 py-2 text-left text-sm hover:bg-mist" disabled={choice === 'secondary' && categories.additional.length >= 9} onClick={() => choose(category)}>{category.displayName}</button></li>)}</ul>}
        <p className="mt-4 text-sm"><span className="text-ink-muted">Primary: </span>{categories.primary?.displayName || data.categories?.primaryCategory?.displayName || 'Not selected'}</p>
        <ul className="mt-2 flex flex-wrap gap-3">{categories.additional.map((cat) => <li key={cat.name} className="flex items-center gap-1 text-sm">{cat.displayName}<Button size="sm" variant="ghost" title="Remove category" aria-label={`Remove ${cat.displayName}`} icon={<X className="h-3.5 w-3.5" />} onClick={() => setCategories({ ...categories, additional: categories.additional.filter((a) => a.name !== cat.name) })} /></li>)}</ul>
        <div className="mt-4 flex flex-wrap gap-2"><Button variant="secondary" disabled={!categories.primary || !!busy} loading={busy === 'save'} onClick={save}>Save categories</Button><Button icon={<Upload className="h-4 w-4" />} disabled={!categories.primary || !data.connected || !!busy} loading={busy === 'publish'} onClick={publish}>Publish to Google</Button></div>
      </section>
      <section className="border-t border-line pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Attributes & verification</h2><a href="https://business.google.com/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600">Manage in Google <ExternalLink className="h-4 w-4" /></a></div>
        <p className="mt-3 text-sm">Verification: <span className="font-medium">{data.verification.replace(/_/g, ' ')}</span></p>
        <ul className="mt-3 divide-y divide-line">{data.attributes.map((a: any) => <li key={a.name} className="py-2 text-sm"><span className="font-medium">{a.name?.split('/').pop()?.replace(/_/g, ' ')}</span><span className="ml-2 text-ink-muted">{(a.values || []).map(String).join(', ') || a.valueType}</span></li>)}</ul>
      </section>
      {!!data.missingServices.length && <section className="border-t border-line pt-6"><h2 className="font-display text-lg font-semibold">Services to confirm</h2><ul className="mt-3 divide-y divide-line">{data.missingServices.map((s: any) => <li key={s.name} className="py-3"><p className="text-sm font-medium">{s.name}</p><p className="text-sm text-ink-muted">{s.recommendation}</p></li>)}</ul><Link className="text-sm font-medium text-brand-600" href="/app/profile?tab=services">Review service list</Link></section>}
      <section className="border-t border-line pt-6"><h2 className="font-display text-lg font-semibold">Customer search terms{data.search.month ? ` / ${data.search.month}` : ''}</h2>{data.search.available ? data.search.keywords.length ? <ul className="mt-3 divide-y divide-line">{data.search.keywords.map((k: any) => <li key={k.term} className="flex flex-wrap items-start justify-between gap-2 py-3 text-sm"><div><p className="font-medium">{k.term}</p>{!!k.services.length && <p className="text-ink-muted">Listed services: {k.services.join(', ')}</p>}</div><span className="text-ink-muted">{k.value !== null ? k.value : k.threshold !== null ? `Below ${k.threshold}` : 'Unavailable'}</span></li>)}</ul> : <p className="mt-3 text-sm text-ink-muted">Google returned no search terms for this month.</p> : <p className="mt-3 text-sm text-ink-muted">{data.search.error || 'Connect Google and refresh the audit to check search data.'}</p>}</section>
      <section className="border-t border-line pt-6"><h2 className="font-display text-lg font-semibold">Customer reputation</h2><dl className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">{[[r.total, 'Reviews'], [r.average === null ? '-' : r.average.toFixed(1), 'Average rating'], ...(data.connected ? [[r.responseCoverage === null ? '-' : `${r.responseCoverage}%`, 'Response coverage']] : [])].map(([value, label]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 text-2xl font-semibold">{value}</dd></div>)}</dl>{r.complaints.length > 0 ? <ul className="mt-5 divide-y divide-line">{r.complaints.map((c: any) => <li key={c.theme} className="flex justify-between gap-3 py-3 text-sm"><span>{c.theme}</span><span className="text-ink-muted">{c.count} reviews</span></li>)}</ul> : <p className="mt-4 text-sm text-ink-muted">No recurring complaints detected in analyzed reviews.</p>}</section>
    </div>
  );
}
