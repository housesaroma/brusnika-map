import { formatCompactPrice, formatPricePerSqm } from '@/utils/formatters';
import { getFlatStatusLabel, getSourceLabel, formatFlatDate } from '@/utils/flatLabels';

export function buildFlatTableRow(flat) {
  const priceChangePercent = Number(flat?.priceChangePercent);

  return {
    id: flat.id,
    flat,
    address: flat.address || 'Без адреса',
    rooms: flat.rooms,
    area: flat.area,
    floor: flat.floor,
    price: flat.price,
    sqm: flat.sqm,
    priceLabel: formatCompactPrice(flat.price),
    sqmLabel: formatPricePerSqm(flat.sqm),
    sourceLabel: getSourceLabel(flat.source),
    statusLabel: getFlatStatusLabel(flat),
    publishedAt: flat.publishedAt,
    publishedLabel: formatFlatDate(flat.publishedAt),
    priceChangePercent: Number.isFinite(priceChangePercent) ? priceChangePercent : null,
    priceChangeLabel: Number.isFinite(priceChangePercent)
      ? `${priceChangePercent > 0 ? '+' : ''}${priceChangePercent.toFixed(1)}%`
      : '—',
  };
}
