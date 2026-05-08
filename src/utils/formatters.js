export function formatCompactPrice(value) {
  if (!Number.isFinite(value)) return '—';
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} млн ₽`;
  }
  if (value >= 1_000) {
    return `${Math.round(value / 1_000)} тыс ₽`;
  }
  return `${Math.round(value)} ₽`;
}

export function formatPricePerSqm(value) {
  if (!Number.isFinite(value)) return '—';
  return `${Math.round(value).toLocaleString('ru-RU')} ₽/м²`;
}
