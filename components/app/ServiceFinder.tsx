'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, Globe, Sparkles, Store } from 'lucide-react';
import { AiMark, Button, Input, Modal, Segmented, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx } from '@/lib/format';

type Found = { name: string; category: string; price: number | null; duration: number | null; description: string; _on?: boolean };
type Source = 'ai' | 'website' | 'google';

/** Shared list UI: grouped checkboxes with editable prices. */
export function FoundServicesList({ items, setItems }: { items: Found[]; setItems: (f: Found[]) => void }) {
  const groups = useMemo(() => {
    const m = new Map<string, number[]>();
    items.forEach((s, i) => m.set(s.category, [...(m.get(s.category) || []), i]));
    return [...m.entries()];
  }, [items]);
  const toggleGroup = (idx: number[], on: boolean) => setItems(items.map((s, i) => (idx.includes(i) ? { ...s, _on: on } : s)));
  return (
    <div className="space-y-5">
      {groups.map(([group, idx]) => {
        const allOn = idx.every((i) => items[i]._on);
        return (
          <section key={group}>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-display text-[15px] font-semibold">{group}</h3>
              <button onClick={() => toggleGroup(idx, !allOn)} className="text-xs font-medium text-brand-600 hover:underline">{allOn ? 'Clear all' : 'Select all'}</button>
            </div>
            <ul className="divide-y divide-line-soft rounded-xl border border-line-soft">
              {idx.map((i) => {
                const s = items[i];
                return (
                  <li key={i} className={cx('flex items-center gap-3 px-3 py-2', !s._on && 'opacity-60')}>
                    <button
                      onClick={() => setItems(items.map((x, j) => (j === i ? { ...x, _on: !x._on } : x)))}
                      className={cx('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', s._on ? 'border-brand-500 bg-brand-500 text-white' : 'border-line bg-white')}
                      aria-pressed={!!s._on}
                      aria-label={`Include ${s.name}`}
                    >
                      {s._on && <Check className="h-3.5 w-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <input
                        value={s.name}
                        onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))}
                        className="w-full rounded border border-transparent bg-transparent px-1 text-sm font-medium hover:border-line focus:border-brand-200 focus:outline-none"
                        aria-label="Service name"
                      />
                      {s.description && <p className="truncate px-1 text-xs text-ink-muted">{s.description}</p>}
                    </div>
                    <label className="flex items-center gap-1 text-sm text-ink-muted">
                      ₹
                      <input
                        type="number"
                        min={0}
                        value={s.price ?? ''}
                        placeholder="—"
                        onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, price: e.target.value === '' ? null : Number(e.target.value) } : x)))}
                        className="w-20 rounded-md border border-line bg-white px-2 py-1 text-right text-sm tabular text-ink focus:border-brand-400 focus:outline-none"
                        aria-label={`Price for ${s.name}`}
                      />
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}

export function useServiceDiscovery() {
  const toast = useToast();
  const [items, setItems] = useState<Found[]>([]);
  const [model, setModel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const find = async (source: Source, url?: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await api('/services/discover', { body: { source, url: url || undefined } });
      setItems(res.services.map((s: Found) => ({ ...s, _on: true })));
      setModel(res.model);
      if (!res.services.length) setError('Nothing new found — your list may already have these.');
    } catch (e: any) {
      setItems([]);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  const save = async () => {
    const chosen = items.filter((s) => s._on && s.name.trim()).map(({ _on, ...s }) => ({ ...s, name: s.name.trim(), description: s.description || '' }));
    if (!chosen.length) {
      toast('Select at least one service', 'bad');
      return 0;
    }
    await api('/services/bulk', { body: { services: chosen } });
    return chosen.length;
  };
  return { items, setItems, model, loading, error, find, save, selected: items.filter((s) => s._on).length };
}

export function ServiceFinder({ open, onClose, onDone, website }: { open: boolean; onClose: () => void; onDone: () => void; website?: string }) {
  const toast = useToast();
  const [source, setSource] = useState<Source>('ai');
  const [url, setUrl] = useState(website || '');
  const [busy, setBusy] = useState(false);
  const d = useServiceDiscovery();

  useEffect(() => {
    if (open && source === 'ai' && !d.items.length && !d.loading) d.find('ai');
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => setUrl(website || ''), [website]);

  const add = async () => {
    setBusy(true);
    try {
      const n = await d.save();
      if (n) {
        toast(`${n} services added`);
        onDone();
        onClose();
        d.setItems([]);
      }
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find your services"
      wide
      footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button onClick={add} loading={busy} disabled={!d.selected}>Add {d.selected || ''} services</Button></>}
    >
      <Segmented<Source>
        value={source}
        onChange={(v) => { setSource(v); d.setItems([]); if (v === 'ai') d.find('ai'); }}
        options={[{ value: 'ai', label: 'Suggest for my business' }, { value: 'website', label: 'From my website' }, { value: 'google', label: 'From Google' }]}
      />

      <div className="mt-4">
        {source === 'ai' && (
          <p className="flex items-start gap-2 text-sm text-ink-muted"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet" />A full list of what businesses like yours usually offer, with typical prices. Untick what you don’t do and fix prices to match yours.</p>
        )}
        {source === 'website' && (
          <div>
            <p className="flex items-start gap-2 text-sm text-ink-muted"><Globe className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />ReviewRankr reads your website (and its menu or price pages) and picks out the services listed there.</p>
            <div className="mt-3 flex gap-2">
              <Input type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://yourbusiness.com" aria-label="Website address" />
              <Button onClick={() => d.find('website', url)} loading={d.loading} disabled={!url}>Read website</Button>
            </div>
          </div>
        )}
        {source === 'google' && (
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-start gap-2 text-sm text-ink-muted"><Store className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />Import the services already listed on your Google Business Profile.</p>
            <Button onClick={() => d.find('google')} loading={d.loading}>Import</Button>
          </div>
        )}
      </div>

      <div className="mt-5">
        {d.loading ? (
          <div className="space-y-3"><Skeleton className="h-5 w-40" /><Skeleton className="h-28" /><Skeleton className="h-5 w-32" /><Skeleton className="h-20" /></div>
        ) : d.error ? (
          <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">{d.error}</p>
        ) : d.items.length ? (
          <>
            <div className="mb-3 flex items-center justify-between">
              <AiMark label={d.model === 'catalog' ? 'Starter list for your business type' : d.model === 'google' ? 'From your Google profile' : 'Found by AI — check before adding'} />
              <span className="text-xs text-ink-muted tabular">{d.selected} of {d.items.length} selected</span>
            </div>
            <FoundServicesList items={d.items} setItems={d.setItems} />
          </>
        ) : null}
      </div>
    </Modal>
  );
}
