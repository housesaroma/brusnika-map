const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/';
const DEFAULT_SUGGEST_LIMIT = 8;

function parseGeocoderItems(data) {
  const items = data?.response?.GeoObjectCollection?.featureMember || [];
  return items
    .map((item) => {
      const geoObject = item?.GeoObject;
      const pos = geoObject?.Point?.pos;
      if (!pos) return null;

      const [lngRaw, latRaw] = String(pos).split(' ');
      const lng = Number(lngRaw);
      const lat = Number(latRaw);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

      const label =
        geoObject?.metaDataProperty?.GeocoderMetaData?.text ||
        geoObject?.description ||
        geoObject?.name ||
        '';

      return {
        label,
        coordinates: [lng, lat],
      };
    })
    .filter(Boolean);
}

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
  const [first] = parseGeocoderItems(data);
  if (!first) return null;
  return {
    coordinates: first.coordinates,
    label: first.label || query,
  };
}

export async function suggestAddresses(
  query,
  { cityLabel = '', limit = DEFAULT_SUGGEST_LIMIT } = {},
  apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
) {
  if (!query?.trim()) {
    return [];
  }

  if (!apiKey) {
    throw new Error('Yandex Geocoder API key is missing');
  }

  const fullQuery = cityLabel ? `${query}, ${cityLabel}` : query;
  const url = `${GEOCODER_URL}?apikey=${encodeURIComponent(apiKey)}&format=json&lang=ru_RU&results=${encodeURIComponent(limit)}&geocode=${encodeURIComponent(fullQuery)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to load address suggestions');
  }

  const data = await response.json();
  return parseGeocoderItems(data);
}
