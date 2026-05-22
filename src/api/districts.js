import {
  boundedByToRing,
  filterDistrictFeaturesByCity,
  ringFromGeoJsonGeometry,
  simplifyRing,
} from '@/utils/polygons';
import { isValidCenter } from '@/utils/geo';

const GEOCODER_URL = 'https://geocode-maps.yandex.ru/1.x/';

function parseDistrictFromGeoObject(geoObject) {
  const meta = geoObject?.metaDataProperty?.GeocoderMetaData;
  const name =
    meta?.Address?.Components?.find((part) => part.kind === 'district')?.name || meta?.text;
  if (!name) return null;

  const boundedBy = geoObject?.boundedBy || geoObject?.BoundedBy;
  let points = boundedByToRing(boundedBy);
  if (points.length < 3) return null;

  points = simplifyRing(points, 80);
  const pos = geoObject?.Point?.pos;
  let center = null;
  if (pos) {
    const [lng, lat] = String(pos).split(' ').map(Number);
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      center = [lng, lat];
    }
  }

  return {
    name,
    points,
    center,
    source: 'yandex',
  };
}

async function geocodeDistricts(query, apiKey) {
  const url = `${GEOCODER_URL}?apikey=${encodeURIComponent(apiKey)}&format=json&lang=ru_RU&kind=district&results=50&geocode=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Failed to load districts from Yandex Geocoder');
  }
  const data = await response.json();
  const items = data?.response?.GeoObjectCollection?.featureMember || [];

  const districts = [];
  const seen = new Set();

  for (const item of items) {
    const parsed = parseDistrictFromGeoObject(item?.GeoObject);
    if (!parsed || seen.has(parsed.name)) continue;
    seen.add(parsed.name);
    districts.push(parsed);
  }

  return districts;
}

async function loadGeoJsonDistricts(city) {
  try {
    const response = await fetch('/data/districts.geojson');
    if (!response.ok) return [];
    const data = await response.json();
    const features = filterDistrictFeaturesByCity(data.features || [], city.center);

    return features
      .map((feature) => {
        const name = feature.properties?.name;
        const points = simplifyRing(ringFromGeoJsonGeometry(feature.geometry), 160);
        if (!name || points.length < 3) return null;
        return {
          name,
          points,
          center: null,
          source: 'geojson',
        };
      })
      .filter(Boolean);
  } catch (error) {
    console.warn('GeoJSON districts unavailable', error);
    return [];
  }
}

/**
 * Районы города: GeoJSON (если есть в /data) + Yandex Geocoder kind=district.
 */
export async function fetchCityDistrictPolygons(
  city,
  apiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY
) {
  if (!city?.label) return [];

  const geoJsonDistricts = await loadGeoJsonDistricts(city);
  if (geoJsonDistricts.length) return geoJsonDistricts;

  if (!apiKey) {
    console.warn('Yandex API key missing — district boundaries skipped');
    return [];
  }

  const yandexDistricts = await geocodeDistricts(city.label, apiKey);
  if (!isValidCenter(city.center)) return yandexDistricts;

  return yandexDistricts.filter((district) => {
    if (!district.center) return true;
    const [lng, lat] = district.center;
    const [cityLng, cityLat] = city.center;
    return Math.abs(lng - cityLng) < 0.6 && Math.abs(lat - cityLat) < 0.6;
  });
}
