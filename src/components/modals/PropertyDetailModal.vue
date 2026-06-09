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
            {{ display.address || 'Без адреса' }}
          </p>
          <p class="detail-modal__meta">
            {{ display.rooms }}-комн. · {{ display.area }} м² · Этаж {{ display.floor }}
          </p>
          <p class="detail-modal__status">
            <i class="pi pi-calendar"></i>
            {{ statusText }}
          </p>
        </div>
        <Tag severity="secondary">{{ display.sourceLabel }}</Tag>
      </div>

      <div class="detail-modal__prices">
        <div class="detail-modal__price-card">
          <span>Текущая цена</span>
          <strong>{{ formatCompactPrice(display.price) }}</strong>
          <small>{{ formatPricePerSqm(display.sqm) }}</small>
        </div>
        <div class="detail-modal__price-card" :class="predictionCardClass">
          <span>Прогнозная оценка</span>
          <strong>{{ predictedLabel }}</strong>
          <div v-if="predictionTrend" class="detail-modal__trend" :class="predictionTrendClass">
            <i :class="predictionTrend.icon"></i>
            <small>{{ predictionTrend.label }}</small>
          </div>
          <Skeleton v-else-if="loadingPrediction" width="120px" height="12px" />
          <small v-else>Нет данных</small>
        </div>
      </div>

      <div v-if="loadingDetails" class="detail-modal__grid detail-modal__grid--skeleton">
        <div v-for="index in 9" :key="index" class="detail-modal__cell">
          <Skeleton width="90px" height="12px" />
          <Skeleton width="140px" height="18px" />
        </div>
      </div>

      <div v-else class="detail-modal__grid">
        <div class="detail-modal__cell">
          <span>Площадь</span>
          <strong>{{ display.area }} м²</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Комнат</span>
          <strong>{{ display.rooms }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Этаж</span>
          <strong>{{ display.floor }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Кухня</span>
          <strong>{{ kitchenLabel }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Год постройки</span>
          <strong>{{ display.buildYear ?? '—' }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Материал</span>
          <strong>{{ display.material || '—' }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Отделка</span>
          <strong>{{ display.finishing || '—' }}</strong>
        </div>
        <div class="detail-modal__cell">
          <span>Балкон</span>
          <strong>{{ display.hasBalcony ? 'Есть' : 'Нет' }}</strong>
        </div>
        <div class="detail-modal__cell detail-modal__cell--wide">
          <span>Метро</span>
          <strong>{{ metroLabel }}</strong>
        </div>
      </div>

      <div v-if="prediction?.recommendation" class="detail-modal__recommendation">
        <div class="detail-modal__recommendation-icon">
          <i class="pi pi-info-circle"></i>
        </div>
        <div class="detail-modal__recommendation-body">
          <span>Рекомендация системы</span>
          <p>{{ prediction.recommendation }}</p>
          <small v-if="prediction.status">{{ prediction.status }}</small>
        </div>
      </div>

      <AnalogSlider
        :analogs="analogs"
        :loading="loadingAnalogs"
        @select="emit('select-analog', $event)"
      />

      <div class="detail-modal__actions">
        <Button
          label="Показать на карте"
          icon="pi pi-map-marker"
          @click="emit('show-on-map', flat)"
          class="custom-map-button"
        />
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue';
import Dialog from 'primevue/dialog';
import Tag from 'primevue/tag';
import Skeleton from 'primevue/skeleton';
import AnalogSlider from './AnalogSlider.vue';
import { formatCompactPrice, formatPricePerSqm } from '@/utils/formatters';
import { getFlatStatusLabel, getSourceLabel, formatFlatDate } from '@/utils/flatLabels';

const props = defineProps({
  flat: {
    type: Object,
    default: null,
  },
  flatDetails: {
    type: Object,
    default: null,
  },
  closestMetro: {
    type: Array,
    default: () => [],
  },
  loadingDetails: {
    type: Boolean,
    default: false,
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
  analogs: {
    type: Array,
    default: () => [],
  },
  loadingAnalogs: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'select-analog', 'show-on-map']);

const visible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const display = computed(() => {
  const base = props.flat || {};
  const details = props.flatDetails || {};
  const price = details.price ?? base.price ?? 0;
  const area = details.area ?? base.area ?? 0;

  return {
    address: details.address || base.address || '',
    price,
    area,
    floor: details.floor ?? base.floor ?? 0,
    rooms: details.rooms ?? base.rooms ?? 0,
    kitchenArea: details.kitchenArea ?? 0,
    buildYear: details.buildYear ?? null,
    material: details.material ?? '',
    hasBalcony: details.hasBalcony ?? false,
    finishing: details.finishing ?? '',
    publicationDate: details.publicationDate ?? base.publishedAt ?? null,
    source: details.source || base.source || '',
    sourceLabel: details.sourceLabel || getSourceLabel(details.source || base.source),
    metro: details.metro ?? null,
    sqm: details.sqm ?? base.sqm ?? (area > 0 && price > 0 ? price / area : 0),
  };
});

const kitchenLabel = computed(() => {
  const value = display.value.kitchenArea;
  if (!Number.isFinite(value) || value <= 0) return '—';
  return `${value} м²`;
});

const metroLabel = computed(() => {
  if (display.value.metro) return display.value.metro;
  if (!props.closestMetro?.length) return '—';
  return props.closestMetro
    .map((station) => {
      if (station.distanceKm != null) {
        return `${station.name} (${station.distanceKm.toFixed(1)} км)`;
      }
      return station.name;
    })
    .join(' · ');
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

const predictionCardClass = computed(() => {
  if (!props.prediction?.deviationPercent) return '';
  const deviation = props.prediction.deviationPercent;
  if (!Number.isFinite(deviation)) return '';
  // Если прогноз выше фактической цены (deviation > 0) — зеленый
  if (deviation > 0) return 'detail-modal__price-card--good';
  // Если прогноз ниже фактической цены (deviation < 0) — красный (как сейчас accent)
  return 'detail-modal__price-card--accent';
});

const statusText = computed(() => {
  const publishedAt = display.value.publicationDate;
  const dateLabel = publishedAt ? formatFlatDate(publishedAt) : 'Дата не указана';
  return `Опубликовано ${dateLabel} · ${getFlatStatusLabel(props.flat)}`;
});
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

.detail-modal__price-card--good {
  border-color: rgba(16, 185, 129, 0.25);
  background: rgba(16, 185, 129, 0.06);
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

.detail-modal__grid--skeleton .detail-modal__cell {
  gap: 8px;
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

.detail-modal__cell--wide {
  grid-column: 1 / -1;
}

.detail-modal__cell span {
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
}

/* Полностью обновленный блок рекомендаций */
.detail-modal__recommendation {
  padding: 14px 16px;
  border-radius: 14px;
  /* Мягкий синий инфо-оттенок для фона и границ */
  border: 1px solid rgba(14, 116, 144, 0.15);
  background: rgba(14, 116, 144, 0.05);
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-top: 4px;
}

.detail-modal__recommendation-icon {
  color: #0e7490; /* Цвет иконки (cyan/blue) */
  font-size: 1.1rem;
  margin-top: 2px;
  flex-shrink: 0;
}

.detail-modal__recommendation-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-modal__recommendation-body span {
  font-size: 0.75rem;
  font-weight: 600;
  color: #0e7490; /* Подчеркиваем заголовок синим */
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.detail-modal__recommendation-body p {
  margin: 0;
  font-size: 0.85rem;
  line-height: 1.5;
  color: var(--app-foreground);
}

.detail-modal__recommendation-body small {
  color: var(--app-muted-foreground);
  font-size: 0.7rem;
  margin-top: 2px;
}

.detail-modal__loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--app-muted-foreground);
}

.detail-modal__actions {
  display: flex;
  justify-content: center;
  margin-top: 8px;
}

.custom-map-button,
.custom-map-button .p-button {
  padding: 0.5rem 1rem !important;
  font-size: 1rem !important;
  min-width: auto !important;
}

.custom-map-button .p-button-label {
  font-size: 0.875rem !important;
  font-weight: 500 !important;
  display: inline-block !important;
  margin-left: 0.5rem !important;
}

.custom-map-button .pi-map-marker {
  margin-right: 0 !important;
}
</style>
