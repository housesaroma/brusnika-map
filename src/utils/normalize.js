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
    yearBuilt: building.YearBuild ?? building.yearBuild ?? null,
    center,
    geoPoint,
    coordKey,
  };
}

function normalizeCoordKey(raw) {
  if (!raw || typeof raw !== 'string') return '';
  return raw.replaceAll(',', '.').replaceAll(/\s+/g, ' ').trim();
}

function isValidDate(raw) {
  if (!raw) return false;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(date.getTime())) return false;
  // Проверяем, что дата не является дефолтной (01.01.0001)
  const year = date.getFullYear();
  return year >= 1970;
}

export function normalizeFlat(flat, buildingMeta = {}) {
  const coordsRaw = flat.coords || flat.Coords || flat.GeoPoint || flat.geoPoint || '';
  const coordKey = normalizeCoordKey(coordsRaw);
  const rawSource =
    flat.Source ||
    flat.source ||
    flat.SourceName ||
    flat.sourceName ||
    flat.Parser ||
    flat.parser ||
    flat.Platform ||
    flat.platform ||
    '';
  // По умолчанию используем 'domclick' для всех источников
  const source = rawSource || 'domclick';
  
  const rawPublishedAt =
    flat.PublishedAt ??
    flat.publishedAt ??
    flat.FlatPublished ??
    flat.flatPublished ??
    flat.publishedDate ??
    null;
  const publishedAt = isValidDate(rawPublishedAt) ? rawPublishedAt : null;
  
  const rawUnpublishedAt =
    flat.UnpublishedAt ??
    flat.unpublishedAt ??
    flat.FlatUnpublished ??
    flat.flatUnpublished ??
    flat.unpublishedDate ??
    null;
  const unpublishedAt = isValidDate(rawUnpublishedAt) ? rawUnpublishedAt : null;
  
  return {
    id: flat.Id || flat.id,
    area: Number(flat.area ?? flat.Area ?? 0),
    rooms: Number(flat.rooms ?? flat.Rooms ?? 0),
    floor: Number(flat.floor ?? flat.Floor ?? 0),
    price: Number(flat.Price ?? flat.price ?? 0),
    sqm: Number(flat.SQM ?? flat.sqm ?? flat.PricePerSqm ?? 0),
    source,
    status:
      flat.Status ?? flat.status ?? flat.FlatStatus ?? flat.flatStatus ?? flat.statusCode ?? null,
    publishedAt,
    unpublishedAt,
    priceChangePercent:
      flat.PriceChangePercent ??
      flat.priceChangePercent ??
      flat.priceChangePct ??
      flat.priceChange ??
      null,
    pictureUrl: flat.PictureUrl || flat.pictureUrl || '',
    coords: coordsRaw,
    center: parseCoordsToLngLat(coordsRaw),
    coordKey,
    address: buildingMeta.address || flat.address || 'Без адреса',
    buildingId: buildingMeta.id || flat.buildingId || null,
    pricePerSqmLabel: formatPricePerSqm(Number(flat.SQM ?? flat.sqm ?? flat.PricePerSqm ?? 0)),
    // Новые поля для таблицы
    buildYear: flat.BuildYear ?? flat.buildYear ?? null,
    material: flat.Material ?? flat.material ?? null,
    polygon: flat.Polygon ?? flat.polygon ?? null,
    predictedPrice: flat.PredictedPrice ?? flat.predictedPrice ?? null,
    deviationPercent: flat.DeviationPercent ?? flat.deviationPercent ?? null,
  };
}
