<template>
  <YandexMapMarker
    v-for="point in points"
    :key="point.id"
    :settings="{ coordinates: point.coordinates }"
  >
    <div class="heatmap-dot" :style="getDotStyle(point)" />
  </YandexMapMarker>
</template>

<script setup>
import { YandexMapMarker } from 'vue-yandex-maps';
import { heatColorFromValue } from '@/utils/heatmap';

defineProps({
  points: {
    type: Array,
    default: () => [],
  },
});

function getDotStyle(point) {
  const size = 24 + Math.round(point.value * 70);
  const color = heatColorFromValue(point.value);
  return {
    width: `${size}px`,
    height: `${size}px`,
    background: `radial-gradient(circle at center, ${color} 0%, rgba(255, 255, 255, 0) 70%)`,
    transform: 'translate(-50%, -50%)',
  };
}
</script>

<style scoped>
.heatmap-dot {
  border-radius: 50%;
  pointer-events: none;
  filter: blur(0.5px);
  mix-blend-mode: multiply;
}
</style>
