<template>
  <template v-if="mapReady">
    <YandexMapFeature
      v-for="polygon in polygonFeatures"
      :key="polygon.id"
      :settings="polygon.feature"
    />

    <YandexMapFeature v-if="drawingFeature" :settings="drawingFeature" />

    <YandexMapMarker
      v-for="(point, index) in vertexPoints"
      :key="`vertex-${index}-${point[0]}-${point[1]}`"
      :settings="getVertexSettings(index, point)"
    >
      <div
        class="polygon-vertex"
        :class="{
          'polygon-vertex--editing': isEditing,
          'polygon-vertex--drawing': isDrawing,
        }"
        @click.stop="emit('vertex-click', { index, point })"
      ></div>
    </YandexMapMarker>
  </template>
</template>

<script setup>
import { computed } from 'vue';
import { YandexMapFeature, YandexMapMarker } from 'vue-yandex-maps';
import { buildPolygonFeature } from '@/utils/polygons';

const props = defineProps({
  mapReady: {
    type: Boolean,
    default: false,
  },
  polygons: {
    type: Array,
    default: () => [],
  },
  vertexPoints: {
    type: Array,
    default: () => [],
  },
  isDrawing: {
    type: Boolean,
    default: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['vertex-click', 'update-vertex']);

const polygonFeatures = computed(() =>
  props.polygons
    .map((polygon) => {
      const stroke = polygon.selected ? '#2563eb' : '#64748b';
      const fill = polygon.selected ? 'rgba(37, 99, 235, 0.18)' : 'rgba(100, 116, 139, 0.12)';
      const feature = buildPolygonFeature(polygon.points, stroke, fill);
      if (!feature) return null;
      return { id: polygon.id, feature };
    })
    .filter(Boolean)
);

const drawingFeature = computed(() => {
  if (!props.isDrawing) return null;
  return buildPolygonFeature(props.vertexPoints, '#ff001e', 'rgba(255, 0, 30, 0.15)');
});

function getVertexSettings(index, coordinates) {
  return {
    coordinates,
    draggable: true,
    mapFollowsOnDrag: false,
    zIndex: 2200,
    onDragMove: (coords) => {
      if (!Array.isArray(coords) || coords.length !== 2) return;
      emit('update-vertex', { index, coordinates: coords, commit: false });
    },
    onDragEnd: (coords) => {
      if (!Array.isArray(coords) || coords.length !== 2) return;
      emit('update-vertex', { index, coordinates: coords, commit: true });
    },
  };
}
</script>

<style scoped>
.polygon-vertex {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 3px solid #fff;
  background: #ff001e;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.35);
  cursor: grab;
  transform: translate(-50%, -50%);
  transition: transform 0.15s ease;
}

.polygon-vertex--editing {
  width: 18px;
  height: 18px;
  background: #f59e0b;
}

.polygon-vertex--drawing {
  width: 18px;
  height: 18px;
}

.polygon-vertex:active {
  cursor: grabbing;
  transform: translate(-50%, -50%) scale(1.08);
}
</style>
