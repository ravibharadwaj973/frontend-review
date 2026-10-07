'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, ArrowUpRight, CalendarDays, Clock, HelpCircle, Images, Megaphone, MessageSquareText, Minus, Play, Plus, Sparkles } from 'lucide-react';
import { Badge, Button, PageHeader, Panel, Select, Skeleton, Stars, Toggle, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { clock, cx, relDay, ymdLabel } from '@/lib/format';

type Settings = {
  replyRules: { five: Rule; four: Rule; three: Rule; low: Rule };
  replyDelayMinutes: number;
  autoDraftReplies: boolean;
  syncHoursToGoogle: boolean;
  photos: { enabled: boolean; perWeek: number; autoQueueUploads: boolean };
  posts: { enabled: boolean; perWeek: number; autoPublish: boolean; day: string; time: string };
};
type Rule = 'auto' | 'approve';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function ConnectionBanner({ connection }: { connection: any }) {
  if (connection?.mode === 'live' && connection.ready) return null;
  const demo = connection?.mode === 'demo';
  return (
    <div className={cx('mb-6 flex flex-col gap-3 rounded-xl2 border px-5 py-4 sm:flex-row sm:items-center', demo ? 'border-star/40 bg-amber-soft/60' : 'border-brand-200 bg-brand-50')}>
      <AlertTriangle className={cx('h-5 w-5 shrink-0', demo ? 'text-amber' : 'text-brand-500')} />
      <p className="flex-1 text-sm text-ink-soft">
        {demo ? (
          <><span className="font-medium text-ink">Demo connection.</span> Autopilot runs fully, but nothing is sent to Google. Connect your real profile when Google approves API access.</>
        ) : connection ? (
          <><span className="font-medium text-ink">Choose your Google location</span> so autopilot can post for you.</>
        ) : (
          <><span className="font-medium text-ink">Connect Google to switch autopilot on.</span> Until then, photos and posts wait here and nothing is published.</>
        )}
      </p>
      <Link href="/app/google"><Button size="sm" variant={demo ? 'secondary' : 'primary'}>{connection ? 'Google settings' : 'Connect Google'}</Button></Link>
    </div>
  );
}

function Week({ week }: { week: any[] }) {
  return (
    <Panel title={<h2 className="flex items-center gap-2 font-display text-[17px] font-semibold"><CalendarDays className="h-[18px] w-[18px] text-brand-500" />The next 7 days</h2>} padded={false} className="mb-6">
      <div className="thin-scroll overflow-x-auto px-5 pb-5 pt-4">
        <ol className="grid min-w-[760px] grid-cols-7 gap-2">
          {week.map((d, i) => {
            const empty = !d.photos.length && !d.posts.length && !d.holiday;
            return (
              <li key={d.date} className={cx('flex min-h-[148px] flex-col rounded-xl border p-2.5', i === 0 ? 'border-brand-400 bg-brand-50/50' : 'border-line-soft bg-white')}>
                <p className={cx('text-xs font-semibold', i === 0 ? 'text-brand-600' : 'text-ink-soft')}>{i === 0 ? 'Today' : ymdLabel(d.date, { weekday: 'short' })}</p>
                <p className="text-[11px] text-ink-faint">{ymdLabel(d.date, { day: 'numeric', month: 'short' })}</p>
                <div className="mt-2 flex flex-1 flex-col gap-1.5">
                  {d.holiday && (
                    <span className={cx('rounded-md px-1.5 py-1 text-[11px] font-medium leading-tight', d.holiday.set ? 'bg-leaf-soft text-leaf' : 'bg-amber-soft text-amber')}>
                      {d.holiday.name}{d.holiday.set ? '' : ' · hours not set'}
                    </span>
                  )}
                  {d.posts.map((p: any) => (
                    <Link key={p._id} href="/app/posts" className={cx('rounded-md px-1.5 py-1 text-[11px] leading-tight', p.status === 'published' ? 'bg-leaf-soft text-leaf' : p.status === 'scheduled' ? 'bg-brand-100 text-brand-700' : 'bg-violet-soft text-violet')}>
                      <span className="font-semibold">Post</span> · {p.status === 'draft' ? 'needs OK' : p.status === 'published' ? 'live' : clock(p.scheduledFor)}
                    </Link>
                  ))}
                  {d.photos.length > 0 && (
                    <Link href="/app/photos" className="flex flex-wrap gap-1" title={`${d.photos.length} photo${d.photos.length > 1 ? 's' : ''}`}>
                      {d.photos.map((p: any) => <img key={p._id} src={p.fileUrl} alt="" className="h-9 w-9 rounded-md object-cover ring-1 ring-line-soft" />)}
                    </Link>
                  )}
                  {empty && <span className="mt-auto text-[11px] text-ink-faint">—</span>}
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </Panel>
  );
}

function RuleRow({ label, stars, value, onChange }: { label: string; stars: number; value: Rule; onChange: (v: Rule) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-2.5">
      <span className="flex items-center gap-2 text-sm"><Stars value={stars} size={13} /><span className="text-ink-muted">{label}</span></span>
      <div className="inline-flex rounded-lg bg-mist p-0.5" role="radiogroup" aria-label={`${label} reviews`}>
        {(['auto', 'approve'] as Rule[]).map((v) => (
          <button
            key={v}
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cx('h-8 rounded-md px-3 text-[13px] font-medium transition-colors', value === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink')}
          >
            {v === 'auto' ? 'Post automatically' : 'I approve first'}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stepper({ value, min, max, onChange, label }: { value: number; min: number; max: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="inline-flex items-center rounded-xl border border-line bg-white" aria-label={label}>
      <button className="flex h-10 w-10 items-center justify-center text-ink-muted hover:text-brand-600 disabled:opacity-30" onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Fewer"><Minus className="h-4 w-4" /></button>
      <span className="w-10 text-center font-display text-lg font-semibold tabular">{value}</span>
      <button className="flex h-10 w-10 items-center justify-center text-ink-muted hover:text-brand-600 disabled:opacity-30" onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="More"><Plus className="h-4 w-4" /></button>
    </div>
  );
}

function CardTitle({ icon, title, tag }: { icon: React.ReactNode; title: string; tag?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-500">{icon}</span>
      <h2 className="font-display text-[17px] font-semibold">{title}</h2>
      {tag}
    </div>
  );
}

const Stat = ({ value, label, href, tone }: { value: React.ReactNode; label: string; href?: string; tone?: 'warn' }) => {
  const body = (
    <>
      <p className={cx('font-display text-2xl font-semibold leading-none tabular', tone === 'warn' ? 'text-amber' : 'text-ink')}>{value}</p>
      <p className="mt-1 text-xs text-ink-muted">{label}</p>
    </>
  );
  return href ? <Link href={href} className="rounded-xl bg-mist px-3 py-2.5 transition-colors hover:bg-brand-50">{body}</Link> : <div className="rounded-xl bg-mist px-3 py-2.5">{body}</div>;
};

export default function AutopilotPage() {
  const toast = useToast();
  const { data, mutate } = useSWR('/autopilot', { refreshInterval: 60_000 });
  const [busy, setBusy] = useState('');

  if (!data) {
    return (
      <>
        <PageHeader title="Autopilot" />
        <Skeleton className="mb-6 h-48" />
        <div className="grid gap-6 lg:grid-cols-2"><Skeleton className="h-80" /><Skeleton className="h-80" /></div>
      </>
    );
  }
  const s: Settings = data.settings;

  const save = async (patch: any, msg = 'Saved') => {
    // Optimistic: show the change straight away
    mutate({ ...data, settings: { ...s, ...patch, photos: { ...s.photos, ...(patch.photos || {}) }, posts: { ...s.posts, ...(patch.posts || {}) }, replyRules: { ...s.replyRules, ...(patch.replyRules || {}) } } }, false);
    try {
      await api('/autopilot', { method: 'PATCH', body: patch });
      toast(msg);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      mutate();
    }
  };

  const backlog = async () => {
    setBusy('backlog');
    try {
      const res = await api('/autopilot/replies/backlog', { method: 'POST' });
      toast(`Writing replies for ${res.reviews} review${res.reviews === 1 ? '' : 's'}. They’ll appear in Reviews in a minute.`);
      setTimeout(() => mutate(), 8000);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const runNow = async () => {
    setBusy('run');
    try {
      const r = await api('/autopilot/run', { method: 'POST' });
      const parts = [r.replies && `${r.replies} repl${r.replies === 1 ? 'y' : 'ies'}`, r.photosPosted && `${r.photosPosted} photo${r.photosPosted === 1 ? '' : 's'}`, r.postsPublished && `${r.postsPublished} post${r.postsPublished === 1 ? '' : 's'}`].filter(Boolean);
      toast(parts.length ? `Posted ${parts.join(', ')}` : r.postsPlanned ? `Wrote ${r.postsPlanned} new post draft${r.postsPlanned === 1 ? '' : 's'}` : 'Everything is up to date — nothing was due');
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const r = data.replies;
  const photosLeft = data.photos.queued;
  const weeksLeft = s.photos.perWeek ? Math.floor(photosLeft / s.photos.perWeek) : 0;

  return (
    <>
      <PageHeader
        title="Autopilot"
        subtitle="Starling keeps your Google profile active every week: it replies to reviews, posts your photos, publishes updates and keeps your hours right. You decide what needs your OK."
        actions={<Button variant="secondary" onClick={runNow} loading={busy === 'run'} icon={<Play className="h-4 w-4" />}>Run now</Button>}
      />

      <ConnectionBanner connection={data.connection} />
      <Week week={data.week} />

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {/* Replies */}
        <Panel title={<CardTitle icon={<MessageSquareText className="h-4 w-4" />} title="AI replies to reviews" />}>
          <p className="-mt-1 mb-2 text-sm text-ink-muted">Every new review gets a reply written by AI in your voice. Choose which ones go out by themselves.</p>
          <div className="divide-y divide-line-soft">
            <RuleRow label="5 stars" stars={5} value={s.replyRules.five} onChange={(v) => save({ replyRules: { five: v } })} />
            <RuleRow label="4 stars" stars={4} value={s.replyRules.four} onChange={(v) => save({ replyRules: { four: v } })} />
            <RuleRow label="3 stars" stars={3} value={s.replyRules.three} onChange={(v) => save({ replyRules: { three: v } })} />
            <RuleRow label="1–2 stars" stars={1.5} value={s.replyRules.low} onChange={(v) => save({ replyRules: { low: v } })} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-line-soft pt-4">
            <Clock className="h-4 w-4 text-ink-faint" />
            <span className="text-sm text-ink-soft">Post automatic replies</span>
            <Select className="h-9 w-auto py-1 text-sm" value={String(s.replyDelayMinutes)} onChange={(e) => save({ replyDelayMinutes: Number(e.target.value) })} aria-label="Delay before posting">
              {[[0, 'straight away'], [15, 'after 15 minutes'], [30, 'after 30 minutes'], [60, 'after 1 hour'], [180, 'after 3 hours'], [720, 'after 12 hours']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
          </div>
          <p className="mt-2 text-xs text-ink-muted">You can edit or hold any reply before it posts. Reviews that look urgent, or that mention a problem, always wait for you.</p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat value={r.auto} label={r.nextAuto?.[0] ? `posting by itself · next ${clock(r.nextAuto[0].autoPublishAt)}` : 'posting by itself'} href="/app/reviews?filter=unanswered" />
            <Stat value={r.waitingApproval} label="waiting for your OK" href="/app/reviews?filter=unanswered" tone={r.waitingApproval ? 'warn' : undefined} />
            <Stat value={r.repliedThisWeek} label="replied this week" />
          </div>
          {!s.autoDraftReplies && <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Automatic drafts are off in <Link href="/app/settings" className="underline">Settings</Link>, so nothing is written or posted for you.</p>}
          {r.backlog > 0 && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-dashed border-line px-4 py-3">
              <p className="text-sm text-ink-soft"><span className="font-semibold text-ink">{r.backlog}</span> older review{r.backlog > 1 ? 's have' : ' has'} no reply yet.</p>
              <Button size="sm" variant="ai" onClick={backlog} loading={busy === 'backlog'} icon={<Sparkles className="h-3.5 w-3.5" />}>Write replies for them</Button>
            </div>
          )}
        </Panel>

        {/* Photos */}
        <Panel title={<CardTitle icon={<Images className="h-4 w-4" />} title="Weekly photos" tag={!s.photos.enabled || !s.photos.perWeek ? <Badge>Off</Badge> : undefined} />} action={<Link href="/app/photos" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Photos <ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
          <p className="-mt-1 mb-4 text-sm text-ink-muted">Add photos once. Starling posts a few to Google each week on different days, so your profile always looks fresh.</p>
          <div className="flex flex-wrap items-center gap-4">
            <Stepper label="Photos per week" value={s.photos.perWeek} min={0} max={7} onChange={(v) => save({ photos: { perWeek: v, enabled: v > 0 } })} />
            <div>
              <p className="text-sm font-medium">photo{s.photos.perWeek === 1 ? '' : 's'} a week</p>
              <div className="mt-1 flex gap-1" aria-hidden>
                {Array.from({ length: 7 }, (_, i) => <span key={i} className={cx('h-1.5 w-5 rounded-full', i < s.photos.perWeek ? 'bg-brand-500' : 'bg-line')} />)}
              </div>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat value={photosLeft} label="in the queue" href="/app/photos" tone={s.photos.perWeek && photosLeft < s.photos.perWeek ? 'warn' : undefined} />
            <Stat value={`${data.photos.postedThisWeek}/${s.photos.perWeek}`} label="posted this week" />
            <Stat value={s.photos.perWeek ? (weeksLeft >= 1 ? `${weeksLeft} wk` : '< 1 wk') : '—'} label="until the queue runs out" />
          </div>
          {s.photos.perWeek > 0 && photosLeft < s.photos.perWeek && (
            <p className="mt-3 rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Add more photos — the queue has {photosLeft === 0 ? 'none' : `only ${photosLeft}`} left for this week.</p>
          )}
          <div className="mt-2 border-t border-line-soft">
            <Toggle checked={s.photos.autoQueueUploads} onChange={(v) => save({ photos: { autoQueueUploads: v } })} label="Queue new uploads automatically" description="Photos you upload join the weekly queue (logo and cover photos never do)." />
          </div>
        </Panel>

        {/* Posts */}
        <Panel title={<CardTitle icon={<Megaphone className="h-4 w-4" />} title="Weekly Google posts" tag={!s.posts.enabled || !s.posts.perWeek ? <Badge>Off</Badge> : undefined} />} action={<Link href="/app/posts" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Posts <ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
          <p className="-mt-1 mb-4 text-sm text-ink-muted">AI writes a short update each week — a service spotlight, a tip, what customers love, festival wishes — with one of your photos and a Book or Call button.</p>
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <p className="label">Posts per week</p>
              <div className="inline-flex rounded-lg bg-mist p-0.5">
                {[0, 1, 2, 3].map((n) => (
                  <button key={n} onClick={() => save({ posts: { perWeek: n, enabled: n > 0 } })} className={cx('h-9 min-w-[44px] rounded-md px-3 text-sm font-medium', s.posts.perWeek === n ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted hover:text-ink')}>{n === 0 ? 'Off' : n}</button>
                ))}
              </div>
            </div>
            {s.posts.perWeek > 0 && (
              <>
                <div>
                  <label className="label" htmlFor="post-day">{s.posts.perWeek > 1 ? 'Starting on' : 'On'}</label>
                  <Select id="post-day" className="h-10 w-36 capitalize" value={s.posts.day} onChange={(e) => save({ posts: { day: e.target.value } })}>
                    {DAYS.map((d) => <option key={d} value={d} className="capitalize">{d[0].toUpperCase() + d.slice(1)}</option>)}
                  </Select>
                </div>
                <div>
                  <label className="label" htmlFor="post-time">At</label>
                  <input id="post-time" type="time" className="field h-10 w-32" defaultValue={s.posts.time} onBlur={(e) => e.target.value !== s.posts.time && save({ posts: { time: e.target.value } })} />
                </div>
              </>
            )}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2">
            <Stat value={data.posts.drafts} label="drafts need your OK" href="/app/posts" tone={data.posts.drafts ? 'warn' : undefined} />
            <Stat value={data.posts.scheduled} label="scheduled" href="/app/posts" />
            <Stat value={data.posts.publishedThisWeek} label="published this week" />
          </div>
          <div className="mt-2 border-t border-line-soft">
            <Toggle checked={s.posts.autoPublish} onChange={(v) => save({ posts: { autoPublish: v } }, v ? 'New posts will publish without asking' : 'New posts will wait for your OK')} label="Publish without asking me" description="Off: each AI post waits as a draft until you approve it." />
          </div>
        </Panel>

        {/* Hours + questions */}
        <div className="space-y-6">
          <Panel title={<CardTitle icon={<Clock className="h-4 w-4" />} title="Hours on Google" tag={data.hours.season ? <Badge tone="info">{data.hours.season.name} hours on</Badge> : undefined} />} action={<Link href="/app/profile?tab=hours" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Edit hours <ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
            <Toggle checked={s.syncHoursToGoogle} onChange={(v) => save({ syncHoursToGoogle: v })} label="Update Google when I change hours" description="Holiday hours and seasonal timings go to Google as soon as you save them. Seasonal hours switch on and off by themselves." />
            {data.hours.unset.length > 0 && (
              <div className="mt-2 rounded-xl bg-amber-soft/70 px-4 py-3 text-sm">
                <p className="font-medium text-ink">Set your hours for {data.hours.unset.map((h: any) => h.name).join(', ')}</p>
                <p className="mt-0.5 text-ink-soft">Customers check Google before festivals. Correct holiday hours also tell Google your profile is up to date.</p>
                <Link href="/app/profile?tab=hours" className="mt-2 inline-block text-sm font-medium text-brand-600 hover:underline">Set holiday hours →</Link>
              </div>
            )}
            {data.hours.upcoming.length > 0 && (
              <ul className="mt-3 divide-y divide-line-soft text-sm">
                {data.hours.upcoming.map((h: any) => (
                  <li key={h.date} className="flex items-center justify-between py-2">
                    <span><span className="font-medium">{h.name}</span> <span className="text-ink-muted">· {ymdLabel(h.date)} · in {h.daysAway} day{h.daysAway === 1 ? '' : 's'}</span></span>
                    {h.set ? <Badge tone="good">{h.special?.closed ? 'Closed' : `${h.special?.open}–${h.special?.close}`}</Badge> : <Badge tone="warn">Not set</Badge>}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={<CardTitle icon={<HelpCircle className="h-4 w-4" />} title="Customer questions" />} action={<Link href="/app/questions" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Open <ArrowUpRight className="h-3.5 w-3.5" /></Link>}>
            <p className="text-sm text-ink-muted">Answer the questions people ask once. AI uses your answers in review replies and shares them as Google posts.</p>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <Stat value={data.questions.answered} label="answered" href="/app/questions" />
              <Stat value={data.questions.suggested} label="suggested, waiting for an answer" href="/app/questions" tone={data.questions.suggested ? 'warn' : undefined} />
            </div>
          </Panel>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">Autopilot checks every few minutes. Last loaded {relDay(new Date())} {clock(new Date())}.</p>
    </>
  );
}
