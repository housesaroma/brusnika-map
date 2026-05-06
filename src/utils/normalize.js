import { parseCoordsToLngLat } from './geo';
import { formatPricePerSqm } from './formatters';

export function normalizeBuilding(building) {
  const geoPoint = building.GeoPoint || building.geoPoint || '';
  const center = parseCoordsToLngLat(geoPoint);
  const coordKey = normalizeCoordKey(geoPoint);
  return {
    id: building.BuildingId || building.buildingId || building.id,
    address: building.Address || building.address || 'Без адреса',
    flatCount: Number(building.FlatsCount || building.flatsCount || 0),
    yearBuilt: building.YearBuild || building.yearBuild || null,
    center,
    geoPoint,
    coordKey,
  };
}

export function normalizeFlat(flat, buildingMeta = {}) {
  const coordsRaw = flat.coords || flat.Coords || flat.GeoPoint || flat.geoPoint || '';
  const coordKey = normalizeCoordKey(coordsRaw);
  return {
    id: flat.Id || flat.id,
    area: Number(flat.area ?? flat.Area ?? 0),
    rooms: Number(flat.rooms ?? flat.Rooms ?? 0),
    floor: Number(flat.floor ?? flat.Floor ?? 0),
    price: Number(flat.Price ?? flat.price ?? 0),
    sqm: Number(flat.SQM ?? flat.sqm ?? flat.PricePerSqm ?? 0),
    source: flat.Source || flat.source || 'unknown',
    pictureUrl: flat.PictureUrl || flat.pictureUrl || '',
    coords: coordsRaw,
    center: parseCoordsToLngLat(coordsRaw),
    coordKey,
    address: buildingMeta.address || flat.address || 'Без адреса',
    buildingId: buildingMeta.id || flat.buildingId || null,
    pricePerSqmLabel: formatPricePerSqm(Number(flat.SQM ?? flat.sqm ?? flat.PricePerSqm ?? 0)),
  };
}

function normalizeCoordKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replaceAll(',', '.').replaceAll(/\s+/g, ' ').trim();
}
