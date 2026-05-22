import { getPolygonBBox, isValidCenter } from '@/utils/geo';

export function createPolygonId(prefix = 'poly') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function closeRing(points) {
  if (!Array.isArray(points) || points.length < 3) return null;
  const ring = points.map(([lng, lat]) => [Number(lng), Number(lat)]);
  const [firstLng, firstLat] = ring[0];
  const [lastLng, lastLat] = ring[ring.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    ring.push([firstLng, firstLat]);
  }
  return ring;
}

export function simplifyRing(points, maxPoints = 120) {
  if (!Array.isArray(points) || points.length <= maxPoints) return points;
  const step = Math.ceil(points.length / maxPoints);
  const simplified = points.filter((_, index) => index % step === 0);
  if (simplified.length < 3) return points.slice(0, maxPoints);
  return simplified;
}

export function ringFromGeoJsonGeometry(geometry) {
  if (!geometry) return [];

  if (geometry.type === 'Polygon') {
    const ring = geometry.coordinates?.[0] || [];
    return ringToLngLat(ring);
  }

  if (geometry.type === 'MultiPolygon') {
    const ring = geometry.coordinates?.[0]?.[0] || [];
    return ringToLngLat(ring);
  }

  return [];
}

function ringToLngLat(ring) {
  if (!Array.isArray(ring) || ring.length < 3) return [];
  return ring
    .map((coord) => {
      const lng = Number(coord[0]);
      const lat = Number(coord[1]);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return [lng, lat];
    })
    .filter(Boolean);
}

export function boundedByToRing(boundedBy) {
  const envelope = boundedBy?.Envelope || boundedBy?.envelope;
  if (!envelope) return [];

  const lower = envelope.lowerCorner || envelope.LowerCorner;
  const upper = envelope.upperCorner || envelope.UpperCorner;
  if (!lower || !upper) return [];

  const [lng1, lat1] = String(lower).split(' ').map(Number);
  const [lng2, lat2] = String(upper).split(' ').map(Number);
  if (![lng1, lat1, lng2, lat2].every(Number.isFinite)) return [];

  return [
    [lng1, lat1],
    [lng2, lat1],
    [lng2, lat2],
    [lng1, lat2],
  ];
}

export function isPointInCityBBox(point, center, radiusDeg = 0.45) {
  if (!isValidCenter(point) || !isValidCenter(center)) return true;
  const [lng, lat] = point;
  const [cityLng, cityLat] = center;
  return Math.abs(lng - cityLng) <= radiusDeg && Math.abs(lat - cityLat) <= radiusDeg;
}

export function filterDistrictFeaturesByCity(features, cityCenter) {
  if (!Array.isArray(features) || !isValidCenter(cityCenter)) return features || [];
  const bbox = getPolygonBBox([
    [cityCenter[0] - 0.5, cityCenter[1] - 0.5],
    [cityCenter[0] + 0.5, cityCenter[1] + 0.5],
  ]);
  if (!bbox) return features;

  return features.filter((feature) => {
    const ring = ringFromGeoJsonGeometry(feature.geometry);
    if (!ring.length) return false;
    const featureBBox = getPolygonBBox(ring);
    if (!featureBBox) return false;
    return !(
      featureBBox.max[0] < bbox.min[0] ||
      featureBBox.min[0] > bbox.max[0] ||
      featureBBox.max[1] < bbox.min[1] ||
      featureBBox.min[1] > bbox.max[1]
    );
  });
}

export function buildPolygonFeature(points, strokeColor, fillColor) {
  const closed = closeRing(points);
  if (!closed) return null;

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [closed],
    },
    style: {
      fill: fillColor,
      stroke: [{ color: strokeColor, width: 2 }],
    },
  };
}
