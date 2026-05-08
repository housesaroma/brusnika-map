<template>
  <yandex-map-marker :settings="{ coordinates: coordinates }" position="top left-center">
    <div
      class="property-marker"
      :class="markerClasses"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
      @click.stop="handleClick"
    >
      <span class="property-marker__label">{{ label }}</span>

      <article v-if="isHovered && tooltipData" class="marker-tooltip">
        <p class="marker-tooltip__address">{{ tooltipData.address }}</p>
        <p class="marker-tooltip__meta">{{ tooltipData.meta }}</p>
        <img
          v-if="tooltipData.imageUrl"
          :src="tooltipData.imageUrl"
          :alt="tooltipData.alt || 'Изображение'"
          class="marker-tooltip__image"
        />
      </article>
    </div>
  </yandex-map-marker>
</template>

<script setup>
import { computed, ref } from 'vue';
import { YandexMapMarker } from 'vue-yandex-maps';

const props = defineProps({
  id: {
    type: String,
    required: true,
  },
  coordinates: {
    type: Array,
    required: true,
  },
  label: {
    type: String,
    default: '',
  },
  kind: {
    type: String,
    default: 'property',
    validator: (value) => ['property', 'building', 'cluster'].includes(value),
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
  isInZone: {
    type: Boolean,
    default: false,
  },
  isInDistrict: {
    type: Boolean,
    default: true,
  },
  tooltipData: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['click', 'mouseenter', 'mouseleave']);

const isHovered = ref(false);

const markerClasses = computed(() => ({
  'property-marker--selected': props.isSelected,
  'property-marker--inside': props.isInZone,
  'property-marker--count': props.kind !== 'property',
  'property-marker--cluster': props.kind === 'cluster',
  'property-marker--outside-district': !props.isInDistrict,
}));

function handleMouseEnter() {
  isHovered.value = true;
  emit('mouseenter', props.id);
}

function handleMouseLeave() {
  isHovered.value = false;
  emit('mouseleave', props.id);
}

function handleClick() {
  emit('click', props.id);
}
</script>

<style scoped>
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
}

.property-marker--inside {
  border-color: #2e7d32;
}

.property-marker--outside-district {
  opacity: 0.2;
}

.property-marker--selected {
  border-color: #f57c00;
  box-shadow: 0 4px 14px rgba(245, 124, 0, 0.35);
}

.property-marker--count {
  min-width: 48px;
}

.property-marker--cluster {
  background: #1565c0;
  border-color: #1565c0;
}

.property-marker--cluster .property-marker__label {
  color: #fff;
}

.property-marker__label {
  font-size: 11px;
  font-weight: 700;
  color: #2d2d2d;
  white-space: nowrap;
}

.marker-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  width: 220px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  padding: 8px;
  z-index: 5;
}

.marker-tooltip__address {
  margin: 0;
  font-size: 12px;
  color: #333;
}

.marker-tooltip__meta {
  margin: 6px 0;
  font-size: 12px;
  color: #555;
}

.marker-tooltip__image {
  display: block;
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 6px;
}
</style>
