<template>
  <div class="map-canvas">
    <div v-if="loading" class="map-canvas__loading">
      <div class="map-canvas__spinner"></div>
      <span class="map-canvas__loading-title">{{ loadingTitle }}</span>
      <span
        v-if="loadingPhase === 'buildings' && loadingTotal > 0"
        class="map-canvas__loading-subtitle"
      >
        {{ loadingLoaded }} / {{ loadingTotal }}
      </span>
      <div
        v-if="loadingPhase === 'buildings' && Number.isFinite(loadingPercent)"
        class="map-canvas__progress"
      >
        <div class="map-canvas__progress-fill" :style="{ width: `${loadingPercent}%` }"></div>
      </div>
    </div>

    <div v-if="!hasApiKey" class="map-canvas__no-key">
      <i class="pi pi-exclamation-triangle map-canvas__no-key-icon"></i>
      <p class="map-canvas__no-key-title">API ключ Яндекс Карт не задан</p>
      <p class="map-canvas__no-key-text">
        Укажите <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code>
      </p>
    </div>

    <YandexMap
      v-else-if="canRenderMap"
      v-model="map"
      class="map-canvas__map"
      :class="{ 'map-canvas__map--drawing': isDrawing }"
      :settings="mapSettings"
      width="100%"
      height="100%"
    >
      <YandexMapDefaultSchemeLayer />
      <YandexMapDefaultFeaturesLayer />
      <template v-if="mapReady">
        <YandexMapListener :settings="listenerSettings" />

        <HeatmapLayer v-if="heatMode" :points="heatPoints" />

        <YandexMapClusterer
          v-if="!isDrawing"
          zoom-on-cluster-click
          :grid-size="64"
          :settings="{ maxZoom: 17 }"
        >
          <YandexMapMarker
            v-for="building in visibleBuildings"
            :key="building.id"
            :settings="{ coordinates: building.center }"
            @click="emit('building-click', building)"
          >
            <div class="building-dot">
              <i class="pi pi-building"></i>
              <span>{{ building.flatCount || 0 }}</span>
            </div>
          </YandexMapMarker>

          <template #cluster="{ length }">
            <div class="cluster-marker">{{ length }}</div>
          </template>
        </YandexMapClusterer>

        <template v-else>
          <YandexMapMarker
            v-for="building in visibleBuildings"
            :key="building.id"
            :container-attrs="{ style: { pointerEvents: 'none' } }"
            :settings="{ coordinates: building.center }"
          >
            <div class="building-dot building-dot--disabled">
              <i class="pi pi-building"></i>
              <span>{{ building.flatCount || 0 }}</span>
            </div>
          </YandexMapMarker>
        </template>

        <YandexMapMarker
          v-for="flat in analogFlats"
          :key="flat.id"
          position="top left-center"
          :container-attrs="isDrawing ? { style: { pointerEvents: 'none' } } : undefined"
          :settings="{ coordinates: flat.center }"
        >
          <div class="analog-marker" :class="{ 'analog-marker--disabled': isDrawing }"></div>
        </YandexMapMarker>

        <YandexMapFeature v-if="savedFeature" :settings="savedFeature" />
        <YandexMapFeature v-if="drawingFeature" :settings="drawingFeature" />
      </template>
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
import { computed, ref, shallowRef, watch, watchEffect } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapClusterer,
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
    default: null,
  },
  zoom: {
    type: Number,
    default: 12,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  loadingPhase: {
    type: String,
    default: null,
  },
  loadingPercent: {
    type: Number,
    default: null,
  },
  loadingLoaded: {
    type: Number,
    default: 0,
  },
  loadingTotal: {
    type: Number,
    default: 0,
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

// vue-yandex-maps expects v-model value to be stored in shallowRef
const map = shallowRef(null);
const hasApiKey = computed(() => Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY));
const canRenderMap = computed(() => hasApiKey.value && isValidCenter(safeCenter.value));
const mapReady = computed(() => Boolean(map.value));
const fallbackCenter = [37.617635, 55.755814];
const mapLocation = ref({
  center: isValidCenter(props.center) ? props.center : fallbackCenter,
  zoom: props.zoom,
});
// Zoom value for UI controls.
// We keep it separate to avoid re-render loops triggered by `YandexMapListener.onUpdate`.
const currentZoom = ref(props.zoom);

watch(
  () => props.center,
  (next) => {
    if (isValidCenter(next)) {
      mapLocation.value = { ...mapLocation.value, center: next };
    } else if (!isValidCenter(mapLocation.value.center)) {
      mapLocation.value = { ...mapLocation.value, center: fallbackCenter };
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

const safeCenter = computed(() => {
  const center = isValidCenter(mapLocation.value.center)
    ? mapLocation.value.center
    : fallbackCenter;
  // Ensure a plain array of finite numbers (no reactive proxies).
  return [Number(center[0]), Number(center[1])];
});

const safeZoom = computed(() => {
  const zoom = Number.isFinite(mapLocation.value.zoom) ? mapLocation.value.zoom : props.zoom;
  return Number.isFinite(zoom) ? zoom : 12;
});

const mapSettings = shallowRef({
  location: { center: fallbackCenter, zoom: 12 },
  zoomRange: { min: 3, max: 20 },
});

watchEffect(() => {
  if (!isValidCenter(safeCenter.value)) {
    console.error('[MapCanvas] Invalid center', {
      propsCenter: props.center,
      mapLocation: mapLocation.value,
      safeCenter: safeCenter.value,
    });
  }
  mapSettings.value = {
    location: { center: safeCenter.value, zoom: safeZoom.value },
    zoomRange: { min: 3, max: 20 },
  };
});

const visibleBuildings = computed(() =>
  props.buildings.filter((building) => isValidCenter(building.center))
);
const loadingTitle = computed(() => {
  if (props.loadingPhase === 'buildings') return 'Загружаем объекты карты...';
  if (props.loadingPhase === 'polygon') return 'Применяем полигон...';
  if (props.loadingPhase === 'flats') return 'Применяем фильтры квартир...';
  return 'Загрузка объектов...';
});

const drawingFeature = computed(() =>
  buildPolygonFeature(props.polygonPoints, '#ff001e', 'rgba(255, 0, 30, 0.15)')
);

const savedFeature = computed(() =>
  buildPolygonFeature(props.savedPolygon, '#3b82f6', 'rgba(59, 130, 246, 0.12)')
);

const listenerSettings = {
  onUpdate: (event) => {
    const zoom = event?.location?.zoom;
    if (Number.isFinite(zoom)) currentZoom.value = Math.round(zoom);
  },
  onClick: (object, event) => {
    if (!props.isDrawing) return;
    const coords = extractCoordinates(event) || extractCoordinates(object);
    if (coords) {
      emit('add-point', coords);
    }
  },
};

function extractCoordinates(event) {
  if (Array.isArray(event?.coordinates)) return event.coordinates;
  if (Array.isArray(event?.location?.coordinates)) return event.location.coordinates;
  if (Array.isArray(event?.lngLat)) return event.lngLat;
  if (Array.isArray(event?.object?.coordinates)) return event.object.coordinates;
  if (Array.isArray(event?.detail?.coordinates)) return event.detail.coordinates;
  if (Array.isArray(event?.sourceEvent?.coordinates)) return event.sourceEvent.coordinates;
  if (Array.isArray(event?.data?.coordinates)) return event.data.coordinates;
  return null;
}

function flyTo(center, zoom) {
  if (!isValidCenter(center)) return;
  mapLocation.value = {
    center,
    zoom,
  };
  currentZoom.value = zoom;
  if (map.value?.setLocation) {
    map.value.setLocation({ center, zoom, duration: 1000 });
  }
}

function handleZoomIn() {
  const nextZoom = Math.min(20, (currentZoom.value || mapLocation.value.zoom || 12) + 1);
  flyTo(mapLocation.value.center, nextZoom);
}

function handleZoomOut() {
  const nextZoom = Math.max(3, (currentZoom.value || mapLocation.value.zoom || 12) - 1);
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

.map-canvas__loading {
  position: absolute;
  inset: 0;
  z-index: 20;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(2px);
  color: #0f172a;
  font-size: 14px;
  font-weight: 600;
}

.map-canvas__loading-title {
  font-size: 14px;
  font-weight: 700;
}

.map-canvas__loading-subtitle {
  font-size: 12px;
  opacity: 0.8;
}

.map-canvas__spinner {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: 3px solid rgba(15, 23, 42, 0.2);
  border-top-color: #ff001e;
  animation: map-spin 0.8s linear infinite;
}

.map-canvas__progress {
  width: min(280px, 70%);
  height: 8px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.15);
  overflow: hidden;
}

.map-canvas__progress-fill {
  height: 100%;
  background: #ff001e;
  transition: width 0.2s ease;
}

@keyframes map-spin {
  to {
    transform: rotate(360deg);
  }
}

.map-canvas__map {
  width: 100%;
  height: 100%;
}

.map-canvas__map--drawing {
  cursor: crosshair;
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

code {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New',
    monospace;
  background: #f1f5f9;
  padding: 0 0.25rem;
  border-radius: 4px;
}
</style>

<style>
.building-dot {
  min-width: 38px;
  height: 32px;
  border-radius: 999px;
  padding: 0 10px;
  background: #ff001e;
  color: #fff;
  border: 2px solid #fff;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 18px rgba(255, 0, 30, 0.4);
  transform: translate(-50%, -100%);
}

.building-dot--disabled,
.cluster-marker--disabled,
.analog-marker--disabled {
  pointer-events: none;
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

.cluster-marker {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #7f1d1d;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid #fff;
  box-shadow: 0 8px 20px rgba(127, 29, 29, 0.45);
  transform: translate(-50%, -50%);
  cursor: pointer;
}
</style>
