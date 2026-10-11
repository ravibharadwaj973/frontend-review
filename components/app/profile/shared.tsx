'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/format';

export function useBusinessDraft() {
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
      const g = res.googleSync ? Object.values(res.googleSync as Record<string, any>) : [];
      const failed = g.find((x: any) => x.status === 'failed') as any;
      if (failed) toast(`Saved here, but Google didn’t accept it: ${failed.message}`, 'bad');
      else if (g.some((x: any) => x.status === 'synced')) toast('Saved and updated on Google');
      else if (g.some((x: any) => x.status === 'demo')) toast('Saved (demo — not sent to Google)');
      else toast('Saved');
    } catch (e: any) {
      setErrors(e.details || {});
      toast(e.message, 'bad');
    } finally {
      setSaving(false);
    }
  };
  return { draft, setDraft, save, saving, dirty, errors };
}

export function SaveBar({ dirty, saving, onSave, onReset }: { dirty: boolean; saving: boolean; onSave: () => void; onReset: () => void }) {
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
