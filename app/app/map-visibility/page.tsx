'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from 'react';
import useSWR from 'swr';
import { Download, MapPin, Play, Settings, Square, X } from 'lucide-react';
import { Badge, Button, Field, Input, Modal, PageHeader, Segmented, Select, Skeleton, useToast } from '@/components/ui';
import { api, getToken } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { Center, Detail, Metrics, Overview, Point, Scan, observedRank, percent, pointColor, rankText } from '@/components/app/map-visibility/types';

const GeoMap = dynamic(() => import('@/components/app/map-visibility/GeoMap'), { ssr: false, loading: () => <Skeleton className="h-[460px] sm:h-[540px]" /> });
const TrackingSettings = dynamic(() => import('@/components/app/map-visibility/TrackingSettings'));
const KeywordTable = dynamic(() => import('@/components/app/map-visibility/KeywordTable'));
type Tab = 'overview' | 'grid' | 'keywords' | 'competitors' | 'history' | 'recommendations';
const time = (s?: string) => s ? new Date(s).toLocaleString() : '-';

function Stats({ summary }: { summary?: Metrics }) {
  const items = [['Map visibility', percent(summary?.visibility)], ['Average found rank', rankText(summary?.average)], ['Best rank', rankText(summary?.best)], ['Visible points', summary ? `${summary.visible}/${summary.total}` : '-'], ['Tracked points', summary?.total ?? '-'], ['Not returned / outside range', summary?.notVisible ?? '-']];
  return <dl className="my-5 grid grid-cols-2 gap-x-5 gap-y-5 border-y border-line py-5 sm:grid-cols-3 xl:grid-cols-6">{items.map(([label, value]) => <div key={label}><dt className="text-xs text-ink-muted">{label}</dt><dd className="mt-2 text-2xl font-semibold tabular-nums">{value}</dd></div>)}</dl>;
}

export default function MapVisibilityPage() {
  const { business } = useAuth();
  const toast = useToast();
  const { data, error, mutate } = useSWR<Overview>('/map-visibility', { refreshInterval: (value) => value?.active ? 5000 : 0 });
  const [keyword, setKeyword] = useState('');
  const [radius, setRadius] = useState('5');
  const [size, setSize] = useState('5');
  const [range, setRange] = useState('20');
  const [tab, setTab] = useState<Tab>('grid');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [approveOpen, setApproveOpen] = useState(false);
  const [approved, setApproved] = useState(false);
  const [busy, setBusy] = useState('');
  const [selectedId, setSelectedId] = useState('');
  const [point, setPoint] = useState<Point | null>(null);
  const [competitor, setCompetitor] = useState('');
  const [heatmap, setHeatmap] = useState(false);
  const [thresholds, setThresholds] = useState([3, 10, 20]);
  const [compareMode, setCompareMode] = useState('previous');
  const [baselineId, setBaselineId] = useState('');
  const [offset, setOffset] = useState(0);
  useEffect(() => { if (!keyword && data?.settings?.keywords.length) setKeyword(data.settings.keywords[0]); }, [data, keyword]);
  const scanId = selectedId || (data?.active?.keyword === keyword ? data.active._id : data?.latest.find(s => s.keyword === keyword)?._id) || '';
  const comparisonQuery = compareMode === 'custom' ? baselineId ? `?baseline=${baselineId}` : '?compare=none' : ['1', '7', '30'].includes(compareMode) ? `?compareDays=${compareMode}` : '';
  const { data: detail, error: detailError, mutate: refreshDetail } = useSWR<Detail>(scanId ? `/map-visibility/scans/${scanId}${comparisonQuery}` : null, { refreshInterval: value => value?.scan.active ? 4000 : 0 });
  const { data: history, error: historyError } = useSWR<{ scans: Scan[]; nextOffset: number | null }>(keyword ? `/map-visibility/scans?keyword=${encodeURIComponent(keyword)}&offset=${offset}` : null, { refreshInterval: data?.active ? 5000 : 0 });
  const radiusValid = Number(radius) >= 0.1 && Number(radius) <= 25;
  const { data: preview } = useSWR<{ center: Center | null; points: Point[] }>((data?.settings || data?.suggestedCenter) && radiusValid && !scanId ? `/map-visibility/preview?radiusKm=${radius}&gridSize=${size}` : null);
  const scan = detail?.scan;
  const selectedPlace = competitor || scan?.placeId || data?.settings?.placeId || '';
  const center = scan?.center || preview?.center;
  const points = scan?.points || preview?.points || [];
  const selectedPoint = point ? points.find(p => p.index === point.index) || null : null;
  const onPoint = useCallback((p: Point) => setPoint(p), []);
  const chooseKeyword = (text: string) => { setKeyword(text); setSelectedId(''); setPoint(null); setCompetitor(''); setOffset(0); setBaselineId(''); };
  const action = async (key: string, fn: () => Promise<void>) => { setBusy(key); try { await fn(); } catch (e: any) { toast(e.message, 'bad'); } finally { setBusy(''); } };
  const run = () => action('scan', async () => {
    const res = await api('/map-visibility/scans', { body: { keyword, radiusKm: Number(radius), gridSize: Number(size), rankingRange: Number(range), approved } });
    setSelectedId(res.scan._id); setPoint(null); setCompetitor(''); setApproveOpen(false); setApproved(false); setTab('grid'); await mutate(); toast('Real map scan queued');
  });
  const download = () => action('report', async () => {
    const response = await fetch(`/api/map-visibility/scans/${scanId}/report${detail?.baseline ? `?baseline=${detail.baseline._id}` : ''}`, { headers: { Authorization: `Bearer ${getToken() || ''}` } });
    if (!response.ok) throw new Error('The report could not be downloaded.');
    const url = URL.createObjectURL(await response.blob());
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'reviewrankr-map-visibility.txt'; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  const openScan = (s: Scan) => { setSelectedId(s._id); setKeyword(s.keyword); setPoint(null); setCompetitor(''); setBaselineId(''); setTab('grid'); };
  const comparisons = (history?.scans || []).filter(s => scan && s._id !== scan._id && s.signature === scan.signature && s.status === 'complete' && s.createdAt < scan.createdAt);
  return <>
    <PageHeader title="Local Map Visibility" subtitle="Track how your business appears in Google Maps from locations around your business." actions={<><Button variant="secondary" icon={<Settings className="h-4 w-4" />} disabled={!data} onClick={() => setSettingsOpen(true)}>Tracking settings</Button><Button variant="ghost" icon={<Download className="h-4 w-4" />} aria-label="Download client report" title="Download client report" disabled={!scan || !!busy} loading={busy === 'report'} onClick={download} /></>} />
    {error && <p role="alert" className="mb-4 text-sm text-rose">{error.message}<Button variant="ghost" onClick={() => mutate()}>Retry</Button></p>}
    {!data && !error && <Skeleton className="h-64" />}
    {data && <>
      <div className="border-b border-line pb-5">
        <p className="mb-4 flex flex-wrap items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-brand-600" /><span className="font-medium">{business?.name}</span><span className="text-ink-muted">{data.settings?.center ? `${data.settings.center.latitude}, ${data.settings.center.longitude}` : data.suggestedCenter ? `${data.suggestedCenter.latitude}, ${data.suggestedCenter.longitude}` : 'Business location not configured or Google coordinates expired'}</span><span className="ml-auto text-xs text-ink-muted">Last scan: {time(scan?.createdAt)}</span></p>
        <div className="grid items-end gap-3 sm:grid-cols-2 xl:grid-cols-[minmax(180px,1fr)_120px_120px_120px_auto]">
          <Field label="Search keyword"><Select value={keyword} onChange={e => chooseKeyword(e.target.value)}><option value="">Choose keyword</option>{[...new Set([...(data.settings?.keywords || []), ...(keyword ? [keyword] : [])])].map(k => <option key={k}>{k}</option>)}</Select></Field>
          <Field label="Radius (km)"><Input type="number" step="0.1" min={0.1} max={25} value={radius} onChange={e => setRadius(e.target.value)} list="map-radius-options" /></Field><datalist id="map-radius-options">{[1, 2, 3, 5, 10].map(n => <option key={n} value={n} />)}</datalist>
          <Field label="Grid size"><Select value={size} onChange={e => setSize(e.target.value)}>{[3, 5, 7, 9].map(n => <option key={n} value={n}>{n} x {n}</option>)}</Select></Field>
          <Field label="Ranking range"><Select value={range} onChange={e => setRange(e.target.value)}>{[3, 10, 20].map(n => <option key={n} value={n}>Top {n}</option>)}</Select></Field>
          <Button icon={<Play className="h-4 w-4" />} disabled={!data.provider.configured || !data.settings || !data.settings.keywords.includes(keyword) || !!data.active || !radiusValid || !!busy} onClick={() => { setApproved(false); setApproveOpen(true); }}>Run scan</Button>
        </div>
        {!data.provider.configured && <p role="status" className="mt-3 text-sm text-amber">Map search provider is not connected. Real scans are unavailable until the platform connects SerpApi. Google Business Profile connection alone does not supply geo-grid ranks.</p>}
        {!data.settings && <Button className="mt-3" variant="ghost" onClick={() => setSettingsOpen(true)}>Add actual location and tracked searches</Button>}
      </div>
      {data.active && <div className="my-4 flex flex-wrap items-center justify-between gap-3 border-l-2 border-brand-500 pl-3 text-sm"><span>{data.active.keyword}: {data.active.status} / {data.active.summary.checked}/{data.active.summary.total} points checked</span><div className="flex gap-2"><Button variant="ghost" size="sm" onClick={() => openScan(data.active!)}>View scan</Button><Button variant="ghost" size="sm" icon={<Square className="h-3 w-3" />} disabled={!!busy} onClick={() => action('cancel', async () => { await api(`/map-visibility/scans/${data.active!._id}/cancel`, { method: 'POST' }); await mutate(); await refreshDetail(); })}>Cancel scan</Button></div></div>}
      {detailError && <p role="alert" className="my-4 text-sm text-rose">{detailError.message}</p>}
      {scan?.error && <p role="status" className="my-4 text-sm text-amber">{scan.error}</p>}
      <div className="mt-5"><Segmented<Tab> value={tab} onChange={setTab} options={[{ value: 'overview', label: 'Overview' }, { value: 'grid', label: 'Geo grid' }, { value: 'keywords', label: 'Keywords' }, { value: 'competitors', label: 'Competitors' }, { value: 'history', label: 'History' }, { value: 'recommendations', label: 'Recommendations' }]} /></div>
      {(tab === 'grid' || tab === 'overview') && <>
        <Stats summary={scan?.summary} />
        {scan && <p className="mb-3 text-xs text-ink-muted">Observed scan: {scan.keyword} / {scan.radiusKm} km / {scan.gridSize} x {scan.gridSize} / top {scan.rankingRange} / {scan.language} / {scan.provider} / {scan.status} / {scan.summary.unknown} unknown points</p>}
        {scan && <section className="mb-5 border-b border-line pb-5"><div className="flex flex-wrap items-end gap-3"><Field label="Compare with"><Select className="w-auto" value={compareMode} onChange={e => { setCompareMode(e.target.value); setBaselineId(''); }}><option value="previous">Previous comparable scan</option><option value="1">Yesterday or earlier</option><option value="7">Last week or earlier</option><option value="30">Last month or earlier</option><option value="custom">Custom scan</option></Select></Field>{compareMode === 'custom' && <Field label="Baseline scan"><Select value={baselineId} onChange={e => setBaselineId(e.target.value)}><option value="">Choose completed scan</option>{comparisons.map(s => <option key={s._id} value={s._id}>{time(s.createdAt)}</option>)}</Select></Field>}</div>
          {detail?.comparison.comparable ? <div className="mt-3 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-ink-muted"><tr><th className="py-2">Metric</th><th className="px-3">{time(detail.baseline?.createdAt)}</th><th className="px-3">Current</th><th>Change</th></tr></thead><tbody className="divide-y divide-line">{[['Visibility', percent(detail.comparison.before?.visibility), percent(scan.summary.visibility), `${detail.comparison.visibilityChange! > 0 ? '+' : ''}${detail.comparison.visibilityChange} pp`], ['Average found rank', rankText(detail.comparison.before?.average), rankText(scan.summary.average), detail.comparison.averageImprovement == null ? '-' : `${detail.comparison.averageImprovement > 0 ? '+' : ''}${detail.comparison.averageImprovement} positions improved`], ['Best rank', rankText(detail.comparison.before?.best), rankText(scan.summary.best), '-'], ['Visible points', `${detail.comparison.before?.visible}/${scan.summary.total}`, `${scan.summary.visible}/${scan.summary.total}`, '-']].map(row => <tr key={row[0]}>{row.map((v, i) => <td key={i} className="whitespace-nowrap py-2 pr-3">{v}</td>)}</tr>)}</tbody></table></div> : <p className="mt-3 text-xs text-ink-muted">No completed comparable baseline{compareMode === 'custom' && !baselineId ? ' selected' : ' available'}.</p>}
        </section>}
      </>}
      {tab === 'grid' && <section className="mt-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><Segmented value={heatmap ? 'heatmap' : 'markers'} onChange={v => setHeatmap(v === 'heatmap')} options={[{ value: 'markers', label: 'Map points' }, { value: 'heatmap', label: 'Visibility heatmap' }]} />{scan && <Select className="w-auto max-w-full" value={selectedPlace} onChange={e => { setCompetitor(e.target.value); setPoint(null); }} aria-label="Map business">{detail?.competitors.map(c => <option key={c.placeId} value={c.placeId}>{c.own ? `Your business: ${c.title}` : c.title}</option>)}</Select>}</div>
        <div className={selectedPoint ? 'grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_280px]' : ''}>
          <div className="min-w-0">{center ? <GeoMap center={center} points={points} ownId={scan?.placeId || data.settings?.placeId || ''} placeId={selectedPlace} businessName={scan?.businessName || business?.name || ''} range={scan?.rankingRange || Number(range)} thresholds={thresholds} heatmap={heatmap} radiusKm={scan?.radiusKm || Number(radius)} gridSize={scan?.gridSize || Number(size)} onPoint={onPoint} /> : <div className="flex h-[360px] items-center justify-center border-y border-line text-sm text-ink-muted">No actual business coordinates saved.</div>}</div>
          {selectedPoint && <aside className="min-w-0 border-l border-line pl-4"><div className="flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Point #{selectedPoint.index}</h2><Button size="sm" variant="ghost" icon={<X className="h-4 w-4" />} aria-label="Close point details" title="Close point details" onClick={() => setPoint(null)} /></div><dl className="mt-3 space-y-3 text-sm"><div><dt className="text-xs text-ink-muted">Search</dt><dd>{scan?.keyword || keyword}</dd></div><div><dt className="text-xs text-ink-muted">Observed Maps rank</dt><dd className="text-2xl font-semibold">{selectedPoint.status === 'checked' ? rankText(observedRank(selectedPoint, selectedPlace, scan?.placeId || '')) === '-' ? 'Not returned' : rankText(observedRank(selectedPoint, selectedPlace, scan?.placeId || '')) : 'Unknown'}</dd></div><div><dt className="text-xs text-ink-muted">Search coordinates</dt><dd>{selectedPoint.latitude.toFixed(6)}, {selectedPoint.longitude.toFixed(6)}</dd></div><div><dt className="text-xs text-ink-muted">Checked</dt><dd>{time(selectedPoint.checkedAt)}</dd></div></dl>{selectedPoint.error && <p className="mt-3 text-xs text-rose">{selectedPoint.error}</p>}<h3 className="mt-5 text-sm font-semibold">Observed competitors</h3><ol className="mt-2 max-h-80 overflow-y-auto divide-y divide-line">{selectedPoint.results.map(r => <li key={r.placeId} className="py-2 text-sm"><span className="font-medium">#{r.position} {r.title}</span><p className="text-xs text-ink-muted">{r.address}</p></li>)}</ol>{!selectedPoint.results.length && <p className="mt-2 text-xs text-ink-muted">No competitor results recorded.</p>}</aside>}
        </div>
        <div className="my-4 flex flex-wrap items-center gap-4 text-xs">{thresholds.map((n, i) => <label key={i} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ background: ['#1d8257', '#c69018', '#d66b25'][i] }} />{i ? `#${thresholds[i - 1] + 1}` : '#1'} to <input type="number" min={i ? thresholds[i - 1] + 1 : 1} max={i < 2 ? thresholds[i + 1] - 1 : 20} value={n} aria-label={`Rank color threshold ${i + 1}`} className="field h-8 w-16" onChange={e => { const v = Number(e.target.value); if (v >= (i ? thresholds[i - 1] + 1 : 1) && v <= (i < 2 ? thresholds[i + 1] - 1 : 20)) setThresholds(thresholds.map((x, j) => i === j ? v : x)); }} /></label>)}<span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-rose" />Outside range / not returned</span><span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-ink-muted" />Unknown</span></div>
        {!!points.length && <details className="border-t border-line pt-3"><summary className="cursor-pointer text-sm font-medium">Measurement point list ({points.length})</summary><div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-7">{points.map(p => <button key={p.index} onClick={() => onPoint(p)} className="flex min-h-12 items-center justify-between gap-1 rounded-md border border-line px-2 text-xs" style={{ borderLeft: `4px solid ${pointColor(p, observedRank(p, selectedPlace, scan?.placeId || ''), scan?.rankingRange || Number(range), thresholds)}` }}><span>Point {p.index}</span><span>{p.status === 'checked' ? rankText(observedRank(p, selectedPlace, scan?.placeId || '')) : '?'}</span></button>)}</div></details>}
      </section>}
      {tab === 'overview' && <section className="mt-5"><h2 className="font-display text-lg font-semibold">Visibility by geographic area</h2><ul className="mt-3 divide-y divide-line">{detail?.regions.map(r => <li key={r.area} className="flex justify-between gap-3 py-3 text-sm"><span>{r.area}</span><span>{percent(r.visibility)} / {r.visible}/{r.total} visible</span></li>)}</ul>{scan && <p className="mt-4 text-sm text-ink-muted">Median: {rankText(scan.summary.median)} / Worst found rank: {rankText(scan.summary.worst)} / Top 3: {percent(scan.summary.top3)} / Top 10: {percent(scan.summary.top10)} / Top 20: {percent(scan.summary.top20)}</p>}</section>}
      {tab === 'keywords' && <KeywordTable data={data} onKeyword={keyword => { chooseKeyword(keyword); setTab('grid'); }} />}
      {tab === 'competitors' && <section className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-ink-muted"><tr><th className="py-3">Business</th><th className="px-3">Visibility</th><th className="px-3">Avg found rank</th><th>Visible points</th></tr></thead><tbody className="divide-y divide-line">{detail?.competitors.map(c => <tr key={c.placeId}><td className="min-w-[180px] py-3"><button className="text-brand-600 hover:underline" onClick={() => { setCompetitor(c.placeId); setPoint(null); setTab('grid'); }}>{c.title}</button>{c.own && <Badge className="ml-2">Your business</Badge>}</td><td className="px-3">{percent(c.visibility)}</td><td className="px-3">{rankText(c.average)}</td><td>{c.visible}/{c.total}</td></tr>)}</tbody></table>{!detail && <p className="py-4 text-sm text-ink-muted">No observed competitor data.</p>}</section>}
      {tab === 'history' && <section className="mt-5">{historyError && <p role="alert" className="text-sm text-rose">{historyError.message}</p>}<div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-xs text-ink-muted"><tr><th className="py-3">Date / keyword</th><th className="px-3">Scan settings</th><th className="px-3">Visibility</th><th className="px-3">Avg rank</th><th>Status</th></tr></thead><tbody className="divide-y divide-line">{history?.scans.map(s => <tr key={s._id}><td className="min-w-[180px] py-3"><button className="text-left text-brand-600 hover:underline" onClick={() => openScan(s)}>{time(s.createdAt)}<span className="block text-xs text-ink-muted">{s.keyword}</span></button></td><td className="whitespace-nowrap px-3 text-xs">{s.radiusKm} km / {s.gridSize} x {s.gridSize} / top {s.rankingRange}</td><td className="px-3">{percent(s.summary.visibility)}</td><td className="px-3">{rankText(s.summary.average)}</td><td>{s.status}</td></tr>)}</tbody></table></div>{history && !history.scans.length && <p className="py-4 text-sm text-ink-muted">No scans recorded for this keyword.</p>}<div className="mt-4 flex gap-2"><Button size="sm" variant="secondary" disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 50))}>Previous</Button><Button size="sm" variant="secondary" disabled={history?.nextOffset == null} onClick={() => setOffset(history!.nextOffset!)}>Next</Button></div></section>}
      {tab === 'recommendations' && <section className="mt-5"><ul className="divide-y divide-line">{detail?.recommendations.map((r, i) => <li key={i} className="py-4"><h2 className="text-sm font-semibold">{r.title}</h2><p className="mt-2 text-sm text-ink-muted">{r.detail}</p><Link href={r.href} className="mt-2 inline-block text-sm font-medium text-brand-600">Investigate</Link></li>)}</ul>{!detail?.recommendations.length && <p className="py-4 text-sm text-ink-muted">{scan ? 'No directional visibility gap detected in this scan.' : 'No measured scan available.'}</p>}</section>}
      <p className="mt-7 border-t border-line pt-4 text-xs leading-relaxed text-ink-muted">Third-party observational measurements, not a Google-provided ranking or visibility score. Results may vary by time, device and personalization and may include businesses outside the requested area. Ads are excluded. Average rank covers found points only; incomplete scans have no visibility percentage. Colored areas represent measured grid points, not guaranteed customer coverage.</p>
    </>}
    {settingsOpen && data && <TrackingSettings data={data} onClose={() => setSettingsOpen(false)} onSaved={() => { mutate(); setSelectedId(''); setPoint(null); setCompetitor(''); }} />}
    <Modal open={approveOpen} onClose={() => setApproveOpen(false)} title="Approve map scan" footer={<><Button variant="ghost" onClick={() => setApproveOpen(false)}>Cancel</Button><Button icon={<Play className="h-4 w-4" />} loading={busy === 'scan'} disabled={!approved || !!busy} onClick={run}>Run approved scan</Button></>}><p className="text-sm">{keyword} / {radius} km / {size} x {size} / top {range}</p><p className="mt-3 text-sm text-ink-muted">Up to {Number(size) ** 2} paid third-party search requests. No automatic recurring scans or retries. Cancelling cannot undo an in-flight provider charge.</p><label className="mt-4 flex items-start gap-2 text-sm"><input className="mt-1 accent-brand-600" type="checkbox" checked={approved} onChange={e => setApproved(e.target.checked)} /><span>I approve this scan and the provider credit usage.</span></label></Modal>
  </>;
}
