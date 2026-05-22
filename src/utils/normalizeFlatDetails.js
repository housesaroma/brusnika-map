import { getSourceLabel } from '@/utils/flatLabels';

function formatLabel(value) {
  if (!value || typeof value !== 'string') return '—';
  return value.replaceAll('_', ' ').replace(/\s+/g, ' ').trim();
}

function parseBuildYear(raw) {
  if (!raw) return null;
  const date = raw instanceof Date ? raw : new Date(raw);
  if (!Number.isNaN(date.getTime())) return date.getFullYear();
  const year = Number(String(raw).slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

export function normalizeFlatDetails(data) {
  if (!data) return null;

  const price = Number(data.price ?? data.Price ?? 0);
  const area = Number(data.area ?? data.Area ?? 0);
  const kitchenArea = Number(data.kitchenArea ?? data.KitchenArea ?? 0);

  return {
    address: data.address ?? data.Address ?? '',
    price,
    area,
    floor: Number(data.floor ?? data.Floor ?? 0),
    rooms: Number(data.rooms ?? data.Rooms ?? 0),
    kitchenArea: Number.isFinite(kitchenArea) ? kitchenArea : 0,
    metro: data.metro ?? data.Metro ?? null,
    buildYear: parseBuildYear(data.buildYear ?? data.BuildYear),
    material: formatLabel(data.material ?? data.Material),
    hasBalcony: Boolean(data.hasBalkony ?? data.hasBalcony ?? data.HasBalcony ?? false),
    publicationDate: data.publicationDate ?? data.PublicationDate ?? data.publishedAt ?? null,
    source: data.source ?? data.Source ?? '',
    sourceLabel: getSourceLabel(data.source ?? data.Source),
    finishing: formatLabel(data.finishing ?? data.Finishing),
    sqm: area > 0 && price > 0 ? price / area : 0,
  };
}
