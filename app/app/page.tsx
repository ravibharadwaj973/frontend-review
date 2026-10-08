'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { ArrowUpRight, CalendarClock, Check, Circle, Clock, Images, Megaphone, MessageSquareText, RefreshCw, Send, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AiMark, Avatar, Button, Drawer, Panel, Skeleton, Stars, useToast } from '@/components/ui';
import { MonthlyBars, RatingLine, RatingDistribution, TopicBalance, Funnel, SentimentStrip } from '@/components/charts';
import { ReviewDetail } from '@/components/app/reviews';
import { QrCard } from '@/components/app/QrCard';
import { useAuth } from '@/lib/auth';
import { api } from '@/lib/api';
import { cx, hours, num, timeAgo, when } from '@/lib/format';

function AutopilotCard() {
  const { data } = useSWR('/autopilot', { refreshInterval: 120_000 });
  if (!data) return <Skeleton className="h-56" />;
  const s = data.settings;
  const nextPhoto = data.week.flatMap((d: any) => d.photos)[0];
  const nextPost = data.week.flatMap((d: any) => d.posts).find((p: any) => p.status !== 'published');
  const unset = data.hours.unset?.[0];
  const Row = ({ icon, children, href }: { icon: React.ReactNode; children: React.ReactNode; href: string }) => (
    <li>
      <Link href={href} className="flex items-start gap-3 rounded-lg px-2 py-2 text-sm hover:bg-mist">
        <span className="mt-0.5 text-brand-500">{icon}</span>
        <span className="flex-1 text-ink-soft">{children}</span>
      </Link>
    </li>
  );
  return (
    <Panel title={<h2 className="flex items-center gap-2 font-display text-[17px] font-semibold"><CalendarClock className="h-[18px] w-[18px] text-brand-500" />Autopilot this week</h2>} action={<Link href="/app/autopilot" className="text-sm font-medium text-brand-600 hover:underline">Open</Link>}>
      {!data.connection && <p className="-mt-1 mb-2 rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">Connect Google to switch autopilot on.</p>}
      <ul className="-mx-2 -my-1">
        <Row icon={<MessageSquareText className="h-4 w-4" />} href="/app/reviews?filter=unanswered">
          {data.replies.auto ? <><span className="font-medium text-ink">{data.replies.auto}</span> AI repl{data.replies.auto === 1 ? 'y posts' : 'ies post'} by {data.replies.auto === 1 ? 'itself' : 'themselves'}</> : 'No replies waiting to post'}
          {data.replies.waitingApproval > 0 && <> · <span className="font-medium text-amber">{data.replies.waitingApproval} need your OK</span></>}
        </Row>
        <Row icon={<Images className="h-4 w-4" />} href="/app/photos">
          <span className="font-medium text-ink">{data.photos.postedThisWeek}/{s.photos.perWeek}</span> photos posted{nextPhoto ? <> · next {when(nextPhoto.scheduledFor)}</> : data.photos.queued === 0 && s.photos.perWeek ? <> · <span className="text-amber">queue is empty</span></> : null}
        </Row>
        <Row icon={<Megaphone className="h-4 w-4" />} href="/app/posts">
          {data.posts.drafts ? <><span className="font-medium text-amber">{data.posts.drafts} post{data.posts.drafts > 1 ? 's' : ''}</span> waiting for your OK</> : nextPost ? <>Next post {when(nextPost.scheduledFor)}</> : <>{data.posts.publishedThisWeek} post{data.posts.publishedThisWeek === 1 ? '' : 's'} published this week</>}
        </Row>
        {unset && (
          <Row icon={<Clock className="h-4 w-4" />} href="/app/profile?tab=hours">
            <span className="font-medium text-amber">{unset.name}</span> is in {unset.daysAway} day{unset.daysAway === 1 ? '' : 's'} — set your hours
          </Row>
        )}
      </ul>
    </Panel>
  );
}

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

function Stat({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone?: 'good' | 'bad' }) {
  return (
    <div className="min-w-0 px-6 py-4">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 whitespace-nowrap font-display text-[26px] font-semibold leading-none tabular text-ink">{value}</p>
      {sub && <p className={cx('mt-1.5 text-xs', tone === 'good' ? 'text-leaf' : tone === 'bad' ? 'text-rose' : 'text-ink-muted')}>{sub}</p>}
    </div>
  );
}

function Onboarding({ steps }: { steps: { done: boolean; label: string; href: string; cta: string }[] }) {
  const left = steps.filter((s) => !s.done).length;
  if (!left) return null;
  return (
    <Panel className="mb-6" padded={false}>
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
        <div className="lg:w-64">
          <h2 className="font-display text-lg font-semibold">Finish setting up</h2>
          <p className="text-sm text-ink-muted">{left} step{left > 1 ? 's' : ''} left before ReviewRankr can work on its own.</p>
        </div>
        <ol className="grid flex-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.label}>
              <Link href={s.href} className={cx('flex h-full items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors', s.done ? 'border-transparent bg-mist text-ink-muted' : 'border-line hover:border-brand-200 hover:bg-brand-50')}>
                {s.done ? <Check className="h-4 w-4 shrink-0 text-leaf" /> : <Circle className="h-4 w-4 shrink-0 text-ink-faint" />}
                <span className={cx('flex-1', s.done && 'line-through decoration-ink-faint/50')}><span className="tabular text-ink-faint">{i + 1}.</span> {s.label}</span>
                {!s.done && <span className="text-xs font-medium text-brand-600">{s.cta}</span>}
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </Panel>
  );
}

export default function Dashboard() {
  const { user, business } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const { data, mutate, isLoading } = useSWR('/analytics/dashboard', { refreshInterval: 60_000 });
  const [open, setOpen] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);

  const sync = async () => {
    setSyncing(true);
    try {
      const res = await api('/google/sync', { method: 'POST' });
      toast(res.demo ? 'Demo profile — nothing new to import' : `${res.created} new review${res.created === 1 ? '' : 's'} imported`);
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setSyncing(false);
    }
  };

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-72" />
        <div className="grid gap-6 lg:grid-cols-3"><Skeleton className="h-80 lg:col-span-2" /><Skeleton className="h-80" /></div>
      </div>
    );
  }

  const o = data.overview;
  const f = data.funnel;
  const delta = o.thisMonth - o.lastMonth;
  const steps = [
    { done: data.onboarding?.profile, label: 'Complete your profile', href: '/app/profile', cta: 'Open' },
    { done: data.onboarding?.services, label: 'Add your services', href: '/app/profile?tab=services', cta: 'Add' },
    { done: data.onboarding?.google, label: 'Connect Google', href: '/app/google', cta: 'Connect' },
    { done: f.created > 0, label: 'Send a review request', href: '/app/requests?new=1', cta: 'Send' },
  ];

  return (
    <>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-[30px] font-semibold leading-tight sm:text-[34px]">{greeting()}, {user?.name?.split(' ')[0]}</h1>
          <p className="mt-1 text-[15px] text-ink-muted">
            {o.unanswered ? <>{o.unanswered} review{o.unanswered > 1 ? 's' : ''} waiting for a reply{data.needsReply.some((r: any) => r.draft) ? ' — drafts are ready' : ''}.</> : 'Every review has a reply. Nice work.'}
            {data.google?.lastSyncAt && <> Last checked {timeAgo(data.google.lastSyncAt)}.</>}
          </p>
        </div>
        <div className="flex gap-2">
          {data.google && <Button variant="secondary" onClick={sync} loading={syncing} icon={<RefreshCw className="h-4 w-4" />}>Check for reviews</Button>}
          <Button onClick={() => router.push('/app/requests?new=1')} icon={<Send className="h-4 w-4" />}>Ask for a review</Button>
        </div>
      </div>

      <Onboarding steps={steps} />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="min-w-0 space-y-6">
        {/* Reputation */}
        <Panel padded={false}>
          <div className="flex flex-wrap items-end justify-between gap-4 px-6 pt-6">
            <div className="flex items-center gap-4">
              <span className="font-display text-[68px] font-semibold leading-[0.9] tabular tracking-tight text-ink">{o.total ? o.avgRating.toFixed(1) : '—'}</span>
              <div>
                <Stars value={o.avgRating} size={17} />
                <p className="mt-1 text-sm text-ink-muted">{num(o.total)} Google reviews</p>
                {o.direct?.total > 0 && <Link href="/app/reviews?filter=direct" className="text-xs font-medium text-brand-600 hover:underline">+ {num(o.direct.total)} sent in ReviewRankr</Link>}
              </div>
            </div>
            <div className="w-full max-w-[280px] flex-1">
              <p className="mb-0.5 text-xs text-ink-muted">Rating over the last 12 months</p>
              <RatingLine series={o.series} height={64} compact />
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 border-y border-line-soft sm:grid-cols-4 sm:divide-x sm:divide-line-soft">
            <Stat label="New this month" value={num(o.thisMonth)} sub={`${num(o.lastMonth)} last month`} tone={delta > 0 ? 'good' : undefined} />
            <Stat label="Response rate" value={`${o.responseRate}%`} sub={`${o.unanswered} unanswered`} tone={o.unanswered > 5 ? 'bad' : undefined} />
            <Stat label="Average reply time" value={hours(o.avgResponseHours)} />
            <Stat label="Request to review" value={`${f.conversionRate}%`} sub={`${f.reviewed} of ${f.sent} requests`} />
          </div>
          <div className="px-6 pb-4 pt-5">
            <div className="mb-2 flex items-baseline justify-between">
              <h2 className="font-display text-[15px] font-semibold">New reviews per month</h2>
              <Link href="/app/analytics" className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline">Analytics <ArrowUpRight className="h-3.5 w-3.5" /></Link>
            </div>
            <MonthlyBars series={o.series} height={190} />
          </div>
        </Panel>

        <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <Panel title="What customers mention" action={<Link href="/app/analytics#topics" className="text-sm font-medium text-brand-600 hover:underline">Details</Link>}>
          <TopicBalance praised={data.topics.praised} criticized={data.topics.criticized} onSelect={(t) => router.push(`/app/reviews?topic=${encodeURIComponent(t)}`)} />
        </Panel>
          <Panel title="Ratings">
          <RatingDistribution distribution={o.distribution} onSelect={(s) => router.push(`/app/reviews?rating=${s}`)} />
          <div className="mt-6 border-t border-line-soft pt-5">
            <p className="mb-3 text-sm font-medium text-ink-soft">Sentiment from review text</p>
            <SentimentStrip sentiment={o.sentiment} />
          </div>
        </Panel>
        </div>
        </div>

        <div className="min-w-0 space-y-6">
        <AutopilotCard />
        {/* Reply queue */}
        <Panel title="Needs your reply" action={<Link href="/app/reviews?filter=unanswered" className="text-sm font-medium text-brand-600 hover:underline">All</Link>} padded={false}>
          {data.needsReply.length === 0 ? (
            <p className="px-5 pb-6 pt-3 text-sm text-ink-muted">You’re all caught up. New reviews appear here with a draft reply.</p>
          ) : (
            <ul className="space-y-3 p-4">
              {data.needsReply.map((r: any) => (
                <li key={r._id}>
                  <button onClick={() => setOpen(r._id)} className="block w-full rounded-xl border border-line-soft bg-white p-3.5 text-left transition-colors hover:border-brand-200">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={r.reviewer.name} size={28} />
                      <span className="flex-1 truncate text-sm font-medium">{r.reviewer.name}</span>
                      <Stars value={r.rating} size={12} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{r.comment || <span className="italic text-ink-faint">Rating only</span>}</p>
                    {r.draft ? (
                      <div className="ai-sheen mt-2.5 rounded-lg px-3 py-2">
                        <AiMark />
                        <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">{r.draft.text}</p>
                      </div>
                    ) : (
                      <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-violet"><Sparkles className="h-3 w-3" />Draft a reply</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <Panel title="Review requests" action={<Link href="/app/requests" className="text-sm font-medium text-brand-600 hover:underline">Open</Link>}>
          <Funnel
            steps={[
              { label: 'Sent', value: f.sent },
              { label: 'Opened link', value: f.clicked },
              { label: 'Left a review', value: f.reviewed, note: 'Matched by reviewer name, or marked by you' },
            ]}
          />
          <div className="mt-5 flex items-center justify-between rounded-xl bg-mist px-3 py-2.5 text-sm">
            <span className="text-ink-soft">AI replies published</span>
            <span className="font-display font-semibold tabular">{data.ai.published}<span className="font-sans text-xs font-normal text-ink-muted"> of {data.ai.generated} drafted</span></span>
          </div>
        </Panel>
        <QrCard />
        </div>
      </div>

      <Drawer open={!!open} onClose={() => setOpen(null)} label="Review">
        {open && <ReviewDetail reviewId={open} onClose={() => setOpen(null)} onChanged={() => mutate()} />}
      </Drawer>
    </>
  );
}
