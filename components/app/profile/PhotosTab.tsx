'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ImagePlus, Sparkles, Trash2, Upload } from 'lucide-react';
import { Badge, Empty, Field, Panel, Segmented, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { PHOTO_CATEGORIES } from '@/lib/constants';
import { MediaPreview } from '@/components/app/MediaPreview';
import { cx } from '@/lib/format';
import { shrinkImage } from '@/lib/image';


import { useBusinessDraft, SaveBar } from './shared';

export default function PhotosTab() {
  const toast = useToast();
  const [category, setCategory] = useState('all');
  const [uploadCat, setUploadCat] = useState('interior');
  const [busy, setBusy] = useState(false);
  const { data, mutate } = useSWR(`/photos${category !== 'all' ? `?category=${category}` : ''}`);
  const [captioning, setCaptioning] = useState<string | null>(null);

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    const form = new FormData();
    // Shrink large photos in the browser first: faster uploads, and they stay under hosting body-size limits
    for (const f of [...files]) form.append('files', await shrinkImage(f), f.name);
    form.append('category', uploadCat);
    setBusy(true);
    try {
      const res = await api('/photos', { form });
      toast(`${res.photos.length} photo${res.photos.length > 1 ? 's' : ''} uploaded${res.queued ? ' and added to your weekly queue' : ''}`);
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };
  const caption = async (p: any) => {
    setCaptioning(p._id);
    try {
      const res = await api(`/photos/${p._id}/caption`, { method: 'POST' });
      await api(`/photos/${p._id}`, { method: 'PATCH', body: { caption: res.caption } });
      mutate();
    } finally {
      setCaptioning(null);
    }
  };
  const updateCaption = async (p: any, text: string) => {
    if (text === p.caption) return;
    await api(`/photos/${p._id}`, { method: 'PATCH', body: { caption: text } });
    mutate();
  };
  const remove = async (p: any) => {
    if (!window.confirm('Delete this photo from ReviewRankr? (It stays on Google if already published there.)')) return;
    await api(`/photos/${p._id}`, { method: 'DELETE' });
    mutate();
  };

  return (
    <>
      <Panel className="mb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <Field label="Upload as" className="sm:w-52">
            <Select value={uploadCat} onChange={(e) => setUploadCat(e.target.value)}>{PHOTO_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</Select>
          </Field>
          <label className={cx('flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-mist px-4 py-3 text-sm text-ink-soft hover:border-brand-200', busy && 'opacity-50')}>
            <Upload className="h-4 w-4" /> {busy ? 'Uploading…' : 'Choose JPG, PNG or WebP (up to 8 MB each)'}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" disabled={busy} onChange={(e) => upload(e.target.files)} />
          </label>
        </div>
        <p className="hint mt-3">Publish photos to Google from the Google profile page. Google only accepts photos it can download from a public address.</p>
      </Panel>
      <div className="mb-4">
        <Segmented value={category} onChange={setCategory} options={[{ value: 'all', label: 'All' }, ...PHOTO_CATEGORIES.map((c) => ({ value: c.value, label: c.label }))]} />
      </div>
      {!data ? <Skeleton className="h-48" /> : !data.photos.length ? (
        <Panel><Empty icon={<ImagePlus className="h-5 w-5" />} title="No photos yet">Profiles with photos of the space, team and work get noticeably more attention on Google.</Empty></Panel>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.photos.map((p: any) => (
            <li key={p._id} className="overflow-hidden rounded-xl2 bg-white shadow-lift">
              <div className="relative aspect-[4/3] bg-mist">
                <MediaPreview media={p} className="h-full w-full object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium">{PHOTO_CATEGORIES.find((c) => c.value === p.category)?.label}</span>
                <button onClick={() => remove(p)} className="absolute right-2 top-2 rounded-full bg-white/90 p-1.5 text-ink-muted hover:text-rose" aria-label="Delete photo"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
              <div className="p-3">
                <input defaultValue={p.caption} onBlur={(e) => updateCaption(p, e.target.value)} placeholder="Add a caption" className="w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm hover:border-line focus:border-brand-200 focus:outline-none" key={p.caption} />
                <div className="mt-2 flex items-center justify-between">
                  <button onClick={() => caption(p)} disabled={captioning === p._id} className="inline-flex items-center gap-1 text-xs font-medium text-violet"><Sparkles className="h-3 w-3" />{captioning === p._id ? 'Writing…' : 'AI caption'}</button>
                  {p.google?.syncStatus === 'synced' ? <Badge tone="good">On Google</Badge> : p.google?.syncStatus === 'failed' ? <Badge tone="bad" className="cursor-help">Failed</Badge> : p.google?.syncStatus === 'demo' ? <Badge>Demo</Badge> : <Badge>Not on Google</Badge>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
