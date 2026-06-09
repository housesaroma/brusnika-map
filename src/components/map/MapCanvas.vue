<template>
  <div class="map-canvas">
    <div v-if="loading" class="map-canvas__loading">
      <div class="map-canvas__house-loader" aria-hidden="true">
        <div class="map-canvas__house">
          <div class="map-canvas__house-smoke"></div>
          <div class="map-canvas__house-chimney"></div>
          <div class="map-canvas__house-roof"></div>
          <div class="map-canvas__house-body">
            <div class="map-canvas__house-window"></div>
            <div class="map-canvas__house-window"></div>
            <div class="map-canvas__house-door"></div>
          </div>
        </div>
        <div class="map-canvas__house-shadow"></div>
      </div>
      <span class="map-canvas__loading-title">{{ loadingTitle }}</span>
      <span
        v-if="loadingPhase === 'buildings' && Number.isFinite(targetPercent)"
        class="map-canvas__loading-subtitle"
      >
        {{ Math.round(displayPercent) }}%
      </span>
      <div
        v-if="loadingPhase === 'buildings' && Number.isFinite(targetPercent)"
        class="map-canvas__progress"
      >
        <div class="map-canvas__progress-fill" :style="{ width: `${displayPercent}%` }"></div>
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
      :class="{ 'map-canvas__map--drawing': isDrawing || isEditing }"
      :settings="mapSettings"
      width="100%"
      height="100%"
    >
      <YandexMapDefaultSchemeLayer />
      <YandexMapDefaultFeaturesLayer />
      <template v-if="mapReady">
        <YandexMapListener :settings="listenerSettings" />

        <HeatmapLayer v-if="heatMode && !isDrawing" :points="heatPoints" />

        <PolygonEditorLayer
          :map-ready="mapReady"
          :polygons="polygons"
          :vertex-points="vertexPoints"
          :is-drawing="isDrawing"
          :is-editing="isEditing"
          @vertex-click="emit('vertex-click', $event)"
          @update-vertex="emit('update-vertex', $event)"
        />

        <YandexMapClusterer
          v-if="!isDrawing && !isEditing && visibleBuildings.length"
          zoom-on-cluster-click
          :grid-size="64"
          :settings="{ maxZoom: 17 }"
        >
          <YandexMapMarker
            v-for="building in visibleBuildings"
            :key="building.markerKey"
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

        <YandexMapMarker
          v-for="flat in analogFlats"
          :key="flat.id"
          position="top left-center"
          :container-attrs="isDrawing ? { style: { pointerEvents: 'none' } } : undefined"
          :settings="{ coordinates: flat.center }"
        >
          <div class="analog-marker" :class="{ 'analog-marker--disabled': isDrawing }"></div>
        </YandexMapMarker>
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
import { computed, onBeforeUnmount, ref, shallowRef, watch, watchEffect } from 'vue';
import { withBuildingMarkerKeys } from '@/utils/buildings';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapClusterer,
  YandexMapListener,
  YandexMapMarker,
} from 'vue-yandex-maps';
import HeatmapLayer from './HeatmapLayer.vue';
import PolygonEditorLayer from './PolygonEditorLayer.vue';
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
  isEditing: {
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
  flyToTarget: {
    type: Array,
    default: null,
  },
});

const emit = defineEmits([
  'building-click',
  'add-point',
  'map-click',
  'vertex-click',
  'update-vertex',
  'favorites',
  'toggle-drawing',
  'fly-to',
]);

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

watch(
  () => props.flyToTarget,
  (target) => {
    if (!target || !isValidCenter(target)) return;
    flyTo(target, 17);
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
  withBuildingMarkerKeys(props.buildings.filter((building) => isValidCenter(building.center)))
);
const loadingTitle = computed(() => {
  if (props.loadingPhase === 'buildings') return 'Загружаем объекты карты...';
  if (props.loadingPhase === 'polygon') return 'Применяем полигон...';
  if (props.loadingPhase === 'flats') return 'Применяем фильтры квартир...';
  return 'Загрузка объектов...';
});

const targetPercent = computed(() => {
  if (!Number.isFinite(props.loadingPercent)) return null;
  return Math.max(0, Math.min(100, Number(props.loadingPercent)));
});

const displayPercent = ref(0);
let progressRaf = 0;

function stopProgressAnimation() {
  if (progressRaf) {
    cancelAnimationFrame(progressRaf);
    progressRaf = 0;
  }
}

function animateProgressToTarget() {
  stopProgressAnimation();

  const step = () => {
    const target = Number.isFinite(targetPercent.value) ? targetPercent.value : 0;
    const current = Number.isFinite(displayPercent.value) ? displayPercent.value : 0;
    const diff = target - current;

    // Snap for tiny diffs to avoid endless rAF loops.
    if (Math.abs(diff) < 0.2) {
      displayPercent.value = target;
      progressRaf = 0;
      return;
    }

    // Ease-out: quickly catches up but still looks smooth for big jumps.
    displayPercent.value = Math.max(0, Math.min(100, current + diff * 0.14));
    progressRaf = requestAnimationFrame(step);
  };

  progressRaf = requestAnimationFrame(step);
}

watch(
  () => [props.loading, props.loadingPhase],
  ([isLoading, phase]) => {
    if (!isLoading) {
      stopProgressAnimation();
      return;
    }
    if (phase === 'buildings') {
      // Reset visual progress when a fresh buildings load starts.
      if (!Number.isFinite(displayPercent.value) || displayPercent.value <= 0.5) {
        displayPercent.value = 0;
      }
      animateProgressToTarget();
    }
  }
);

watch(
  () => targetPercent.value,
  () => {
    if (!props.loading) return;
    if (props.loadingPhase !== 'buildings') return;
    animateProgressToTarget();
  }
);

onBeforeUnmount(() => {
  stopProgressAnimation();
});

const listenerSettings = computed(() => ({
  onUpdate: (event) => {
    const zoom = event?.location?.zoom;
    if (Number.isFinite(zoom)) currentZoom.value = Math.round(zoom);

    // Сохраняем экземпляр карты глобально для heatmap
    if (map.value) {
      window.yaMapsMapInstance = map.value;
    }
  },
  onClick: (object, event) => {
    const coords = extractCoordinates(event) || extractCoordinates(object);
    if (!coords) return;

    if (props.isDrawing) {
      // Ignore clicks right after enabling drawing (pencil button click on map).
      if (Date.now() - props.drawingEnabledAt < 300) return;
      emit('add-point', coords);
      return;
    }

    if (props.isEditing) return;
    emit('map-click', coords);
  },
}));

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

.map-canvas__house-loader {
  display: grid;
  place-items: center;
  gap: 12px;
}

.map-canvas__house {
  position: relative;
  width: 74px;
  height: 74px;
  transform: translateZ(0);
}

.map-canvas__house-chimney {
  position: absolute;
  right: 20px;
  top: 10px;
  width: 12px;
  height: 16px;
  border-radius: 6px 6px 4px 4px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.18), rgba(15, 23, 42, 0.08));
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.1);
}

.map-canvas__house-smoke {
  position: absolute;
  right: 19px;
  top: -2px;
  width: 14px;
  height: 14px;
  border-radius: 999px;
  background: radial-gradient(circle at 30% 30%, rgba(15, 23, 42, 0.2), rgba(15, 23, 42, 0) 70%);
  filter: blur(0.2px);
  opacity: 0.55;
  animation: house-smoke 1.6s ease-in-out infinite;
}

.map-canvas__house-roof {
  position: absolute;
  left: 50%;
  top: 12px;
  width: 0;
  height: 0;
  transform: translateX(-50%);
  border-left: 34px solid transparent;
  border-right: 34px solid transparent;
  border-bottom: 28px solid #ff001e;
  filter: drop-shadow(0 6px 14px rgba(15, 23, 42, 0.12));
  transform-origin: 50% 100%;
  animation: house-roof-pop 1.4s ease-in-out infinite;
}

.map-canvas__house-roof::after {
  content: '';
  position: absolute;
  left: -28px;
  top: 10px;
  width: 56px;
  height: 18px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.28),
    rgba(255, 255, 255, 0)
  );
  transform: rotate(-12deg);
  opacity: 0.6;
  animation: house-roof-shine 1.4s ease-in-out infinite;
}

.map-canvas__house-body {
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 58px;
  height: 42px;
  transform: translateX(-50%);
  border-radius: 14px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  background:
    repeating-linear-gradient(
      0deg,
      rgba(255, 0, 30, 0.1) 0px,
      rgba(255, 0, 30, 0.1) 1px,
      rgba(255, 255, 255, 0.92) 1px,
      rgba(255, 255, 255, 0.92) 8px
    ),
    repeating-linear-gradient(
      90deg,
      rgba(15, 23, 42, 0.06) 0px,
      rgba(15, 23, 42, 0.06) 1px,
      rgba(255, 255, 255, 0) 1px,
      rgba(255, 255, 255, 0) 12px
    ),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(255, 255, 255, 0.9));
  overflow: hidden;
  box-shadow:
    0 18px 28px rgba(15, 23, 42, 0.1),
    0 2px 0 rgba(255, 255, 255, 0.6) inset;
}

.map-canvas__house-body::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(255, 0, 30, 0.15) 0%,
    rgba(255, 0, 30, 0.15) 40%,
    rgba(255, 0, 30, 0) 55%,
    rgba(255, 0, 30, 0) 100%
  );
  transform: translateX(-100%);
  animation: house-build-scan 1.4s ease-in-out infinite;
}

.map-canvas__house-window {
  position: absolute;
  top: 12px;
  width: 14px;
  height: 14px;
  border-radius: 5px;
  background: linear-gradient(180deg, rgba(59, 130, 246, 0.25), rgba(59, 130, 246, 0.12));
  border: 1px solid rgba(59, 130, 246, 0.26);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.6) inset,
    0 8px 18px rgba(15, 23, 42, 0.06);
}

.map-canvas__house-window::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 5px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0),
    rgba(255, 255, 255, 0.35),
    rgba(255, 255, 255, 0)
  );
  transform: translateX(-120%);
  animation: house-window-shine 1.4s ease-in-out infinite;
}

.map-canvas__house-window:nth-child(1) {
  left: 10px;
}

.map-canvas__house-window:nth-child(2) {
  right: 10px;
}

.map-canvas__house-door {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 14px;
  height: 20px;
  border-radius: 8px 8px 4px 4px;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.1), rgba(15, 23, 42, 0.06));
  border: 1px solid rgba(15, 23, 42, 0.14);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.55) inset;
}

.map-canvas__house-door::after {
  content: '';
  position: absolute;
  right: 3px;
  top: 10px;
  width: 3px;
  height: 3px;
  border-radius: 999px;
  background: rgba(255, 0, 30, 0.85);
  box-shadow: 0 0 0 2px rgba(255, 0, 30, 0.12);
}

.map-canvas__house-shadow {
  width: 70px;
  height: 12px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.1);
  filter: blur(1px);
  animation: house-shadow 1.4s ease-in-out infinite;
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
  transition: width 0.35s ease;
}

@keyframes house-build-scan {
  0% {
    transform: translateX(-100%);
    opacity: 0.9;
  }
  55% {
    transform: translateX(10%);
    opacity: 1;
  }
  100% {
    transform: translateX(110%);
    opacity: 0.9;
  }
}

@keyframes house-roof-pop {
  0%,
  100% {
    transform: translateX(-50%) translateY(0) scale(1);
  }
  50% {
    transform: translateX(-50%) translateY(-1px) scale(1.03);
  }
}

@keyframes house-roof-shine {
  0%,
  100% {
    opacity: 0.45;
    transform: rotate(-12deg) translateX(-2px);
  }
  50% {
    opacity: 0.7;
    transform: rotate(-12deg) translateX(2px);
  }
}

@keyframes house-window-shine {
  0% {
    transform: translateX(-120%);
    opacity: 0;
  }
  35% {
    opacity: 0.25;
  }
  75% {
    opacity: 0.25;
  }
  100% {
    transform: translateX(120%);
    opacity: 0;
  }
}

@keyframes house-smoke {
  0%,
  100% {
    transform: translateY(0) translateX(0) scale(0.95);
    opacity: 0.35;
  }
  50% {
    transform: translateY(-8px) translateX(-4px) scale(1.1);
    opacity: 0.65;
  }
}

@keyframes house-shadow {
  0%,
  100% {
    transform: scaleX(0.92);
    opacity: 0.22;
  }
  50% {
    transform: scaleX(1);
    opacity: 0.3;
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
  min-width: 26px;
  height: 22px;
  border-radius: 999px;
  padding: 0 5px;
  background: #ff001e;
  color: #fff;
  border: 1px solid #fff;
  display: inline-flex;
  align-items: center;
  gap: 3px;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  box-shadow: 0 3px 10px rgba(255, 0, 30, 0.35);
  transform: translate(-50%, -100%);
}

.building-dot i {
  font-size: 10px;
  line-height: 1;
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
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #7f1d1d;
  color: #fff;
  font-weight: 700;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid #fff;
  box-shadow: 0 4px 12px rgba(127, 29, 29, 0.4);
  transform: translate(-50%, -50%);
  cursor: pointer;
}
</style>
