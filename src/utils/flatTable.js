import { formatCompactPrice, formatPricePerSqm } from '@/utils/formatters';
import { getFlatStatusLabel, getSourceLabel, formatFlatDate } from '@/utils/flatLabels';

export function buildFlatTableRow(flat) {
  const priceChangePercent = Number(flat?.priceChangePercent);
  const deviationPercent = Number(flat?.deviationPercent);

  return {
    id: flat.id,
    flat,
    address: flat.address || 'Без адреса',
    district: flat.district || '—',
    polygon: flat.polygon || '—',
    rooms: flat.rooms,
    area: flat.area,
    floor: flat.floor,
    buildYear: flat.buildYear || '—',
    material: flat.material || '—',
    price: flat.price,
    sqm: flat.sqm,
    priceLabel: formatCompactPrice(flat.price),
    sqmLabel: formatPricePerSqm(flat.sqm),
    predictedPrice: flat.predictedPrice,
    predictedPriceLabel: flat.predictedPrice ? formatCompactPrice(flat.predictedPrice) : '—',
    deviationPercent: Number.isFinite(deviationPercent) ? deviationPercent : null,
    deviationLabel: Number.isFinite(deviationPercent)
      ? `${deviationPercent > 0 ? '+' : ''}${deviationPercent.toFixed(1)}%`
      : '—',
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
