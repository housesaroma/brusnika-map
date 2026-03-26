/**
 * Composable для проверки попадания точки в полигон
 * Использует алгоритм ray casting
 */
export function usePointInPolygon() {
  /**
   * Проверяет, находится ли точка внутри полигона
   * @param {Array<number>} point - Координаты точки [lng, lat]
   * @param {Array<Array<number>>} polygon - Массив координат вершин полигона
   * @returns {boolean}
   */
  function isPointInside(point, polygon) {
    if (!polygon || polygon.length < 4) {
      return false;
    }

    const [x, y] = point;
    let isInside = false;

    for (let i = 0; i < polygon.length - 1; i++) {
      const [x1, y1] = polygon[i];
      const [x2, y2] = polygon[i + 1];

      if (isPointOnSegment(point, [x1, y1], [x2, y2])) {
        return true;
      }

      const intersects = y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;

      if (intersects) {
        isInside = !isInside;
      }
    }

    return isInside;
  }

  /**
   * Проверяет, лежит ли точка на отрезке
   */
  function isPointOnSegment(point, start, end) {
    const [x, y] = point;
    const [x1, y1] = start;
    const [x2, y2] = end;

    const crossProduct = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1);
    if (Math.abs(crossProduct) > 1e-10) {
      return false;
    }

    const dotProduct = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
    if (dotProduct < 0) {
      return false;
    }

    const squaredLength = (x2 - x1) ** 2 + (y2 - y1) ** 2;
    return dotProduct <= squaredLength;
  }

  /**
   * Фильтрует точки, оставляя только те, что внутри полигона
   * @param {Array} items - Массив объектов с координатами в свойстве center
   * @param {Array<Array<number>>} polygon - Полигон
   * @returns {Array}
   */
  function filterItemsInside(items, polygon) {
    return items.filter((item) => isPointInside(item.center, polygon));
  }

  return {
    isPointInside,
    isPointOnSegment,
    filterItemsInside,
  };
}
