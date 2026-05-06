const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/';

export async function geocodeAddress(query, apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY) {
  if (!query?.trim()) {
    return null;
  }

  if (!apiKey) {
    throw new Error('Yandex Geocoder API key is missing');
  }

  const url = `${GEOCODER_URL}?apikey=${encodeURIComponent(apiKey)}&format=json&lang=ru_RU&geocode=${encodeURIComponent(query)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to geocode address');
  }

  const data = await response.json();
  const first = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;

  if (!first?.Point?.pos) {
    return null;
  }

  const [lngRaw, latRaw] = first.Point.pos.split(' ');
  const lng = Number(lngRaw);
  const lat = Number(latRaw);

  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return null;
  }

  return {
    coordinates: [lng, lat],
    label: first?.metaDataProperty?.GeocoderMetaData?.text || first?.name || query,
  };
}
