'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Copy, ImagePlus, Pencil, Plus, Sparkles, Trash2, Upload, X } from 'lucide-react';
import { AiMark, Badge, Button, Empty, Field, Input, Modal, PageHeader, Panel, Segmented, Select, Skeleton, Textarea, Toggle, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { CATEGORIES, DAYS, PHOTO_CATEGORIES } from '@/lib/constants';
import { ServiceFinder } from '@/components/app/ServiceFinder';
import { cx, inr } from '@/lib/format';

type Tab = 'info' | 'hours' | 'services' | 'photos' | 'links' | 'description';

/* Shared: edit a slice of the business and save it ------------------------ */

function useBusinessDraft() {
  const { business, setBusiness } = useAuth();
  const toast = useToast();
  const [draft, setDraft] = useState<any>(business);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  useEffect(() => setDraft(business), [business]);
  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(business), [draft, business]);
  const save = async (fields: string[]) => {
    setSaving(true);
    setErrors({});
    try {
      const body: any = {};
      for (const f of fields) body[f] = draft[f];
      const res = await api('/business', { method: 'PATCH', body });
      setBusiness(res.business);
      toast('Saved');
    } catch (e: any) {
      setErrors(e.details || {});
      toast(e.message, 'bad');
    } finally {
      setSaving(false);
    }
  };
  return { draft, setDraft, save, saving, dirty, errors };
}

function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
  return (
    <div
      role="status"
      aria-hidden={!dirty}
      className={cx(
        'sticky bottom-4 z-20 mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-brand-700 px-4 py-3 text-white shadow-pop ring-1 ring-brand-800/40 transition-all',
        dirty ? 'translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-4 opacity-0'
      )}
    >
      <span className="text-sm font-medium">You have unsaved changes</span>
      <div className="flex gap-2">
        <Button size="sm" variant="ghostInverse" onClick={onReset}>Discard</Button>
        <Button size="sm" variant="inverse" onClick={onSave} loading={saving}>Save changes</Button>
      </div>
    </div>
  );
}

/* Basic information -------------------------------------------------------- */

function InfoTab() {
  const { business } = useAuth();
  const { draft, setDraft, save, saving, dirty, errors } = useBusinessDraft();
  if (!draft) return null;
  const set = (k: string, v: any) => setDraft({ ...draft, [k]: v });
  const setAddr = (k: string, v: string) => setDraft({ ...draft, address: { ...draft.address, [k]: v } });
  const fields = ['name', 'category', 'phone', 'email', 'address', 'serviceAreas', 'staff', 'policies'];
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Business">
          <div className="space-y-4">
            <Field label="Business name" error={errors.name}><Input value={draft.name} onChange={(e) => set('name', e.target.value)} /></Field>
            <Field label="Category" hint="Your primary category on Google is managed in Google.">
              <Select value={CATEGORIES.includes(draft.category) ? draft.category : 'Other'} onChange={(e) => set('category', e.target.value)}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Select>
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Phone" error={errors.phone}><Input value={draft.phone} onChange={(e) => set('phone', e.target.value)} inputMode="tel" /></Field>
              <Field label="Email" error={errors.email}><Input type="email" value={draft.email} onChange={(e) => set('email', e.target.value)} /></Field>
            </div>
          </div>
        </Panel>
        <Panel title="Address">
          <div className="space-y-4">
            <Field label="Street address"><Input value={draft.address?.line1 || ''} onChange={(e) => setAddr('line1', e.target.value)} /></Field>
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="City"><Input value={draft.address?.city || ''} onChange={(e) => setAddr('city', e.target.value)} /></Field>
              <Field label="State"><Input value={draft.address?.state || ''} onChange={(e) => setAddr('state', e.target.value)} /></Field>
              <Field label="PIN code"><Input value={draft.address?.postalCode || ''} onChange={(e) => setAddr('postalCode', e.target.value)} inputMode="numeric" /></Field>
            </div>
            <Field label="Areas you serve" hint="Comma separated, e.g. Noida, Greater Noida">
              <Input value={(draft.serviceAreas || []).join(', ')} onChange={(e) => set('serviceAreas', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} />
            </Field>
          </div>
        </Panel>
        <Panel title="Team" action={<Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => set('staff', [...(draft.staff || []), { name: '', role: '' }])}>Add person</Button>}>
          <p className="-mt-2 mb-3 text-sm text-ink-muted">Starling uses names to recognise staff mentioned in reviews and in replies.</p>
          <ul className="space-y-2">
            {(draft.staff || []).map((s: any, i: number) => (
              <li key={i} className="flex gap-2">
                <Input placeholder="Name" value={s.name} onChange={(e) => set('staff', draft.staff.map((x: any, j: number) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <Input placeholder="Role" value={s.role || ''} onChange={(e) => set('staff', draft.staff.map((x: any, j: number) => (j === i ? { ...x, role: e.target.value } : x)))} />
                <Button variant="ghost" aria-label="Remove" onClick={() => set('staff', draft.staff.filter((_: any, j: number) => j !== i))} icon={<X className="h-4 w-4" />} />
              </li>
            ))}
            {!draft.staff?.length && <li className="text-sm text-ink-faint">No team members added.</li>}
          </ul>
        </Panel>
        <Panel title="Policies">
          <Textarea rows={5} value={draft.policies || ''} onChange={(e) => set('policies', e.target.value)} placeholder="Cancellation, late arrival, payment methods…" />
          <p className="hint">Shared with the AI so replies don’t contradict your policies.</p>
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save(fields)} onReset={() => setDraft(business)} />
    </>
  );
}

/* Hours ------------------------------------------------------------------- */

function HoursTab() {
  const { business } = useAuth();
  const { draft, setDraft, save, saving, dirty } = useBusinessDraft();
  if (!draft) return null;
  const setDay = (i: number, patch: any) => setDraft({ ...draft, hours: draft.hours.map((h: any, j: number) => (j === i ? { ...h, ...patch } : h)) });
  const copyToAll = (i: number) => setDraft({ ...draft, hours: draft.hours.map((h: any) => (h.closed ? h : { ...h, open: draft.hours[i].open, close: draft.hours[i].close })) });
  const special = draft.specialHours || [];
  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Regular hours">
          <ul className="divide-y divide-line-soft">
            {DAYS.map((day) => {
              const i = draft.hours.findIndex((h: any) => h.day === day);
              const h = draft.hours[i];
              return (
                <li key={day} className="flex flex-wrap items-center gap-3 py-2.5">
                  <span className="w-24 text-sm font-medium capitalize">{day}</span>
                  <label className="flex items-center gap-2 text-sm text-ink-soft">
                    <input type="checkbox" checked={!h.closed} onChange={(e) => setDay(i, { closed: !e.target.checked })} className="h-4 w-4 accent-brand-500" /> Open
                  </label>
                  {h.closed ? (
                    <span className="text-sm text-ink-faint">Closed</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Input type="time" value={h.open} onChange={(e) => setDay(i, { open: e.target.value })} className="h-9 w-[120px] py-1" aria-label={`${day} opens`} />
                      <span className="text-ink-faint">to</span>
                      <Input type="time" value={h.close} onChange={(e) => setDay(i, { close: e.target.value })} className="h-9 w-[120px] py-1" aria-label={`${day} closes`} />
                      <button onClick={() => copyToAll(i)} className="rounded-lg p-1.5 text-ink-faint hover:bg-mist hover:text-brand-600" title="Copy to all open days" aria-label="Copy to all open days"><Copy className="h-4 w-4" /></button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>
        <Panel title="Holidays & special hours" action={<Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setDraft({ ...draft, specialHours: [...special, { date: new Date().toISOString().slice(0, 10), closed: true, note: '' }] })}>Add date</Button>}>
          <ul className="space-y-3">
            {special.map((s: any, i: number) => {
              const upd = (patch: any) => setDraft({ ...draft, specialHours: special.map((x: any, j: number) => (j === i ? { ...x, ...patch } : x)) });
              return (
                <li key={i} className="rounded-xl bg-mist p-3">
                  <div className="flex gap-2">
                    <Input type="date" value={s.date} onChange={(e) => upd({ date: e.target.value })} className="h-9 py-1" />
                    <Input placeholder="Diwali" value={s.note || ''} onChange={(e) => upd({ note: e.target.value })} className="h-9 py-1" />
                    <Button variant="ghost" aria-label="Remove" onClick={() => setDraft({ ...draft, specialHours: special.filter((_: any, j: number) => j !== i) })} icon={<X className="h-4 w-4" />} />
                  </div>
                  <div className="mt-2 flex items-center gap-2 text-sm">
                    <label className="flex items-center gap-2"><input type="checkbox" checked={s.closed} onChange={(e) => upd({ closed: e.target.checked })} className="accent-brand-500" />Closed all day</label>
                    {!s.closed && (<><Input type="time" value={s.open || '10:00'} onChange={(e) => upd({ open: e.target.value })} className="h-8 w-28 py-0" /><Input type="time" value={s.close || '18:00'} onChange={(e) => upd({ close: e.target.value })} className="h-8 w-28 py-0" /></>)}
                  </div>
                </li>
              );
            })}
            {!special.length && <li className="text-sm text-ink-faint">No special dates.</li>}
          </ul>
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save(['hours', 'specialHours'])} onReset={() => setDraft(business)} />
    </>
  );
}

/* Services / menu ---------------------------------------------------------- */

function ServiceModal({ service, onClose, onDone }: { service: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [form, setForm] = useState<any>(service || {});
  const [busy, setBusy] = useState('');
  useEffect(() => setForm(service || {}), [service]);
  if (!service) return null;
  const isNew = !service._id;
  const save = async () => {
    setBusy('save');
    try {
      const body = { name: form.name, description: form.description || '', category: form.category || 'General', price: form.price === '' || form.price == null ? null : Number(form.price), duration: form.duration === '' || form.duration == null ? null : Number(form.duration), active: form.active !== false, reviewTopics: form.reviewTopics || [] };
      if (isNew) await api('/services', { body });
      else await api(`/services/${service._id}`, { method: 'PATCH', body });
      toast(isNew ? 'Service added' : 'Service saved');
      onDone();
      onClose();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  const describe = async () => {
    if (isNew) return toast('Save the service first, then generate a description', 'bad');
    setBusy('ai');
    try {
      const res = await api('/ai/content', { body: { kind: 'service', serviceId: service._id } });
      setForm({ ...form, description: res.text, _ai: true });
    } finally {
      setBusy('');
    }
  };
  const topics = async () => {
    setBusy('topics');
    try {
      const res = await api('/ai/topics', { body: { serviceName: form.name } });
      setForm({ ...form, reviewTopics: res.topics });
    } finally {
      setBusy('');
    }
  };
  return (
    <Modal open onClose={onClose} title={isNew ? 'Add a service' : `Edit ${service.name}`} footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy === 'save'} disabled={!form.name?.trim()}>{isNew ? 'Add service' : 'Save service'}</Button></>}>
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name"><Input value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
          <Field label="Group"><Input value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Hair, Skin, Classes…" /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Price (₹)"><Input type="number" min={0} value={form.price ?? ''} onChange={(e) => setForm({ ...form, price: e.target.value })} /></Field>
          <Field label="Duration (minutes)"><Input type="number" min={0} value={form.duration ?? ''} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></Field>
        </div>
        <Field label="Description" hint={`${(form.description || '').length}/300`}>
          <div className={cx('rounded-lg', form._ai && 'ai-sheen p-[1px]')}>
            <Textarea rows={3} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value, _ai: false })} maxLength={300} className={form._ai ? 'border-0' : ''} />
          </div>
          <button onClick={describe} disabled={busy === 'ai'} className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-violet hover:underline"><Sparkles className="h-3 w-3" />{busy === 'ai' ? 'Writing…' : 'Write with AI'}</button>
        </Field>
        <Field label="Review topics" hint="Neutral prompts shown to customers on the review page. They write the review themselves.">
          <div className="flex flex-wrap gap-1.5">
            {(form.reviewTopics || []).map((t: string, i: number) => (
              <span key={i} className="inline-flex items-center gap-1 rounded-full bg-mist px-2.5 py-1 text-xs">{t}<button aria-label={`Remove ${t}`} onClick={() => setForm({ ...form, reviewTopics: form.reviewTopics.filter((_: any, j: number) => j !== i) })}><X className="h-3 w-3" /></button></span>
            ))}
            <button onClick={topics} disabled={busy === 'topics' || !form.name} className="inline-flex items-center gap-1 rounded-full border border-dashed border-violet/40 px-2.5 py-1 text-xs font-medium text-violet"><Sparkles className="h-3 w-3" />{busy === 'topics' ? 'Suggesting…' : 'Suggest topics'}</button>
          </div>
        </Field>
        <Toggle checked={form.active !== false} onChange={(v) => setForm({ ...form, active: v })} label="Offered" description="Hidden services aren’t used by AI or synced to Google." />
      </div>
    </Modal>
  );
}

function ServicesTab() {
  const toast = useToast();
  const { business } = useAuth();
  const { data, mutate } = useSWR('/services');
  const [editing, setEditing] = useState<any>(null);
  const [finding, setFinding] = useState(false);
  const services = data?.services || [];
  const groups = useMemo(() => {
    const m = new Map<string, any[]>();
    for (const s of services) m.set(s.category || 'General', [...(m.get(s.category || 'General') || []), s]);
    return [...m.entries()];
  }, [services]);

  const remove = async (s: any) => {
    if (!window.confirm(`Delete ${s.name}?`)) return;
    await api(`/services/${s._id}`, { method: 'DELETE' });
    mutate();
  };

  if (!data) return <Skeleton className="h-64" />;
  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">{services.length ? `${services.length} services. Customers pick from these on the review page.` : ''}</p>
        <div className="flex gap-2">
          <Button variant="ai" onClick={() => setFinding(true)} icon={<Sparkles className="h-4 w-4" />}>Find services</Button>
          <Button variant="secondary" onClick={() => setEditing({ active: true })} icon={<Plus className="h-4 w-4" />}>Add one</Button>
        </div>
      </div>
      {!services.length ? (
        <Panel><Empty title="Add the services you offer" action={<div className="flex gap-2"><Button variant="ai" onClick={() => setFinding(true)} icon={<Sparkles className="h-4 w-4" />}>Find my services</Button><Button variant="secondary" onClick={() => setEditing({ active: true })}>Add one</Button></div>}>Starling can suggest a full list for your type of business, or read it from your website or Google profile.</Empty></Panel>
      ) : (
        <div className="space-y-6">
          {groups.map(([group, items]) => (
            <Panel key={group} title={group} padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px] table-fixed text-sm">
                  <colgroup><col /><col className="w-[110px]" /><col className="w-[110px]" /><col className="w-[130px]" /><col className="w-[96px]" /></colgroup>
                  <thead className="text-left text-xs text-ink-muted"><tr><th className="px-5 py-2 font-medium">Service</th><th className="px-3 py-2 text-right font-medium">Price</th><th className="px-3 py-2 text-right font-medium">Duration</th><th className="px-3 py-2 font-medium">Google</th><th className="w-20" /></tr></thead>
                  <tbody className="divide-y divide-line-soft border-t border-line-soft">
                    {items.map((s: any) => (
                      <tr key={s._id} className={cx(!s.active && 'opacity-50')}>
                        <td className="px-5 py-3"><p className="font-medium">{s.name}</p>{s.description && <p className="line-clamp-1 max-w-md text-xs text-ink-muted">{s.description}</p>}</td>
                        <td className="px-3 py-3 text-right tabular">{s.price ? inr(s.price) : '—'}</td>
                        <td className="px-3 py-3 text-right tabular text-ink-soft">{s.duration ? `${s.duration} min` : '—'}</td>
                        <td className="px-3 py-3">{s.google?.syncStatus === 'synced' ? <Badge tone="good">Synced</Badge> : s.google?.syncStatus === 'demo' ? <Badge>Demo</Badge> : s.google?.syncStatus === 'failed' ? <Badge tone="bad">Failed</Badge> : <Badge tone="neutral">Not synced</Badge>}</td>
                        <td className="px-3 py-3"><div className="flex justify-end gap-1"><button onClick={() => setEditing(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-mist" aria-label={`Edit ${s.name}`}><Pencil className="h-4 w-4" /></button><button onClick={() => remove(s)} className="rounded-lg p-1.5 text-ink-muted hover:bg-rose-soft hover:text-rose" aria-label={`Delete ${s.name}`}><Trash2 className="h-4 w-4" /></button></div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Panel>
          ))}
        </div>
      )}
      <ServiceModal service={editing} onClose={() => setEditing(null)} onDone={() => mutate()} />
      <ServiceFinder open={finding} onClose={() => setFinding(false)} onDone={() => mutate()} website={business?.links?.website} />
    </>
  );
}

/** Resizes an image to at most 2000px on the long side as JPEG (keeps small files as they are). */
async function shrinkImage(file: File): Promise<Blob> {
  if (file.size < 1.5 * 1024 * 1024 || !/image\/(jpeg|png|webp)/.test(file.type)) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 2000 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob && blob.size < file.size ? new File([blob], file.name.replace(/\.\w+$/, '.jpg'), { type: 'image/jpeg' }) : file;
  } catch {
    return file;
  }
}

/* Photos -------------------------------------------------------------------- */

function PhotosTab() {
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
      toast(`${res.photos.length} photo${res.photos.length > 1 ? 's' : ''} uploaded`);
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
    if (!window.confirm('Delete this photo from Starling? (It stays on Google if already published there.)')) return;
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
                <img src={p.fileUrl} alt={p.caption || p.category} className="h-full w-full object-cover" loading="lazy" />
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

/* Links --------------------------------------------------------------------- */

const LINKS = [
  { key: 'website', label: 'Website', hint: 'Synced to Google' },
  { key: 'booking', label: 'Booking page' },
  { key: 'appointment', label: 'Appointment link' },
  { key: 'ordering', label: 'Online ordering' },
  { key: 'whatsapp', label: 'WhatsApp link', placeholder: 'https://wa.me/919811024567' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
];

function LinksTab() {
  const { business } = useAuth();
  const { draft, setDraft, save, saving, dirty, errors } = useBusinessDraft();
  if (!draft) return null;
  return (
    <>
      <Panel>
        <div className="grid gap-5 md:grid-cols-2">
          {LINKS.map((l) => (
            <Field key={l.key} label={l.label} hint={l.hint} error={errors[`links.${l.key}`]}>
              <Input type="url" placeholder={l.placeholder || 'https://'} value={draft.links?.[l.key] || ''} onChange={(e) => setDraft({ ...draft, links: { ...draft.links, [l.key]: e.target.value } })} />
            </Field>
          ))}
        </div>
      </Panel>
      <SaveBar dirty={dirty} saving={saving} onSave={() => save(['links'])} onReset={() => setDraft(business)} />
    </>
  );
}

/* Description + AI content assistant ----------------------------------------- */

function DescriptionTab() {
  const toast = useToast();
  const { business } = useAuth();
  const { draft, setDraft, save, saving, dirty } = useBusinessDraft();
  const [aiWritten, setAiWritten] = useState(false);
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState('');
  const [extra, setExtra] = useState<{ kind: string; text: string } | null>(null);
  if (!draft) return null;
  const len = (draft.description || '').length;

  const generate = async () => {
    setBusy('desc');
    try {
      const res = await api('/ai/content', { body: { kind: 'description', instruction: instruction || undefined } });
      setDraft({ ...draft, description: res.text });
      setAiWritten(true);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  const other = async (kind: 'faq' | 'promo') => {
    setBusy(kind);
    try {
      const res = await api('/ai/content', { body: { kind } });
      setExtra({ kind, text: res.text });
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Panel title="Business description">
          <p className="-mt-2 mb-3 text-sm text-ink-muted">Shown on your Google profile. Describe what you offer and what makes a visit good — no links, prices or phone numbers.</p>
          <div className={cx('rounded-xl', aiWritten ? 'ai-sheen p-3' : '')}>
            {aiWritten && <AiMark className="mb-1" label="AI suggestion — edit before saving" />}
            <Textarea rows={8} value={draft.description || ''} maxLength={750} onChange={(e) => { setDraft({ ...draft, description: e.target.value }); setAiWritten(false); }} className={aiWritten ? 'border-0 px-0 focus:ring-0' : ''} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={cx('tabular', len > 700 ? 'text-amber' : 'text-ink-muted')}>{len} / 750</span>
          </div>
          <div className="mt-4 flex flex-col gap-2 border-t border-line-soft pt-4 sm:flex-row">
            <input className="field h-10 flex-1 text-sm" placeholder="Optional: what to emphasise (e.g. bridal makeup, women-only staff)" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
            <Button variant="ai" onClick={generate} loading={busy === 'desc'} icon={<Sparkles className="h-4 w-4" />}>{draft.description ? 'Rewrite with AI' : 'Write with AI'}</Button>
          </div>
        </Panel>
        <Panel title="More with the content assistant">
          <p className="-mt-2 mb-4 text-sm text-ink-muted">Generated from your real services and details. Copy what you like.</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => other('faq')} loading={busy === 'faq'} icon={<Sparkles className="h-3.5 w-3.5 text-violet" />}>FAQ answers</Button>
            <Button variant="secondary" size="sm" onClick={() => other('promo')} loading={busy === 'promo'} icon={<Sparkles className="h-3.5 w-3.5 text-violet" />}>Google post</Button>
          </div>
          {extra && (
            <div className="ai-sheen mt-4 rounded-xl p-3">
              <div className="flex items-center justify-between"><AiMark label={extra.kind === 'faq' ? 'FAQ draft' : 'Post draft'} /><button onClick={() => { navigator.clipboard.writeText(extra.text); toast('Copied'); }} className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-brand-600"><Copy className="h-3 w-3" />Copy</button></div>
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">{extra.text}</p>
            </div>
          )}
        </Panel>
      </div>
      <SaveBar dirty={dirty} saving={saving} onSave={() => { save(['description']); setAiWritten(false); }} onReset={() => { setDraft(business); setAiWritten(false); }} />
    </>
  );
}

function ProfileInner() {
  const params = useSearchParams();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) || 'info');
  const change = (t: Tab) => { setTab(t); router.replace(`/app/profile?tab=${t}`, { scroll: false }); };
  return (
    <>
      <PageHeader title="Business profile" subtitle="The details behind your Google listing, your review requests and every AI reply." />
      <div className="mb-6">
        <Segmented<Tab>
          value={tab}
          onChange={change}
          options={[
            { value: 'info', label: 'Basic information' },
            { value: 'hours', label: 'Hours' },
            { value: 'services', label: 'Services / menu' },
            { value: 'photos', label: 'Photos' },
            { value: 'links', label: 'Website & links' },
            { value: 'description', label: 'Description' },
          ]}
        />
      </div>
      {tab === 'info' && <InfoTab />}
      {tab === 'hours' && <HoursTab />}
      {tab === 'services' && <ServicesTab />}
      {tab === 'photos' && <PhotosTab />}
      {tab === 'links' && <LinksTab />}
      {tab === 'description' && <DescriptionTab />}
    </>
  );
}

export default function ProfilePage() {
  return <Suspense><ProfileInner /></Suspense>;
}
