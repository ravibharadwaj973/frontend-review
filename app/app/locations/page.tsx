'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { ExternalLink, RefreshCw, Save } from 'lucide-react';
import { Badge, Button, Field, Input, PageHeader, Select, Skeleton, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

export default function LocationsPage() {
  const { business, setBusiness } = useAuth();
  const { data, error, mutate } = useSWR('/business/location-audit');
  const [draft, setDraft] = useState<any>({ type: 'unknown' });
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [areas, setAreas] = useState('');
  const [busy, setBusy] = useState('');
  const toast = useToast();
  useEffect(() => { setDraft(business?.locationSettings || { type: 'unknown' }); setLatitude(String(business?.locationSettings?.pin?.latitude ?? '')); setLongitude(String(business?.locationSettings?.pin?.longitude ?? '')); setAreas((business?.serviceAreas || []).join(', ')); }, [business]);
  const run = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); await mutate(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); } };
  const save = () => run('save', async () => {
    if ((latitude === '') !== (longitude === '')) throw new Error('Enter both map coordinates');
    const locationSettings = { type: draft.type, pin: latitude && longitude ? { latitude: Number(latitude), longitude: Number(longitude) } : null, ...Object.fromEntries(['receivesCustomers', 'visitsCustomers', 'permanentSignage', 'staffedDuringHours', 'virtualOffice'].map((k) => [k, !!draft[k]])) };
    const response = await api('/business', { method: 'PATCH', body: { locationSettings, serviceAreas: areas.split(',').map((a) => a.trim()).filter(Boolean) } });
    setBusiness(response.business); toast('Actual location details saved');
  });
  const remote = data?.remote;
  const mapUrl = remote?.latlng ? `https://www.google.com/maps/search/?api=1&query=${remote.latlng.latitude},${remote.latlng.longitude}` : remote?.mapsUri;
  return <>
    <PageHeader title="Location accuracy" subtitle="Actual operating locations, service areas and Google profile checks." actions={<Button variant="secondary" disabled={!data?.connected || !!busy} loading={busy === 'refresh'} icon={<RefreshCw className="h-4 w-4" />} onClick={() => run('refresh', async () => { await api('/google/locations/audit-refresh', { method: 'POST' }); })}>Refresh Google locations</Button>} />
    {error && <p role="alert" className="text-sm text-rose">{error.message}</p>}
    {!data && !error && <Skeleton className="h-64" />}
    {!data?.connected && data && <Link href="/app/google" className="mb-5 block text-sm font-medium text-brand-600">Connect Google to compare location data</Link>}
    <section className="border-y border-line py-5"><h2 className="font-display text-lg font-semibold">Actual operating details</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Field label="Business location type"><Select value={draft.type || 'unknown'} onChange={(e) => setDraft({ ...draft, type: e.target.value })}><option value="unknown">Not confirmed</option><option value="storefront">Storefront</option><option value="service_area">Service-area business</option><option value="hybrid">Storefront and customer locations</option></Select></Field><Field label="Actual service areas"><Input value={areas} onChange={(e) => setAreas(e.target.value)} placeholder="Cities or areas, comma separated" /></Field><Field label="Confirmed latitude"><Input type="number" step="any" min={-90} max={90} value={latitude} onChange={(e) => setLatitude(e.target.value)} /></Field><Field label="Confirmed longitude"><Input type="number" step="any" min={-180} max={180} value={longitude} onChange={(e) => setLongitude(e.target.value)} /></Field></div><fieldset className="mt-5 grid gap-3 text-sm sm:grid-cols-2"><legend className="mb-3 font-medium">Operating conditions</legend>{[['receivesCustomers', 'Customers visit this location'], ['visitsCustomers', 'We serve customers at their locations'], ['permanentSignage', 'Permanent business signage'], ['staffedDuringHours', 'Our staff are present during stated hours'], ['virtualOffice', 'Mailing or virtual office only']].map(([key, label]) => <label key={key} className="flex items-center gap-2"><input type="checkbox" checked={!!draft[key]} onChange={(e) => setDraft({ ...draft, [key]: e.target.checked })} className="accent-brand-500" />{label}</label>)}</fieldset><div className="mt-5 flex flex-wrap gap-3"><Button loading={busy === 'save'} disabled={!!busy} icon={<Save className="h-4 w-4" />} onClick={save}>Save actual details</Button><Link href="/app/profile?tab=info" className="self-center text-sm font-medium text-brand-600">Address and contact details</Link><Link href="/app/profile?tab=hours" className="self-center text-sm font-medium text-brand-600">Opening hours</Link></div></section>
    {data && <>
      <section className="pt-6"><h2 className="font-display text-lg font-semibold">Location findings</h2><ul className="mt-3 divide-y divide-line">{data.findings.map((f: any, i: number) => <li key={i} className="py-3"><div className="flex flex-wrap justify-between gap-2"><h3 className="text-sm font-medium">{f.title}</h3><Badge tone={f.status === 'unknown' ? undefined : 'warn'}>{f.status}</Badge></div><p className="mt-1 text-sm text-ink-muted">{f.detail}</p></li>)}</ul>{!data.findings.length && <p className="mt-3 text-sm text-ink-muted">No issues detected in the saved and returned location data.</p>}</section>
      <section className="mt-6 border-t border-line pt-5"><div className="flex flex-wrap justify-between gap-3"><h2 className="font-display text-lg font-semibold">Selected Google location</h2>{mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-brand-600">View map pin <ExternalLink className="h-4 w-4" /></a>}</div><dl className="mt-4 grid gap-4 sm:grid-cols-2">{[['Address', remote.address || 'Unavailable'], ['Google service areas', remote.serviceAreas.join(', ') || 'None returned'], ['Business type', remote.businessType?.replace(/_/g, ' ') || 'Unavailable'], ['Open status', remote.openStatus || 'Unavailable'], ['Pin coordinates', remote.latlng ? `${remote.latlng.latitude}, ${remote.latlng.longitude}` : 'Unavailable'], ['Difference from confirmed point', data.pinDistanceMetres === null ? 'Not measured' : `${data.pinDistanceMetres} metres`]].map(([label, value]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-1 break-words text-sm">{value}</dd></div>)}</dl></section>
      <section className="mt-7 border-t border-line pt-5"><h2 className="font-display text-lg font-semibold">Authorized Google profiles</h2><p className="mt-1 text-xs text-ink-muted">{data.inventoryFetchedAt ? `Last checked ${new Date(data.inventoryFetchedAt).toLocaleString()}` : 'No location inventory retrieved yet.'}</p><ul className="mt-3 divide-y divide-line">{data.inventory.map((location: any) => <li key={`${location.accountName}:${location.locationName}`} className="py-3"><p className="text-sm font-medium">{location.title}</p><p className="mt-1 text-sm text-ink-muted">{location.address || 'Address not returned'} / {location.openStatus || 'Open status unavailable'}</p>{location.mapsUri && <a href={location.mapsUri} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-brand-600">Open Google listing</a>}</li>)}</ul></section>
      <p className="mt-6 text-xs text-ink-muted">Eligibility requires review against Google’s guidelines. This audit does not create locations or automatically change addresses, map pins or service areas. Searcher distance is not controlled by these settings.</p>
    </>}
  </>;
}
