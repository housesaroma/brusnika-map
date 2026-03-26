import { ref, computed } from 'vue';

/**
 * Composable для кластеризации маркеров на карте
 */
export function useMarkerClustering() {
  const zoom = ref(11);

  /**
   * Определяет режим отображения маркеров в зависимости от зума
   */
  const displayMode = computed(() => {
    if (zoom.value >= 14) {
      return 'price'; // Показывать отдельные маркеры с ценой
    }
    if (zoom.value >= 12) {
      return 'building'; // Группировать по зданиям
    }
    return 'cluster'; // Кластеризация по областям
  });

  /**
   * Получает размер ячейки кластеризации для текущего зума
   */
  function getClusterCellSize(currentZoom) {
    if (currentZoom <= 9.5) {
      return 0.25;
    }
    if (currentZoom <= 10.5) {
      return 0.14;
    }
    if (currentZoom <= 11.5) {
      return 0.08;
    }
    return 0.04;
  }

  /**
   * Получает ключ здания для группировки
   */
  function getBuildingKey(property) {
    const rawAddress = property.address || property.addressQuery || '';
    const normalizedAddress = rawAddress.trim().toLowerCase();
    if (normalizedAddress) {
      return normalizedAddress;
    }
    return `${property.center[0].toFixed(5)}:${property.center[1].toFixed(5)}`;
  }

  /**
   * Группирует свойства по зданиям
   */
  function groupByBuilding(properties) {
    const grouped = new Map();

    for (const property of properties) {
      const key = getBuildingKey(property);
      const existing = grouped.get(key);

      if (existing) {
        existing.properties.push(property);
        existing.sumLng += property.center[0];
        existing.sumLat += property.center[1];
      } else {
        grouped.set(key, {
          key,
          properties: [property],
          sumLng: property.center[0],
          sumLat: property.center[1],
        });
      }
    }

    return Array.from(grouped.values()).map((group) => ({
      id: `building-${group.key}`,
      kind: 'building',
      count: group.properties.length,
      propertyIds: group.properties.map((p) => p.id),
      center: [group.sumLng / group.properties.length, group.sumLat / group.properties.length],
    }));
  }

  /**
   * Создает кластеры для текущего уровня зума
   */
  function createClusters(buildingMarkers, currentZoom) {
    if (!buildingMarkers.length) {
      return [];
    }

    // Полный кластер для малого зума
    if (currentZoom <= 8.5) {
      const totalCount = buildingMarkers.reduce((sum, m) => sum + m.count, 0);
      const sumLng = buildingMarkers.reduce((sum, m) => sum + m.center[0] * m.count, 0);
      const sumLat = buildingMarkers.reduce((sum, m) => sum + m.center[1] * m.count, 0);

      return [
        {
          id: 'cluster-all',
          kind: 'cluster',
          count: totalCount,
          propertyIds: buildingMarkers.flatMap((m) => m.propertyIds),
          center: [sumLng / totalCount, sumLat / totalCount],
        },
      ];
    }

    // Кластеризация по ячейкам
    const cellSize = getClusterCellSize(currentZoom);
    const grouped = new Map();

    for (const marker of buildingMarkers) {
      const [lng, lat] = marker.center;
      const gridX = Math.floor(lng / cellSize);
      const gridY = Math.floor(lat / cellSize);
      const key = `${gridX}:${gridY}`;
      const existing = grouped.get(key);

      if (existing) {
        existing.markers.push(marker);
        existing.sumLng += lng * marker.count;
        existing.sumLat += lat * marker.count;
        existing.count += marker.count;
        existing.propertyIds.push(...marker.propertyIds);
      } else {
        grouped.set(key, {
          key,
          markers: [marker],
          sumLng: lng * marker.count,
          sumLat: lat * marker.count,
          count: marker.count,
          propertyIds: [...marker.propertyIds],
        });
      }
    }

    return Array.from(grouped.values()).map((group) => ({
      id: `cluster-${group.key}`,
      kind: 'cluster',
      count: group.count,
      propertyIds: group.propertyIds,
      center: [group.sumLng / group.count, group.sumLat / group.count],
    }));
  }

  function setZoom(newZoom) {
    zoom.value = newZoom;
  }

  return {
    zoom,
    displayMode,
    setZoom,
    getClusterCellSize,
    getBuildingKey,
    groupByBuilding,
    createClusters,
  };
}
