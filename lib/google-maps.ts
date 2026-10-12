'use client';
import { importLibrary, setOptions } from '@googlemaps/js-api-loader';
let configured = false;
export const googleMapsConfigured = () => !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
export async function loadGoogleMaps<T extends keyof google.maps.ImportLibraryMap>(library: T): Promise<google.maps.ImportLibraryMap[T]> {
  if (!googleMapsConfigured()) throw new Error('Google Maps browser key is not configured.');
  if (!configured) {
    setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, v: 'weekly', authReferrerPolicy: 'origin' });
    configured = true;
  }
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Google Maps loading timed out. Check network access, API permissions and project billing.')), 30000);
    importLibrary(library).then(value => { clearTimeout(timeout); resolve(value); }, error => { clearTimeout(timeout); reject(error); });
  });
}
