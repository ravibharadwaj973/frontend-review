'use client';

import { useRef, useState } from 'react';
import useSWR from 'swr';
import { ExternalLink, Plus, RefreshCw, Upload } from 'lucide-react';
import { Badge, Button, Field, Input, Modal, PageHeader, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';

const kinds = ['directory', 'press', 'industry', 'community', 'other'];

export default function ProminencePage() {
  const { data, error, mutate } = useSWR('/prominence');
  const [url, setUrl] = useState('');
  const [kind, setKind] = useState('directory');
  const [busy, setBusy] = useState('');
  const [importOpen, setImportOpen] = useState(false);
  const [provider, setProvider] = useState('');
  const [sources, setSources] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState('');
  const file = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const run = async (key: string, work: () => Promise<void>) => { setBusy(key); try { await work(); await mutate(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); } };
  const read = async (selected: File | undefined) => {
    if (!selected) return;
    try {
      if (selected.size > 500000) throw new Error('Keep the source file under 500 KB');
      const value = JSON.parse(await selected.text());
      const entries = Array.isArray(value) ? value : value.sources;
      if (!Array.isArray(entries)) throw new Error('The JSON file must contain a sources array');
      setSources(entries); setFileName(selected.name);
      if (value.provider) setProvider(value.provider);
    } catch (e: any) { toast(e.message, 'bad'); setSources(null); }
  };
  const template = () => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify({ provider: '', sources: [{ url: '', kind: 'directory', targetUrl: '', businessName: '', phone: '', address: '' }] }, null, 2)], { type: 'application/json' }));
    link.download = 'external-sources-template.json'; link.click(); URL.revokeObjectURL(link.href);
  };
  return <>
    <PageHeader title="Web reputation & prominence" subtitle="Evidence from supplied directories, press, industry and community sources." actions={<Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => setImportOpen(true)}>Import source data</Button>} />
    <form className="flex flex-wrap items-end gap-3 border-b border-line pb-6" onSubmit={(e) => { e.preventDefault(); run('add', async () => { await api('/prominence', { body: { url, kind } }); setUrl(''); }); }}><div className="min-w-0 flex-1 basis-64"><Field label="External source URL"><Input required type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://directory-or-publication.com/business-page" /></Field></div><Field label="Source type"><Select value={kind} onChange={(e) => setKind(e.target.value)}>{kinds.map((k) => <option key={k} value={k}>{k.charAt(0).toUpperCase() + k.slice(1)}</option>)}</Select></Field><Button type="submit" loading={busy === 'add'} icon={<Plus className="h-4 w-4" />}>Add source</Button></form>
    {error && <p className="mt-5 text-sm text-rose" role="alert">{error.message}</p>}
    {!data && !error && <Skeleton className="mt-6 h-72" />}
    {data && <><p className="my-5 text-sm text-ink-muted">{data.coverage} External provider connection: {data.providerConnected ? 'Connected' : 'None configured'}.</p>{!data.sources.length ? <p className="py-10 text-sm text-ink-muted">No external sources added yet.</p> : <ul className="divide-y divide-line">{data.sources.map((source: any) => <li key={source._id} className="py-5"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1 basis-full sm:basis-0"><a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-start gap-1 break-words text-sm font-medium text-brand-600">{source.evidence?.title || source.url}<ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0" /></a><p className="mt-1 text-xs text-ink-muted">{source.kind} / {source.provider} / {source.checkedAt ? `Checked ${new Date(source.checkedAt).toLocaleString()}` : 'Not checked'}</p></div><Badge tone={source.status === 'checked' ? 'good' : source.status === 'failed' ? 'bad' : undefined}>{source.status}</Badge><Button size="sm" variant="secondary" icon={<RefreshCw className="h-3.5 w-3.5" />} disabled={!!busy || source.status === 'checking'} loading={busy === source._id} onClick={() => run(source._id, async () => { await api(`/prominence/${source._id}/check`, { method: 'POST' }); })}>Check source</Button></div>{source.error && <p className="mt-3 text-sm text-rose">{source.error}</p>}{source.providerReported && <div className="mt-3 text-xs text-ink-muted"><p className="font-medium">Imported provider evidence / page check shown separately</p>{source.providerReported.targetUrl && <p className="mt-1 break-all">Reported target: {source.providerReported.targetUrl}</p>}{source.providerReported.businessName && <p>Name: {source.providerReported.businessName}</p>}{source.providerReported.phone && <p>Phone: {source.providerReported.phone}</p>}{source.providerReported.address && <p>Address: {source.providerReported.address}</p>}</div>}{source.evidence && <div className="mt-4"><div className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><span>Business identity found: {source.evidence.nameFound || source.evidence.relatedDeclarations.length ? 'Yes' : 'Not found'}</span><span>Direct website links: {source.evidence.websiteLinks.length}</span><span>Authority: {source.evidence.authority}</span></div>{source.evidence.excerpt && <blockquote className="mt-3 border-l-2 border-line pl-3 text-sm text-ink-muted">{source.evidence.excerpt}</blockquote>}<ul className="mt-3 space-y-2 text-sm text-ink-muted">{source.evidence.issues.map((issue: string) => <li key={issue}>{issue}</li>)}</ul>{source.previousEvidence && <p className="mt-3 text-xs text-ink-muted">Previous check: {source.previousEvidence.websiteLinks?.length || 0} direct links and {source.previousEvidence.issues?.length || 0} findings. Current check: {source.evidence.websiteLinks.length} direct links and {source.evidence.issues.length} findings.</p>}</div>}</li>)}</ul>}<p className="mt-6 text-xs text-ink-muted">A fetched mention or link is evidence of that page only. Source legitimacy, overall authority, customer sentiment and ranking impact are not automatically verified. Review corrections with the directory or publisher.</p></>}
    <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import external source evidence" footer={<><Button variant="ghost" onClick={() => setImportOpen(false)}>Cancel</Button><Button disabled={!provider.trim() || !sources?.length} loading={busy === 'import'} onClick={() => run('import', async () => { await api('/prominence/import', { body: { provider, sources } }); setImportOpen(false); setSources(null); setFileName(''); })}>Import sources</Button></>}><div className="space-y-4"><Field label="Provider or data source"><Input value={provider} onChange={(e) => setProvider(e.target.value)} /></Field><input ref={file} type="file" accept="application/json,.json" hidden onChange={(e) => read(e.target.files?.[0])} /><Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => file.current?.click()}>Choose JSON file</Button>{fileName && <p className="text-sm text-ink-muted">{fileName} / {sources?.length || 0} sources</p>}<Button size="sm" variant="ghost" onClick={template}>Download import template</Button></div></Modal>
  </>;
}
