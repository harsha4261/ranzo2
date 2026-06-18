import * as Location from 'expo-location';

export type ResolvedLocation = {
  lat: number;
  lng: number;
  address: string;
  area: string;
};

const FALLBACK: ResolvedLocation = {
  lat: 16.3067,
  lng: 80.4365,
  area: 'Brodipet',
  address: 'Brodipet, Guntur, AP',
};

export async function getCurrentLocation(): Promise<{
  ok: boolean;
  data: ResolvedLocation;
  reason?: 'denied' | 'unavailable';
}> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return { ok: false, data: FALLBACK, reason: 'denied' };
    }
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    let area = 'Your area';
    let address = `${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`;
    try {
      const places = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      if (places.length > 0) {
        const p = places[0];
        area = p.district ?? p.subregion ?? p.city ?? 'Your area';
        address = [p.name, p.street, p.district, p.city, p.region]
          .filter(Boolean)
          .join(', ');
      }
    } catch {}
    return {
      ok: true,
      data: {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        area,
        address,
      },
    };
  } catch {
    return { ok: false, data: FALLBACK, reason: 'unavailable' };
  }
}

export const FALLBACK_LOCATION = FALLBACK;
