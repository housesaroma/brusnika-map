<template>
  <div class="brusnika-map">
    <Card v-if="!hasApiKey">
      <template #content>
        <div class="no-api-key">
          <i class="pi pi-exclamation-triangle text-3xl text-yellow-500 mb-3"></i>
          <p class="text-gray-700 font-medium mb-2">API ключ Яндекс Карт не задан</p>
          <p class="text-sm text-gray-500">
            Укажите <code class="bg-gray-100 px-2 py-1 rounded">VITE_YANDEX_MAPS_API_KEY</code> в
            <code class="bg-gray-100 px-2 py-1 rounded">.env.local</code>
          </p>
        </div>
      </template>
    </Card>

    <div v-else ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import Card from 'primevue/card';

const mapContainer = ref(null);
const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
const hasApiKey = Boolean(yandexMapsApiKey);

onMounted(() => {
  if (hasApiKey && mapContainer.value) {
    initMap();
  }
});

function initMap() {
  // Инициализация карты будет реализована позже
  // Пока заглушка для будущего функционала
}
</script>

<style>
.brusnika-map {
  width: 100%;
  height: 100%;
  min-height: 500px;
}

.map-container {
  width: 100%;
  height: 600px;
  border-radius: var(--p-card-border-radius);
  overflow: hidden;
  border: 1px solid var(--p-surface-200);
}

.no-api-key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}

.no-api-key code {
  font-family: monospace;
  font-size: 0.875rem;
}
</style>
