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

function parseMetroItems(data) {
  const items = data?.response?.GeoObjectCollection?.featureMember || [];
  return items
    .map((item) => {
      const geoObject = item?.GeoObject;
      const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
      const name =
        meta?.Address?.Components?.find((part) => part.kind === 'metro')?.name ||
        meta?.text ||
        geoObject?.name ||
        '';
      if (!name) return null;

      const description = meta?.text || geoObject?.description || '';
      const distanceMatch = description.match(/(\d+(?:[.,]\d+)?)\s*км/i);
      const distanceKm = distanceMatch ? Number(distanceMatch[1].replace(',', '.')) : null;

      return {
        name: name.replace(/^метро\s+/i, '').trim(),
        description,
        distanceKm: Number.isFinite(distanceKm) ? distanceKm : null,
      };
    })
    .filter(Boolean);
}

/**
 * Ближайшие станции метро через Geocoder API (kind=metro).
 * skip=1 — первая станция часто совпадает с точкой запроса.
 */
export async function findClosestMetro(
  coordinates,
  { results = 3, skip = 1 } = {},
  apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) {
    return [];
  }

  const [lng, lat] = coordinates;
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
    return [];
  }

  if (!apiKey) {
    console.warn('Yandex Geocoder API key is missing — metro lookup skipped');
    return [];
  }

  const url = `${GEOCODER_URL}?apikey=${encodeURIComponent(apiKey)}&format=json&lang=ru_RU&kind=metro&results=${encodeURIComponent(results)}&skip=${encodeURIComponent(skip)}&geocode=${encodeURIComponent(`${lng},${lat}`)}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error('Failed to find closest metro');
  }

  const data = await response.json();
  return parseMetroItems(data);
}
