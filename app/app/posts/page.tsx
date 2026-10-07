'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, CalendarClock, Check, ExternalLink, ImageOff, Megaphone, Pencil, Phone, Plus, Send, Sparkles, Trash2, Wand2 } from 'lucide-react';
import { AiMark, Badge, Button, Empty, Field, Input, Modal, PageHeader, Segmented, Select, Skeleton, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx, dayTime, shortDate, ymdLabel } from '@/lib/format';

type Post = {
  _id: string;
  type: 'STANDARD' | 'OFFER' | 'EVENT';
  theme: string;
  summary: string;
  title?: string;
  startDate?: string;
  endDate?: string;
  couponCode?: string;
  redeemUrl?: string;
  terms?: string;
  action: string;
  actionUrl?: string;
  photo?: { _id: string; fileUrl: string; caption?: string } | null;
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledFor?: string;
  publishedAt?: string;
  publishedTo?: 'google' | 'demo';
  source: 'ai' | 'manual';
  slotKey?: string;
  google?: { searchUrl?: string };
  error?: string;
};

const THEME_LABEL: Record<string, string> = {
  service: 'Service spotlight', tip: 'Tip', reviews: 'What customers love', team: 'Behind the scenes', faq: 'Customer question', festival: 'Festival', custom: 'Update',
};
const ACTIONS = [
  { value: 'NONE', label: 'No button' },
  { value: 'BOOK', label: 'Book' },
  { value: 'CALL', label: 'Call now' },
  { value: 'LEARN_MORE', label: 'Learn more' },
  { value: 'ORDER', label: 'Order online' },
  { value: 'SHOP', label: 'Shop' },
  { value: 'SIGN_UP', label: 'Sign up' },
];
const actionLabel = (a: string) => ACTIONS.find((x) => x.value === a)?.label || '';

function StatusBadge({ post }: { post: Post }) {
  if (post.status === 'published') return <Badge tone="good"><Check className="h-3 w-3" />{post.publishedTo === 'demo' ? 'Published (demo)' : 'Live on Google'}</Badge>;
  if (post.status === 'scheduled') return <Badge tone="info"><CalendarClock className="h-3 w-3" />{dayTime(post.scheduledFor)}</Badge>;
  if (post.status === 'failed') return <Badge tone="bad"><AlertTriangle className="h-3 w-3" />Not accepted</Badge>;
  return <Badge tone="ai"><Sparkles className="h-3 w-3" />Needs your OK</Badge>;
}

/** Looks roughly like a post on Google Search / Maps */
function PostPreview({ post, businessName }: { post: Partial<Post>; businessName?: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line-soft bg-white">
      {post.photo?.fileUrl ? (
        <img src={post.photo.fileUrl} alt="" className="aspect-[16/10] w-full object-cover" />
      ) : (
        <div className="flex aspect-[16/10] w-full items-center justify-center bg-mist text-xs text-ink-faint"><ImageOff className="mr-1.5 h-4 w-4" />No photo</div>
      )}
      <div className="p-4">
        {businessName && <p className="mb-1 text-xs font-medium text-ink-muted">{businessName}</p>}
        {(post.type === 'OFFER' || post.type === 'EVENT') && (
          <>
            <p className="font-display text-[17px] font-semibold leading-snug">{post.title || 'Add a title'}</p>
            {post.startDate && <p className="mt-0.5 text-xs text-ink-muted">{ymdLabel(post.startDate)}{post.endDate && post.endDate !== post.startDate ? ` – ${ymdLabel(post.endDate)}` : ''}</p>}
          </>
        )}
        <p className="mt-1.5 whitespace-pre-line text-[14px] leading-relaxed text-ink-soft">{post.summary || <span className="italic text-ink-faint">Your post text</span>}</p>
        {post.type === 'OFFER' && post.couponCode && <p className="mt-3 rounded-lg border border-dashed border-brand-200 bg-brand-50 px-3 py-2 text-center text-sm">Code <span className="font-mono font-semibold tracking-wide">{post.couponCode}</span></p>}
        {post.action && post.action !== 'NONE' && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-200 px-3.5 py-1.5 text-sm font-medium text-brand-600">
            {post.action === 'CALL' && <Phone className="h-3.5 w-3.5" />}{actionLabel(post.action)}
          </span>
        )}
      </div>
    </div>
  );
}

function PhotoPicker({ value, onChange }: { value?: string | null; onChange: (p: any | null) => void }) {
  const { data } = useSWR('/photos');
  const photos = (data?.photos || []).filter((p: any) => p.category !== 'logo');
  if (!data) return <Skeleton className="h-20" />;
  if (!photos.length) return <p className="text-sm text-ink-muted">No photos yet. <Link href="/app/photos" className="text-brand-600 hover:underline">Upload photos</Link> to add one.</p>;
  return (
    <div className="thin-scroll flex gap-2 overflow-x-auto pb-1">
      <button type="button" onClick={() => onChange(null)} className={cx('flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-lg border text-xs text-ink-muted', !value ? 'border-brand-500 ring-2 ring-brand-200' : 'border-line')}>None</button>
      {photos.map((p: any) => (
        <button type="button" key={p._id} onClick={() => onChange(p)} className={cx('h-[72px] w-[72px] shrink-0 overflow-hidden rounded-lg border', value === p._id ? 'border-brand-500 ring-2 ring-brand-200' : 'border-line-soft')} aria-label={p.caption || 'Photo'}>
          <img src={p.fileUrl} alt="" className="h-full w-full object-cover" />
        </button>
      ))}
    </div>
  );
}

const toLocalInput = (d?: string | Date) => {
  const x = d ? new Date(d) : new Date(Date.now() + 3600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}T${pad(x.getHours())}:${pad(x.getMinutes())}`;
};

function PostEditor({ open, post, defaults, onClose, onDone }: { open: boolean; post: Post | null; defaults: any; onClose: () => void; onDone: () => void }) {
  const toast = useToast();
  const { data: svc } = useSWR(open ? '/services' : null);
  const isNew = !post?._id;
  const [form, setForm] = useState<any>({});
  const [when, setWhen] = useState<'now' | 'schedule' | 'draft'>('now');
  const [at, setAt] = useState(toLocalInput());
  const [ai, setAi] = useState({ theme: 'service', serviceId: '', instruction: '' });
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm(post ? { ...post, photo: post.photo || null } : { type: 'STANDARD', summary: '', action: defaults?.action || 'NONE', actionUrl: defaults?.actionUrl || '', photo: null });
    setWhen(post?.scheduledFor ? 'schedule' : post ? 'draft' : 'now');
    setAt(toLocalInput(post?.scheduledFor));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, post]);

  const set = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));
  const services = svc?.services || [];

  const write = async () => {
    setBusy('ai');
    try {
      const res = await api('/posts/write', { body: { type: form.type, theme: ai.theme, serviceId: ai.serviceId || undefined, instruction: ai.instruction || undefined } });
      set({ summary: res.summary, ...(res.title && form.type !== 'STANDARD' && !form.title ? { title: res.title } : {}), theme: ai.theme, source: 'ai' });
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const submit = async () => {
    setBusy('save');
    setError('');
    const body: any = {
      type: form.type, summary: form.summary, title: form.title || '', startDate: form.startDate || '', endDate: form.endDate || form.startDate || '',
      couponCode: form.couponCode || '', redeemUrl: form.redeemUrl || '', terms: form.terms || '',
      action: form.action, actionUrl: ['NONE', 'CALL'].includes(form.action) ? '' : form.actionUrl || '',
      photo: form.photo?._id || null,
      scheduledFor: when === 'schedule' ? new Date(at).toISOString() : null,
    };
    try {
      if (isNew) {
        const res = await api('/posts', { body: { ...body, publishNow: when === 'now' } });
        toast(res.post.status === 'published' ? (res.post.publishedTo === 'demo' ? 'Published (demo — not sent to Google)' : 'Post is live on Google') : res.post.status === 'scheduled' ? `Scheduled for ${dayTime(res.post.scheduledFor)}` : res.post.status === 'failed' ? `Google didn’t accept it: ${res.post.error}` : 'Saved as a draft');
      } else {
        await api(`/posts/${post!._id}`, { method: 'PATCH', body });
        if (when === 'now') await api(`/posts/${post!._id}/publish`, { method: 'POST' });
        else if (when === 'schedule') await api(`/posts/${post!._id}/approve`, { method: 'POST' });
        else if (post!.status === 'scheduled') await api(`/posts/${post!._id}/unschedule`, { method: 'POST' });
        toast(when === 'now' ? 'Published' : when === 'schedule' ? 'Scheduled' : 'Saved');
      }
      onDone();
      onClose();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy('');
    }
  };

  const needsDates = form.type === 'OFFER' || form.type === 'EVENT';
  const preview = useMemo(() => ({ ...form }), [form]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? 'New Google post' : 'Edit post'}
      wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={busy === 'save'} disabled={!form.summary?.trim()} icon={when === 'now' ? <Send className="h-4 w-4" /> : when === 'schedule' ? <CalendarClock className="h-4 w-4" /> : <Check className="h-4 w-4" />}>
            {when === 'now' ? 'Publish now' : when === 'schedule' ? 'Schedule' : 'Save draft'}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_260px]">
        <div className="min-w-0 space-y-4">
          <div className="inline-flex rounded-lg bg-mist p-0.5">
            {[['STANDARD', 'Update'], ['OFFER', 'Offer'], ['EVENT', 'Event']].map(([v, l]) => (
              <button key={v} type="button" onClick={() => set({ type: v })} className={cx('h-8 rounded-md px-3.5 text-sm font-medium', form.type === v ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-muted')}>{l}</button>
            ))}
          </div>

          <div className="rounded-xl border border-violet/20 bg-violet-soft/40 p-3">
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-ink"><Wand2 className="h-4 w-4 text-violet" />Write it with AI</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Select className="h-9 py-1 text-sm" value={ai.theme} onChange={(e) => setAi({ ...ai, theme: e.target.value })} aria-label="Topic">
                <option value="service">Service spotlight</option>
                <option value="tip">Helpful tip</option>
                <option value="reviews">What customers love</option>
                <option value="team">Behind the scenes</option>
                <option value="custom">My own idea</option>
              </Select>
              {(ai.theme === 'service' || ai.theme === 'tip') && services.length > 0 && (
                <Select className="h-9 py-1 text-sm" value={ai.serviceId} onChange={(e) => setAi({ ...ai, serviceId: e.target.value })} aria-label="Service">
                  <option value="">Any service</option>
                  {services.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
                </Select>
              )}
            </div>
            <div className="mt-2 flex gap-2">
              <input className="field h-9 min-w-0 flex-1 text-sm" placeholder={ai.theme === 'custom' ? 'e.g. we’re now open on Sundays' : 'Anything to mention? (optional)'} value={ai.instruction} onChange={(e) => setAi({ ...ai, instruction: e.target.value })} aria-label="Note for the AI" />
              <Button size="sm" variant="ai" className="h-9" onClick={write} loading={busy === 'ai'} icon={<Sparkles className="h-3.5 w-3.5" />}>Write</Button>
            </div>
          </div>

          {needsDates && (
            <div className="grid gap-3 sm:grid-cols-3">
              <Field label={form.type === 'OFFER' ? 'Offer title' : 'Event title'} className="sm:col-span-3"><Input value={form.title || ''} maxLength={58} onChange={(e) => set({ title: e.target.value })} placeholder={form.type === 'OFFER' ? 'Festive hair spa week' : 'Free skin check-up day'} /></Field>
              <Field label="Starts"><Input type="date" value={form.startDate || ''} onChange={(e) => set({ startDate: e.target.value })} /></Field>
              <Field label="Ends"><Input type="date" value={form.endDate || ''} min={form.startDate} onChange={(e) => set({ endDate: e.target.value })} /></Field>
            </div>
          )}

          <Field label="Post text" hint={`${(form.summary || '').length} / 1500 · No phone numbers or links in the text — Google rejects them. Use the button instead.`}>
            <Textarea rows={6} maxLength={1500} value={form.summary || ''} onChange={(e) => set({ summary: e.target.value, source: form.source })} />
          </Field>

          {form.type === 'OFFER' && (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Coupon code (optional)"><Input value={form.couponCode || ''} onChange={(e) => set({ couponCode: e.target.value })} /></Field>
              <Field label="Redeem online link (optional)"><Input type="url" value={form.redeemUrl || ''} onChange={(e) => set({ redeemUrl: e.target.value })} placeholder="https://" /></Field>
              <Field label="Terms (optional)" className="sm:col-span-2"><Input value={form.terms || ''} onChange={(e) => set({ terms: e.target.value })} placeholder="Valid on weekdays only" /></Field>
            </div>
          )}

          <div>
            <p className="label">Photo</p>
            <PhotoPicker value={form.photo?._id} onChange={(p) => set({ photo: p })} />
          </div>

          <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
            <Field label="Button">
              <Select value={form.action} onChange={(e) => set({ action: e.target.value })}>{ACTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}</Select>
            </Field>
            {!['NONE', 'CALL'].includes(form.action) && <Field label="Button link"><Input type="url" value={form.actionUrl || ''} onChange={(e) => set({ actionUrl: e.target.value })} placeholder="https://" /></Field>}
            {form.action === 'CALL' && <p className="self-end pb-2.5 text-sm text-ink-muted">Uses the phone number on your Google profile.</p>}
          </div>

          <div>
            <p className="label">When</p>
            <div className="flex flex-wrap items-center gap-2">
              {[['now', 'Publish now'], ['schedule', 'Schedule'], ['draft', 'Save as draft']].map(([v, l]) => (
                <label key={v} className={cx('flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm', when === v ? 'border-brand-500 bg-brand-50' : 'border-line')}>
                  <input type="radio" className="accent-brand-500" checked={when === v} onChange={() => setWhen(v as any)} />{l}
                </label>
              ))}
              {when === 'schedule' && <Input type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} className="h-10 w-auto" aria-label="Date and time" />}
            </div>
          </div>
          {error && <p className="rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
        </div>

        <div>
          <p className="label">Preview</p>
          <PostPreview post={preview} />
        </div>
      </div>
    </Modal>
  );
}

function PostCard({ post, businessName, onEdit, onChanged }: { post: Post; businessName?: string; onEdit: () => void; onChanged: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const act = async (what: 'approve' | 'publish' | 'unschedule' | 'delete') => {
    if (what === 'delete' && !window.confirm(post.status === 'published' && post.publishedTo === 'google' ? 'Delete this post? It will also be removed from Google.' : 'Delete this post?')) return;
    setBusy(what);
    try {
      if (what === 'delete') await api(`/posts/${post._id}`, { method: 'DELETE' });
      else {
        const res = await api(`/posts/${post._id}/${what}`, { method: 'POST' });
        const p = res.post;
        toast(p.status === 'published' ? (p.publishedTo === 'demo' ? 'Published (demo — not sent to Google)' : 'Post is live on Google') : p.status === 'scheduled' ? `Scheduled for ${dayTime(p.scheduledFor)}` : 'Moved back to drafts');
      }
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  const overdue = post.status === 'draft' && post.scheduledFor && new Date(post.scheduledFor) < new Date();

  return (
    <article className="flex flex-col rounded-xl2 border border-line-soft bg-paper p-4 shadow-lift">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <StatusBadge post={post} />
        <span className="text-xs text-ink-muted">{THEME_LABEL[post.theme] || 'Update'}{post.type !== 'STANDARD' ? ` · ${post.type === 'OFFER' ? 'Offer' : 'Event'}` : ''}</span>
        {post.source === 'ai' && <AiMark label="Written by AI" className="ml-auto" />}
      </div>
      <PostPreview post={post} businessName={businessName} />
      {post.status === 'draft' && post.scheduledFor && (
        <p className={cx('mt-3 text-xs', overdue ? 'text-amber' : 'text-ink-muted')}>{overdue ? `Planned for ${dayTime(post.scheduledFor)} — approve to publish now.` : `Planned for ${dayTime(post.scheduledFor)}. Approve it and it publishes then.`}</p>
      )}
      {post.status === 'failed' && <p className="mt-3 rounded-lg bg-rose-soft px-3 py-2 text-xs text-rose">{post.error}</p>}
      {post.status === 'published' && <p className="mt-3 text-xs text-ink-muted">Published {shortDate(post.publishedAt)}</p>}
      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        {post.status === 'draft' && <Button size="sm" onClick={() => act('approve')} loading={busy === 'approve'} icon={<Check className="h-3.5 w-3.5" />}>{post.scheduledFor && !overdue ? 'Approve' : 'Approve & publish'}</Button>}
        {post.status === 'scheduled' && <Button size="sm" variant="secondary" onClick={() => act('publish')} loading={busy === 'publish'} icon={<Send className="h-3.5 w-3.5" />}>Post now</Button>}
        {post.status === 'failed' && <Button size="sm" onClick={() => act('publish')} loading={busy === 'publish'}>Try again</Button>}
        {post.status !== 'published' && <Button size="sm" variant="ghost" onClick={onEdit} icon={<Pencil className="h-3.5 w-3.5" />}>Edit</Button>}
        {post.status === 'scheduled' && <Button size="sm" variant="ghost" onClick={() => act('unschedule')} loading={busy === 'unschedule'}>Unschedule</Button>}
        {post.status === 'published' && post.google?.searchUrl && <a href={post.google.searchUrl} target="_blank" rel="noreferrer"><Button size="sm" variant="secondary" icon={<ExternalLink className="h-3.5 w-3.5" />}>View on Google</Button></a>}
        <Button size="sm" variant="ghost" className="ml-auto text-ink-faint hover:text-rose" onClick={() => act('delete')} loading={busy === 'delete'} aria-label="Delete post" icon={<Trash2 className="h-3.5 w-3.5" />} />
      </div>
    </article>
  );
}

export default function PostsPage() {
  const toast = useToast();
  const [tab, setTab] = useState<'upcoming' | 'published'>('upcoming');
  const { data, mutate } = useSWR(`/posts?status=${tab}`);
  const { data: other } = useSWR(`/posts?status=${tab === 'upcoming' ? 'published' : 'upcoming'}`);
  const { data: biz } = useSWR('/business');
  const [editing, setEditing] = useState<Post | null>(null);
  const [creating, setCreating] = useState(false);
  const [planning, setPlanning] = useState(false);

  const plan = async () => {
    setPlanning(true);
    try {
      const res = await api('/posts/plan', { method: 'POST' });
      toast(res.created ? `AI wrote ${res.created} post${res.created === 1 ? '' : 's'} for the coming week` : 'This week’s posts are already written');
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setPlanning(false);
    }
  };

  const posts: Post[] = data?.posts || [];
  const counts = { [tab]: posts.length, [tab === 'upcoming' ? 'published' : 'upcoming']: other?.posts?.length } as any;
  const s = data?.settings;

  return (
    <>
      <PageHeader
        title="Google posts"
        subtitle="Short updates on your Google profile — services, tips, offers and festival wishes. They keep your profile looking alive and give people a reason to tap Call or Book."
        actions={
          <>
            <Button variant="secondary" onClick={plan} loading={planning} icon={<Sparkles className="h-4 w-4" />}>Write this week’s posts</Button>
            <Button onClick={() => setCreating(true)} icon={<Plus className="h-4 w-4" />}>New post</Button>
          </>
        }
      />

      {data && !data.connection && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-ink-soft">
          <AlertTriangle className="h-4 w-4 shrink-0 text-brand-500" />
          <span className="flex-1">Connect Google to publish posts. You can still write and plan them now.</span>
          <Link href="/app/google" className="font-medium text-brand-600 hover:underline">Connect</Link>
        </div>
      )}
      {s && (
        <p className="mb-4 text-sm text-ink-muted">
          {s.enabled && s.perWeek ? <>AI writes <span className="font-medium text-ink">{s.perWeek} post{s.perWeek > 1 ? 's' : ''} a week</span> starting <span className="capitalize">{s.day}s</span> at {s.time}{s.autoPublish ? ', and publishes them by itself.' : '. Each one waits for your OK.'}</> : 'Weekly AI posts are off.'}{' '}
          <Link href="/app/autopilot" className="font-medium text-brand-600 hover:underline">Change</Link>
        </p>
      )}

      <div className="mb-5">
        <Segmented<'upcoming' | 'published'> value={tab} onChange={setTab} options={[{ value: 'upcoming', label: 'Upcoming & drafts', count: counts.upcoming }, { value: 'published', label: 'Published', count: counts.published }]} />
      </div>

      {!data ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"><Skeleton className="h-96" /><Skeleton className="h-96" /><Skeleton className="h-96" /></div>
      ) : posts.length === 0 ? (
        <Empty
          icon={<Megaphone className="h-6 w-6" />}
          title={tab === 'upcoming' ? 'Nothing planned yet' : 'No posts published yet'}
          action={tab === 'upcoming' ? <Button variant="ai" onClick={plan} loading={planning} icon={<Sparkles className="h-4 w-4" />}>Let AI write this week’s post</Button> : undefined}
        >
          {tab === 'upcoming' ? 'AI can write your weekly post using your services, reviews and photos. You approve it before it goes live.' : 'Posts you publish appear here with a link to see them on Google.'}
        </Empty>
      ) : (
        <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
          {posts.map((p) => <PostCard key={p._id} post={p} businessName={biz?.business?.name} onEdit={() => setEditing(p)} onChanged={() => mutate()} />)}
        </div>
      )}

      <PostEditor open={creating || !!editing} post={editing} defaults={data?.defaults} onClose={() => { setCreating(false); setEditing(null); }} onDone={() => mutate()} />
    </>
  );
}
