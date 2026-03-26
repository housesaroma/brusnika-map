<template>
  <YandexMapFeature
    v-for="(feature, index) in districtsFeatures"
    :key="`district-${index}`"
    :settings="feature"
  />
</template>

<script setup>
import { YandexMapFeature } from 'vue-yandex-maps';
import { ref, onMounted, computed, watch } from 'vue';
import { useDistrictsStore } from '@/stores/districts';

const props = defineProps({
  fillColor: {
    type: String,
    default: 'rgba(21, 101, 192, 0.15)',
  },
  strokeColor: {
    type: String,
    default: '#1565c0',
  },
  strokeWidth: {
    type: Number,
    default: 2,
  },
});

const districtsStore = useDistrictsStore();
const districtsData = ref(null);
const loading = ref(false);
const error = ref('');

onMounted(async () => {
  await loadDistricts();
});

async function loadDistricts() {
  loading.value = true;
  error.value = '';

  try {
    const response = await fetch('/data/districts.geojson');
    if (!response.ok) {
      throw new Error('Failed to load districts GeoJSON');
    }
    districtsData.value = await response.json();
  } catch (err) {
    error.value = err.message;
    console.error('Error loading districts:', err);
  } finally {
    loading.value = false;
  }
}

const districtsFeatures = computed(() => {
  if (!districtsData.value) return [];

  const selectedName = districtsStore.selectedDistrict?.name;

  return districtsData.value.features.map((feature) => {
    const districtName = feature.properties?.name;
    const isSelected = selectedName && districtName === selectedName;

    return {
      geometry: feature.geometry,
      style: {
        fill: isSelected
          ? 'rgba(245, 124, 0, 0.4)' // Оранжевый с прозрачностью 40%
          : props.fillColor,
        stroke: [
          {
            color: isSelected ? '#f57c00' : props.strokeColor,
            width: isSelected ? 3 : props.strokeWidth,
          },
        ],
      },
    };
  });
});
</script>
