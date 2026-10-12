'use client';

import { useState } from 'react';
import { Plus, Save, Search, X } from 'lucide-react';
import PlacePicker from './PlacePicker';
import { Button, Field, Input, Modal, Select, useToast } from '@/components/ui';
import { api } from '@/lib/api';
import { Overview } from './types';

export default function TrackingSettings({ data, onClose, onSaved }: { data: Overview; onClose: () => void; onSaved: () => void }) {
  const current = data.settings;
  const center = current?.center || data.suggestedCenter;
  const [placeId, setPlaceId] = useState(current?.placeId || '');
  const [latitude, setLatitude] = useState(center?.latitude?.toString() || '');
  const [longitude, setLongitude] = useState(center?.longitude?.toString() || '');
  const [keywords, setKeywords] = useState(current?.keywords || []);
  const [keyword, setKeyword] = useState('');
  const [language, setLanguage] = useState(current?.language || 'en');
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState(current?.coordinateSource || 'owner');
  const [address, setAddress] = useState('');
  const [locations, setLocations] = useState<any[]>([]);
  const [finding, setFinding] = useState(false);
  const toast = useToast();
  const chooseLocation = (location: { placeId: string; latitude: number; longitude: number }) => { setPlaceId(location.placeId); setLatitude(String(location.latitude)); setLongitude(String(location.longitude)); setSource('google'); setConfirmed(false); };
  const findLocation = async () => {
    setFinding(true); setLocations([]);
    try { const response = await api('/map-visibility/geocode', { body: address.trim() ? { address: address.trim() } : { placeId } }); setLocations(response.results); if (!response.results.length) toast('No matching Google location found', 'bad'); }
    catch (e: any) { toast(e.message, 'bad'); } finally { setFinding(false); }
  };
  const add = () => { const text = keyword.trim(); if (text.length >= 2 && keywords.length < 20 && !keywords.includes(text)) { setKeywords([...keywords, text]); setKeyword(''); } };
  const save = async () => {
    setBusy(true);
    try {
      await api('/map-visibility/settings', { method: 'PUT', body: { placeId, center: { latitude: Number(latitude), longitude: Number(longitude) }, keywords, language, confirmed, coordinateSource: source } });
      toast('Map tracking settings saved'); onSaved(); onClose();
    } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(false); }
  };
  return <Modal open onClose={onClose} title="Map tracking settings" footer={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button icon={<Save className="h-4 w-4" />} onClick={save} loading={busy} disabled={!confirmed || !placeId || !latitude || !longitude || !keywords.length}>Save settings</Button></>}>
    <div className="space-y-4">
      <PlacePicker onPlace={chooseLocation} />
      <div className="flex items-end gap-2"><Field label="Business address" className="min-w-0 flex-1"><Input value={address} maxLength={600} onChange={e => setAddress(e.target.value)} /></Field><Button variant="secondary" icon={<Search className="h-4 w-4" />} aria-label="Find address coordinates" title="Find address coordinates" loading={finding} disabled={!data.geocodingConfigured || (!address.trim() && !placeId)} onClick={findLocation} /></div>
      {!!locations.length && <div className="border-y border-line"><ul className="divide-y divide-line">{locations.map(location => <li key={location.placeId}><button className="w-full py-3 text-left text-sm text-brand-600" onClick={() => { setLatitude(String(location.latitude)); setLongitude(String(location.longitude)); setSource('google'); setConfirmed(false); }}>{location.address}<span className="block text-xs text-ink-muted">{location.locationType}{location.partialMatch ? ' / Partial match: confirm the actual location' : ''}</span></button></li>)}</ul><p className="py-2 text-xs text-ink-muted" translate="no">Google Maps</p><p className="pb-2 text-xs text-ink-muted">An address match is not a business listing. Keep the actual business Place ID.</p></div>}
      <Field label="Google Place ID"><Input value={placeId} onChange={e => { setPlaceId(e.target.value); setConfirmed(false); }} maxLength={200} placeholder="ChIJ..." /></Field>
      <a className="text-sm text-brand-600 hover:underline" href="https://developers.google.com/maps/documentation/javascript/examples/places-placeid-finder" target="_blank" rel="noopener noreferrer">Google Place ID finder</a>
      <div className="grid grid-cols-2 gap-3"><Field label="Actual latitude"><Input type="number" step="any" min={-80} max={80} value={latitude} onChange={e => setLatitude(e.target.value)} /></Field><Field label="Actual longitude"><Input type="number" step="any" min={-180} max={180} value={longitude} onChange={e => setLongitude(e.target.value)} /></Field></div>
      <Field label="Coordinate source"><Select value={source} onChange={e => { setSource(e.target.value); setConfirmed(false); }}><option value="owner">Independently supplied business coordinates</option><option value="google">Google Maps location (temporary cache)</option></Select></Field>
      <Field label="Search language"><Select value={language} onChange={e => setLanguage(e.target.value)}>{[['en', 'English'], ['hi', 'Hindi'], ['es', 'Spanish'], ['fr', 'French'], ['de', 'German'], ['pt', 'Portuguese'], ['it', 'Italian'], ['ar', 'Arabic']].map(([code, name]) => <option key={code} value={code}>{name}</option>)}</Select></Field>
      <div><p className="label">Tracked searches ({keywords.length}/20)</p><ul className="divide-y divide-line">{keywords.map(k => <li key={k} className="flex items-center justify-between gap-2 py-2 text-sm"><span className="min-w-0 break-words">{k}</span><Button variant="ghost" size="sm" icon={<X className="h-4 w-4" />} aria-label={`Remove ${k}`} onClick={() => setKeywords(keywords.filter(x => x !== k))} /></li>)}</ul></div>
      <div className="flex items-end gap-2"><Field label="Add keyword" className="min-w-0 flex-1"><Input value={keyword} maxLength={120} onChange={e => setKeyword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }} /></Field><Button variant="secondary" icon={<Plus className="h-4 w-4" />} aria-label="Add keyword" title="Add keyword" disabled={keyword.trim().length < 2 || keywords.length >= 20} onClick={add} /></div>
      <label className="flex items-start gap-2 text-sm"><input className="mt-1 accent-brand-600" type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} /><span>I confirm this Place ID and these coordinates identify the actual business, not a fabricated location.</span></label>
    </div>
  </Modal>;
}
