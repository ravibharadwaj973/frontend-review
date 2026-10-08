'use client';

import { Printer } from 'lucide-react';
import { rupees, shortDate } from '@/lib/format';

const METHOD: Record<string, string> = { upi: 'UPI', cash: 'Cash', bank_transfer: 'Bank transfer', card: 'Card', cheque: 'Cheque', other: 'Other' };

/** A printable bill (or receipt, once fully paid). "Print / Save as PDF" uses the browser's print dialog. */
export function InvoiceSheet({ doc }: { doc: any }) {
  const i = doc.invoice;
  const b = doc.business || {};
  const f = doc.from || {};
  const paid = i.status === 'paid';
  const overdue = ['pending', 'partial'].includes(i.status) && i.dueDate && new Date(i.dueDate) < new Date();
  const title = paid ? 'Receipt' : i.status === 'waived' ? 'Bill (waived)' : i.status === 'cancelled' ? 'Bill (cancelled)' : 'Bill';
  const address = [b.address?.line1, b.address?.line2, b.address?.city, b.address?.state, b.address?.postalCode].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-mist px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto mb-4 flex max-w-[760px] justify-end print:hidden">
        <button onClick={() => window.print()} className="inline-flex h-10 items-center gap-2 rounded-xl bg-brand-600 px-4 text-sm font-medium text-white hover:bg-brand-700">
          <Printer className="h-4 w-4" />Print / Save as PDF
        </button>
      </div>
      <article className="mx-auto max-w-[760px] rounded-xl2 bg-white p-8 shadow-lift print:max-w-none print:rounded-none print:p-0 print:shadow-none sm:p-10">
        <header className="flex flex-wrap items-start justify-between gap-6 border-b border-line-soft pb-6">
          <div>
            <p className="font-display text-2xl font-semibold">{f.companyName || 'Starling'}</p>
            <p className="mt-1 text-sm text-ink-muted">{[f.supportPhone, f.supportEmail].filter(Boolean).join(' · ')}</p>
          </div>
          <div className="text-right">
            <p className="font-display text-3xl font-semibold tracking-tight">{title}</p>
            <p className="mt-1 font-mono text-sm">{i.number}</p>
            {paid && <p className="mt-2 inline-block rounded-full bg-leaf-soft px-3 py-0.5 text-sm font-semibold text-leaf">PAID</p>}
            {overdue && <p className="mt-2 inline-block rounded-full bg-rose-soft px-3 py-0.5 text-sm font-semibold text-rose">OVERDUE</p>}
          </div>
        </header>

        <section className="grid gap-6 py-6 sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Billed to</p>
            <p className="mt-1 font-medium">{b.name}</p>
            {b.ownerName && <p className="text-sm text-ink-soft">{b.ownerName}</p>}
            {address && <p className="text-sm text-ink-soft">{address}</p>}
            <p className="text-sm text-ink-soft">{[b.phone, b.email].filter(Boolean).join(' · ')}</p>
          </div>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:text-right">
            <dt className="text-ink-muted">Date</dt><dd>{shortDate(i.createdAt)}</dd>
            <dt className="text-ink-muted">Due</dt><dd>{shortDate(i.dueDate)}</dd>
            {i.paidAt && <><dt className="text-ink-muted">Paid on</dt><dd>{shortDate(i.paidAt)}</dd></>}
          </dl>
        </section>

        <table className="w-full text-sm">
          <thead className="border-y border-line-soft text-left text-xs uppercase tracking-wide text-ink-faint">
            <tr><th className="py-2.5 font-semibold">Description</th><th className="py-2.5 text-right font-semibold">Amount</th></tr>
          </thead>
          <tbody>
            <tr className="border-b border-line-soft">
              <td className="py-3">
                <p className="font-medium">{i.description || i.planName || 'Starling subscription'}</p>
                {i.periodStart && <p className="text-xs text-ink-muted">{shortDate(i.periodStart)} – {shortDate(i.periodEnd)}</p>}
              </td>
              <td className="py-3 text-right tabular">{rupees(i.amount)}</td>
            </tr>
          </tbody>
        </table>
        <dl className="ml-auto mt-4 w-full max-w-[280px] space-y-1.5 text-sm">
          {i.discount > 0 && <div className="flex justify-between"><dt className="text-ink-muted">Discount</dt><dd className="tabular text-leaf">−{rupees(i.discount)}</dd></div>}
          <div className="flex justify-between font-medium"><dt>Total</dt><dd className="tabular">{rupees(i.total)}</dd></div>
          <div className="flex justify-between"><dt className="text-ink-muted">Paid</dt><dd className="tabular">{rupees(i.paid)}</dd></div>
          <div className="flex justify-between border-t border-line-soft pt-2 font-display text-lg font-semibold"><dt>{i.status === 'waived' ? 'Waived' : 'Balance due'}</dt><dd className="tabular">{rupees(i.balance)}</dd></div>
        </dl>

        {doc.payments?.length > 0 && (
          <section className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Payments received</p>
            <ul className="mt-2 divide-y divide-line-soft text-sm">
              {doc.payments.map((p: any) => (
                <li key={p._id} className="flex justify-between py-2">
                  <span>{shortDate(p.paidAt)} · {METHOD[p.method] || p.method}{p.reference ? ` · ${p.reference}` : ''}</span>
                  <span className="tabular">{rupees(p.amount)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {i.balance > 0 && (f.upiId || f.bankDetails) && (
          <section className="mt-8 rounded-xl bg-mist p-4 text-sm print:border print:border-line-soft print:bg-white">
            <p className="font-medium">How to pay</p>
            {f.upiId && <p className="mt-1">UPI: <span className="font-mono font-semibold">{f.upiId}</span></p>}
            {f.bankDetails && <p className="mt-1 whitespace-pre-line text-ink-soft">{f.bankDetails}</p>}
            {f.instructions && <p className="mt-1 text-ink-muted">{f.instructions}</p>}
          </section>
        )}
        {i.notes && <p className="mt-6 text-sm text-ink-muted">Note: {i.notes}</p>}
        <p className="mt-10 text-center text-xs text-ink-faint">Thank you for your business.</p>
      </article>
    </div>
  );
}
