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
    <PropertyMarker
      v-else
      :id="String(marker.propertyId)"
      :coordinates="marker.center"
      :label="marker.formattedPrice"
      kind="property"
      :is-selected="selectedPropertyId === marker.propertyId"
      :tooltip-data="marker.tooltipData"
      @click="handlePropertyClick(marker.property)"
    />
  </YandexMapMarker>
</template>

<script setup>
import { computed } from 'vue';
import { YandexMapMarker } from 'vue-yandex-maps';
import { useFormatters } from '@/composables/useFormatters';
import { useMarkerClustering } from '@/composables/useMarkerClustering';
import PropertyMarker from './PropertyMarker.vue';

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
  const markers = groupMarkers(props.properties, clusterSize);

  // Добавляем отформатированные данные для каждого маркера
  return markers.map((marker) => {
    if (marker.type === 'property') {
      return {
        ...marker,
        formattedPrice: formatPrice(marker.price),
        tooltipData: {
          address: marker.property.address || '',
          meta: `${marker.property.area} м² • ${marker.property.rooms} комн. • ${formatPrice(marker.price)}`,
          imageUrl: marker.property.planUrl || '',
          alt: marker.property.name || marker.property.address,
        },
      };
    }
    return marker;
  });
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
