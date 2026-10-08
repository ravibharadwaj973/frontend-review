'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, CheckCircle2, ClipboardCheck, Minus, PenLine, Plus, RefreshCw, Send, Sparkles, Star } from 'lucide-react';
import { cx } from '@/lib/format';

type Info = {
  business: { name: string; category: string; logoUrl?: string; city?: string };
  firstName: string;
  serviceName?: string;
  topics: string[];
  hasReviewLink: boolean;
  services: { name: string; category: string }[];
  staff: string[];
  aspects: string[];
};

const FEEL = ['', 'Bad', 'Not great', 'Okay', 'Good', 'Excellent'];

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="mt-7">
      <h2 className="font-display text-[17px] font-semibold text-ink">{title}</h2>
      {hint && <p className="mt-0.5 text-sm text-ink-muted">{hint}</p>}
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Chip({ on, onClick, children, tone = 'brand' }: { on: boolean; onClick: () => void; children: React.ReactNode; tone?: 'brand' | 'good' | 'bad' }) {
  const onCls = tone === 'bad' ? 'border-critique bg-critique-soft text-[#9A3A22]' : tone === 'good' ? 'border-praise bg-praise-soft text-[#14607A]' : 'border-brand-500 bg-brand-50 text-brand-700';
  return (
    <button type="button" onClick={onClick} aria-pressed={on} className={cx('inline-flex min-h-[40px] items-center gap-1.5 rounded-full border px-3.5 text-[14.5px] transition-colors', on ? onCls : 'border-line bg-white text-ink-soft hover:border-brand-200')}>
      {children}
    </button>
  );
}

/**
 * The customer-facing review helper. `base` is the public API path for this link:
 *   /api/public/r/<token>  personal review request
 *   /api/public/b/<slug>   business QR code / shared link
 * No sign-in, no gating: every rating gets the same path to Google.
 */
export function ReviewHelper({ base }: { base: string }) {
  const [info, setInfo] = useState<Info | null>(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [services, setServices] = useState<string[]>([]);
  const [aspects, setAspects] = useState<Record<string, 'good' | 'bad'>>({});
  const [staff, setStaff] = useState('');
  const [note, setNote] = useState('');
  const [draft, setDraft] = useState('');
  const [aiDraft, setAiDraft] = useState('');
  const [variant, setVariant] = useState(0);
  const [length, setLength] = useState<'short' | 'detailed'>('short');
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [ownMode, setOwnMode] = useState(false);
  const [name, setName] = useState('');
  const [hp, setHp] = useState(''); // honeypot (hidden from people)
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const draftRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(base)
      .then(async (r) => (r.ok ? r.json() : Promise.reject(new Error((await r.json().catch(() => ({}))).error || 'Link not found'))))
      .then((d: Info) => {
        setInfo(d);
        if (d.serviceName && d.services.some((s) => s.name === d.serviceName)) setServices([d.serviceName]);
      })
      .catch((e) => setError(e.message));
  }, [base]);

  const cycle = (a: string) =>
    setAspects((cur) => {
      const next = { ...cur };
      if (!cur[a]) next[a] = 'good';
      else if (cur[a] === 'good') next[a] = 'bad';
      else delete next[a];
      return next;
    });

  const write = async (nextVariant = variant, nextLength = length) => {
    setBusy(true);
    try {
      const res = await fetch(`${base}/compose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          services,
          liked: Object.keys(aspects).filter((k) => aspects[k] === 'good'),
          disliked: Object.keys(aspects).filter((k) => aspects[k] === 'bad'),
          staff,
          note,
          length: nextLength,
          variant: nextVariant,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not write a suggestion');
      setDraft(data.text);
      setAiDraft(data.text);
      setTimeout(() => draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  /** Saves the review in the business's inbox. No account or login needed. */
  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const text = (draft || note).trim();
      const res = await fetch(`${base}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, text, services, name: name.trim(), website: hp }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Could not send your review. Please try again.');
      if (!draft && text) setDraft(text);
      setDone(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const copyAndGo = async () => {
    try {
      await navigator.clipboard.writeText(draft);
    } catch {
      /* clipboard blocked — the text is still visible to copy by hand */
    }
    setCopied(true);
    setTimeout(() => { window.location.href = `${base}/go`; }, 900);
  };

  if (error && !info) {
    return <main className="flex min-h-screen items-center justify-center bg-mist p-6 text-center"><div><h1 className="font-display text-2xl font-semibold">This link doesn’t work any more</h1><p className="mt-2 text-ink-muted">Ask the business to send a new one.</p></div></main>;
  }
  if (!info) return <main className="min-h-screen bg-mist" />;

  const groups = info.services.reduce<Record<string, string[]>>((m, s) => ({ ...m, [s.category || 'Services']: [...(m[s.category || 'Services'] || []), s.name] }), {});
  const edited = draft && draft !== aiDraft;

  return (
    <main className="min-h-screen bg-mist px-4 py-8 sm:py-12">
      <div className="mx-auto w-full max-w-lg">
        <div className="relative rounded-xl3 bg-white p-6 shadow-pop sm:p-8">
          <div className="flex items-center gap-3">
            {info.business.logoUrl ? (
              <img src={info.business.logoUrl} alt="" className="h-12 w-12 rounded-2xl object-cover" />
            ) : (
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-600 font-display text-xl font-semibold text-white">{info.business.name[0]}</span>
            )}
            <div>
              <p className="font-display text-lg font-semibold leading-tight">{info.business.name}</p>
              <p className="text-sm text-ink-muted">{[info.business.category, info.business.city].filter(Boolean).join(', ')}</p>
            </div>
          </div>

          {done ? (
            <div className="py-6 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-leaf" />
              <h1 className="mt-4 font-display text-[28px] font-semibold leading-tight">Thank you{name || info.firstName ? `, ${name || info.firstName}` : ''}!</h1>
              <p className="mt-2 text-[15px] text-ink-soft">Your review was sent to {info.business.name}.</p>
              {info.hasReviewLink && (
                <div className="mt-8 rounded-xl bg-mist p-5 text-left">
                  <p className="font-display text-[17px] font-semibold">Share it on Google too?</p>
                  <p className="mt-1 text-sm text-ink-muted">It helps other people find {info.business.name}. Google asks you to sign in to your Google account.</p>
                  {draft.trim() && <p className="mt-3 rounded-lg bg-white p-3 text-sm leading-relaxed text-ink-soft">{draft}</p>}
                  <button type="button" onClick={copyAndGo} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-white text-[15px] font-medium text-brand-700 ring-1 ring-brand-200 hover:bg-brand-50">
                    {copied ? <ClipboardCheck className="h-5 w-5" /> : <Star className="h-4 w-4 fill-star text-star" />}
                    {copied ? 'Copied — opening Google…' : draft.trim() ? 'Copy & post on Google' : 'Post on Google'}
                  </button>
                  {draft.trim() && <p className="mt-2 text-center text-xs text-ink-muted">On Google, tap the {rating} star{rating > 1 ? 's' : ''}, then paste.</p>}
                </div>
              )}
            </div>
          ) : (
          <>
          <h1 className="mt-6 font-display text-[28px] font-semibold leading-tight text-ink">{info.firstName ? `Thanks for coming in, ${info.firstName}!` : `Thanks for visiting ${info.business.name}!`}</h1>
          <p className="mt-2 text-[15px] leading-relaxed text-ink-soft">Tell us how it went — good or bad. Pick a few things below and we’ll help you put it into words. No sign-up needed.</p>

          <Section title="How was it?">
            <div className="flex items-center gap-1" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} star${n > 1 ? 's' : ''}`} onClick={() => setRating(n)} className="rounded-lg p-1">
                  <Star className={cx('h-10 w-10 transition-transform', n <= rating ? 'fill-star text-star' : 'fill-line-soft text-line', rating === n && 'scale-110')} strokeWidth={1.5} />
                </button>
              ))}
              <span className="ml-2 text-sm font-medium text-ink-soft">{FEEL[rating]}</span>
            </div>
          </Section>

          {info.services.length > 0 && (
            <Section title="What did you get done?" hint="Tap everything you had today.">
              <div className="space-y-3">
                {Object.entries(groups).map(([g, names]) => (
                  <div key={g}>
                    {Object.keys(groups).length > 1 && <p className="mb-1.5 text-xs font-medium text-ink-muted">{g}</p>}
                    <div className="flex flex-wrap gap-2">
                      {names.map((n) => (
                        <Chip key={n} on={services.includes(n)} onClick={() => setServices(services.includes(n) ? services.filter((x) => x !== n) : [...services, n])}>
                          {services.includes(n) && <Check className="h-4 w-4" />}{n}
                        </Chip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          )}

          <Section title="What stood out?" hint="Tap once if it was good, twice if it could be better.">
            <div className="flex flex-wrap gap-2">
              {info.aspects.map((a) => (
                <Chip key={a} on={!!aspects[a]} tone={aspects[a] === 'bad' ? 'bad' : 'good'} onClick={() => cycle(a)}>
                  {aspects[a] === 'good' && <Plus className="h-4 w-4" />}
                  {aspects[a] === 'bad' && <Minus className="h-4 w-4" />}
                  {a}
                </Chip>
              ))}
            </div>
          </Section>

          {info.staff.length > 0 && (
            <Section title="Who looked after you?" hint="Optional">
              <div className="flex flex-wrap gap-2">
                {info.staff.map((s) => <Chip key={s} on={staff === s} onClick={() => setStaff(staff === s ? '' : s)}>{s}</Chip>)}
              </div>
            </Section>
          )}

          <Section title="Anything else?" hint="Optional. A few words in your own language is fine.">
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={600} className="field text-[15px]" placeholder="e.g. loved the head massage, will book again before Diwali" />
          </Section>

          {!info.firstName && (
            <Section title="Your name" hint="Optional — leave it empty to stay anonymous.">
              <input aria-label="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="field text-[15px]" placeholder="e.g. Priya" autoComplete="given-name" />
            </Section>
          )}
          {/* Honeypot field: hidden from people, bots fill it in */}
          <input tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />

          <div className="mt-7 grid gap-2 sm:grid-cols-[1fr_auto]">
            <button
              type="button"
              onClick={() => { setOwnMode(false); setVariant(0); write(0); }}
              disabled={!rating || busy}
              className="flex h-12 items-center justify-center gap-2 rounded-xl border border-brand-200 bg-brand-50 text-[15px] font-medium text-brand-700 transition-colors hover:bg-brand-100 disabled:opacity-40"
            >
              {busy && !draft ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {draft && !ownMode ? 'Write it again from my choices' : 'Help me write it'}
            </button>
            <button
              type="button"
              onClick={() => { setOwnMode(true); if (!draft) { setDraft(note); setAiDraft(''); } setTimeout(() => draftRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50); }}
              className="flex h-12 items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-medium text-ink-soft hover:bg-mist"
            >
              <PenLine className="h-4 w-4" /> I’ll write it myself
            </button>
          </div>
          {!rating && <p className="mt-2 text-center text-xs text-ink-muted">Choose a star rating first.</p>}

          {(draft || ownMode) && (
            <div ref={draftRef} className="mt-7 scroll-mt-6">
              <div className={cx('rounded-xl p-4', edited || ownMode || !aiDraft ? 'border border-line bg-white' : 'ai-sheen')}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-ink-soft">{!aiDraft || edited || ownMode ? 'Your review' : 'Suggested from your choices'}</span>
                  <span className="text-xs text-ink-faint tabular">{draft.length}</span>
                </div>
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write about your visit…" rows={Math.min(14, Math.max(4, Math.ceil(draft.length / 34) + 1))} className="mt-1 w-full resize-none border-0 bg-transparent text-[16px] leading-relaxed text-ink placeholder:text-ink-faint focus:outline-none" aria-label="Your review text" />
                {aiDraft && !ownMode && (
                  <div className="mt-2 flex flex-wrap gap-2 border-t border-line-soft pt-3">
                    <button type="button" onClick={() => { const v = variant + 1; setVariant(v); write(v); }} disabled={busy} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-mist px-3 text-sm font-medium text-ink-soft hover:bg-brand-50">
                      <RefreshCw className={cx('h-3.5 w-3.5', busy && 'animate-spin')} /> Try another
                    </button>
                    <button type="button" onClick={() => { const l = length === 'short' ? 'detailed' : 'short'; setLength(l); write(variant, l); }} disabled={busy} className="inline-flex h-9 items-center rounded-lg bg-mist px-3 text-sm font-medium text-ink-soft hover:bg-brand-50">
                      {length === 'short' ? 'Make it longer' : 'Make it shorter'}
                    </button>
                  </div>
                )}
              </div>
              {aiDraft && !ownMode && <p className="mt-2 text-xs leading-relaxed text-ink-muted">Change anything so it sounds like you. Only say what’s true for your visit.</p>}
            </div>
          )}

          {error && <p className="mt-4 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">{error}</p>}

          <button
            type="button"
            onClick={submit}
            disabled={!rating || submitting}
            className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand-600 text-[15px] font-medium text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.18)] transition-colors hover:bg-brand-700 disabled:opacity-40"
          >
            {submitting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Submit review
          </button>
          <p className="mt-2 text-center text-xs text-ink-muted">Goes straight to {info.business.name}. No login or app needed.</p>
          <p className="mt-1 text-center text-[11px] text-ink-faint">By submitting you agree to our <a href="/terms" target="_blank" className="underline hover:text-brand-600">Terms</a> and <a href="/privacy-policy" target="_blank" className="underline hover:text-brand-600">Privacy Policy</a>.</p>
          </>
          )}
        </div>
        
      </div>
    </main>
  );
}
