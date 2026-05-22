export function getBuildingMarkerKey(building, index = 0) {
  const id = building?.id ?? 'building';
  if (building?.coordKey) return `${id}::${building.coordKey}`;
  if (Array.isArray(building?.center) && building.center.length === 2) {
    const [lng, lat] = building.center;
    return `${id}::${lng},${lat}`;
  }
  return `${id}::${index}`;
}

/** Сливает дубликаты зданий (один id + одна точка) из ответа API. */
export function dedupeBuildings(buildings) {
  if (!Array.isArray(buildings)) return [];

  const merged = new Map();

  for (const building of buildings) {
    const key = getBuildingMarkerKey(building);
    const existing = merged.get(key);

    if (!existing) {
      merged.set(key, { ...building });
      continue;
    }

    const prevCount = Number(existing.flatCount) || 0;
    const nextCount = Number(building.flatCount) || 0;
    existing.flatCount = Math.max(prevCount, nextCount);
  }

  return [...merged.values()];
}

export function withBuildingMarkerKeys(buildings) {
  if (!Array.isArray(buildings)) return [];

  const used = new Set();

  return buildings.map((building, index) => {
    const baseKey = getBuildingMarkerKey(building, index);
    let markerKey = baseKey;
    let suffix = 0;

    while (used.has(markerKey)) {
      suffix += 1;
      markerKey = `${baseKey}#${suffix}`;
    }

    used.add(markerKey);

    return {
      ...building,
      markerKey,
    };
  });
}
