<template>
  <yandex-map-feature :settings="featureSettings" />
</template>

<script setup>
import { computed } from 'vue';
import { YandexMapFeature } from 'vue-yandex-maps';

const props = defineProps({
  coordinates: {
    type: Array,
    required: true,
  },
  fillColor: {
    type: String,
    default: 'rgba(25, 118, 210, 0.2)',
  },
  strokeColor: {
    type: String,
    default: '#1976d2',
  },
  strokeWidth: {
    type: Number,
    default: 3,
  },
  isClosed: {
    type: Boolean,
    default: true,
  },
});

const polygonCoordinates = computed(() => {
  if (!props.coordinates.length) return [];

  const points = [...props.coordinates];

  if (props.isClosed) {
    const first = points[0];
    const last = points[points.length - 1];

    if (first[0] !== last[0] || first[1] !== last[1]) {
      points.push([...first]);
    }
  }

  return points;
});

const featureSettings = computed(() => ({
  geometry: {
    type: 'Polygon',
    coordinates: [polygonCoordinates.value],
  },
  style: {
    fill: props.fillColor,
    stroke: [{ color: props.strokeColor, width: props.strokeWidth }],
  },
}));
</script>
