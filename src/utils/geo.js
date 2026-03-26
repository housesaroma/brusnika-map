/**
 * Утилиты для работы с координатами
 */

/**
 * Парсит координаты из строки в формат [lng, lat]
 */
export function parseCoordsToLngLat(rawCoords) {
  if (typeof rawCoords !== 'string') {
    return null;
  }

  const normalized = rawCoords.replaceAll(',', '.').replaceAll(/\s+/g, ' ').trim();
  const [firstRaw, secondRaw] = normalized.split(' ');
  const first = Number(firstRaw);
  const second = Number(secondRaw);

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }

  // Lat, Lng формат
  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return [second, first];
  }

  // Lng, Lat формат
  if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
    return [first, second];
  }

  return null;
}

/**
 * Проверяет валидность координат
 */
export function isValidCenter(center) {
  return (
    Array.isArray(center) &&
    center.length === 2 &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1])
  );
}

/**
 * Вычисляет расстояние между двумя точками (формула гаверсинуса)
 */
export function getDistance(coord1, coord2) {
  const R = 6371000; // Радиус Земли в метрах
  const [lng1, lat1] = coord1;
  const [lng2, lat2] = coord2;

  const toRad = (deg) => (deg * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Вычисляет центроид полигона
 */
export function getPolygonCentroid(coordinates) {
  if (!coordinates || coordinates.length < 3) {
    return null;
  }

  let sumLng = 0;
  let sumLat = 0;
  let count = 0;

  for (const [lng, lat] of coordinates) {
    sumLng += lng;
    sumLat += lat;
    count++;
  }

  return [sumLng / count, sumLat / count];
}

/**
 * Вычисляет bounding box полигона
 */
export function getPolygonBBox(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    maxLng = Math.max(maxLng, lng);
    minLat = Math.min(minLat, lat);
    maxLat = Math.max(maxLat, lat);
  }

  return {
    min: [minLng, minLat],
    max: [maxLng, maxLat],
    center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
  };
}
