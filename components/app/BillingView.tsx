'use client';

import { useEffect, useState } from 'react';
import useSWR from 'swr';
import QRCode from 'qrcode';
import { Check, Copy, Phone, Mail, Receipt, Wallet } from 'lucide-react';
import { Badge, Button, Field, Input, Panel, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx, rupees, shortDate } from '@/lib/format';

export const CYCLE_LABEL: Record<string, string> = { monthly: 'month', quarterly: '3 months', half_yearly: '6 months', yearly: 'year' };
export const METHOD_LABEL: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank_transfer: 'Bank transfer', card: 'Card', cheque: 'Cheque', other: 'Other' };

export function InvoiceStatus({ inv }: { inv: any }) {
  const overdue = ['pending', 'partial'].includes(inv.status) && inv.dueDate && new Date(inv.dueDate) < new Date();
  if (inv.status === 'paid') return <Badge tone="good"><Check className="h-3 w-3" />Paid</Badge>;
  if (inv.status === 'waived') return <Badge tone="info">Waived</Badge>;
  if (inv.status === 'cancelled') return <Badge>Cancelled</Badge>;
  if (overdue) return <Badge tone="bad">{inv.status === 'partial' ? 'Part paid · overdue' : 'Overdue'}</Badge>;
  if (inv.status === 'partial') return <Badge tone="warn">Part paid</Badge>;
  return <Badge tone="warn">Pending</Badge>;
}

export function PaymentStatus({ p }: { p: any }) {
  if (p.status === 'confirmed') return <Badge tone="good">Confirmed</Badge>;
  if (p.status === 'rejected') return <Badge tone="bad">Not found</Badge>;
  return <Badge tone="warn">Being checked</Badge>;
}

export const STATE_LABEL: Record<string, { label: string; tone: any }> = {
  active: { label: 'Active', tone: 'good' },
  trial: { label: 'Free trial', tone: 'info' },
  due: { label: 'Payment due', tone: 'warn' },
  overdue: { label: 'Overdue', tone: 'bad' },
  suspended: { label: 'Paused', tone: 'bad' },
  no_plan: { label: 'No plan', tone: 'neutral' },
};

function UpiQr({ upiId, name, amount }: { upiId: string; name: string; amount: number }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    const params = new URLSearchParams({ pa: upiId, pn: name, cu: 'INR' });
    if (amount > 0) params.set('am', amount.toFixed(2));
    QRCode.toDataURL(`upi://pay?${params}`, { width: 320, margin: 1, color: { dark: '#143A8C', light: '#FFFFFF' } }).then(setSrc);
  }, [upiId, name, amount]);
  return src ? <img src={src} alt={`UPI QR code for ${upiId}`} className="h-36 w-36 rounded-lg ring-1 ring-line-soft" /> : <Skeleton className="h-36 w-36" />;
}

/** The business's plan, bills, payments and how to pay. Used on the Billing page and the paused screen. */
export function BillingView() {
  const toast = useToast();
  const { data, mutate } = useSWR('/billing');
  const [form, setForm] = useState({ amount: '', method: 'upi', reference: '', paidAt: new Date().toISOString().slice(0, 10) });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  if (!data) return <div className="space-y-4"><Skeleton className="h-40" /><Skeleton className="h-64" /></div>;

  const acc = data.account || {};
  const st = STATE_LABEL[data.state] || STATE_LABEL.active;
  const pay = data.payTo || {};

  const report = async () => {
    setBusy(true);
    setError('');
    try {
      await api('/billing/report-payment', { body: { amount: Number(form.amount), method: form.method, reference: form.reference, paidAt: form.paidAt } });
      toast('Thanks! We’ll confirm your payment soon.');
      setForm({ ...form, amount: '', reference: '' });
      mutate();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const copy = (t: string) => navigator.clipboard?.writeText(t).then(() => toast('Copied'));

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] text-ink-muted">Your plan</p>
              <p className="font-display text-2xl font-semibold">{acc.plan?.name || (acc.price != null ? 'Custom plan' : 'No plan yet')}</p>
            </div>
            <Badge tone={st.tone}>{st.label}</Badge>
          </div>
          {data.price > 0 && (
            <p className="mt-3 text-[15px]">
              {data.discount > 0 && <span className="mr-2 text-ink-faint line-through">{rupees(data.price)}</span>}
              <span className="font-display text-xl font-semibold">{rupees(data.netPrice)}</span>
              <span className="text-ink-muted"> / {CYCLE_LABEL[acc.billingCycle || 'monthly']}</span>
              {data.discount > 0 && <Badge tone="good" className="ml-2">{acc.discountType === 'percent' ? `${acc.discountValue}% off` : `${rupees(data.discount)} off`}</Badge>}
            </p>
          )}
          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            {acc.trialEndsAt && new Date(acc.trialEndsAt) > new Date() && <div><dt className="text-ink-muted">Free trial until</dt><dd className="font-medium">{shortDate(acc.trialEndsAt)}</dd></div>}
            {acc.paidUntil && <div><dt className="text-ink-muted">Paid until</dt><dd className="font-medium">{shortDate(acc.paidUntil)}</dd></div>}
            <div><dt className="text-ink-muted">Total paid</dt><dd className="font-medium">{rupees(data.paidTotal)}</dd></div>
            {data.credit > 0 && <div><dt className="text-ink-muted">Credit</dt><dd className="font-medium text-leaf">{rupees(data.credit)}</dd></div>}
          </dl>
          {acc.plan?.features?.length > 0 && (
            <ul className="mt-4 space-y-1 border-t border-line-soft pt-4 text-sm text-ink-soft">
              {acc.plan.features.map((f: string) => <li key={f} className="flex gap-2"><Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf" />{f}</li>)}
            </ul>
          )}
        </Panel>

        <Panel className={cx(data.due > 0 && 'ring-1 ring-star/40')}>
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-500"><Wallet className="h-5 w-5" /></span>
            <div className="flex-1">
              <p className="text-[13px] text-ink-muted">Amount due</p>
              <p className="font-display text-3xl font-semibold tabular">{rupees(data.due)}</p>
              {data.overdueAmount > 0 && <p className="text-sm text-rose">{rupees(data.overdueAmount)} is overdue</p>}
              {(() => {
                const checking = (data.payments || []).filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.amount, 0);
                return checking > 0 ? <p className="text-sm text-amber">{rupees(checking)} you sent is being checked</p> : null;
              })()}
            </div>
          </div>
          {(pay.upiId || pay.bankDetails || pay.instructions) && (
            <div className="mt-4 flex flex-col gap-4 rounded-xl bg-mist p-4 sm:flex-row">
              {pay.upiId && <UpiQr upiId={pay.upiId} name={pay.companyName || 'ReviewRankr'} amount={data.due} />}
              <div className="min-w-0 flex-1 space-y-2 text-sm">
                {pay.upiId && (
                  <p className="flex items-center gap-2">
                    <span className="text-ink-muted">UPI</span>
                    <span className="truncate font-mono font-semibold">{pay.upiId}</span>
                    <button onClick={() => copy(pay.upiId)} className="rounded p-1 text-ink-faint hover:text-brand-600" aria-label="Copy UPI ID"><Copy className="h-3.5 w-3.5" /></button>
                  </p>
                )}
                {pay.bankDetails && <p className="whitespace-pre-line text-ink-soft">{pay.bankDetails}</p>}
                {pay.instructions && <p className="text-ink-muted">{pay.instructions}</p>}
                <p className="flex flex-wrap gap-3 pt-1 text-ink-muted">
                  {pay.supportPhone && <a href={`tel:${pay.supportPhone}`} className="inline-flex items-center gap-1 hover:text-brand-600"><Phone className="h-3.5 w-3.5" />{pay.supportPhone}</a>}
                  {pay.supportEmail && <a href={`mailto:${pay.supportEmail}`} className="inline-flex items-center gap-1 hover:text-brand-600"><Mail className="h-3.5 w-3.5" />{pay.supportEmail}</a>}
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 border-t border-line-soft pt-4">
            <p className="mb-3 font-medium">Already paid? Tell us</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Amount (₹)"><Input type="number" min={1} inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder={data.due ? String(data.due) : ''} /></Field>
              <Field label="Paid by">
                <Select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
                  {Object.entries(METHOD_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field label="Reference / UTR number"><Input value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="e.g. 4321 8765 1234" /></Field>
              <Field label="Date paid"><Input type="date" value={form.paidAt} onChange={(e) => setForm({ ...form, paidAt: e.target.value })} /></Field>
            </div>
            {error && <p className="mt-3 rounded-lg bg-rose-soft px-3 py-2 text-sm text-rose">{error}</p>}
            <div className="mt-3 flex justify-end"><Button onClick={report} loading={busy} disabled={!form.amount || form.reference.trim().length < 3}>Send payment details</Button></div>
          </div>
        </Panel>
      </div>

      <Panel title="Bills" padded={false}>
        {data.invoices.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-ink-muted">No bills yet.</p>
        ) : (
          <div className="thin-scroll overflow-x-auto">
            <table className="w-full min-w-[720px] whitespace-nowrap text-sm">
              <thead className="text-left text-xs text-ink-muted">
                <tr className="border-b border-line-soft"><th className="px-5 py-3 font-medium">Bill</th><th className="px-3 py-3 font-medium">For</th><th className="px-3 py-3 text-right font-medium">Amount</th><th className="px-3 py-3 text-right font-medium">Paid</th><th className="px-3 py-3 text-right font-medium">Balance</th><th className="px-3 py-3 font-medium">Due</th><th className="px-3 py-3 font-medium">Status</th><th className="px-5 py-3" /></tr>
              </thead>
              <tbody className="divide-y divide-line-soft">
                {data.invoices.map((i: any) => (
                  <tr key={i._id}>
                    <td className="px-5 py-3 font-mono text-xs">{i.number}</td>
                    <td className="whitespace-normal px-3 py-3">{i.description || i.planName || '—'}{i.periodStart && <span className="block text-xs text-ink-muted">{shortDate(i.periodStart)} – {shortDate(i.periodEnd)}</span>}</td>
                    <td className="px-3 py-3 text-right tabular">{rupees(i.total)}{i.discount > 0 && <span className="block text-xs text-leaf">−{rupees(i.discount)} off</span>}</td>
                    <td className="px-3 py-3 text-right tabular">{rupees(i.paid)}</td>
                    <td className="px-3 py-3 text-right font-medium tabular">{rupees(i.balance)}</td>
                    <td className="px-3 py-3">{shortDate(i.dueDate)}</td>
                    <td className="px-3 py-3"><InvoiceStatus inv={i} /></td>
                    <td className="px-5 py-3 text-right"><a href={`/bill/${i._id}`} target="_blank" rel="noreferrer" className="text-sm font-medium text-brand-600 hover:underline">{i.status === 'paid' ? 'Receipt' : 'View'}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <Panel title="Payments" padded={false}>
        {data.payments.length === 0 ? (
          <p className="px-5 pb-5 pt-2 text-sm text-ink-muted">No payments yet.</p>
        ) : (
          <ul className="divide-y divide-line-soft">
            {data.payments.map((p: any) => (
              <li key={p._id} className="flex flex-wrap items-center gap-3 px-5 py-3 text-sm">
                <Receipt className="h-4 w-4 text-ink-faint" />
                <span className="w-28 text-ink-muted">{shortDate(p.paidAt)}</span>
                <span className="font-medium tabular">{rupees(p.amount)}</span>
                <span className="text-ink-muted">{METHOD_LABEL[p.method]}{p.reference ? ` · ${p.reference}` : ''}</span>
                <span className="ml-auto"><PaymentStatus p={p} /></span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
