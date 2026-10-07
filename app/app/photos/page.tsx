'use client';

import Link from 'next/link';
import { useRef, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, ArrowDown, ArrowUp, CalendarClock, Check, ImagePlus, Images, Plus, Send, Upload, X } from 'lucide-react';
import { Badge, Button, Empty, PageHeader, Panel, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { PHOTO_CATEGORIES } from '@/lib/constants';
import { cx, dayTime, relDay, clock, shortDate } from '@/lib/format';
import { shrinkImage } from '@/lib/image';

const catLabel = (v: string) => PHOTO_CATEGORIES.find((c) => c.value === v)?.label || v;

export default function WeeklyPhotosPage() {
  const toast = useToast();
  const { data, mutate } = useSWR('/photos/schedule');
  const { data: lib, mutate: mutateLib } = useSWR('/photos');
  const [uploadCat, setUploadCat] = useState('services');
  const [busy, setBusy] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const refresh = () => {
    mutate();
    mutateLib();
  };

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const form = new FormData();
    for (const f of [...files].slice(0, 12)) form.append('files', await shrinkImage(f), f.name);
    form.append('category', uploadCat);
    setBusy('upload');
    try {
      const res = await api('/photos', { form });
      toast(`${res.photos.length} photo${res.photos.length > 1 ? 's' : ''} added${res.queued ? ' to the weekly queue' : ''}`);
      refresh();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const call = async (key: string, fn: () => Promise<any>, ok?: string) => {
    setBusy(key);
    try {
      await fn();
      if (ok) toast(ok);
      refresh();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const ids = data.queue.map((p: any) => p._id);
    const j = i + dir;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    // Show the new order straight away
    const queue = [...data.queue];
    [queue[i], queue[j]] = [queue[j], queue[i]];
    mutate({ ...data, queue }, false);
    call(`move-${ids[i]}`, () => api('/photos/queue/order', { body: { ids } }));
  };

  if (!data) {
    return (
      <>
        <PageHeader title="Weekly photos" />
        <Skeleton className="mb-6 h-32" />
        <Skeleton className="h-80" />
      </>
    );
  }

  const s = data.settings || { perWeek: 4, enabled: true };
  const perWeek = s.enabled === false ? 0 : s.perWeek;
  const next = data.queue.find((p: any) => p.scheduledFor);
  const queuedIds = new Set(data.queue.map((p: any) => p._id));
  const unqueued = (lib?.photos || []).filter((p: any) => !queuedIds.has(p._id) && !p.postedAt && !['logo', 'cover'].includes(p.category) && p.google?.syncStatus !== 'failed');
  const demo = data.connection === 'demo';

  return (
    <>
      <PageHeader
        title="Weekly photos"
        subtitle="Upload photos once. Starling posts a few to your Google profile every week, on different days, so it always looks fresh and active."
        actions={<Button onClick={() => fileRef.current?.click()} loading={busy === 'upload'} icon={<Upload className="h-4 w-4" />}>Upload photos</Button>}
      />
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => upload(e.target.files)} />

      {!data.connection && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-ink-soft">
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="flex-1">Connect Google to start posting. Your queue is ready and waits until then.</span>
          <Link href="/app/google" className="font-medium text-brand-600 hover:underline">Connect</Link>
        </div>
      )}

      <div className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
            <div>
              <p className="text-[13px] text-ink-muted">Plan</p>
              <p className="font-display text-2xl font-semibold">{perWeek ? `${perWeek} a week` : 'Off'}</p>
            </div>
            <div>
              <p className="text-[13px] text-ink-muted">This week</p>
              <p className="font-display text-2xl font-semibold tabular">{data.postedThisWeek}<span className="text-base text-ink-faint"> / {perWeek} posted</span></p>
            </div>
            <div>
              <p className="text-[13px] text-ink-muted">Next photo</p>
              <p className="font-display text-2xl font-semibold">{next ? `${relDay(next.scheduledFor)}, ${clock(next.scheduledFor)}` : '—'}</p>
            </div>
            <Link href="/app/autopilot" className="ml-auto text-sm font-medium text-brand-600 hover:underline">Change plan</Link>
          </div>
          {perWeek > 0 && data.queue.length < perWeek && (
            <p className="mt-4 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Only {data.queue.length} photo{data.queue.length === 1 ? '' : 's'} left in the queue. Add {perWeek - data.queue.length} more to keep this week full.</p>
          )}
          {demo && <p className="mt-4 text-xs text-ink-muted">Demo connection — photos are marked as posted here but not sent to Google.</p>}
        </Panel>

        <Panel>
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-500"><ImagePlus className="h-4 w-4" /></span>
            <div className="flex-1">
              <p className="font-medium">Add photos to the queue</p>
              <p className="mt-0.5 text-sm text-ink-muted">Real photos work best: your work, your team, your place. At least 720 × 720 px. No text, logos or stock images.</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)} className="h-9 w-40 py-1 text-sm" aria-label="Photo type">
                  {PHOTO_CATEGORIES.filter((c) => !['logo', 'cover'].includes(c.value)).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
                <Button size="sm" variant="secondary" className="h-9" onClick={() => fileRef.current?.click()} loading={busy === 'upload'} icon={<Upload className="h-3.5 w-3.5" />}>Choose photos</Button>
              </div>
            </div>
          </div>
        </Panel>
      </div>

      <Panel title={`Queue · ${data.queue.length}`} padded={false} className="mb-6">
        {data.queue.length === 0 ? (
          <Empty icon={<Images className="h-6 w-6" />} title="The queue is empty" action={<Button onClick={() => fileRef.current?.click()} icon={<Upload className="h-4 w-4" />}>Upload photos</Button>}>
            Upload 10–20 photos and Starling will keep posting them for weeks.
          </Empty>
        ) : (
          <ol className="divide-y divide-line-soft">
            {data.queue.map((p: any, i: number) => (
              <li key={p._id} className="flex items-center gap-3 px-5 py-3">
                <span className="w-5 text-right text-xs tabular text-ink-faint">{i + 1}</span>
                <img src={p.fileUrl} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover ring-1 ring-line-soft" />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    {p.scheduledFor ? (
                      <span className="inline-flex items-center gap-1 font-medium text-ink"><CalendarClock className="h-3.5 w-3.5 text-brand-500" />{dayTime(p.scheduledFor)}</span>
                    ) : (
                      <span className="text-ink-muted">{perWeek ? 'Waiting for a free slot' : 'Weekly photos are off'}</span>
                    )}
                    <Badge>{catLabel(p.category)}</Badge>
                  </p>
                  {p.caption && <p className="mt-0.5 truncate text-xs text-ink-muted">{p.caption}</p>}
                </div>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} icon={<ArrowUp className="h-4 w-4" />} />
                  <Button size="sm" variant="ghost" aria-label="Move down" disabled={i === data.queue.length - 1} onClick={() => move(i, 1)} icon={<ArrowDown className="h-4 w-4" />} />
                  <Button size="sm" variant="secondary" className="hidden sm:inline-flex" onClick={() => call(`now-${p._id}`, () => api(`/photos/${p._id}/post-now`, { method: 'POST' }), demo ? 'Marked as posted (demo)' : 'Photo sent to Google')} loading={busy === `now-${p._id}`} icon={<Send className="h-3.5 w-3.5" />}>Post now</Button>
                  <Button size="sm" variant="ghost" aria-label="Remove from queue" title="Remove from queue" onClick={() => call(`rm-${p._id}`, () => api(`/photos/${p._id}/queue`, { body: { queued: false } }), 'Removed from the queue')} icon={<X className="h-4 w-4" />} />
                </div>
              </li>
            ))}
          </ol>
        )}
      </Panel>

      {data.failed.length > 0 && (
        <Panel title="Google didn’t accept these" className="mb-6">
          <ul className="space-y-3">
            {data.failed.map((p: any) => (
              <li key={p._id} className="flex items-center gap-3">
                <img src={p.fileUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
                <p className="flex-1 text-sm text-rose">{p.google?.error || 'Upload failed'}</p>
                <Button size="sm" variant="secondary" onClick={() => call(`rq-${p._id}`, () => api(`/photos/${p._id}/queue`, { body: { queued: true } }), 'Back in the queue')} loading={busy === `rq-${p._id}`}>Try again</Button>
              </li>
            ))}
          </ul>
        </Panel>
      )}

      {unqueued.length > 0 && (
        <Panel title="Other photos in your library" className="mb-6">
          <p className="-mt-2 mb-4 text-sm text-ink-muted">Not in the queue yet.</p>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {unqueued.map((p: any) => (
              <div key={p._id} className="group relative">
                <img src={p.fileUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <button onClick={() => call(`q-${p._id}`, () => api(`/photos/${p._id}/queue`, { body: { queued: true } }), 'Added to the queue')} className="absolute inset-x-1.5 bottom-1.5 inline-flex items-center justify-center gap-1 rounded-md bg-white/95 py-1 text-xs font-medium text-brand-700 shadow-sm hover:bg-white">
                  <Plus className="h-3 w-3" />Queue
                </button>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel title="Posted recently">
        {data.posted.length === 0 ? (
          <p className="text-sm text-ink-muted">Nothing posted yet. The first photo goes out at its scheduled time.</p>
        ) : (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {data.posted.map((p: any) => (
              <figure key={p._id}>
                <img src={p.fileUrl} alt="" className="aspect-square w-full rounded-lg object-cover" />
                <figcaption className="mt-1 flex items-center gap-1 text-[11px] text-ink-muted">
                  <Check className={cx('h-3 w-3', p.google?.syncStatus === 'synced' ? 'text-leaf' : 'text-ink-faint')} />
                  {shortDate(p.postedAt)}{p.google?.syncStatus === 'demo' ? ' · demo' : ''}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </Panel>
    </>
  );
}
