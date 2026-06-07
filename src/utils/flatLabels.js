export function getFlatStatusLabel(flat) {
  if (!flat) return 'Активна';
  if (flat.unpublishedAt) return 'Снято с публикации';

  const rawStatus = flat.status ?? flat.Status ?? flat.FlatStatus ?? flat.flatStatus;
  const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : rawStatus;

  if (normalized === 3 || normalized === 'продано') return 'Продано';
  if (normalized === 1 || normalized === 'в_архиве' || normalized === 'архив') {
    return 'Снято с публикации';
  }

  return 'Активна';
}

export function getSourceLabel(source) {
  const map = {
    cian: 'Циан',
    domclick: 'Домклик',
    avito: 'Авито',
  };
  const normalized = String(source || '')
    .trim()
    .toLowerCase();
  if (map[normalized]) return map[normalized];
  // По умолчанию возвращаем 'Домклик' для всех источников
  return 'Домклик';
}

export function formatFlatDate(value) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
