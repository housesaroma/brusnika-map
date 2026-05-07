<template>
  <div
    class="property-card"
    :class="{ 'property-card--selected': isSelected }"
    @click="emit('click')"
  >
    <div class="property-card__header">
      <div>
        <p class="property-card__title">{{ flat.rooms }}-комн. · {{ flat.area }} м²</p>
        <p class="property-card__address">
          <i class="pi pi-map-marker"></i>
          {{ flat.address || 'Без адреса' }}
        </p>
      </div>
      <Tag class="property-card__source" severity="secondary">
        {{ sourceLabel }}
      </Tag>
    </div>

    <div class="property-card__meta">
      <span><i class="pi pi-layers"></i> Этаж {{ flat.floor }}</span>
      <span v-if="flat.pricePerSqmLabel">• {{ flat.pricePerSqmLabel }}</span>
    </div>

    <div class="property-card__footer">
      <div>
        <p class="property-card__price">{{ formatCompactPrice(flat.price) }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import Tag from 'primevue/tag';
import { formatCompactPrice } from '@/utils/formatters';

const props = defineProps({
  flat: {
    type: Object,
    required: true,
  },
  isSelected: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['click']);

const sourceLabel = computed(() => {
  const map = {
    cian: 'Циан',
    domclick: 'Домклик',
    avito: 'Авито',
    unknown: 'Источник',
  };
  const source = String(props.flat.source || '')
    .trim()
    .toLowerCase();
  return map[source] || props.flat.source || 'Источник';
});
</script>

<style scoped>
.property-card {
  padding: 14px;
  border-radius: 16px;
  background: var(--app-card);
  border: 1px solid var(--app-border);
  cursor: pointer;
  transition:
    border 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.property-card:hover {
  border-color: rgba(255, 0, 30, 0.4);
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.08);
  transform: translateY(-1px);
}

.property-card--selected {
  border-color: var(--app-primary);
  background: var(--app-accent);
}

.property-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.property-card__title {
  margin: 0;
  font-weight: 600;
  font-size: 0.95rem;
}

.property-card__address {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
  display: flex;
  gap: 4px;
  align-items: center;
}

.property-card__source {
  font-size: 0.65rem;
  padding: 2px 6px;
}

.property-card__meta {
  margin-top: 8px;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
  display: flex;
  gap: 8px;
  align-items: center;
}

.property-card__footer {
  margin-top: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.property-card__price {
  margin: 0;
  font-weight: 700;
  color: var(--app-primary);
}
</style>
