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

    <div class="property-card__status">
      <i class="pi pi-calendar"></i>
      <span>{{ statusText }}</span>
    </div>

    <div class="property-card__footer">
      <div>
        <p class="property-card__price">{{ formatCompactPrice(flat.price) }}</p>
        <p v-if="prediction?.predictedPrice" class="property-card__prediction">
          Прогноз: {{ formatCompactPrice(prediction.predictedPrice) }}
        </p>
      </div>
      <div v-if="priceChange" class="property-card__change" :class="priceChangeClass">
        <i :class="priceChange.icon"></i>
        <span>{{ priceChange.label }}</span>
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
  prediction: {
    type: Object,
    default: null,
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

const statusText = computed(() => {
  const publishedAt = toDate(props.flat?.publishedAt);
  const dateLabel = publishedAt ? formatDate(publishedAt) : 'Дата не указана';
  return `Опубликовано ${dateLabel} · ${getStatusLabel(props.flat)}`;
});

const priceChange = computed(() => {
  const raw = Number(props.flat?.priceChangePercent);
  if (!Number.isFinite(raw) || raw === 0) return null;
  const isUp = raw > 0;
  return {
    isUp,
    label: `${isUp ? '+' : ''}${raw.toFixed(1)}%`,
    icon: isUp ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right',
  };
});

const priceChangeClass = computed(() => {
  if (!priceChange.value) return '';
  return priceChange.value.isUp ? 'property-card__change--up' : 'property-card__change--down';
});

function getStatusLabel(flat) {
  if (!flat) return 'Активна';
  if (flat.unpublishedAt) return 'Снято с публикации';

  const rawStatus = flat.status ?? flat.Status ?? flat.FlatStatus ?? flat.flatStatus;
  const normalized = typeof rawStatus === 'string' ? rawStatus.trim().toLowerCase() : rawStatus;

  if (normalized === 3 || normalized === 'продано') return 'Продано';
  if (normalized === 1 || normalized === 'в_архиве' || normalized === 'архив') {
    return 'Снято с публикации';
  }

  return 'Активна';
}

function toDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDate(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
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

.property-card__status {
  margin-top: 8px;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
  display: flex;
  gap: 6px;
  align-items: center;
}

.property-card__price {
  margin: 0;
  font-weight: 700;
  color: var(--app-primary);
}

.property-card__prediction {
  margin: 2px 0 0;
  font-size: 0.75rem;
  font-weight: 600;
  color: #047857;
}

.property-card__change {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 600;
}

.property-card__change--up {
  background: rgba(16, 185, 129, 0.12);
  color: #047857;
}

.property-card__change--down {
  background: rgba(239, 68, 68, 0.12);
  color: #b91c1c;
}
</style>
