'use client';
import { useEffect, useRef, useState } from 'react';
import { googleMapsConfigured, loadGoogleMaps } from '@/lib/google-maps';
import { Center, Point, observedRank, pointColor } from './types';
declare global { interface Window { gm_authFailure?: () => void } }

type Props = { center: Center; points: Point[]; placeId: string; ownId: string; businessName: string; range: number; thresholds: number[]; heatmap: boolean; radiusKm: number; gridSize: number; onPoint: (point: Point) => void };
export default function GeoMap(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let capabilityListener: google.maps.MapsEventListener | undefined;
    let capabilityTimeout: ReturnType<typeof setTimeout> | undefined;
    const previous = window.gm_authFailure;
    const failed = () => setError('Google Maps rejected the browser key. Check billing, enabled APIs and allowed website referrers.');
    window.gm_authFailure = failed;
    (async () => {
      try {
        const { Map } = await loadGoogleMaps('maps');
        await loadGoogleMaps('marker');
        if (cancelled || !host.current) return;
        map.current = new Map(host.current, { center: { lat: props.center.latitude, lng: props.center.longitude }, zoom: 13, mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID', gestureHandling: 'cooperative', streetViewControl: false, mapTypeControl: false });
        const capabilityError = 'Google Maps grid markers are unavailable. Check project billing, API access, website referrers and map ID.';
        const checkCapabilities = () => {
          if (cancelled || !map.current) return;
          if (map.current.getMapCapabilities().isAdvancedMarkersAvailable) setError(value => value === capabilityError ? '' : value);
          else setError(capabilityError);
        };
        capabilityListener = map.current.addListener('mapcapabilities_changed', checkCapabilities);
        capabilityTimeout = setTimeout(checkCapabilities, 3000);
        setReady(true);
      } catch (e: any) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; clearTimeout(capabilityTimeout); capabilityListener?.remove(); if (map.current) google.maps.event.clearInstanceListeners(map.current); map.current = null; if (window.gm_authFailure === failed) window.gm_authFailure = previous; };
  }, []);
  useEffect(() => {
    if (!ready || !map.current) return;
    const overlays: (google.maps.Circle | google.maps.marker.AdvancedMarkerElement)[] = [];
    const listeners: google.maps.MapsEventListener[] = [];
    const center = { lat: props.center.latitude, lng: props.center.longitude };
    overlays.push(new google.maps.Circle({ map: map.current, center, radius: props.radiusKm * 1000, fillOpacity: 0, strokeColor: '#1f5ad6', strokeWeight: 1 }));
    for (const point of props.points) {
      const rank = observedRank(point, props.placeId, props.ownId);
      const color = pointColor(point, rank, props.range, props.thresholds);
      const position = { lat: point.latitude, lng: point.longitude };
      const label = document.createElement('div');
      label.textContent = point.status !== 'checked' ? '?' : rank === null ? 'NF' : `#${rank}`;
      const diameter = props.gridSize <= 3 ? 36 : props.gridSize === 5 ? 24 : 18;
      label.style.cssText = `width:${diameter}px;height:${diameter}px;border-radius:50%;border:1px solid white;display:flex;align-items:center;justify-content:center;background:${color};color:white;font:600 ${diameter >= 24 ? 10 : 7}px system-ui`;
      const marker = new google.maps.marker.AdvancedMarkerElement({ map: map.current, position, content: label, gmpClickable: true, title: `Point ${point.index}: ${point.status !== 'checked' ? 'unknown' : rank === null ? 'not returned' : `rank ${rank}`}` });
      listeners.push(marker.addListener('click', () => props.onPoint(point))); overlays.push(marker);
      if (props.heatmap) {
        const circle = new google.maps.Circle({ map: map.current, center: position, radius: props.radiusKm * 1000 * Math.SQRT2 / (props.gridSize - 1) * 0.43, strokeWeight: 1, strokeColor: color, fillColor: color, fillOpacity: 0.3 });
        listeners.push(circle.addListener('click', () => props.onPoint(point))); overlays.push(circle);
      }
    }
    const business = document.createElement('div');
    business.textContent = props.businessName;
    business.style.cssText = 'background:#1f5ad6;color:white;font:600 12px system-ui;padding:5px 8px;border:2px solid white;border-radius:4px;transform:translateY(30px);max-width:180px;overflow-wrap:anywhere';
    overlays.push(new google.maps.marker.AdvancedMarkerElement({ map: map.current, position: center, content: business, title: `Business: ${props.businessName}`, zIndex: 1000 }));
    return () => { listeners.forEach(listener => listener.remove()); overlays.forEach(overlay => { if (overlay instanceof google.maps.Circle) overlay.setMap(null); else overlay.map = null; }); };
  }, [ready, props]);
  useEffect(() => {
    if (!ready || !map.current) return;
    const circle = new google.maps.Circle({ center: { lat: props.center.latitude, lng: props.center.longitude }, radius: props.radiusKm * 1000 });
    const bounds = circle.getBounds();
    if (bounds) map.current.fitBounds(bounds, 28);
  }, [ready, props.center.latitude, props.center.longitude, props.radiusKm]);
  return <div className="relative h-[460px] w-full sm:h-[540px]"><div ref={host} className="h-full w-full bg-mist" aria-label="Google map with business and measurement points" />{(!googleMapsConfigured() || error) && <p role="status" className="absolute inset-x-4 top-5 rounded-md border border-line bg-white p-4 text-sm text-ink-muted">{error || 'Google Maps browser key is not configured. Add the website-restricted frontend key; the backend key must remain private.'}</p>}</div>;
}
