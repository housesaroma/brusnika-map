<template>
  <div class="brusnika-map">
    <yandex-map
      v-if="hasApiKey"
      ref="mapRef"
      v-model="map"
      :settings="mapSettings"
      width="100%"
      height="100%"
    >
      <yandex-map-default-scheme-layer />
      <yandex-map-default-features-layer />

      <yandex-map-listener :settings="listenerSettings" />

      <slot name="features" />
      <slot name="markers" />
    </yandex-map>

    <div v-else class="no-api-key">
      <p>API ключ Яндекс Карт не задан</p>
      <p class="hint">Укажите <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code></p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, shallowRef } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapListener,
} from 'vue-yandex-maps';

const props = defineProps({
  center: {
    type: Array,
    default: () => [60.597465, 56.838011],
  },
  zoom: {
    type: Number,
    default: 11,
  },
  onClick: {
    type: Function,
    default: () => {},
  },
});

const emit = defineEmits(['map-ready', 'zoom-change']);

const mapRef = ref(null);
const map = shallowRef(null);
const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
const hasApiKey = Boolean(yandexMapsApiKey);

const mapSettings = computed(() => ({
  location: {
    center: props.center,
    zoom: props.zoom,
  },
}));

const listenerSettings = {
  onUpdate: (event) => {
    if (event?.location?.zoom) {
      emit('zoom-change', event.location.zoom);
    }
  },
  onClick: (_, mapEvent) => {
    const coordinates =
      mapEvent?.coordinates ||
      mapEvent?.lngLat ||
      mapEvent?.coordPosition ||
      mapEvent?.location?.center ||
      null;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return;
    }

    props.onClick(coordinates);
  },
};

function getMapInstance() {
  return map.value;
}

defineExpose({ getMapInstance });
</script>

<style scoped>
.brusnika-map {
  width: 100%;
  height: 100%;
  min-height: 400px;
  border-radius: 12px;
  overflow: hidden;
}

.no-api-key {
  width: 100%;
  height: 100%;
  min-height: 400px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 1px dashed #ccc;
  border-radius: 12px;
  background: #fafafa;
  color: #666;
}

.hint {
  font-size: 13px;
  color: #999;
}

.hint code {
  background: #f0f0f0;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>
