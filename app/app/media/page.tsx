'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import useSWR from 'swr';
import { Check, Pencil, RefreshCw, Send, Upload, X } from 'lucide-react';
import { Badge, Button, Field, Input, Modal, PageHeader, Segmented, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { MediaPreview } from '@/components/app/MediaPreview';
import { PHOTO_CATEGORIES } from '@/lib/constants';
import { shrinkImage } from '@/lib/image';
import { api } from '@/lib/api';

type Filter = 'all' | 'pending' | 'approved' | 'video';

export default function MediaPage() {
  const { data, error, mutate } = useSWR('/photos');
  const { data: audit, mutate: refreshAudit } = useSWR('/photos/audit');
  const { data: services } = useSWR('/services');
  const { data: google } = useSWR('/google/status');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState('services');
  const [editing, setEditing] = useState<any>(null);
  const [busy, setBusy] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const connected = google?.account?.mode === 'live' && google.account.status === 'connected' && google.account.locationName;
  const refresh = async () => { await mutate(); await refreshAudit(); };
  const call = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); await refresh(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); } };
  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    call('upload', async () => {
      const form = new FormData();
      for (const file of [...files].slice(0, 12)) { const prepared = await shrinkImage(file); form.append('files', prepared, prepared instanceof File ? prepared.name : file.name); }
      form.append('category', category);
      await api('/photos', { form });
      if (input.current) input.current.value = '';
      toast('Media uploaded for approval');
    });
  };
  const approve = (media: any, status: string) => call(media._id, async () => { await api(`/photos/${media._id}/approval`, { body: { status } }); });
  const save = () => call('save', async () => {
    await api(`/photos/${editing._id}`, { method: 'PATCH', body: { caption: editing.caption, category: editing.category, services: editing.services || [], capturedAt: editing.capturedAt ? new Date(`${editing.capturedAt}T12:00:00Z`).toISOString() : null } });
    setEditing(null);
  });
  const shown = (data?.photos || []).filter((m: any) => filter === 'all' || filter === 'video' && m.mediaType === 'video' || filter === 'approved' && m.approval?.status === 'approved' || filter === 'pending' && (!m.approval?.status || m.approval.status === 'pending'));
  return <>
    <PageHeader title="Photos & videos" subtitle="Your business media library, approvals and coverage." actions={<Button icon={<Upload className="h-4 w-4" />} onClick={() => input.current?.click()} loading={busy === 'upload'}>Upload media</Button>} />
    <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,video/mp4" multiple hidden onChange={(e) => upload(e.target.files)} />
    <div className="mb-6 flex flex-wrap items-center gap-3"><Select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Upload category" className="w-auto">{PHOTO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select><span className="text-xs text-ink-muted">Photos up to 8 MB / MP4 up to 50 MB</span><Link className="ml-auto text-sm font-medium text-brand-600" href="/app/photos">Weekly photo schedule</Link></div>
    {error && <p role="alert" className="text-sm text-rose">{error.message}</p>}
    {audit && <section className="mb-7 border-y border-line py-5"><dl className="grid grid-cols-3 gap-4 sm:grid-cols-6">{[[audit.total, 'Media'], [audit.approved, 'Approved'], [audit.pending, 'Pending'], [audit.videos, 'Videos'], [audit.published, 'Published'], [audit.failed, 'Failed']].map(([value, label]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 font-display text-2xl font-semibold">{value}</dd></div>)}</dl><div className="mt-4 space-y-2 text-sm text-ink-muted"><p>Category gaps: {audit.categoryGaps.length ? audit.categoryGaps.join(', ') : 'None in approved library'}</p><p>Services without tagged approved media: {audit.serviceGaps.length ? audit.serviceGaps.map((s: any) => s.name).join(', ') : 'None'}</p><p>{audit.lowResolution} photos below 720 px on the short edge / {audit.missingDimensions} with unmeasured dimensions / {audit.older} approved items older than 6 months by capture or upload date</p><p>Videos stay in your library; Google video publishing is unavailable through the current API.</p></div></section>}
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><Segmented<Filter> value={filter} onChange={setFilter} options={[{ value: 'all', label: 'All media' }, { value: 'pending', label: 'Pending' }, { value: 'approved', label: 'Approved' }, { value: 'video', label: 'Videos' }]} /><Button variant="secondary" size="sm" disabled={!connected || !!busy} icon={<RefreshCw className="h-4 w-4" />} loading={busy === 'activity'} onClick={() => call('activity', async () => { const res = await api('/photos/activity/refresh', { method: 'POST' }); toast(res.updated ? `${res.updated} media activity records updated` : 'Google returned no views for matching media'); })}>Refresh Google activity</Button></div>
    {!data && !error ? <Skeleton className="h-80" /> : !shown.length ? <p className="py-12 text-sm text-ink-muted">No media in this view.</p> : <div className="grid items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">{shown.map((media: any) => {
      const approved = media.approval?.status === 'approved';
      const video = media.mediaType === 'video';
      return <article key={media._id} className="overflow-hidden rounded-lg border border-line bg-white"><MediaPreview media={media} className="aspect-[4/3] w-full bg-mist object-contain" /><div className="p-3"><div className="flex flex-wrap justify-between gap-2"><Badge tone={approved ? 'good' : media.approval?.status === 'rejected' ? 'bad' : 'warn'}>{media.approval?.status || 'pending'}</Badge><Badge>{PHOTO_CATEGORIES.find((c) => c.value === media.category)?.label || media.category}</Badge></div><p className="mt-2 break-words text-sm font-medium">{media.caption || media.fileName}</p><p className="mt-1 text-xs text-ink-muted">{media.width && media.height ? `${media.width} x ${media.height} / ` : ''}{new Date(media.createdAt).toLocaleDateString()} / {media.google?.syncStatus === 'synced' ? 'Published' : media.queued ? 'Queued' : 'Library'}</p>{media.google?.viewCount != null && <p className="mt-1 text-xs text-ink-muted">{media.google.viewCount} Google views / checked {new Date(media.google.insightsAt).toLocaleDateString()}</p>}<div className="mt-3 flex flex-wrap gap-1"><Button size="sm" variant="ghost" title="Edit media" aria-label="Edit media" icon={<Pencil className="h-4 w-4" />} onClick={() => setEditing({ ...media, capturedAt: media.capturedAt?.slice(0, 10) || '' })} />{!approved && <Button size="sm" variant="secondary" icon={<Check className="h-4 w-4" />} disabled={!!busy} loading={busy === media._id} onClick={() => approve(media, 'approved')}>Approve</Button>}{media.approval?.status !== 'rejected' && <Button size="sm" variant="ghost" title="Reject media" aria-label="Reject media" disabled={!!busy} icon={<X className="h-4 w-4" />} onClick={() => approve(media, 'rejected')} />}{approved && !video && !['logo', 'cover'].includes(media.category) && !media.queued && media.google?.syncStatus !== 'synced' && <Button size="sm" variant="secondary" disabled={!!busy} icon={<Send className="h-4 w-4" />} onClick={() => call(media._id, async () => { await api(`/photos/${media._id}/queue`, { body: { queued: true } }); })}>Queue photo</Button>}</div></div></article>;
    })}</div>}
    {audit && <p className="mt-5 text-xs text-ink-muted">{audit.performanceNote}</p>}
    <Modal open={!!editing} onClose={() => setEditing(null)} title="Media details" footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button loading={busy === 'save'} onClick={save}>Save details</Button></>}>{editing && <div className="space-y-4"><Field label="Caption"><Textarea value={editing.caption || ''} maxLength={300} onChange={(e) => setEditing({ ...editing, caption: e.target.value })} /></Field><Field label="Category"><Select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })}>{PHOTO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select></Field><Field label="Date captured"><Input type="date" value={editing.capturedAt} onChange={(e) => setEditing({ ...editing, capturedAt: e.target.value })} /></Field><fieldset><legend className="mb-2 text-sm font-medium">Services shown</legend><div className="space-y-2">{(services?.services || []).filter((s: any) => s.active).map((s: any) => <label key={s._id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing.services?.includes(s._id) || false} onChange={(e) => setEditing({ ...editing, services: e.target.checked ? [...(editing.services || []), s._id] : (editing.services || []).filter((id: string) => id !== s._id) })} className="accent-brand-500" />{s.name}</label>)}</div></fieldset></div>}</Modal>
  </>;
}
