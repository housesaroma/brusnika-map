<template>
  <yandex-map
    v-if="hasApiKey"
    v-model="map"
    :settings="settings"
    width="100%"
    height="500px"
  >
    <yandex-map-default-scheme-layer />
    <yandex-map-default-features-layer />
    <yandex-map-marker :settings="marker" position="top-left" />
  </yandex-map>
  <div v-else class="map-placeholder">
    Укажите <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code>, чтобы загрузить карту.
  </div>
</template>

<script setup>
import { shallowRef } from 'vue';
import { YandexMap, YandexMapDefaultSchemeLayer, YandexMapDefaultFeaturesLayer, YandexMapMarker } from 'vue-yandex-maps';

const map = shallowRef(null);
const hasApiKey = Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY);
const settings = {
  location: {
    center: [37.617698, 55.755864], // Москва [lng, lat]
    zoom: 10,
  },
};
const marker = {
  coordinates: [37.617698, 55.755864],
};
</script>

<style scoped>
.map-placeholder {
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
  border: 1px dashed #c8c8c8;
  border-radius: 8px;
  color: #444;
  background: #fafafa;
}
</style>
