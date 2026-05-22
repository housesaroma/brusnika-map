import { fetchCityDistrictPolygons } from '@/api/districts';
import { createPolygonId } from '@/utils/polygons';

const SEED_FLAG_PREFIX = 'brusnika_districts_seeded_';

function slugify(value) {
  return String(value || 'district')
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '');
}

export function isDistrictsSeeded(cityId) {
  if (!cityId) return false;
  return localStorage.getItem(`${SEED_FLAG_PREFIX}${cityId}`) === '1';
}

export function markDistrictsSeeded(cityId) {
  if (!cityId) return;
  localStorage.setItem(`${SEED_FLAG_PREFIX}${cityId}`, '1');
}

export async function buildDistrictFavoritesForCity(city) {
  const districts = await fetchCityDistrictPolygons(city);
  return districts.map((district) => ({
    id: `district_${city.id}_${slugify(district.name)}`,
    name: district.name,
    filters: null,
    geoPoints: district.points,
    cityId: city.id,
    source: 'district',
    isDistrict: true,
  }));
}

export function mergeDistrictFavorites(existingFavorites, districtFavorites, cityId) {
  const withoutCityDistricts = (existingFavorites || []).filter(
    (item) => !(item.isDistrict && item.cityId === cityId)
  );
  const seen = new Set(withoutCityDistricts.map((item) => item.id));
  const merged = [...withoutCityDistricts];

  districtFavorites.forEach((favorite) => {
    if (seen.has(favorite.id)) return;
    seen.add(favorite.id);
    merged.unshift(favorite);
  });

  return merged;
}

export function favoriteToMapPolygon(favorite) {
  if (!favorite?.geoPoints?.length) return null;
  return {
    id: createPolygonId('map'),
    presetId: favorite.id,
    name: favorite.name || 'Полигон',
    points: favorite.geoPoints.map(([lng, lat]) => [Number(lng), Number(lat)]),
    selected: true,
    isDistrict: Boolean(favorite.isDistrict),
  };
}
