/**
 * Composable для кластеризации маркеров на карте
 */
export function useMarkerClustering() {
  /**
   * Получает размер ячейки кластеризации для текущего зума
   * 5 уровней кластеризации:
   * - zoom >= 14: без кластеризации (0)
   * - zoom 12-14: слабая кластеризация (0.008)
   * - zoom 10-12: средняя кластеризация (0.03)
   * - zoom 8-10: сильная кластеризация (0.1)
   * - zoom < 8: максимальная кластеризация (0.3)
   */
  function getClusterSize(zoom) {
    if (zoom >= 14) {
      return 0; // Без кластеризации
    }
    if (zoom >= 12) {
      return 0.008; // Слабая кластеризация
    }
    if (zoom >= 10) {
      return 0.03; // Средняя кластеризация
    }
    if (zoom >= 8) {
      return 0.1; // Сильная кластеризация
    }
    return 0.9; // Максимальная кластеризация
  }

  /**
   * Группирует свойства по кластерам
   * @param {Array} properties - Массив объектов с координатами
   * @param {number} cellSize - Размер ячейки кластеризации
   * @returns {Array} - Массив маркеров (кластеры или одиночные объекты)
   */
  function groupMarkers(properties, cellSize) {
    if (!cellSize || cellSize <= 0) {
      // Без кластеризации - возвращаем все объекты
      return properties.map((p) => ({
        type: 'property',
        id: `prop-${p.id}`,
        propertyId: p.id,
        price: p.price,
        center: p.center,
        property: p,
      }));
    }

    // Группируем по ячейкам
    const grouped = new Map();

    for (const property of properties) {
      const [lng, lat] = property.center;
      const gridX = Math.floor(lng / cellSize);
      const gridY = Math.floor(lat / cellSize);
      const key = `${gridX}:${gridY}`;

      const existing = grouped.get(key);

      if (existing) {
        // Если в ячейке уже есть что-то
        if (existing.type === 'cluster') {
          // Добавляем в существующий кластер
          existing.count++;
          existing.properties.push(property);
          // Обновляем центр кластера (средневзвешенное)
          existing.center = [
            (existing.center[0] * (existing.count - 1) + lng) / existing.count,
            (existing.center[1] * (existing.count - 1) + lat) / existing.count,
          ];
        } else {
          // Превращаем одиночный маркер в кластер из 2 объектов
          grouped.set(key, {
            type: 'cluster',
            id: `cluster-${key}`,
            count: 2,
            center: [
              (existing.center[0] + lng) / 2,
              (existing.center[1] + lat) / 2,
            ],
            properties: [existing.property, property],
          });
        }
      } else {
        // Первый объект в ячейке - создаём одиночный маркер
        grouped.set(key, {
          type: 'property',
          id: `prop-${property.id}`,
          propertyId: property.id,
          price: property.price,
          center: property.center,
          property,
        });
      }
    }

    return Array.from(grouped.values());
  }

  return {
    getClusterSize,
    groupMarkers,
  };
}
