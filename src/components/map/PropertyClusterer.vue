<template>
  <YandexMapClusterer
    :settings="{
      clusterDisableClickZoom: true,
      clusterGridSize: 64,
    }"
  >
    <template #data>
      <template v-for="property in properties" :key="property.id">
        <YandexMapMarker
          :settings="{
            coordinates: property.center,
            userData: property,
          }"
        />
      </template>
    </template>

    <template #marker="{ coordinates, userData, onClick }">
      <YandexMapMarker :settings="{ coordinates }" @click="onClick">
        <div class="property-marker">
          <span class="property-marker__price">{{ formatPrice(userData.price) }}</span>
        </div>
      </YandexMapMarker>
    </template>

    <template #cluster="{ coordinates, count, onClick }">
      <YandexMapMarker :settings="{ coordinates }" @click="onClick">
        <div class="cluster-marker">
          {{ count }}
        </div>
      </YandexMapMarker>
    </template>
  </YandexMapClusterer>
</template>

<script setup>
import {
  YandexMapClusterer,
  YandexMapMarker,
} from 'vue-yandex-maps';
import { useFormatters } from '@/composables/useFormatters';

const props = defineProps({
  properties: {
    type: Array,
    default: () => [],
  },
  selectedPropertyId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['property-click']);

const { formatPrice } = useFormatters();
</script>

<style>
.property-marker {
  position: relative;
  transform: translate(-50%, -100%);
  background: #ffffff;
  border: 1px solid #d94444;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  cursor: pointer;
  min-width: 78px;
  text-align: center;
  transition: all 0.2s;
  white-space: nowrap;
}

.property-marker--selected {
  border-color: #f57c00;
  box-shadow: 0 4px 14px rgba(245, 124, 0, 0.35);
}

.property-marker__price {
  font-size: 11px;
  font-weight: 700;
  color: #2d2d2d;
}

.cluster-marker {
  width: 40px;
  height: 40px;
  background: #1565c0;
  border-radius: 50%;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
}

.cluster-marker:hover {
  background: #0d47a1;
}
</style>
