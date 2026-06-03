<template>
  <section class="analog-slider">
    <div class="analog-slider__header">
      <h4>Аналоги{{ analogs.length ? ` (${analogs.length})` : '' }}</h4>
      <div v-if="analogs.length" class="analog-slider__buttons">
        <Button icon="pi pi-angle-left" text rounded @click="scroll(-1)" />
        <Button icon="pi pi-angle-right" text rounded @click="scroll(1)" />
      </div>
    </div>

    <div v-if="loading" class="analog-slider__skeleton">
      <div v-for="index in 3" :key="index" class="analog-card analog-card--skeleton">
        <div class="analog-card__header">
          <Skeleton width="120px" height="14px" />
          <Skeleton width="32px" height="18px" border-radius="999px" />
        </div>
        <div class="analog-card__address">
          <Skeleton width="160px" height="12px" />
        </div>
        <div class="analog-card__meta">
          <Skeleton width="140px" height="12px" />
        </div>
        <div class="analog-card__price">
          <Skeleton width="100px" height="16px" />
        </div>
      </div>
    </div>

    <p v-else-if="!analogs.length" class="analog-slider__empty">Аналоги не найдены</p>

    <div v-else ref="scrollRef" class="analog-slider__list">
      <button
        v-for="analog in analogs"
        :key="analog.id"
        type="button"
        class="analog-card"
        @click="emit('select', analog)"
      >
        <div class="analog-card__header">
          <p>{{ analog.rooms }}-комн. · {{ analog.area }} м²</p>
          <Tag v-if="analog.similarity" severity="secondary">
            {{ Math.round(analog.similarity * 100) }}%
          </Tag>
        </div>
        <p class="analog-card__address">
          <i class="pi pi-map-marker"></i>
          {{ analog.address || 'Без адреса' }}
        </p>
        <p class="analog-card__meta">
          <span>Этаж {{ analog.floor }}</span>
          <span v-if="analog.pricePerSqm">• {{ analog.pricePerSqm }}</span>
        </p>
        <p class="analog-card__price">{{ formatCompactPrice(analog.price) }}</p>
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue';
import Button from 'primevue/button';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import { formatCompactPrice } from '@/utils/formatters';

defineProps({
  analogs: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['select']);

const scrollRef = ref(null);

function scroll(direction) {
  if (!scrollRef.value) return;
  scrollRef.value.scrollBy({ left: direction * 260, behavior: 'smooth' });
}
</script>

<style scoped>
.analog-slider {
  margin-top: 16px;
}

.analog-slider__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.analog-slider__header h4 {
  margin: 0;
  font-size: 0.85rem;
}

.analog-slider__buttons {
  display: flex;
  gap: 6px;
}

.analog-slider__list {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-top: 10px;
}

.analog-slider__skeleton {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  padding-bottom: 8px;
  margin-top: 10px;
}

.analog-card--skeleton {
  cursor: default;
  background: rgba(242, 236, 230, 0.35);
}

.analog-slider__empty {
  margin: 10px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.analog-card {
  min-width: 220px;
  max-width: 220px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 12px;
  background: rgba(242, 236, 230, 0.4);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.2s ease;
}

.analog-card:hover {
  border-color: rgba(255, 0, 30, 0.45);
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.1);
  transform: translateY(-1px);
}

.analog-card__hint {
  display: block;
  margin-top: 8px;
  font-size: 0.65rem;
  color: var(--app-primary);
  font-weight: 600;
}

.analog-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 6px;
}

.analog-card__header p {
  margin: 0;
  font-weight: 600;
  font-size: 0.8rem;
}

.analog-card__address {
  margin: 6px 0 0;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
  display: flex;
  gap: 4px;
  align-items: center;
}

.analog-card__meta {
  margin: 6px 0 0;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
}

.analog-card__price {
  margin: 8px 0 0;
  font-weight: 700;
  color: var(--app-primary);
}
</style>
