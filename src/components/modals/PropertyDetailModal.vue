<template>
  <Dialog v-model:visible="visible" modal class="detail-modal" :style="{ width: '720px' }">
    <template #header>
      <div class="detail-modal__header">
        <h3>Детализация квартиры</h3>
      </div>
    </template>

    <div v-if="flat" class="detail-modal__content">
      <div class="detail-modal__summary">
        <div>
          <p class="detail-modal__address">
            <i class="pi pi-map-marker"></i>
            {{ flat.address || 'Без адреса' }}
          </p>
          <p class="detail-modal__meta">
            {{ flat.rooms }}-комн. · {{ flat.area }} м² · Этаж {{ flat.floor }}
          </p>
          <p class="detail-modal__status">
            <i class="pi pi-calendar"></i>
            {{ statusText }}
          </p>
        </div>
        <Tag severity="secondary">{{ sourceLabel }}</Tag>
      </div>

      <div class="detail-modal__prices">
        <div class="detail-modal__price-card">
          <span>Текущая цена</span>
          <strong>{{ formatCompactPrice(flat.price) }}</strong>
          <small>{{ formatPricePerSqm(flat.sqm) }}</small>
        </div>
        <div class="detail-modal__price-card detail-modal__price-card--accent">
          <span>Прогнозная оценка</span>
          <strong>{{ predictedLabel }}</strong>
          <div v-if="predictionTrend" class="detail-modal__trend" :class="predictionTrendClass">
            <i :class="predictionTrend.icon"></i>
            <small>{{ predictionTrend.label }}</small>
          </div>
          <small v-else>Нет данных</small>
        </div>
      </div>

      <div class="detail-modal__grid">
        <div class="detail-modal__cell">
          <span>Площадь</span>
          <strong>{{ flat.area }} м²</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Комнат</span>
          <strong>{{ flat.rooms }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Этаж</span>
          <strong>{{ flat.floor }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Цена / м²</span>
          <strong>{{ formatPricePerSqm(flat.sqm) }}</strong>
        </div>
      </div>

      <div v-if="loadingPrediction" class="detail-modal__loading">
        <ProgressSpinner style="width: 36px; height: 36px" />
        <p>Получаем прогноз...</p>
      </div>

      <AnalogSlider v-if="analogs.length" :analogs="analogs" />
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import AnalogSlider from './AnalogSlider.vue';
import { formatCompactPrice, formatPricePerSqm } from '@/utils/formatters';

const props = defineProps({
  flat: {
    type: Object,
    default: null,
  },
  prediction: {
    type: Object,
    default: null,
  },
  open: {
    type: Boolean,
    default: false,
  },
  loadingPrediction: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close']);

const visible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const sourceLabel = computed(() => {
  const map = { cian: 'Циан', domclick: 'Домклик', avito: 'Авито' };
  const source = String(props.flat?.source || '')
    .trim()
    .toLowerCase();
  return map[source] || props.flat?.source || 'Источник';
});

const predictedLabel = computed(() => {
  if (!props.prediction?.predictedPrice) return '—';
  return formatCompactPrice(props.prediction.predictedPrice);
});

const predictionTrend = computed(() => {
  if (!props.prediction) return null;
  const deviation = props.prediction.deviationPercent;
  if (!Number.isFinite(deviation) || deviation === 0) return null;
  const isUp = deviation > 0;
  return {
    isUp,
    label: `${isUp ? '+' : ''}${deviation.toFixed(1)}%`,
    icon: isUp ? 'pi pi-arrow-up-right' : 'pi pi-arrow-down-right',
  };
});

const predictionTrendClass = computed(() => {
  if (!predictionTrend.value) return '';
  return predictionTrend.value.isUp ? 'detail-modal__trend--up' : 'detail-modal__trend--down';
});

const statusText = computed(() => {
  const publishedAt = toDate(props.flat?.publishedAt);
  const dateLabel = publishedAt ? formatDate(publishedAt) : 'Дата не указана';
  return `Опубликовано ${dateLabel} · ${getStatusLabel(props.flat)}`;
});

const analogs = computed(() => {
  const list = props.prediction?.similarFlats || [];
  return list.map((item) => ({
    id: item.flatId || item.FlatId || item.id,
    rooms: item.rooms || item.Rooms || 0,
    area: item.area || item.Area || 0,
    floor: item.floor || item.Floor || 0,
    price: item.price || item.Price || 0,
    similarity: item.similarityScore || item.SimilarityScore || 0,
    address: item.address || item.Address || 'Без адреса',
    pricePerSqm: formatPricePerSqm(item.pricePerSqm || item.PricePerSqm || 0),
  }));
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
.detail-modal__header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.detail-modal__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-modal__summary {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.detail-modal__address {
  margin: 0;
  font-size: 0.85rem;
  display: flex;
  gap: 4px;
  align-items: center;
}

.detail-modal__meta {
  margin: 6px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.detail-modal__status {
  margin: 6px 0 0;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
  display: inline-flex;
  gap: 6px;
  align-items: center;
}

.detail-modal__prices {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-modal__price-card {
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: rgba(242, 236, 230, 0.4);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-modal__price-card strong {
  font-size: 1.2rem;
}

.detail-modal__price-card--accent {
  border-color: rgba(255, 0, 30, 0.25);
  background: rgba(255, 0, 30, 0.06);
}

.detail-modal__trend {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.detail-modal__trend small {
  font-weight: 600;
}

.detail-modal__trend--up {
  color: #047857;
}

.detail-modal__trend--down {
  color: #b91c1c;
}

.detail-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.detail-modal__cell {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid var(--app-border);
  background: rgba(248, 243, 236, 0.4);
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.detail-modal__cell span {
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
}

.detail-modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--app-muted-foreground);
}
</style>
