import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { propertiesApi } from '@/api/properties';

export const usePropertiesStore = defineStore('properties', () => {
  const items = ref([]);
  const loading = ref(false);
  const error = ref('');
  const filters = ref({
    priceMin: null,
    priceMax: null,
    areaMin: null,
    areaMax: null,
    rooms: null,
    dealType: 'all',
    propertyType: 'all',
  });

  const count = computed(() => items.value.length);

  const filteredItems = computed(() => {
    return items.value.filter((item) => {
      const { priceMin, priceMax, areaMin, areaMax, rooms, dealType, propertyType } = filters.value;

      if (priceMin && item.price < priceMin) return false;
      if (priceMax && item.price > priceMax) return false;
      if (areaMin && item.area < areaMin) return false;
      if (areaMax && item.area > areaMax) return false;
      if (rooms && item.rooms !== rooms) return false;
      if (dealType !== 'all' && item.dealType !== dealType) return false;
      if (propertyType !== 'all' && item.propertyType !== propertyType) return false;

      return true;
    });
  });

  async function fetchProperties() {
    loading.value = true;
    error.value = '';

    try {
      // Симуляция запроса к бэкенду через mock данные
      const data = await propertiesApi.getMockData();
      items.value = normalizeProperties(data.Properties || []);
    } catch (err) {
      error.value = err.message || 'Ошибка загрузки объектов';
      throw err;
    } finally {
      loading.value = false;
    }
  }

  function setFilters(newFilters) {
    filters.value = { ...filters.value, ...newFilters };
  }

  function resetFilters() {
    filters.value = {
      priceMin: null,
      priceMax: null,
      areaMin: null,
      areaMax: null,
      rooms: null,
      dealType: 'all',
      propertyType: 'all',
    };
  }

  function addProperty(property) {
    items.value.push(property);
  }

  function updateProperty(id, updates) {
    const index = items.value.findIndex((item) => item.id === id);
    if (index !== -1) {
      items.value[index] = { ...items.value[index], ...updates };
    }
  }

  function removeProperty(id) {
    items.value = items.value.filter((item) => item.id !== id);
  }

  return {
    items,
    loading,
    error,
    filters,
    count,
    filteredItems,
    fetchProperties,
    setFilters,
    resetFilters,
    addProperty,
    updateProperty,
    removeProperty,
  };
});

/**
 * Нормализует данные из бэкенда во внутренний формат
 */
function normalizeProperties(properties) {
  return properties.map((prop) => ({
    id: prop.Id,
    dealType: prop.DealType,
    propertyType: prop.PropertyType,
    status: prop.Status,
    price: Number(prop.Price) || 0,
    pricePerMeter: Number(prop.PPM) || 0,
    area: Number(prop.Area) || 0,
    rooms: Number(prop.Rooms) || 0,
    floor: Number(prop.Floor) || 0,
    isApart: prop.isApart,
    name: prop.zkName || '',
    endOfBuilding: prop.EndOfBuilding || '',
    address: prop.Address || '',
    center: parseCoords(prop.coords),
    planUrl: prop.planUrl || '',
    url: prop.Url || '',
    description: prop.Description || '',
  }));
}

/**
 * Парсит координаты из строки формата "56,79163 60,608127" в [lng, lat]
 */
function parseCoords(coordsString) {
  if (!coordsString || typeof coordsString !== 'string') {
    return null;
  }

  const parts = coordsString.split(' ').map((s) => parseFloat(s.replace(',', '.')));
  if (parts.length !== 2 || parts.some((p) => isNaN(p))) {
    return null;
  }

  // Формат: "lat lng" -> конвертируем в [lng, lat]
  const [lat, lng] = parts;
  return [lng, lat];
}
