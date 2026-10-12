'use client';
import { useEffect, useRef, useState } from 'react';
import { googleMapsConfigured, loadGoogleMaps } from '@/lib/google-maps';

export default function PlacePicker({ onPlace }: { onPlace: (place: { placeId: string; latitude: number; longitude: number }) => void }) {
  const host = useRef<HTMLDivElement>(null);
  const callback = useRef(onPlace); callback.current = onPlace;
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    let element: google.maps.places.PlaceAutocompleteElement | undefined;
    const selected = async (event: any) => {
      try {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ['id', 'location'] });
        if (!cancelled && place.id && place.location) callback.current({ placeId: place.id, latitude: place.location.lat(), longitude: place.location.lng() });
      } catch { setError('Google Places could not load this location. Check API access and billing.'); }
    };
    (async () => {
      try {
        const { PlaceAutocompleteElement } = await loadGoogleMaps('places');
        if (cancelled || !host.current) return;
        element = new PlaceAutocompleteElement();
        element.setAttribute('aria-label', 'Find business on Google Maps');
        element.addEventListener('gmp-select', selected);
        element.addEventListener('gmp-error', () => setError('Google Places search is unavailable.'));
        host.current.append(element);
      } catch (e: any) { if (!cancelled) setError(e.message); }
    })();
    return () => { cancelled = true; element?.removeEventListener('gmp-select', selected); element?.remove(); };
  }, []);
  if (!googleMapsConfigured()) return null;
  return <div><p className="label">Find business on Google Maps</p><div ref={host} />{error && <p role="status" className="mt-2 text-xs text-rose">{error}</p>}</div>;
}
