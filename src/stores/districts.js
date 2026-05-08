import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useDistrictsStore = defineStore('districts', () => {
  const districts = ref([]);
  const loading = ref(false);
  const error = ref('');
  const selectedDistrict = ref(null);

  const count = computed(() => districts.value.length);

  const districtsWithStats = computed(() => {
    return districts.value.map((district) => ({
      ...district,
      isActive: selectedDistrict.value?.name === district.name,
    }));
  });

  async function loadDistricts() {
    loading.value = true;
    error.value = '';

    try {
      const response = await fetch('/data/districts.geojson');
      if (!response.ok) {
        throw new Error('Failed to load districts GeoJSON');
      }
      const data = await response.json();

      // Извлекаем уникальные районы из GeoJSON
      const uniqueDistricts = new Map();
      data.features.forEach((feature) => {
        const name = feature.properties?.name;
        if (name && !uniqueDistricts.has(name)) {
          uniqueDistricts.set(name, {
            id: feature.properties['@id'] || `district-${name}`,
            name,
            feature,
          });
        }
      });

      districts.value = Array.from(uniqueDistricts.values()).sort((a, b) =>
        a.name.localeCompare(b.name)
      );
    } catch (err) {
      error.value = err.message;
      console.error('Error loading districts:', err);
    } finally {
      loading.value = false;
    }
  }

  function selectDistrict(district) {
    selectedDistrict.value = district;
  }

  function clearSelection() {
    selectedDistrict.value = null;
  }

  return {
    districts,
    loading,
    error,
    selectedDistrict,
    count,
    districtsWithStats,
    loadDistricts,
    selectDistrict,
    clearSelection,
  };
});
