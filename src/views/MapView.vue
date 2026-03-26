<template>
  <div class="map-view">
    <div class="container">
      <Card>
        <template #header>
          <div class="map-header">
            <h1 class="page-title">Карта объектов</h1>
            <p class="page-subtitle">Визуализация недвижимости на карте Екатеринбурга</p>
          </div>
        </template>
        <template #content>
          <div v-if="loading" class="loading-container">
            <ProgressSpinner style="width: 50px; height: 50px" />
            <p class="text-gray-500 mt-4">Загрузка объектов...</p>
          </div>

          <div v-else-if="error" class="error-container">
            <Message severity="error" :closable="false">
              {{ error }}
            </Message>
          </div>

          <template v-else-if="hasApiKey">
            <YandexMap
              v-model="map"
              :settings="mapSettings"
              width="100%"
              height="600px"
            >
              <YandexMapDefaultSchemeLayer />
              <YandexMapDefaultFeaturesLayer />
              <YandexMapListener :settings="listenerSettings" />

              <!-- Слой с районами -->
              <DistrictsLayer />

              <!-- Маркеры объектов с кластеризацией -->
              <PropertyMarkers
                :properties="propertiesWithCoords"
                :selected-property-id="selectedPropertyId"
                :zoom="currentZoom"
                @property-click="handlePropertyClick"
              />
            </YandexMap>

            <div class="map-info mt-4">
              <Tag severity="info">
                <span>Всего объектов: <b>{{ propertiesWithCoords.length }}</b></span>
              </Tag>
              <Tag severity="secondary" class="ml-2">
                <span>Зум: <b>{{ currentZoom }}</b></span>
              </Tag>
            </div>
          </template>

          <div v-else class="no-api-key">
            <i class="pi pi-exclamation-triangle text-3xl text-yellow-500 mb-3"></i>
            <p class="text-gray-700 font-medium mb-2">API ключ Яндекс Карт не задан</p>
            <p class="text-sm text-gray-500">
              Укажите
              <code class="bg-gray-100 px-2 py-1 rounded">VITE_YANDEX_MAPS_API_KEY</code> в
              <code class="bg-gray-100 px-2 py-1 rounded">.env.local</code>
            </p>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapListener,
} from 'vue-yandex-maps';
import Card from 'primevue/card';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';
import Tag from 'primevue/tag';
import { usePropertiesStore } from '@/stores/properties';
import PropertyMarkers from '@/components/map/PropertyMarkers.vue';
import DistrictsLayer from '@/components/map/DistrictsLayer.vue';

const map = ref(null);
const selectedPropertyId = ref(null);
const currentZoom = ref(11);

const listenerSettings = {
  onUpdate: (e) => {
    if (e?.location?.zoom) {
      currentZoom.value = Math.round(e.location.zoom * 10) / 10;
    }
  },
};

const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
const hasApiKey = Boolean(yandexMapsApiKey);

const propertiesStore = usePropertiesStore();

const loading = computed(() => propertiesStore.loading);
const error = computed(() => propertiesStore.error);
const propertiesWithCoords = computed(() =>
  propertiesStore.items.filter((p) => p.center && p.center.length === 2)
);

const mapSettings = computed(() => ({
  location: {
    center: [60.597465, 56.838011],
    zoom: 11,
  },
}));

onMounted(() => {
  propertiesStore.fetchProperties();
});

function handlePropertyClick(property) {
  selectedPropertyId.value = property.id;
  console.log('Property clicked:', property);
}
</script>

<style>
.map-view {
  padding: 2rem;
}

.map-header {
  padding: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--p-text-color);
}

.page-subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
}

.loading-container,
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
}

.no-api-key {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: var(--p-surface-50);
  border: 2px dashed var(--p-surface-200);
  border-radius: var(--p-card-border-radius);
  text-align: center;
  padding: 2rem;
}

.no-api-key code {
  font-family: monospace;
  font-size: 0.875rem;
}

.map-info {
  display: flex;
  gap: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.ml-2 {
  margin-left: 0.5rem;
}
</style>
