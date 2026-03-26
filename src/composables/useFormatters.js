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

  /**
   * Форматирует тип сделки
   */
  function formatDealType(type) {
    const types = {
      sale: 'Продажа',
      rent: 'Аренда',
    };
    return types[type] || type || '—';
  }

  /**
   * Форматирует тип объекта
   */
  function formatPropertyType(type) {
    const types = {
      flat: 'Квартира',
      layout: 'Европланировка',
      house: 'Дом',
      land: 'Участок',
      commercial: 'Коммерческое',
    };
    return types[type] || type || '—';
  }

  return {
    formatPrice,
    formatArea,
    formatNumber,
    formatDealType,
    formatPropertyType,
  };
}
