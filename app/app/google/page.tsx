'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { AlertTriangle, ArrowUpFromLine, Check, ExternalLink, FlaskConical, MapPin, RefreshCw, Unplug, Zap } from 'lucide-react';
import { Badge, Button, Empty, PageHeader, Panel, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { cx, timeAgo } from '@/lib/format';

const STATUS: Record<string, { label: string; tone: any }> = {
  synced: { label: 'Synced', tone: 'good' },
  different: { label: 'Different', tone: 'warn' },
  partial: { label: 'Partial', tone: 'warn' },
  not_synced: { label: 'Not synced', tone: 'neutral' },
  unknown: { label: 'Not checked', tone: 'neutral' },
  empty: { label: 'Empty', tone: 'neutral' },
  demo: { label: 'Demo', tone: 'info' },
  google_managed: { label: 'Managed in Google', tone: 'neutral' },
  not_connected: { label: '—', tone: 'neutral' },
};

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  );
}

function Connect({ googleConfigured, onDone }: { googleConfigured: boolean; onDone: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState('');
  const connect = async () => {
    setBusy('live');
    try {
      const { url } = await api('/auth/google?format=json');
      window.location.href = url;
    } catch (e: any) {
      toast(e.message, 'bad');
      setBusy('');
    }
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl2 border border-brand-100 bg-brand-50 px-5 py-4 text-sm text-ink-soft lg:col-span-2">
        <span className="font-medium text-brand-700">Customers can post on Google before you connect.</span> Save your Google review link in{' '}
        <a href="/app/settings#review-link" className="font-medium text-brand-700 underline">Settings → Google review link</a>, and the review page sends every customer straight to your Google review form. Connecting later doesn’t change your saved link.
      </div>
      <Panel>
        <div className="flex items-center gap-3"><GoogleMark /><h2 className="font-display text-xl font-semibold">Connect Google Business Profile</h2></div>
        <p className="mt-3 text-[15px] leading-relaxed text-ink-soft">Sign in with the Google account that manages your listing. ReviewRankr will import reviews, check for new ones every 15 minutes, and publish replies you approve.</p>
        <ul className="mt-4 space-y-1.5 text-sm text-ink-soft">
          {['Read and reply to reviews', 'Update hours, description, phone and website', 'Publish photos and your service menu'].map((t) => <li key={t} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-leaf" />{t}</li>)}
        </ul>
        {googleConfigured ? (
          <Button className="mt-6" size="lg" onClick={connect} loading={busy === 'live'} icon={<GoogleMark />}>Continue with Google</Button>
        ) : (
          <div className="mt-6 rounded-xl bg-amber-soft p-4 text-sm text-ink-soft">
            <p className="flex items-center gap-2 font-medium text-amber"><AlertTriangle className="h-4 w-4" />Google sign-in isn’t set up on this server yet</p>
            <p className="mt-1.5">Add <code className="rounded bg-white/70 px-1">GOOGLE_CLIENT_ID</code> and <code className="rounded bg-white/70 px-1">GOOGLE_CLIENT_SECRET</code> to <code className="rounded bg-white/70 px-1">backend/.env</code> — the README walks through creating them in Google Cloud and requesting Business Profile API access.</p>
          </div>
        )}
      </Panel>
    </div>
  );
}

function LocationPicker({ onDone }: { onDone: () => void }) {
  const toast = useToast();
  const { data, error } = useSWR('/google/locations');
  const [busy, setBusy] = useState('');
  const choose = async (locationName: string) => {
    setBusy(locationName);
    try {
      await api('/google/locations/select', { body: { locationName } });
      toast('Location connected. Importing reviews…');
      onDone();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  return (
    <Panel title="Choose your location">
      {error ? <p className="text-sm text-rose">{error.message}</p> : !data ? <Skeleton className="h-24" /> : !data.locations.length ? (
        <Empty title="No locations on this Google account">Sign in with the account that manages your Business Profile, or check that the profile is verified.</Empty>
      ) : (
        <ul className="divide-y divide-line-soft">
          {data.locations.map((l: any) => (
            <li key={l.locationName} className="flex items-center gap-4 py-3">
              <MapPin className="h-5 w-5 text-brand-400" />
              <div className="min-w-0 flex-1"><p className="font-medium">{l.title}</p><p className="truncate text-sm text-ink-muted">{l.address || l.accountTitle}</p></div>
              <Button size="sm" onClick={() => choose(l.locationName)} loading={busy === l.locationName}>Connect</Button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function SyncTable({ onChanged }: { onChanged: () => void }) {
  const toast = useToast();
  const { data, mutate } = useSWR('/google/sync-status');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState('');
  if (!data) return <Skeleton className="h-64" />;
  const demo = data.mode === 'demo';
  const profileKeys = ['name', 'phone', 'website', 'description', 'hours', 'specialHours'];

  const push = async (keys: string[]) => {
    const profile = keys.filter((k) => profileKeys.includes(k));
    setBusy('push');
    try {
      if (profile.length) {
        const res = await api('/google/push/profile', { body: { sections: profile } });
        const failed = Object.entries(res.results).filter(([, v]: any) => v.status === 'failed');
        if (failed.length) toast(`Google rejected: ${failed.map(([k, v]: any) => `${k} (${v.message})`).join('; ')}`, 'bad');
        else toast(demo ? 'Demo — nothing was sent to Google' : 'Google accepted the update');
      }
      if (keys.includes('services')) {
        const res = await api('/google/push/services', { method: 'POST' });
        toast(res.result.status === 'failed' ? `Services: ${res.result.message}` : demo ? 'Demo — services marked, not sent' : `${res.result.count} services published`, res.result.status === 'failed' ? 'bad' : 'good');
      }
      setSelected([]);
      mutate();
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };
  const refresh = async () => {
    setBusy('refresh');
    try {
      await api('/google/refresh', { method: 'POST' });
      mutate();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const pushable = data.sections.filter((s: any) => s.pushable && s.key !== 'photos');
  return (
    <Panel
      title="What Google shows vs. ReviewRankr"
      padded={false}
      action={<div className="flex gap-2">{!demo && <Button size="sm" variant="ghost" onClick={refresh} loading={busy === 'refresh'} icon={<RefreshCw className="h-3.5 w-3.5" />}>Re-check</Button>}<Button size="sm" disabled={!selected.length} loading={busy === 'push'} onClick={() => push(selected)} icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}>Push {selected.length || ''} to Google</Button></div>}
    >
      <p className="px-5 pt-2 text-sm text-ink-muted">{data.fetchedAt ? `Google profile checked ${timeAgo(data.fetchedAt)}.` : demo ? 'Demo connection — statuses are simulated.' : 'Press Re-check to read your Google profile.'} A section only shows Synced after Google confirms it.</p>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-y border-line-soft bg-mist/50 text-left text-xs text-ink-muted">
            <tr><th className="w-10 px-5 py-2.5" /><th className="py-2.5 font-medium">Section</th><th className="px-3 py-2.5 font-medium">ReviewRankr</th><th className="px-3 py-2.5 font-medium">Google</th><th className="px-5 py-2.5 font-medium">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-line-soft">
            {data.sections.map((s: any) => {
              const canPick = pushable.some((p: any) => p.key === s.key);
              const fmt = (v: any) => (v === '' || v == null ? <span className="text-ink-faint">—</span> : typeof v === 'number' ? v : <span className="line-clamp-1 max-w-[220px]" title={String(v)}>{String(v)}</span>);
              return (
                <tr key={s.key}>
                  <td className="px-5 py-3">{canPick && <input type="checkbox" className="h-4 w-4 accent-brand-500" checked={selected.includes(s.key)} onChange={(e) => setSelected(e.target.checked ? [...selected, s.key] : selected.filter((k) => k !== s.key))} aria-label={`Select ${s.label}`} />}</td>
                  <td className="py-3 font-medium">{s.label}{s.note && <p className="text-xs font-normal text-ink-muted">{s.note}</p>}</td>
                  <td className="px-3 py-3 text-ink-soft">{fmt(s.app)}</td>
                  <td className="px-3 py-3 text-ink-soft">{fmt(s.google)}</td>
                  <td className="px-5 py-3"><Badge tone={STATUS[s.status]?.tone}>{STATUS[s.status]?.label || s.status}</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

function PhotoSync() {
  const toast = useToast();
  const { data, mutate } = useSWR('/photos');
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const photos = data?.photos || [];
  const publish = async () => {
    setBusy(true);
    try {
      const res = await api('/google/push/photos', { body: { ids: selected } });
      const failed = res.photos.filter((p: any) => p.google?.syncStatus === 'failed');
      toast(failed.length ? failed[0].google.error : `${res.photos.length} photo${res.photos.length > 1 ? 's' : ''} processed`, failed.length ? 'bad' : 'good');
      setSelected([]);
      mutate();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Panel title="Photos" action={<Button size="sm" disabled={!selected.length} loading={busy} onClick={publish} icon={<ArrowUpFromLine className="h-3.5 w-3.5" />}>Publish {selected.length || ''} to Google</Button>}>
      {!photos.length ? <p className="text-sm text-ink-muted">Upload photos under Business profile → Photos, then publish them here.</p> : (
        <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
          {photos.map((p: any) => {
            const on = selected.includes(p._id);
            const status = p.google?.syncStatus;
            return (
              <li key={p._id}>
                <button onClick={() => setSelected(on ? selected.filter((x) => x !== p._id) : [...selected, p._id])} className={cx('relative block aspect-square w-full overflow-hidden rounded-xl ring-2 ring-offset-2 transition', on ? 'ring-brand-500' : 'ring-transparent')} aria-pressed={on} title={p.google?.error || p.caption}>
                  <img src={p.fileUrl} alt={p.caption || ''} className="h-full w-full object-cover" />
                  <span className={cx('absolute bottom-1 left-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold', status === 'synced' ? 'bg-leaf text-white' : status === 'failed' ? 'bg-rose text-white' : status === 'demo' ? 'bg-white/90 text-ink' : 'bg-white/90 text-ink-muted')}>
                    {status === 'synced' ? 'On Google' : status === 'failed' ? 'Failed' : status === 'demo' ? 'Demo' : 'Not sent'}
                  </span>
                  {on && <span className="absolute right-1 top-1 rounded-full bg-brand-500 p-0.5 text-white"><Check className="h-3 w-3" /></span>}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function GoogleInner() {
  const params = useSearchParams();
  const router = useRouter();
  const toast = useToast();
  const { refresh } = useAuth();
  const { data, mutate } = useSWR('/google/status');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (params.get('connected')) toast('Google Business Profile connected. Importing reviews…');
    if (params.get('error')) toast(params.get('error')!, 'bad');
    if (params.get('connected') || params.get('error')) router.replace('/app/google');
  }, [params]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!data) return <><PageHeader title="Google profile" /><Skeleton className="h-64" /></>;
  const acc = data.account;
  const changed = () => { mutate(); refresh(); };

  const action = async (name: string, fn: () => Promise<any>, msg: (r: any) => string) => {
    setBusy(name);
    try {
      const r = await fn();
      toast(msg(r));
      changed();
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <PageHeader title="Google profile" subtitle="Your connection to Google Business Profile, and what’s in sync." />
      {!acc ? (
        <Connect googleConfigured={data.googleConfigured} onDone={changed} />
      ) : (
        <div className="space-y-6">
          <Panel padded={false}>
            <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-center">
              <div className="flex flex-1 items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-mist">{acc.mode === 'demo' ? <FlaskConical className="h-5 w-5 text-brand-500" /> : <GoogleMark />}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-semibold">{acc.locationTitle || 'Choose a location'}</h2>
                    {acc.mode === 'demo' ? <Badge tone="info">Demo connection</Badge> : acc.status === 'connected' ? <Badge tone="good">Connected</Badge> : acc.status === 'needs_location' ? <Badge tone="warn">Pick a location</Badge> : <Badge tone="bad">Needs attention</Badge>}
                  </div>
                  <p className="mt-0.5 text-sm text-ink-muted">{acc.email}{acc.lastSyncAt && ` · reviews checked ${timeAgo(acc.lastSyncAt)}`}</p>
                  {acc.lastError && <p className="mt-1 text-sm text-rose">{acc.lastError}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {data.reviewLink && <a href={data.reviewLink} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-line bg-white px-4 text-sm font-medium hover:border-brand-200">Review link <ExternalLink className="h-3.5 w-3.5" /></a>}
                {acc.mode === 'live' && acc.status !== 'needs_location' && <Button variant="secondary" loading={busy === 'sync'} onClick={() => action('sync', () => api('/google/sync', { method: 'POST' }), (r) => `${r.created} new of ${r.total} reviews`)} icon={<RefreshCw className="h-4 w-4" />}>Check for reviews</Button>}
                {acc.mode === 'demo' && data.googleConfigured && <Button loading={busy === 'live'} onClick={async () => { setBusy('live'); try { const { url } = await api('/auth/google?format=json'); window.location.href = url; } catch (e: any) { toast(e.message, 'bad'); setBusy(''); } }} icon={<GoogleMark />}>Connect real profile</Button>}
                <Button variant="danger" loading={busy === 'off'} onClick={() => window.confirm(acc.mode === 'demo' ? 'Disconnect and delete the demo reviews?' : 'Disconnect Google? Reviews stay in ReviewRankr, but no new ones will be imported.') && action('off', () => api('/google', { method: 'DELETE' }), () => 'Disconnected')} icon={<Unplug className="h-4 w-4" />}>Disconnect</Button>
              </div>
            </div>
          </Panel>

          {acc.status === 'needs_location' ? (
            <LocationPicker onDone={changed} />
          ) : (
            <>
              <SyncTable onChanged={changed} />
              <PhotoSync />
            </>
          )}
        </div>
      )}
    </>
  );
}

export default function GooglePage() {
  return <Suspense><GoogleInner /></Suspense>;
}
