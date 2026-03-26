/**
 * Composable для форматирования значений
 */
export function useFormatters() {
  /**
   * Форматирует цену
   */
  function formatPrice(price) {
    if (!Number.isFinite(price)) {
      return '—';
    }
    return `${Math.round(price).toLocaleString('ru-RU')} ₽`;
  }

  /**
   * Форматирует площадь
   */
  function formatArea(area) {
    if (!Number.isFinite(area)) {
      return '—';
    }
    return `${area.toLocaleString('ru-RU')} м²`;
  }

  /**
   * Форматирует число с разделителями
   */
  function formatNumber(num) {
    if (!Number.isFinite(num)) {
      return '—';
    }
    return num.toLocaleString('ru-RU');
  }

  return {
    formatPrice,
    formatArea,
    formatNumber,
  };
}
