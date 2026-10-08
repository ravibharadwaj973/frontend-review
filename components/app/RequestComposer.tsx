'use client';

import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { Copy, ExternalLink, Mail, MessageCircle, MessageSquare, Plus, Sparkles } from 'lucide-react';
import { AiMark, Button, Field, Input, Modal, Select, Textarea, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { cx } from '@/lib/format';

const CHANNELS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { value: 'sms', label: 'SMS', icon: MessageSquare },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'copy', label: 'Copy link', icon: Copy },
] as const;

export function RequestComposer({ open, onClose, onDone, preset }: { open: boolean; onClose: () => void; onDone: () => void; preset?: { customerId?: string; serviceId?: string } }) {
  const toast = useToast();
  const { data: cust, mutate: mutateCustomers } = useSWR(open ? '/customers?limit=200' : null);
  const { data: svc } = useSWR(open ? '/services' : null);
  const { data: biz } = useSWR(open ? '/business' : null);
  const customers = cust?.customers || [];
  const services = (svc?.services || []).filter((s: any) => s.active);

  const [customerId, setCustomerId] = useState('');
  const [serviceId, setServiceId] = useState('');
  const [visitDate, setVisitDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [channel, setChannel] = useState<string>('whatsapp');
  const [adding, setAdding] = useState(false);
  const [newCust, setNewCust] = useState({ name: '', phone: '', email: '' });
  const [request, setRequest] = useState<any>(null);
  const [deliveryLink, setDeliveryLink] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (!open) return;
    setRequest(null);
    setMessage('');
    setCustomerId(preset?.customerId || '');
    setServiceId(preset?.serviceId || '');
    setAdding(false);
  }, [open, preset?.customerId, preset?.serviceId]);

  const customer = useMemo(() => customers.find((c: any) => c._id === customerId), [customers, customerId]);
  useEffect(() => {
    // Pre-select the service from the customer's last visit
    if (customer && !serviceId) {
      const last = customer.visits?.[customer.visits.length - 1];
      if (last?.service) setServiceId(last.service);
    }
  }, [customer]); // eslint-disable-line react-hooks/exhaustive-deps

  const missingContact = customer && ((channel === 'email' && !customer.email) || ((channel === 'whatsapp' || channel === 'sms') && !customer.phone));

  const createCustomer = async () => {
    if (!newCust.name.trim()) return toast('Enter the customer’s name', 'bad');
    setBusy('customer');
    try {
      const res = await api('/customers', { body: { ...newCust, visit: serviceId ? { serviceId, date: visitDate } : undefined } });
      await mutateCustomers();
      setCustomerId(res.customer._id);
      setAdding(false);
      setNewCust({ name: '', phone: '', email: '' });
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const generate = async () => {
    if (!customerId) return toast('Choose a customer first', 'bad');
    setBusy('generate');
    try {
      const res = await api('/requests', { body: { customerId, serviceId: serviceId || null, visitDate, channel } });
      setRequest(res.request);
      setMessage(res.request.message);
      setDeliveryLink(res.deliveryLink);
    } catch (e: any) {
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const saveIfEdited = async () => {
    if (message !== request.message || channel !== request.channel) {
      const res = await api(`/requests/${request._id}`, { method: 'PATCH', body: { message, channel } });
      setRequest(res.request);
      setMessage(res.request.message);
      setDeliveryLink(res.deliveryLink);
      return res;
    }
    return { request, deliveryLink };
  };

  const send = async () => {
    setBusy('send');
    // Open the window synchronously so popup blockers allow it
    const win = channel === 'whatsapp' ? window.open('', '_blank') : null;
    try {
      const res = await saveIfEdited();
      if (channel === 'copy') {
        await navigator.clipboard.writeText(res.request.message).catch(() => {});
        toast('Message copied — paste it wherever you talk to this customer');
      } else if (res.deliveryLink) {
        if (win) win.location.href = res.deliveryLink;
        else window.location.href = res.deliveryLink;
      }
      await api(`/requests/${request._id}/sent`, { method: 'POST' });
      if (channel !== 'copy') toast('Marked as sent');
      onDone();
      onClose();
    } catch (e: any) {
      win?.close();
      toast(e.message, 'bad');
    } finally {
      setBusy('');
    }
  };

  const aiWritten = request && message === request.message && request.model !== 'manual';

  return (
    <Modal open={open} onClose={onClose} title={request ? 'Review and send' : 'Ask for a review'} wide>
      {!request ? (
        <div className="space-y-5">
          {(!biz?.business?.reviewLink || /DEMO_PLACE_ID/.test(biz.business.reviewLink)) && (
            <p className="rounded-lg bg-amber-soft px-3 py-2 text-sm text-amber">Add your Google review link first so customers land on your Google review page. <a href="/app/settings#review-link" className="font-medium underline">Add it in Settings</a></p>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Customer">
              {!adding ? (
                <div className="flex gap-2">
                  <Select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className="flex-1">
                    <option value="">Choose a customer…</option>
                    {customers.map((c: any) => (
                      <option key={c._id} value={c._id}>{c.name}{c.phone ? ` · ${c.phone}` : ''}{c.reviewStatus === 'reviewed' ? ' (reviewed)' : ''}</option>
                    ))}
                  </Select>
                  <Button variant="secondary" onClick={() => setAdding(true)} aria-label="Add customer" icon={<Plus className="h-4 w-4" />} />
                </div>
              ) : (
                <div className="space-y-2 rounded-xl bg-mist p-3">
                  <Input placeholder="Name" value={newCust.name} onChange={(e) => setNewCust({ ...newCust, name: e.target.value })} autoFocus />
                  <div className="grid grid-cols-2 gap-2">
                    <Input placeholder="Phone" value={newCust.phone} onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })} inputMode="tel" />
                    <Input placeholder="Email (optional)" value={newCust.email} onChange={(e) => setNewCust({ ...newCust, email: e.target.value })} type="email" />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
                    <Button size="sm" onClick={createCustomer} loading={busy === 'customer'}>Add customer</Button>
                  </div>
                </div>
              )}
            </Field>
            <Field label="Service they had">
              <Select value={serviceId} onChange={(e) => setServiceId(e.target.value)}>
                <option value="">Not specified</option>
                {services.map((s: any) => <option key={s._id} value={s._id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="Visit date">
              <Input type="date" value={visitDate} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setVisitDate(e.target.value)} />
            </Field>
            <Field label="Send with" error={missingContact ? `This customer has no ${channel === 'email' ? 'email' : 'phone number'}` : undefined}>
              <div className="grid grid-cols-4 gap-1.5">
                {CHANNELS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setChannel(c.value)}
                    className={cx('flex flex-col items-center gap-1 rounded-lg border py-2 text-xs font-medium transition-colors', channel === c.value ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-line text-ink-soft hover:border-brand-200')}
                  >
                    <c.icon className="h-4 w-4" />
                    {c.label}
                  </button>
                ))}
              </div>
            </Field>
          </div>
          <div className="flex items-center justify-between gap-3 border-t border-line-soft pt-4">
            <p className="text-xs text-ink-muted">Every customer gets the same honest ask — ReviewRankr never filters out unhappy customers.</p>
            <Button variant="ai" onClick={generate} loading={busy === 'generate'} disabled={!customerId || !!missingContact} icon={<Sparkles className="h-4 w-4" />}>Write message</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          <div className={cx('rounded-xl p-4', aiWritten ? 'ai-sheen' : 'border border-line bg-white')}>
            <div className="mb-1 flex items-center justify-between">
              {aiWritten ? <AiMark label={`Written for ${customer?.name?.split(' ')[0] || 'this customer'}`} /> : <span className="text-xs font-semibold text-ink-soft">Edited by you</span>}
              <span className="text-xs tabular text-ink-faint">{message.length} characters</span>
            </div>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} className="border-0 bg-transparent px-0 focus:ring-0" aria-label="Message" />
          </div>
          <div className="rounded-xl bg-mist p-4">
            <p className="text-sm font-medium text-ink">What {customer?.name?.split(' ')[0] || 'the customer'} sees after tapping the link</p>
            <p className="mt-1 text-sm text-ink-muted">A short thank-you page with optional things they might mention, then a button to Google’s review form. They write everything themselves.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {(request.topics || []).map((t: string) => <span key={t} className="rounded-full bg-white px-2.5 py-1 text-xs text-ink-soft">{t}</span>)}
            </div>
            <a href={request.link} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-brand-600 hover:underline">Preview the page <ExternalLink className="h-3 w-3" /></a>
          </div>
          <div className="flex flex-col-reverse gap-2 border-t border-line-soft pt-4 sm:flex-row sm:justify-between">
            <Button variant="ghost" onClick={() => { onDone(); onClose(); }}>Save as draft</Button>
            <div className="flex gap-2">
              <Select value={channel} onChange={(e) => setChannel(e.target.value)} className="h-10 w-36 py-1 text-sm" aria-label="Channel">
                {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
              <Button onClick={send} loading={busy === 'send'} disabled={!!missingContact} icon={channel === 'copy' ? <Copy className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}>
                {channel === 'copy' ? 'Copy & mark sent' : `Open ${CHANNELS.find((c) => c.value === channel)?.label}`}
              </Button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  );
}
