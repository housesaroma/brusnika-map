<template>
  <YandexMapFeature
    v-for="(feature, index) in districtsFeatures"
    :key="`district-${index}`"
    :settings="feature"
  />
</template>

<script setup>
import { YandexMapFeature } from 'vue-yandex-maps';
import { ref, onMounted, computed } from 'vue';

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

  return districtsData.value.features.map((feature) => ({
    geometry: feature.geometry,
    style: {
      fill: props.fillColor,
      stroke: [{ color: props.strokeColor, width: props.strokeWidth }],
    },
  }));
});
</script>
