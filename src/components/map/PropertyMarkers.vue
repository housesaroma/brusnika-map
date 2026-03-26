<template>
  <YandexMapMarker
    v-for="marker in visibleMarkers"
    :key="`${marker.id}-z${zoom}`"
    :settings="{ coordinates: marker.center }"
  >
    <div
      v-if="marker.type === 'cluster'"
      class="cluster-marker"
      @click="handleClusterClick(marker)"
    >
      {{ marker.count }}
    </div>
    <div
      v-else
      class="property-marker"
      :class="{ 'property-marker--selected': selectedPropertyId === marker.propertyId }"
      @click="handlePropertyClick(marker.property)"
    >
      <span class="property-marker__price">{{ formatPrice(marker.price) }}</span>
    </div>
  </YandexMapMarker>
</template>

<script setup>
import { computed } from 'vue';
import { YandexMapMarker } from 'vue-yandex-maps';
import { useFormatters } from '@/composables/useFormatters';
import { useMarkerClustering } from '@/composables/useMarkerClustering';

const props = defineProps({
  properties: {
    type: Array,
    default: () => [],
  },
  selectedPropertyId: {
    type: String,
    default: null,
  },
  zoom: {
    type: Number,
    default: 11,
  },
});

const emit = defineEmits(['property-click']);

const { formatPrice } = useFormatters();
const { groupMarkers, getClusterSize } = useMarkerClustering();

// Вычисляем видимые маркеры с кластеризацией
// Пересчитываем при изменении зума или свойств
const visibleMarkers = computed(() => {
  const clusterSize = getClusterSize(props.zoom);
  return groupMarkers(props.properties, clusterSize);
});

function handleClusterClick(cluster) {
  // При клике на кластер можно зумить карту
  console.log('Cluster click:', cluster);
}

function handlePropertyClick(property) {
  emit('property-click', property);
}
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
