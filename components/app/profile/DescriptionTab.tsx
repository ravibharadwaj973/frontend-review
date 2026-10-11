'use client';

import { useState } from 'react';
import { Copy, Sparkles } from 'lucide-react';
import { AiMark, Button, Panel, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx } from '@/lib/format';


import { useBusinessDraft, SaveBar } from './shared';

export default function DescriptionTab() {
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
