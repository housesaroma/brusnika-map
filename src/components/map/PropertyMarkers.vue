<template>
  <YandexMapMarker
    v-for="marker in visibleMarkers"
    :key="`${marker.id}-z${zoom}`"
    :settings="{ coordinates: marker.center }"
  >
    <div
      v-if="marker.type === 'cluster'"
      class="cluster-marker"
      :class="{ 'cluster-marker--faded': isDistrictSelected && !marker.isInDistrict }"
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
      :is-in-district="marker.isInDistrict"
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
import { usePointInPolygon } from '@/composables/usePointInPolygon';
import { useDistrictsStore } from '@/stores/districts';
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

const districtsStore = useDistrictsStore();
const { formatPrice } = useFormatters();
const { groupMarkers, getClusterSize } = useMarkerClustering();
const { isPointInDistrict } = usePointInPolygon();

const selectedDistrict = computed(() => districtsStore.selectedDistrict);
const isDistrictSelected = computed(() => !!selectedDistrict.value);

// Вычисляем видимые маркеры с кластеризацией
// Пересчитываем при изменении зума или свойств
const visibleMarkers = computed(() => {
  const clusterSize = getClusterSize(props.zoom);
  const markers = groupMarkers(props.properties, clusterSize);

  // Добавляем отформатированные данные для каждого маркера
  return markers.map((marker) => {
    if (marker.type === 'property') {
      const isInDistrict = isDistrictSelected.value
        ? isPointInDistrict(marker.property.center, selectedDistrict.value.feature)
        : true;

      return {
        ...marker,
        formattedPrice: formatPrice(marker.price),
        tooltipData: {
          address: marker.property.address || '',
          meta: `${marker.property.area} м² • ${marker.property.rooms} комн. • ${formatPrice(marker.price)}`,
          imageUrl: marker.property.planUrl || '',
          alt: marker.property.name || marker.property.address,
        },
        isInDistrict,
      };
    }
    // Для кластеров тоже проверяем принадлежность к району
    if (marker.type === 'cluster') {
      const isInDistrict = isDistrictSelected.value
        ? isPointInDistrict(marker.center, selectedDistrict.value.feature)
        : true;
      return {
        ...marker,
        isInDistrict,
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
  transition: opacity 0.2s;
}

.cluster-marker:hover {
  background: #0d47a1;
}

.cluster-marker--faded {
  opacity: 0.2;
}
</style>
