'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import Link from 'next/link';
import { Check, Copy, Mail, MessageCircle, MessageSquare, MoreHorizontal, QrCode, Send, Trash2 } from 'lucide-react';
import { Badge, Button, Empty, PageHeader, Panel, Segmented, Skeleton, useToast } from '@/components/ui';
import { RequestComposer } from '@/components/app/RequestComposer';
import { api } from '@/lib/api';
import { cx, num, shortDate, timeAgo } from '@/lib/format';
import { useAuth } from '@/lib/auth';

const CHANNEL_ICON: Record<string, any> = { whatsapp: MessageCircle, sms: MessageSquare, email: Mail, copy: Copy };
const STATUS: Record<string, { label: string; tone: any }> = {
  draft: { label: 'Draft', tone: 'neutral' },
  scheduled: { label: 'Scheduled', tone: 'info' },
  sent: { label: 'Sent', tone: 'info' },
  clicked: { label: 'Opened link', tone: 'warn' },
  reviewed: { label: 'Reviewed', tone: 'good' },
};

/** Sent → Opened → Reviewed as three dots, so progress reads at a glance. */
function Progress({ r }: { r: any }) {
  const steps = [!!r.sentAt, !!r.clickedAt, r.status === 'reviewed'];
  return (
    <span className="flex items-center gap-1" aria-label={STATUS[r.status]?.label}>
      {steps.map((on, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={cx('h-2 w-2 rounded-full', on ? 'bg-brand-500' : 'bg-line')} />
          {i < 2 && <span className={cx('h-px w-3', steps[i + 1] ? 'bg-brand-500' : 'bg-line')} />}
        </span>
      ))}
    </span>
  );
}

function RowMenu({ r, onChanged }: { r: any; onChanged: () => void }) {
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const act = async (fn: () => Promise<any>, msg: string) => {
    setOpen(false);
    try {
      await fn();
      toast(msg);
      onChanged();
    } catch (e: any) {
      toast(e.message, 'bad');
    }
  };
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="rounded-lg p-1.5 text-ink-muted hover:bg-mist" aria-label="More actions"><MoreHorizontal className="h-4 w-4" /></button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-20 mt-1 w-52 overflow-hidden rounded-xl border border-line-soft bg-white py-1 text-sm shadow-pop">
            <button className="flex w-full items-center gap-2 px-3 py-2 hover:bg-mist" onClick={() => act(() => navigator.clipboard.writeText(r.link), 'Link copied')}><Copy className="h-4 w-4" />Copy review link</button>
            {r.status === 'draft' && <button className="flex w-full items-center gap-2 px-3 py-2 hover:bg-mist" onClick={() => act(() => api(`/requests/${r._id}/sent`, { method: 'POST' }), 'Marked as sent')}><Send className="h-4 w-4" />Mark as sent</button>}
            {r.status !== 'reviewed' && <button className="flex w-full items-center gap-2 px-3 py-2 hover:bg-mist" onClick={() => act(() => api(`/requests/${r._id}/reviewed`, { method: 'POST' }), 'Marked as reviewed')}><Check className="h-4 w-4" />They left a review</button>}
            <button className="flex w-full items-center gap-2 px-3 py-2 text-rose hover:bg-rose-soft" onClick={() => window.confirm('Delete this request?') && act(() => api(`/requests/${r._id}`, { method: 'DELETE' }), 'Request deleted')}><Trash2 className="h-4 w-4" />Delete</button>
          </div>
        </>
      )}
    </div>
  );
}

function RequestsInner() {
  const params = useSearchParams();
  const { business } = useAuth();
  const [status, setStatus] = useState('all');
  const [composer, setComposer] = useState<{ open: boolean; customerId?: string; serviceId?: string }>({ open: false });
  const { data, mutate } = useSWR(`/requests?limit=100${status !== 'all' ? `&status=${status}` : ''}`);
  const { data: funnel, mutate: mutateFunnel } = useSWR('/analytics/requests');
  const { data: ready } = useSWR('/customers?segment=not_requested&limit=50');

  useEffect(() => {
    if (params.get('new')) setComposer({ open: true, customerId: params.get('customer') || undefined });
  }, [params]);

  // Customers whose visit is old enough for the configured delay, but recent enough to still remember it
  const dueCustomers = useMemo(() => {
    const delayH = business?.automation?.requestDelayHours ?? 2;
    const now = Date.now();
    return (ready?.customers || [])
      .filter((c: any) => c.lastVisit && now - new Date(c.lastVisit).getTime() >= delayH * 36e5 && now - new Date(c.lastVisit).getTime() <= 14 * 864e5)
      .slice(0, 6);
  }, [ready, business]);

  const refresh = () => { mutate(); mutateFunnel(); };
  const counts = data?.counts || {};
  const total = Object.values(counts).reduce((a: number, b: any) => a + b, 0) as number;

  return (
    <>
      <PageHeader
        title="Review requests"
        subtitle="Send a personal ask after each visit. Links are tracked, so you can see who opened theirs and who went on to review."
        actions={<><Link href="/app/share" className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-4 text-sm font-medium hover:border-brand-200 hover:bg-brand-50"><QrCode className="h-4 w-4" />QR code</Link><Button onClick={() => setComposer({ open: true })} icon={<Send className="h-4 w-4" />}>New request</Button></>}
      />

      <div className="mb-6 grid grid-cols-2 divide-line-soft overflow-hidden rounded-xl2 border border-line-soft bg-white shadow-lift sm:grid-cols-4 sm:divide-x">
        {[
          ['Sent', funnel?.sent],
          ['Opened the link', funnel?.clicked, funnel ? `${funnel.clickRate}% of sent` : ''],
          ['Left a review', funnel?.reviewed],
          ['Conversion', funnel ? `${funnel.conversionRate}%` : undefined, 'reviews ÷ requests sent'],
        ].map(([label, value, sub]) => (
          <div key={label as string} className="px-5 py-4">
            <p className="text-[13px] text-ink-muted">{label}</p>
            <p className="mt-1 font-display text-2xl font-semibold tabular">{value ?? '—'}</p>
            {sub && <p className="mt-0.5 text-xs text-ink-muted">{sub}</p>}
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
        <div>
          <div className="mb-3">
            <Segmented
              value={status}
              onChange={setStatus}
              options={[
                { value: 'all', label: 'All', count: total },
                { value: 'draft', label: 'Drafts', count: counts.draft || 0 },
                { value: 'sent', label: 'Sent', count: counts.sent || 0 },
                { value: 'clicked', label: 'Opened', count: counts.clicked || 0 },
                { value: 'reviewed', label: 'Reviewed', count: counts.reviewed || 0 },
              ]}
            />
          </div>
          <section className="overflow-hidden rounded-xl2 border border-line-soft bg-paper shadow-lift">
            {!data ? (
              <div className="space-y-3 p-5">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-12" />)}</div>
            ) : data.requests.length === 0 ? (
              <Empty icon={<Send className="h-5 w-5" />} title="No requests here yet" action={<Button onClick={() => setComposer({ open: true })}>Ask your first customer</Button>}>
                Pick a customer and the service they had — Starling writes the message.
              </Empty>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b border-line-soft text-left text-xs text-ink-muted">
                    <tr>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-3 py-3 font-medium">Service</th>
                      <th className="px-3 py-3 font-medium">Status</th>
                      <th className="px-3 py-3 font-medium">Progress</th>
                      <th className="px-3 py-3 font-medium">Sent</th>
                      <th className="w-10 px-3 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line-soft">
                    {data.requests.map((r: any) => {
                      const Icon = CHANNEL_ICON[r.channel] || Send;
                      return (
                        <tr key={r._id} className="hover:bg-mist/50">
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-2.5">
                              <Icon className="h-4 w-4 shrink-0 text-ink-faint" aria-label={r.channel} />
                              <div className="min-w-0">
                                <p className="truncate font-medium text-ink">{r.customer?.name || 'Deleted customer'}</p>
                                <p className="truncate text-xs text-ink-muted">{r.customer?.phone || r.customer?.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-ink-soft">{r.serviceName || '—'}</td>
                          <td className="px-3 py-3"><Badge tone={STATUS[r.status]?.tone}>{STATUS[r.status]?.label}</Badge></td>
                          <td className="px-3 py-3"><Progress r={r} /></td>
                          <td className="px-3 py-3 text-ink-muted" title={r.sentAt ? shortDate(r.sentAt) : ''}>{r.sentAt ? timeAgo(r.sentAt) : '—'}</td>
                          <td className="px-3 py-3"><RowMenu r={r} onChanged={refresh} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>

        <aside className="space-y-6">
          <Panel title="Ready to ask">
            <p className="-mt-2 mb-3 text-sm text-ink-muted">Visited in the last two weeks and not asked yet.</p>
            {dueCustomers.length === 0 ? (
              <p className="text-sm text-ink-faint">No one right now. Add visits on the Customers page.</p>
            ) : (
              <ul className="divide-y divide-line-soft">
                {dueCustomers.map((c: any) => {
                  const last = c.visits?.[c.visits.length - 1];
                  return (
                    <li key={c._id} className="flex items-center gap-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{c.name}</p>
                        <p className="truncate text-xs text-ink-muted">{last?.serviceName || 'Visit'} · {timeAgo(c.lastVisit)}</p>
                      </div>
                      <Button size="sm" variant="secondary" onClick={() => setComposer({ open: true, customerId: c._id, serviceId: last?.service })}>Ask</Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>
          {funnel && Object.keys(funnel.byChannel || {}).length > 0 && (
            <Panel title="By channel">
              <ul className="space-y-2 text-sm">
                {Object.entries(funnel.byChannel).map(([ch, v]: any) => (
                  <li key={ch} className="flex items-center justify-between">
                    <span className="text-ink-soft">{({ sms: 'SMS', whatsapp: 'WhatsApp', email: 'Email', copy: 'Copied link' } as any)[ch] || ch}</span>
                    <span className="tabular text-ink-muted"><span className="font-medium text-ink">{num(v.reviewed)}</span> reviews from {num(v.sent)} sent</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </aside>
      </div>

      <RequestComposer open={composer.open} preset={composer} onClose={() => setComposer({ open: false })} onDone={refresh} />
    </>
  );
}

export default function RequestsPage() {
  return (
    <Suspense>
      <RequestsInner />
    </Suspense>
  );
}
