'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, CornerDownRight, RefreshCw, Sparkles, Trash2, Wand2, X, UserRound } from 'lucide-react';
import { AiMark, Avatar, Badge, Button, Select, Stars, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx, shortDate, timeAgo } from '@/lib/format';
import { TONES } from '@/lib/constants';

export type Review = {
  _id: string;
  source: 'google' | 'demo' | 'direct';
  services?: string[];
  submittedVia?: 'link' | 'qr';
  reviewer: { name: string; photoUrl?: string };
  rating: number;
  comment: string;
  createTime: string;
  status: 'unanswered' | 'drafted' | 'answered';
  reply?: { comment: string; updateTime: string; by?: string };
  analysis?: {
    sentiment?: string; services?: string[]; positives?: string[]; negatives?: string[]; concerns?: string[];
    keywords?: string[]; urgency?: string; recommendation?: string; model?: string;
  };
  draft?: { _id: string; text: string; finalText?: string; status: string; model?: string } | null;
  customer?: { _id: string; name: string } | string;
};

export const sentimentTone = (s?: string) => (s === 'positive' ? 'good' : s === 'negative' ? 'bad' : s === 'mixed' ? 'warn' : 'neutral') as any;

export function StatusPill({ review }: { review: Review }) {
  if (review.status === 'answered') return <Badge tone="good"><Check className="h-3 w-3" />Replied</Badge>;
  if (review.status === 'drafted' || review.draft) return <Badge tone="ai"><Sparkles className="h-3 w-3" />Draft ready</Badge>;
  return <Badge tone={review.rating <= 2 ? 'bad' : 'neutral'}>Needs reply</Badge>;
}

export function ReviewRow({ review, onOpen, selected }: { review: Review; onOpen: () => void; selected?: boolean }) {
  return (
    <button
      onClick={onOpen}
      className={cx(
        'group block w-full border-b border-line-soft px-5 py-4 text-left transition-colors last:border-0 hover:bg-mist/60',
        selected && 'bg-brand-50/60'
      )}
    >
      <div className="flex items-start gap-3">
        <Avatar name={review.reviewer?.name || '?'} src={review.reviewer?.photoUrl} size={38} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-medium text-ink">{review.reviewer?.name}</span>
            <Stars value={review.rating} size={13} />
            <span className="text-xs text-ink-muted">{timeAgo(review.createTime)}</span>
            {review.source === 'demo' && <span className="text-[11px] text-ink-faint">demo</span>}
            {review.source === 'direct' && <Badge tone="info">In app{review.submittedVia === 'qr' ? ' · QR' : ''}</Badge>}
          </div>
          <p className={cx('mt-1.5 text-[14.5px] leading-relaxed', review.comment ? 'text-ink-soft line-clamp-2' : 'italic text-ink-faint')}>
            {review.comment || 'Rating only — no written review'}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <StatusPill review={review} />
            {review.analysis?.services?.slice(0, 2).map((s) => <Badge key={s}>{s}</Badge>)}
            {review.analysis?.negatives?.slice(0, 2).map((n) => <span key={n} className="rounded-full bg-critique-soft px-2 py-0.5 text-xs font-medium text-[#A33B22]">− {n}</span>)}
          </div>
        </div>
      </div>
    </button>
  );
}

export function AnalysisPanel({ review, onReanalyze, busy }: { review: Review; onReanalyze?: () => void; busy?: boolean }) {
  const a = review.analysis;
  if (!a?.sentiment) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-dashed border-line bg-white px-4 py-3 text-sm text-ink-muted">
        Not analysed yet
        {onReanalyze && <Button size="sm" variant="secondary" onClick={onReanalyze} loading={busy} icon={<Wand2 className="h-3.5 w-3.5" />}>Analyse</Button>}
      </div>
    );
  }
  const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="grid grid-cols-[110px_1fr] gap-3 py-2 text-sm">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="flex flex-wrap gap-1.5">{children}</dd>
    </div>
  );
  const none = <span className="text-ink-faint">—</span>;
  return (
    <div className="rounded-xl bg-white px-4 py-2">
      <dl className="divide-y divide-line-soft">
        <Row label="Sentiment"><Badge tone={sentimentTone(a.sentiment)} className="capitalize">{a.sentiment}</Badge>{a.urgency === 'high' && <Badge tone="bad">Urgent</Badge>}</Row>
        <Row label="Services">{a.services?.length ? a.services.map((s) => <Badge key={s}>{s}</Badge>) : none}</Row>
        <Row label="Praised">{a.positives?.length ? a.positives.map((s) => <span key={s} className="rounded-full bg-praise-soft px-2 py-0.5 text-xs font-medium text-[#14607A]">+ {s}</span>) : none}</Row>
        <Row label="Criticised">{a.negatives?.length ? a.negatives.map((s) => <span key={s} className="rounded-full bg-critique-soft px-2 py-0.5 text-xs font-medium text-[#A33B22]">− {s}</span>) : none}</Row>
        {!!a.concerns?.length && <Row label="Issues">{a.concerns.map((s) => <Badge key={s} tone="warn">{s}</Badge>)}</Row>}
        {a.recommendation && <Row label="How to reply"><span className="text-ink-soft">{a.recommendation}</span></Row>}
      </dl>
      <div className="flex items-center justify-between py-2 text-xs text-ink-faint">
        <span>{a.model === 'heuristic' ? 'Built-in analysis' : `Analysed by ${a.model?.replace('groq:', '')}`}</span>
        {onReanalyze && <button onClick={onReanalyze} disabled={busy} className="inline-flex items-center gap-1 hover:text-brand-600"><RefreshCw className={cx('h-3 w-3', busy && 'animate-spin')} />Re-analyse</button>}
      </div>
    </div>
  );
}

/** Draft → edit → approve → publish. The sheen border marks text the AI wrote that a person hasn't approved yet. */
export function ReplyComposer({ review, onChanged, compact }: { review: Review; onChanged: (r?: Review) => void; compact?: boolean }) {
  const toast = useToast();
  const [draft, setDraft] = useState(review.draft || null);
  const [text, setText] = useState(review.draft?.finalText || review.draft?.text || '');
  const [tone, setTone] = useState('');
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState<'' | 'draft' | 'publish'>('');
  const edited = draft && text !== draft.text;

  useEffect(() => {
    setDraft(review.draft || null);
    setText(review.draft?.finalText || review.draft?.text || '');
  }, [review._id, review.draft?._id]);

  const generate = async () => {
    setBusy('draft');
    try {
      const res = await api(`/reviews/${review._id}/draft`, { body: { tone: tone || undefined, instruction: instruction || undefined } });
      setDraft(res.draft);
      setText(res.draft.text);
      setInstruction('');
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const publish = async () => {
    setBusy('publish');
    try {
      const res = await api(`/reviews/${review._id}/publish`, { body: { text, draftId: draft?._id } });
      toast(res.publishedTo === 'google' ? 'Reply published on Google' : res.publishedTo === 'app' ? 'Reply saved in Starling' : 'Reply saved (demo — not sent to Google)');
      onChanged(res.review);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  if (!draft && !text) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-white p-4">
        <p className="text-sm text-ink-muted">No reply yet. Starling can draft one using the review, your services and your tone of voice.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="ai" onClick={generate} loading={busy === 'draft'} icon={<Sparkles className="h-4 w-4" />}>Draft a reply</Button>
          <Button variant="ghost" onClick={() => setText(' ')}>Write my own</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('rounded-xl p-4', draft && !edited ? 'ai-sheen' : 'border border-line bg-white')}>
      <div className="mb-2 flex items-center justify-between gap-2">
        {draft && !edited ? <AiMark /> : <span className="text-xs font-semibold text-ink-soft">{draft ? 'Edited by you' : 'Your reply'}</span>}
        <span className="text-xs tabular text-ink-faint">{text.trim().length} / 4096</span>
      </div>
      <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={compact ? 4 : 6} className="border-0 bg-transparent px-0 focus:ring-0" aria-label="Reply text" />
      {!compact && (
        <div className="mt-3 flex flex-col gap-2 border-t border-line-soft pt-3 sm:flex-row">
          <input
            className="field h-9 flex-1 text-sm"
            placeholder="Ask for changes, e.g. “mention Simran by name”, “shorter”"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && generate()}
          />
          <Select value={tone} onChange={(e) => setTone(e.target.value)} className="h-9 py-1 text-sm sm:w-40" aria-label="Tone">
            <option value="">Default tone</option>
            {TONES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          <Button size="sm" variant="secondary" className="h-9" onClick={generate} loading={busy === 'draft'} icon={<RefreshCw className="h-3.5 w-3.5" />}>{draft ? 'Redraft' : 'Draft'}</Button>
        </div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-ink-muted">{review.source === 'demo' ? 'Demo review — publishing saves it here only.' : review.source === 'direct' ? 'Submitted in Starling — your reply is saved here, not posted publicly.' : 'Publishes publicly on your Google profile.'}</p>
        <div className="flex gap-2">
          {compact && <Button size="sm" variant="ghost" onClick={generate} loading={busy === 'draft'} icon={<RefreshCw className="h-3.5 w-3.5" />}>Redraft</Button>}
          <Button size={compact ? 'sm' : 'md'} onClick={publish} loading={busy === 'publish'} disabled={!text.trim()} icon={<Check className="h-4 w-4" />}>Approve & publish</Button>
        </div>
      </div>
    </div>
  );
}

export function ReviewDetail({ reviewId, onClose, onChanged }: { reviewId: string; onClose: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [data, setData] = useState<{ review: Review; responses: any[] } | null>(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const res = await api(`/reviews/${reviewId}`);
    const draft = res.responses.find((r: any) => r.status === 'draft' || r.status === 'approved') || null;
    setData({ review: { ...res.review, draft }, responses: res.responses });
  };
  useEffect(() => {
    setData(null);
    load().catch((e) => toast(e.message, 'bad'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  const reanalyze = async () => {
    setBusy(true);
    try {
      await api(`/reviews/${reviewId}/analyze`, { method: 'POST' });
      await load();
      onChanged();
    } finally {
      setBusy(false);
    }
  };

  const removeReply = async () => {
    if (!window.confirm('Remove this reply? It will also be removed from Google.')) return;
    try {
      await api(`/reviews/${reviewId}/reply`, { method: 'DELETE' });
      toast('Reply removed');
      await load();
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    }
  };

  if (!data) return <div className="p-8"><div className="skeleton h-6 w-40" /><div className="skeleton mt-4 h-28 w-full" /></div>;
  const r = data.review;
  const customer = typeof r.customer === 'object' ? r.customer : null;

  return (
    <div>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line-soft bg-mist/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center gap-2"><StatusPill review={r} /><span className="text-xs text-ink-muted">{shortDate(r.createTime)}</span></div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-ink-muted hover:bg-white" aria-label="Close"><X className="h-5 w-5" /></button>
      </header>
      <div className="space-y-6 px-6 py-6">
        <div className="rounded-xl2 bg-white p-5 shadow-lift">
          <div className="flex items-center gap-3">
            <Avatar name={r.reviewer.name} src={r.reviewer.photoUrl} size={44} />
            <div className="flex-1">
              <p className="font-display text-lg font-semibold">{r.reviewer.name}</p>
              <Stars value={r.rating} size={15} />
            </div>
          </div>
          <p className={cx('mt-4 text-[16px] leading-relaxed', r.comment ? 'text-ink' : 'italic text-ink-faint')}>{r.comment || 'This customer left a rating without a written review.'}</p>
          {r.source === 'direct' && (
            <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-ink-muted">
              <Badge tone="info">Submitted in Starling{r.submittedVia === 'qr' ? ' via QR code' : ' via review link'}</Badge>
              {(r.services || []).map((s) => <Badge key={s}>{s}</Badge>)}
            </div>
          )}
          {customer && (
            <Link href={`/app/customers?open=${customer._id}`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600 hover:bg-brand-100">
              <UserRound className="h-3.5 w-3.5" /> Matched to customer {customer.name} via review request
            </Link>
          )}
        </div>

        <section>
          <h3 className="mb-2 font-display text-[15px] font-semibold">What Starling found</h3>
          <AnalysisPanel review={r} onReanalyze={reanalyze} busy={busy} />
        </section>

        <section>
          <h3 className="mb-2 font-display text-[15px] font-semibold">Your reply</h3>
          {r.reply?.comment ? (
            <div className="rounded-xl bg-white p-4">
              <div className="flex gap-2 text-[15px] leading-relaxed text-ink">
                <CornerDownRight className="mt-1 h-4 w-4 shrink-0 text-brand-400" />
                <p className="whitespace-pre-line">{r.reply.comment}</p>
              </div>
              <div className="mt-3 flex items-center justify-between text-xs text-ink-muted">
                <span>Replied {timeAgo(r.reply.updateTime)}{r.reply.by === 'google' ? ' on Google' : ' from Starling'}</span>
                <button onClick={removeReply} className="inline-flex items-center gap-1 text-rose hover:underline"><Trash2 className="h-3 w-3" />Remove</button>
              </div>
            </div>
          ) : (
            <ReplyComposer review={r} onChanged={() => { load(); onChanged(); }} />
          )}
        </section>

        {data.responses.length > 0 && (
          <section>
            <h3 className="mb-2 font-display text-[15px] font-semibold">Draft history</h3>
            <ul className="space-y-2">
              {data.responses.map((d) => (
                <li key={d._id} className="rounded-lg bg-white/70 px-3 py-2 text-sm">
                  <div className="flex items-center justify-between text-xs text-ink-muted">
                    <span className="capitalize">{d.status}{d.edited ? ' · edited' : ''}</span>
                    <span>{timeAgo(d.createdAt)} · {d.model === 'heuristic' ? 'built-in' : d.model?.replace('groq:', '')}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-ink-soft">{d.finalText || d.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
