<template>
  <div class="map-canvas">
    <div v-if="!hasApiKey" class="map-canvas__no-key">
      <i class="pi pi-exclamation-triangle map-canvas__no-key-icon"></i>
      <p class="map-canvas__no-key-title">API ключ Яндекс Карт не задан</p>
      <p class="map-canvas__no-key-text">
        Укажите <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code>
      </p>
    </div>

    <YandexMap
      v-else
      v-model="map"
      class="map-canvas__map"
      :settings="mapSettings"
      width="100%"
      height="100%"
    >
      <YandexMapDefaultSchemeLayer />
      <YandexMapDefaultFeaturesLayer />
      <YandexMapListener :settings="listenerSettings" />

      <HeatmapLayer v-if="heatMode" :points="heatPoints" />

      <YandexMapMarker
        v-for="building in visibleBuildings"
        :key="building.id"
        :settings="{ coordinates: building.center }"
      >
        <button
          type="button"
          class="building-marker"
          :class="{ 'building-marker--active': building.id === selectedBuildingId }"
          @click.stop="() => emit('building-click', building)"
        >
          <i class="pi pi-building building-marker__icon"></i>
          <span>{{ building.flatCount }}</span>
        </button>
      </YandexMapMarker>

      <YandexMapMarker
        v-for="flat in analogFlats"
        :key="flat.id"
        :settings="{ coordinates: flat.center }"
      >
        <div class="analog-marker"></div>
      </YandexMapMarker>

      <YandexMapFeature v-if="savedFeature" :settings="savedFeature" />
      <YandexMapFeature v-if="drawingFeature" :settings="drawingFeature" />
    </YandexMap>

    <FloatControls
      class="map-canvas__float-controls"
      :is-drawing="isDrawing"
      @favorites="emit('favorites')"
      @toggle-drawing="emit('toggle-drawing')"
      @zoom-in="handleZoomIn"
      @zoom-out="handleZoomOut"
    />
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapListener,
  YandexMapMarker,
  YandexMapFeature,
} from 'vue-yandex-maps';
import HeatmapLayer from './HeatmapLayer.vue';
import FloatControls from '../toolbar/FloatControls.vue';
import { isValidCenter } from '@/utils/geo';

const props = defineProps({
  center: {
    type: Array,
    required: true,
  },
  zoom: {
    type: Number,
    default: 12,
  },
  buildings: {
    type: Array,
    default: () => [],
  },
  selectedBuildingId: {
    type: String,
    default: null,
  },
  analogFlats: {
    type: Array,
    default: () => [],
  },
  isDrawing: {
    type: Boolean,
    default: false,
  },
  polygonPoints: {
    type: Array,
    default: () => [],
  },
  savedPolygon: {
    type: Array,
    default: () => [],
  },
  drawingEnabledAt: {
    type: Number,
    default: 0,
  },
  heatMode: {
    type: String,
    default: null,
  },
  heatPoints: {
    type: Array,
    default: () => [],
  },
  searchTarget: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['building-click', 'add-point', 'favorites', 'toggle-drawing']);

const map = ref(null);
const hasApiKey = computed(() => Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY));
const fallbackCenter = [37.617635, 55.755814];
const mapLocation = ref({
  center: isValidCenter(props.center) ? props.center : fallbackCenter,
  zoom: props.zoom,
});

watch(
  () => props.center,
  (next) => {
    if (isValidCenter(next)) {
      mapLocation.value = { ...mapLocation.value, center: next };
    }
  }
);

watch(
  () => props.searchTarget,
  (target) => {
    if (!target?.coordinates || !isValidCenter(target.coordinates)) return;
    flyTo(target.coordinates, 16);
  }
);

const mapSettings = computed(() => ({
  location: mapLocation.value,
  zoomRange: [3, 20],
}));

const visibleBuildings = computed(() =>
  props.buildings.filter((building) => isValidCenter(building.center))
);

const drawingFeature = computed(() =>
  buildPolygonFeature(props.polygonPoints, '#ff001e', 'rgba(255, 0, 30, 0.15)')
);

const savedFeature = computed(() =>
  buildPolygonFeature(props.savedPolygon, '#3b82f6', 'rgba(59, 130, 246, 0.12)')
);

const listenerSettings = {
  onUpdate: (event) => {
    const zoom = event?.location?.zoom;
    if (Number.isFinite(zoom)) {
      mapLocation.value = {
        ...mapLocation.value,
        zoom: Math.round(zoom),
      };
    }
  },
  onClick: (event) => {
    if (!props.isDrawing) return;
    if (Date.now() - props.drawingEnabledAt < 300) return;
    const coords = extractCoordinates(event);
    if (coords) {
      emit('add-point', coords);
    }
  },
};

function extractCoordinates(event) {
  if (Array.isArray(event?.coordinates)) return event.coordinates;
  if (Array.isArray(event?.location?.coordinates)) return event.location.coordinates;
  if (Array.isArray(event?.lngLat)) return event.lngLat;
  return null;
}

function flyTo(center, zoom) {
  mapLocation.value = {
    center,
    zoom,
  };
  if (map.value?.setLocation) {
    map.value.setLocation({ center, zoom, duration: 1000 });
  }
}

function handleZoomIn() {
  const nextZoom = Math.min(20, (mapLocation.value.zoom || 12) + 1);
  flyTo(mapLocation.value.center, nextZoom);
}

function handleZoomOut() {
  const nextZoom = Math.max(3, (mapLocation.value.zoom || 12) - 1);
  flyTo(mapLocation.value.center, nextZoom);
}

function buildPolygonFeature(points, strokeColor, fillColor) {
  if (!Array.isArray(points) || points.length < 3) return null;
  const closed = [...points];
  const [firstLng, firstLat] = closed[0];
  const [lastLng, lastLat] = closed[closed.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    closed.push([firstLng, firstLat]);
  }

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [closed],
    },
    style: {
      fill: fillColor,
      stroke: [{ color: strokeColor, width: 2 }],
    },
  };
}
</script>

<style scoped>
.map-canvas {
  position: relative;
  width: 100%;
  height: 100%;
  border-radius: var(--app-radius-lg);
  overflow: hidden;
  background: var(--app-card);
}

.map-canvas__map {
  width: 100%;
  height: 100%;
}

.map-canvas__no-key {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2rem;
  background: var(--app-card);
  border: 2px dashed var(--app-border);
}

.map-canvas__no-key-icon {
  font-size: 2rem;
  color: #f59e0b;
  margin-bottom: 0.75rem;
}

.map-canvas__no-key-title {
  font-weight: 600;
  margin: 0 0 0.25rem;
}

.map-canvas__no-key-text {
  margin: 0;
  color: var(--app-muted-foreground);
  font-size: 0.875rem;
}

.map-canvas__float-controls {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  z-index: 5;
}

.building-marker {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: var(--app-primary);
  color: var(--app-primary-contrast);
  border: 2px solid #ffffff;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.2);
  cursor: pointer;
}

.building-marker__icon {
  font-size: 12px;
}

.building-marker--active {
  background: #1e293b;
}

.analog-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: #3b82f6;
  border: 2px solid #ffffff;
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.3);
  transform: translate(-50%, -50%);
}

code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  background: #f1f5f9;
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>
