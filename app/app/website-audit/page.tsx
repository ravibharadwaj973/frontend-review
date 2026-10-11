'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import { Download, Globe, Play } from 'lucide-react';
import { Badge, Button, Field, Input, PageHeader, Segmented, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';

type Group = 'all' | 'technical' | 'local' | 'services' | 'content';

export default function WebsiteAuditPage() {
  const { data, error, mutate } = useSWR('/website-audit', { refreshInterval: (data: any) => data?.audit?.status === 'running' ? 3000 : 0 });
  const [url, setUrl] = useState('');
  const [busy, setBusy] = useState(false);
  const [group, setGroup] = useState<Group>('all');
  const toast = useToast();
  useEffect(() => { if (data && !url) setUrl(data.audit?.url || data.website || ''); }, [data, url]);
  const run = async () => {
    setBusy(true);
    try { await api('/website-audit', { body: { url } }); await mutate(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(false); }
  };
  const audit = data?.audit;
  const report = audit?.report;
  const exportReport = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' }));
    link.download = 'website-seo-audit.json';
    link.click();
    URL.revokeObjectURL(link.href);
  };
  return <>
    <PageHeader title="Website SEO Audit" subtitle="Website findings and local service coverage." actions={report && <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportReport}>Export report</Button>} />
    <form className="flex flex-wrap items-end gap-3 border-b border-line pb-6" onSubmit={(e) => { e.preventDefault(); run(); }}>
      <div className="min-w-0 flex-1 basis-72"><Field label="Website URL"><Input type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourbusiness.com" disabled={audit?.status === 'running'} /></Field></div>
      <Button type="submit" disabled={audit?.status === 'running'} loading={busy} icon={<Play className="h-4 w-4" />}>Run audit</Button>
    </form>
    {error && <p role="alert" className="mt-4 text-sm text-rose">{error.message}</p>}
    {!data && !error && <Skeleton className="mt-6 h-64" />}
    {audit?.status === 'running' && <p role="status" className="my-5 text-sm text-brand-600">Crawling website pages. Started {new Date(audit.startedAt).toLocaleTimeString()}.</p>}
    {audit?.status === 'failed' && <p role="alert" className="my-5 text-sm text-rose">{audit.error}</p>}
    {!audit && data && <div className="py-12 text-ink-muted"><Globe className="mb-3 h-6 w-6" /><p>No website audit yet.</p></div>}
    {report && <div className="space-y-7 pt-6">
      <div><p className="break-all text-sm font-medium">{report.url}</p><p className="mt-1 text-xs text-ink-muted">Last completed {new Date(report.completedAt).toLocaleString()} / Compared with {report.comparisonSource}{audit.status !== 'completed' ? ' / Showing the last completed report' : ''}</p></div>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">{[[report.summary.pages, 'Pages checked'], [report.summary.issues, 'Findings'], [report.summary.broken, 'Broken pages'], [report.summary.noindex, 'Noindex pages']].map(([value, label]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 font-display text-2xl font-semibold">{value}</dd></div>)}</dl>
      {audit.previousSummary && <p className="text-sm text-ink-muted">Previous sample: {audit.previousSummary.pages} pages, {audit.previousSummary.issues} findings. Current sample: {report.summary.pages} pages, {report.summary.issues} findings.</p>}
      <section className="border-t border-line pt-5"><h2 className="mb-4 font-display text-lg font-semibold">Recommended actions</h2><Segmented<Group> value={group} onChange={setGroup} options={[{ value: 'all', label: 'All' }, { value: 'technical', label: 'Technical' }, { value: 'local', label: 'Local SEO' }, { value: 'services', label: 'Services' }, { value: 'content', label: 'Content' }]} /><ul className="mt-3 divide-y divide-line">{report.findings.filter((f: any) => group === 'all' || f.group === group).map((f: any, i: number) => <li key={`${f.code}-${i}`} className="py-4"><div className="flex flex-wrap items-start justify-between gap-2"><h3 className="text-sm font-medium">{f.title}</h3><Badge tone={f.severity === 'high' ? 'bad' : f.severity === 'medium' ? 'warn' : undefined}>{f.severity === 'review' ? 'Review' : f.severity === 'high' ? 'High priority' : 'Medium priority'}</Badge></div><p className="mt-1 break-words text-sm text-ink-muted">{f.detail}</p><a className="mt-2 block break-all text-xs text-brand-600 hover:underline" href={f.url} target="_blank" rel="noopener noreferrer">{f.url}</a></li>)}</ul>{!report.findings.length && <p className="mt-4 text-sm text-ink-muted">No findings in this crawl sample.</p>}</section>
      <section className="border-t border-line pt-5"><h2 className="font-display text-lg font-semibold">Service coverage</h2><ul className="mt-3 divide-y divide-line">{report.coverage.map((s: any) => <li className="py-3" key={s.service}><p className="text-sm font-medium">{s.service} <Badge tone={s.pages.length ? 'good' : 'warn'}>{s.pages.length ? 'Page found' : 'No dedicated page found'}</Badge></p>{s.pages.map((url: string) => <a key={url} className="mt-1 block break-all text-xs text-brand-600" href={url} target="_blank" rel="noopener noreferrer">{url}</a>)}</li>)}</ul>{!report.coverage.length && <p className="mt-3 text-sm text-ink-muted">Add your actual services to check coverage.</p>}</section>
      <section className="border-t border-line pt-5"><h2 className="font-display text-lg font-semibold">Pages checked</h2><div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-ink-muted"><tr><th className="py-2">Page</th><th className="px-3">Status</th><th className="px-3">Response</th><th className="px-3">Words</th></tr></thead><tbody className="divide-y divide-line">{report.pages.map((p: any) => <tr key={p.url}><td className="max-w-xs py-3"><a className="break-all text-brand-600" href={p.url} target="_blank" rel="noopener noreferrer">{p.title || new URL(p.url).pathname}</a></td><td className="px-3">{p.status}</td><td className="whitespace-nowrap px-3">{p.responseMs} ms</td><td className="px-3">{p.words}</td></tr>)}</tbody></table></div></section>
      <section className="border-t border-line pt-5"><h2 className="font-display text-lg font-semibold">Audit scope</h2><p className="mt-3 text-sm text-ink-muted">robots.txt: {report.robots.status || 'Unavailable'} / Sitemap: {report.sitemap.found ? 'Found' : 'Not found'} / Crawl limit: {report.limits.maxPages} pages{report.limits.remainingLinks ? ` / ${report.limits.remainingLinks} discovered links remain unchecked` : ''}</p><ul className="mt-3 space-y-2 text-sm text-ink-muted">{report.limitations.map((item: string) => <li key={item}>{item}</li>)}</ul></section>
    </div>}
  </>;
}
