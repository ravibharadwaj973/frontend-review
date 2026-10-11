'use client';

import { Plus, X } from 'lucide-react';
import { Button, Field, Input, Panel, Select, Textarea } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { CATEGORIES } from '@/lib/constants';


import { useBusinessDraft, SaveBar } from './shared';

export default function InfoTab() {
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
          <p className="-mt-2 mb-3 text-sm text-ink-muted">ReviewRankr uses names to recognise staff mentioned in reviews and in replies.</p>
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
