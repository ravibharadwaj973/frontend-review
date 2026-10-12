'use client';

import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Center, Point, observedRank, pointColor } from './types';

type Props = { center: Center; points: Point[]; placeId: string; ownId: string; businessName: string; range: number; thresholds: number[]; heatmap: boolean; radiusKm: number; gridSize: number; onPoint: (point: Point) => void };
export default function LeafletGeoMap(props: Props) {
  const host = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, { scrollWheelZoom: false });
    map.current = instance;
    L.tileLayer(process.env.NEXT_PUBLIC_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: process.env.NEXT_PUBLIC_MAP_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).on('tileerror', () => setTileError(true)).addTo(instance);
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(host.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const instance = map.current;
    if (!instance) return;
    const layer = L.layerGroup().addTo(instance);
    const center: L.LatLngTuple = [props.center.latitude, props.center.longitude];
    L.circle(center, { radius: props.radiusKm * 1000, color: '#1f5ad6', weight: 1, fill: false, dashArray: '5 5' }).addTo(layer);
    for (const point of props.points) {
      const rank = observedRank(point, props.placeId, props.ownId);
      const color = pointColor(point, rank, props.range, props.thresholds);
      const longitude = props.center.longitude + ((point.longitude - props.center.longitude + 540) % 360) - 180;
      const location: L.LatLngTuple = [point.latitude, longitude];
      if (props.heatmap) L.circle(location, { radius: props.radiusKm * 1000 * Math.SQRT2 / (props.gridSize - 1) * 0.43, color, weight: 1, fillColor: color, fillOpacity: 0.3 }).addTo(layer).on('click', () => props.onPoint(point));
      const label = document.createElement('button');
      label.type = 'button';
      const diameter = props.gridSize === 3 ? 36 : props.gridSize === 5 ? 24 : props.gridSize === 7 ? 18 : 16;
      const fontSize = props.gridSize === 3 ? 12 : props.gridSize === 5 ? 9 : 7;
      label.style.cssText = `width:${diameter}px;height:${diameter}px;border-radius:50%;border:1px solid white;background:${color};color:white;font:600 ${fontSize}px system-ui;box-shadow:0 1px 5px #0004;cursor:pointer`;
      label.textContent = point.status !== 'checked' ? '?' : rank === null ? 'NF' : `#${rank}`;
      label.setAttribute('aria-label', `Point ${point.index}: ${point.status !== 'checked' ? 'unknown' : rank === null ? 'not returned' : `rank ${rank}`}`);
      label.title = label.getAttribute('aria-label') || '';
      L.marker(location, { icon: L.divIcon({ html: label, className: '', iconSize: [diameter, diameter], iconAnchor: [diameter / 2, diameter / 2] }), keyboard: false }).addTo(layer).on('click', () => props.onPoint(point));
    }
    const label = document.createElement('span');
    label.textContent = props.businessName;
    // Keep the business center distinct, including when a measurement shares its coordinates.
    const centerRadius = props.gridSize === 3 ? 22 : props.gridSize === 5 ? 16 : props.gridSize === 7 ? 13 : 11;
    L.circleMarker(center, { radius: centerRadius, color: 'white', weight: 2, fillColor: '#1f5ad6', fillOpacity: 1 }).addTo(layer).bindTooltip(label, { permanent: true, direction: 'bottom', offset: [0, centerRadius + 4] });
    return () => { layer.remove(); };
  }, [props]);
  useEffect(() => {
    const center = L.latLng(props.center.latitude, props.center.longitude);
    map.current?.fitBounds(center.toBounds(props.radiusKm * 2400), { padding: [26, 26], maxZoom: 16 });
  }, [props.center.latitude, props.center.longitude, props.radiusKm]);
  return <div className="relative">
    <div ref={host} className="relative z-0 h-[460px] w-full bg-mist sm:h-[540px]" aria-label="Google Maps search measurement locations" />
    {tileError && <p role="status" className="absolute bottom-8 left-3 right-3 z-[500] bg-white px-3 py-2 text-xs text-rose">Map tiles could not load. Measurement coordinates and results remain available in the point list.</p>}
  </div>;
}
