'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Pencil, Plus, Sparkles, Trash2, X } from 'lucide-react';
import { Badge, Button, Empty, Field, Input, Modal, Panel, Skeleton, Textarea, Toggle, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { ServiceFinder } from '@/components/app/ServiceFinder';
import { cx, inr } from '@/lib/format';


import { useBusinessDraft, SaveBar } from './shared';

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

export default function ServicesTab() {
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
        <Panel><Empty title="Add the services you offer" action={<div className="flex gap-2"><Button variant="ai" onClick={() => setFinding(true)} icon={<Sparkles className="h-4 w-4" />}>Find my services</Button><Button variant="secondary" onClick={() => setEditing({ active: true })}>Add one</Button></div>}>ReviewRankr can suggest a full list for your type of business, or read it from your website or Google profile.</Empty></Panel>
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
