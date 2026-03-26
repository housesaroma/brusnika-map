import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

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
      // TODO: API call to backend
      // const response = await apiClient.get('/properties');
      // items.value = response.data;
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
