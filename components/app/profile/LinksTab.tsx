'use client';

import { Field, Input, Panel } from '@/components/ui';
import { useAuth } from '@/lib/auth';


import { useBusinessDraft, SaveBar } from './shared';

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

export default function LinksTab() {
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
