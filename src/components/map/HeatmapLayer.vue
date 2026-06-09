<template>
  <div v-if="points.length > 0" class="heatmap-container">
    <YandexMapMarker
      v-for="point in points"
      :key="point.id"
      :settings="{ coordinates: point.coordinates }"
    >
      <div class="heatmap-point" :style="getPointStyle(point)"></div>
    </YandexMapMarker>
  </div>
</template>

<script setup>
import { watch } from 'vue';
import { YandexMapMarker } from 'vue-yandex-maps';

const props = defineProps({
  points: {
    type: Array,
    default: () => [],
  },
});

function getPointStyle(point) {
  const size = 80 + point.value * 120; // Размер от 80px до 200px
  const color = getHeatColor(point.value);

  return {
    width: `${size}px`,
    height: `${size}px`,
    background: color,
    borderRadius: '50%',
    transform: 'translate(-50%, -50%)',
  };
}

function getHeatColor(value) {
  // Нормализуем значение от 0 до 1
  value = Math.max(0, Math.min(1, value));

  const hue = (1 - value) * 240; // От синего (240) до красного (0)
  return `hsla(${hue}, 100%, 50%, 0.4)`;
}

watch(
  () => props.points,
  (newPoints) => {
    console.warn('[HeatmapLayer] Points:', newPoints.length);
  },
  { deep: true }
);
</script>

<style scoped>
.heatmap-container {
  pointer-events: none;
}

.heatmap-point {
  filter: blur(12px);
  mix-blend-mode: screen;
  opacity: 0.7;
}
</style>
