'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { Plus, Search, Send, Trash2, Upload, Users, X } from 'lucide-react';
import { Avatar, Badge, Button, Drawer, Empty, Field, Input, Modal, PageHeader, Segmented, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { inr, shortDate, timeAgo } from '@/lib/format';

const REVIEW_STATUS: Record<string, { label: string; tone: any }> = {
  none: { label: 'Not asked', tone: 'neutral' },
  requested: { label: 'Asked', tone: 'info' },
  clicked: { label: 'Opened link', tone: 'warn' },
  reviewed: { label: 'Reviewed', tone: 'good' },
};

function AddCustomer({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { data: svc } = useSWR(open ? '/services' : null);
  const [form, setForm] = useState({ name: '', phone: '', email: '', serviceId: '', date: new Date().toISOString().slice(0, 10) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const save = async () => {
    setBusy(true);
    setErrors({});
    try {
      await api('/customers', { body: { name: form.name, phone: form.phone, email: form.email, visit: form.serviceId ? { serviceId: form.serviceId, date: form.date } : undefined } });
      toast(`${form.name} added`);
      setForm({ name: '', phone: '', email: '', serviceId: '', date: new Date().toISOString().slice(0, 10) });
      onDone();
      onClose();
    } catch (e: any) {
      setErrors(e.details || {});
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Add a customer" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={save} loading={busy} disabled={!form.name.trim()}>Add customer</Button></>}>
      <div className="space-y-4">
        <Field label="Name" error={errors.name}><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus /></Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Phone" hint="Used for WhatsApp and SMS"><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} inputMode="tel" /></Field>
          <Field label="Email" error={errors.email}><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Service today (optional)">
            <Select value={form.serviceId} onChange={(e) => setForm({ ...form, serviceId: e.target.value })}>
              <option value="">No visit to log</option>
              {(svc?.services || []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
          </Field>
          <Field label="Visit date"><Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} disabled={!form.serviceId} /></Field>
        </div>
      </div>
    </Modal>
  );
}

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/).filter(Boolean);
  if (!lines.length) return [];
  const split = (l: string) => l.match(/("([^"]|"")*"|[^,]*)(,|$)/g)!.map((c) => c.replace(/,$/, '').replace(/^"|"$/g, '').replace(/""/g, '"').trim()).slice(0, -1);
  const head = split(lines[0]).map((h) => h.toLowerCase());
  const hasHeader = head.includes('name');
  const cols = hasHeader ? head : ['name', 'phone', 'email', 'service', 'date'];
  return (hasHeader ? lines.slice(1) : lines).map((l) => {
    const cells = split(l);
    const row: any = {};
    cols.forEach((c, i) => { if (cells[i]) row[c] = cells[i]; });
    return row;
  }).filter((r) => r.name);
}

function ImportCustomers({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const rows = parseCsv(text);
  const onFile = async (f?: File) => f && setText(await f.text());
  const run = async () => {
    setBusy(true);
    try {
      const res = await api('/customers/import', { body: { rows } });
      toast(`${res.created} added, ${res.updated} updated`);
      setText('');
      onDone();
      onClose();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal open={open} onClose={onClose} title="Import customers" wide footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={run} loading={busy} disabled={!rows.length}>Import {rows.length || ''} customers</Button></>}>
      <p className="text-sm text-ink-muted">Columns: <code className="rounded bg-mist px-1">name, phone, email, service, date</code>. Existing customers are matched by phone or email, and the visit is added to them.</p>
      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-mist px-4 py-5 text-sm text-ink-soft hover:border-brand-200">
        <Upload className="h-4 w-4" /> Choose a CSV file
        <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      <Textarea className="mt-3 font-mono text-xs" rows={6} placeholder={'name,phone,email,service,date\nPriya Sharma,9810011122,priya@example.com,Facial,2026-09-28'} value={text} onChange={(e) => setText(e.target.value)} />
      {rows.length > 0 && <p className="mt-2 text-xs text-ink-muted">{rows.length} rows found. First: {rows[0].name}{rows[0].service ? ` — ${rows[0].service}` : ''}</p>}
    </Modal>
  );
}

function CustomerDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const router = useRouter();
  const { data, mutate } = useSWR(`/customers/${id}`);
  const { data: svc } = useSWR('/services');
  const [visit, setVisit] = useState({ serviceId: '', date: new Date().toISOString().slice(0, 10) });
  const [notes, setNotes] = useState<string | null>(null);

  if (!data) return <div className="p-8"><Skeleton className="h-8 w-48" /><Skeleton className="mt-4 h-32" /></div>;
  const c = data.customer;
  const addVisit = async () => {
    if (!visit.serviceId) return;
    try {
      await api(`/customers/${id}/visits`, { body: visit });
      toast('Visit added');
      mutate();
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    }
  };
  const saveNotes = async () => {
    await api(`/customers/${id}`, { method: 'PATCH', body: { notes } });
    toast('Notes saved');
    setNotes(null);
    mutate();
  };
  const remove = async () => {
    if (!window.confirm(`Delete ${c.name} and their review requests?`)) return;
    await api(`/customers/${id}`, { method: 'DELETE' });
    toast('Customer deleted');
    onChanged();
    onClose();
  };
  const spent = (c.visits || []).reduce((s: number, v: any) => s + (v.amount || 0), 0);

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-mist/95 px-6 py-4 backdrop-blur">
        <Badge tone={REVIEW_STATUS[c.reviewStatus]?.tone}>{REVIEW_STATUS[c.reviewStatus]?.label}</Badge>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-white" aria-label="Close"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} size={56} />
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl font-semibold">{c.name}</h2>
            <p className="text-sm text-ink-muted">{[c.phone, c.email].filter(Boolean).join(' · ') || 'No contact details'}</p>
          </div>
          <Button size="sm" onClick={() => router.push(`/app/requests?new=1&customer=${c._id}`)} icon={<Send className="h-3.5 w-3.5" />}>Ask for review</Button>
        </div>

        <div className="grid grid-cols-3 divide-x divide-line-soft rounded-xl bg-white py-3 text-center">
          <div><p className="font-display text-xl font-semibold tabular">{c.visits?.length || 0}</p><p className="text-xs text-ink-muted">visits</p></div>
          <div><p className="font-display text-xl font-semibold tabular">{spent ? inr(spent) : '—'}</p><p className="text-xs text-ink-muted">spent</p></div>
          <div><p className="font-display text-xl font-semibold">{c.lastVisit ? timeAgo(c.lastVisit) : '—'}</p><p className="text-xs text-ink-muted">last visit</p></div>
        </div>

        {c.googleReview && (
          <div className="rounded-xl bg-leaf-soft p-4 text-sm">
            <p className="font-medium text-leaf">Left a {c.googleReview.rating}★ Google review</p>
            {c.googleReview.comment && <p className="mt-1 text-ink-soft">“{c.googleReview.comment}”</p>}
          </div>
        )}

        <section>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Visits</h3>
          <ul className="divide-y divide-line-soft rounded-xl bg-white">
            {[...(c.visits || [])].reverse().map((v: any) => (
              <li key={v._id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <span className="font-medium">{v.serviceName || 'Visit'}</span>
                <span className="text-ink-muted">{shortDate(v.date)}{v.amount ? ` · ${inr(v.amount)}` : ''}</span>
              </li>
            ))}
            {!c.visits?.length && <li className="px-4 py-3 text-sm text-ink-faint">No visits logged</li>}
          </ul>
          <div className="mt-2 flex gap-2">
            <Select value={visit.serviceId} onChange={(e) => setVisit({ ...visit, serviceId: e.target.value })} className="h-9 flex-1 py-1 text-sm" aria-label="Service">
              <option value="">Log a visit…</option>
              {(svc?.services || []).map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
            <Input type="date" value={visit.date} onChange={(e) => setVisit({ ...visit, date: e.target.value })} className="h-9 w-40 py-1 text-sm" aria-label="Date" />
            <Button size="sm" className="h-9" variant="secondary" onClick={addVisit} disabled={!visit.serviceId}>Add</Button>
          </div>
        </section>

        <section>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Review requests</h3>
          {data.requests.length ? (
            <ul className="space-y-2">
              {data.requests.map((r: any) => (
                <li key={r._id} className="rounded-xl bg-white px-4 py-3 text-sm">
                  <div className="flex items-center justify-between"><span className="font-medium">{r.serviceName || 'Visit'}</span><Badge tone={r.status === 'reviewed' ? 'good' : 'info'} className="capitalize">{r.status}</Badge></div>
                  <p className="mt-1 line-clamp-2 text-ink-muted">{r.message}</p>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-ink-faint">Not asked yet.</p>}
        </section>

        <section>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Notes</h3>
          <Textarea rows={3} value={notes ?? c.notes ?? ''} onChange={(e) => setNotes(e.target.value)} placeholder="Preferences, allergies, favourite stylist…" />
          {notes !== null && <div className="mt-2 flex justify-end"><Button size="sm" onClick={saveNotes}>Save notes</Button></div>}
        </section>

        <button onClick={remove} className="inline-flex items-center gap-1.5 text-sm text-rose hover:underline"><Trash2 className="h-4 w-4" />Delete customer</button>
      </div>
    </div>
  );
}

function CustomersInner() {
  const params = useSearchParams();
  const [segment, setSegment] = useState('all');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [open, setOpen] = useState<string | null>(params.get('open'));
  useEffect(() => { const t = setTimeout(() => setQuery(q), 300); return () => clearTimeout(t); }, [q]);
  const { data, mutate } = useSWR(`/customers?limit=200${segment !== 'all' ? `&segment=${segment}` : ''}${query ? `&q=${encodeURIComponent(query)}` : ''}`);

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="A light client list: who visited, for what, and whether they’ve been asked for a review."
        actions={<><Button variant="secondary" onClick={() => setImporting(true)} icon={<Upload className="h-4 w-4" />}>Import CSV</Button><Button onClick={() => setAdding(true)} icon={<Plus className="h-4 w-4" />}>Add customer</Button></>}
      />
      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Segmented
          value={segment}
          onChange={setSegment}
          options={[
            { value: 'all', label: 'All' },
            { value: 'not_requested', label: 'Not asked' },
            { value: 'requested', label: 'Asked' },
            { value: 'reviewed', label: 'Reviewed' },
            { value: 'first_time', label: 'First visit' },
            { value: 'returning', label: 'Returning' },
            { value: 'lapsed', label: 'Not back in 45 days' },
          ]}
        />
        <div className="relative lg:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input className="field h-9 pl-9 text-sm" placeholder="Search name, phone or email" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <section className="overflow-hidden rounded-xl2 border border-line-soft bg-paper shadow-lift">
        {!data ? (
          <div className="space-y-3 p-5">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
        ) : data.customers.length === 0 ? (
          <Empty icon={<Users className="h-5 w-5" />} title={segment === 'all' && !query ? 'No customers yet' : 'Nobody matches'} action={segment === 'all' && !query ? <Button onClick={() => setAdding(true)}>Add your first customer</Button> : undefined}>
            {segment === 'all' && !query ? 'Add customers as they visit, or import a CSV from your billing software.' : 'Try a different filter.'}
          </Empty>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-sm">
              <thead className="border-b border-line-soft text-left text-xs text-ink-muted">
                <tr><th className="px-5 py-3 font-medium">Name</th><th className="px-3 py-3 font-medium">Last service</th><th className="px-3 py-3 text-right font-medium">Visits</th><th className="px-3 py-3 font-medium">Last visit</th><th className="px-5 py-3 font-medium">Review</th></tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.customers.map((c: any) => (
                  <tr key={c._id} className="cursor-pointer hover:bg-mist/50" onClick={() => setOpen(c._id)}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size={32} />
                        <div className="min-w-0"><p className="truncate font-medium">{c.name}</p><p className="truncate text-xs text-ink-muted">{c.phone || c.email}</p></div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-ink-soft">{c.visits?.[c.visits.length - 1]?.serviceName || '—'}</td>
                    <td className="px-3 py-3 text-right tabular">{c.visits?.length || 0}</td>
                    <td className="px-3 py-3 text-ink-muted">{c.lastVisit ? timeAgo(c.lastVisit) : '—'}</td>
                    <td className="px-5 py-3"><Badge tone={REVIEW_STATUS[c.reviewStatus]?.tone}>{REVIEW_STATUS[c.reviewStatus]?.label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-line-soft px-5 py-3 text-xs text-ink-muted">{data.total} customer{data.total === 1 ? '' : 's'}</p>
          </div>
        )}
      </section>

      <AddCustomer open={adding} onClose={() => setAdding(false)} onDone={() => mutate()} />
      <ImportCustomers open={importing} onClose={() => setImporting(false)} onDone={() => mutate()} />
      <Drawer open={!!open} onClose={() => setOpen(null)} label="Customer">
        {open && <CustomerDetail id={open} onClose={() => setOpen(null)} onChanged={() => mutate()} />}
      </Drawer>
    </>
  );
}

export default function CustomersPage() {
  return <Suspense><CustomersInner /></Suspense>;
}
