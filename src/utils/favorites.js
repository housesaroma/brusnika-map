import { parseGeoPointString, serializeGeoPoints } from './geo';

export function normalizeFavorite(raw) {
  if (!raw) return null;
  return {
    id: raw.id,
    name: raw.name || 'Избранное',
    filters: raw.filters || null,
    geoPoints: Array.isArray(raw.geoPoints)
      ? raw.geoPoints
      : parseGeoPointString(raw.geoPoints || raw.GeoPoints || ''),
    source: raw.source || 'local',
    serverId: raw.serverId || raw.id || null,
  };
}

export function serializeFavorite(favorite) {
  if (!favorite) return null;
  return {
    id: favorite.id,
    name: favorite.name,
    filters: favorite.filters,
    geoPoints: favorite.geoPoints,
    source: favorite.source,
    serverId: favorite.serverId,
  };
}

export function favoriteToServerPayload(favorite) {
  return {
    color: '#ff001e',
    GeoPoints: serializeGeoPoints(favorite.geoPoints || []),
  };
}
