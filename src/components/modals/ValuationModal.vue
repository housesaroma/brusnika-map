<template>
  <Dialog v-model:visible="visible" modal class="valuation-modal" :style="{ width: '720px' }">
    <template #header>
      <div class="valuation-modal__header">
        <i class="pi pi-calculator"></i>
        <h3>Оценка стоимости</h3>
      </div>
    </template>

    <div v-if="loading" class="valuation-modal__loader">
      <StepLoader 
        :steps="evaluationSteps" 
        @done="handleLoadingDone"
      />
    </div>

    <div v-else-if="result" class="valuation-modal__result">
      <div class="valuation-modal__result-card">
        <p>Прогнозная стоимость</p>
        <strong>{{ formatCompactPrice(result.predictedPrice) }}</strong>
        <small>{{ formatPricePerSqm(result.pricePerSqm) }}</small>
        <span v-if="result.avgAnalogPrice">
          Средняя цена аналогов: {{ formatCompactPrice(result.avgAnalogPrice) }}
        </span>
      </div>
      <AnalogSlider :analogs="result.analogs" />
      <div class="valuation-modal__actions">
        <Button
          class="valuation-modal__action valuation-modal__action--secondary"
          label="Изменить параметры"
          outlined
          @click="result = null"
        />
        <Button
          class="valuation-modal__action valuation-modal__action--primary"
          label="Показать на карте"
          @click="handleApplyToFilters"
        />
      </div>
    </div>

    <div v-else class="valuation-modal__form">
      <section>
        <h4>Обязательные поля</h4>
        <div class="valuation-modal__grid">
          <div class="field">
            <label>Комнат</label>
            <Select v-model="params.rooms" :options="roomOptions" />
          </div>
          <div class="field">
            <label>Общая площадь (м²)</label>
            <InputText v-model.number="params.area" type="number" />
          </div>
          <div class="field">
            <label>Этаж</label>
            <InputText v-model.number="params.floor" type="number" />
          </div>
          <div class="field">
            <label>Расстояние до метро (мин)</label>
            <InputText v-model.number="params.metroDistance" type="number" />
          </div>
        </div>
      </section>

      <section>
        <h4>Дополнительные поля</h4>
        <div class="valuation-modal__grid">
          <div class="field">
            <label>Материал дома</label>
            <Select
              v-model="params.material"
              :options="materialOptions"
              option-label="label"
              option-value="value"
            />
          </div>
          <div class="field">
            <label>Ремонт</label>
            <Select
              v-model="params.renovation"
              :options="renovationOptions"
              option-label="label"
              option-value="value"
            />
          </div>
          <div class="field">
            <label>Площадь кухни (м²)</label>
            <InputText v-model.number="params.kitchenArea" type="number" />
          </div>
          <div class="field">
            <label>Год постройки</label>
            <InputText v-model.number="params.yearBuilt" type="number" />
          </div>
          <div class="field field--inline">
            <InputSwitch v-model="params.balcony" />
            <span>Балкон</span>
          </div>
        </div>
      </section>

      <Button class="valuation-modal__action" label="Рассчитать оценку" @click="handleEvaluate" />
    </div>
  </Dialog>
</template>

<script setup>
import { ref, computed } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Select from 'primevue/select';
import InputSwitch from 'primevue/inputswitch';
import AnalogSlider from './AnalogSlider.vue';
import StepLoader from './StepLoader.vue';
import { formatCompactPrice, formatPricePerSqm } from '@/utils/formatters';
import predictionsApi from '@/api/predictions';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'applyFilters']);

const visible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const roomOptions = [1, 2, 3, 4, 5];

const materialOptions = [
  { label: 'Кирпичный', value: 'brick' },
  { label: 'Монолитный', value: 'monolith' },
  { label: 'Панельный', value: 'panel' },
  { label: 'Кирпично-монолитный', value: 'monolith_brick' },
];

const renovationOptions = [
  { label: 'Черновая', value: 'rough' },
  { label: 'Предчистовая', value: 'pre' },
  { label: 'Чистовая', value: 'clean' },
  { label: 'Под ключ', value: 'full' },
];

const params = ref({
  rooms: 2,
  area: 55,
  kitchenArea: 10,
  floor: 5,
  metroDistance: 10,
  material: 'monolith',
  renovation: 'clean',
  balcony: true,
  yearBuilt: 2018,
});

const result = ref(null);
const loading = ref(false);
const evaluationSteps = ref([]);

// Получаем CityId из URL или используем дефолтное значение
function getCityId() {
  const urlParams = new URLSearchParams(window.location.search);
  const cityId = urlParams.get('cityId');
  if (cityId) return cityId;
  
  // Дефолтный CityId для тестирования (замените на реальный при необходимости)
  return 'a0ee0000-0000-0000-0000-000000000001';
}

function handleEvaluate() {
  loading.value = true;
  result.value = null;
  
  // Формируем payload для API согласно DTO PredictByParametersRequest
  const payload = {
    FlatArea: params.value.area,
    FlatRooms: params.value.rooms,
    FlatFloor: params.value.floor,
    FlatAreaKitchen: params.value.kitchenArea,
    FlatAreaLiving: null, // Не используется в текущей форме
    FlatBalcony: params.value.balcony ? 1 : 0,
    FlatLoggia: 0, // Не используется в текущей форме
    FlatFurniture: 0, // Не используется в текущей форме
    FlatStatus: 'active',
    CityId: getCityId(),
    TotalFloors: null, // Не используется в текущей форме
    BuildYear: params.value.yearBuilt,
    Renovation: mapRenovationToBackend(params.value.renovation),
    Source: 'manual',
  };

  Promise.resolve()
    .then(() => {
      evaluationSteps.value = [
        { label: 'Анализируем параметры квартиры', duration: 500 },
        { label: 'Ищем похожие объявления', duration: 1000 },
        { label: 'Считаем и уточняем оценку', duration: 800 },
      ];
      return new Promise((resolve) => setTimeout(resolve, 500));
    })
    .then(() => {
      return predictionsApi.estimateByParams(payload);
    })
    .then((response) => {
      const data = response.data;
      
      // Нормализуем данные с бэкенда согласно PredictByParametersResult
      const predictedPrice = data.PredictedPrice || data.predictedPrice || 0;
      const pricePerSqm = predictedPrice > 0 ? predictedPrice / params.value.area : 0;

      result.value = {
        predictedPrice,
        pricePerSqm,
        avgAnalogPrice: 0,
        analogs: [],
      };
    })
    .catch((error) => {
      console.error('Ошибка оценки:', error);
      // Fallback на mock данные если API не доступен
      const basePrice = 130000;
      const renovationFactor =
        params.value.renovation === 'full' ? 1.2 : params.value.renovation === 'clean' ? 1.1 : 1.0;
      const materialFactor =
        params.value.material === 'monolith' ? 1.1 : params.value.material === 'brick' ? 1.05 : 1.0;
      const metroFactor = 1 - Math.max(0, params.value.metroDistance - 5) * 0.01;
      const pricePerSqm = Math.max(65000, basePrice * renovationFactor * materialFactor * metroFactor);
      const predictedPrice = Math.round(pricePerSqm * params.value.area);

      result.value = {
        predictedPrice,
        pricePerSqm,
        avgAnalogPrice: Math.round(predictedPrice * 0.96),
        analogs: [],
      };
    })
    .finally(() => {
      setTimeout(() => {
        loading.value = false;
      }, 500);
    });
}

function mapRenovationToBackend(renovation) {
  // Маппинг значений ремонта из frontend в формат backend
  const mapping = {
    rough: 'without',
    pre: 'pre',
    clean: 'euro',
    full: 'design',
  };
  return mapping[renovation] || 'without';
}

function handleLoadingDone() {
  // Этот метод больше не используется, логика перенесена в handleEvaluate
}

function handleApplyToFilters() {
  if (!result.value) return;

  const filters = {
    roomsMin: params.value.rooms,
    roomsMax: params.value.rooms,
    areaMin: Math.round(params.value.area * 0.85),
    areaMax: Math.round(params.value.area * 1.15),
    floorMin: Math.max(1, params.value.floor - 2),
    floorMax: params.value.floor + 3,
    priceMin: Math.round(result.value.predictedPrice * 0.85),
    priceMax: Math.round(result.value.predictedPrice * 1.15),
  };

  emit('applyFilters', filters);
}
</script>

<style scoped>
.valuation-modal__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.valuation-modal__header h3 {
  margin: 0;
}

.valuation-modal__form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.valuation-modal__form section h4 {
  margin: 0 0 10px;
  font-size: 0.85rem;
  text-transform: uppercase;
  color: var(--app-muted-foreground);
}

.valuation-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 0.75rem;
}

.field--inline {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

/* Общий стиль для основных кнопок действий */
.valuation-modal__action {
  margin-top: 6px;
  background: var(--app-primary);
  border: 1px solid var(--app-primary);
  color: #fff; /* Цвет текста для дефолтной кнопки */
}

/* Стилизация для контурной (outlined) кнопки "Изменить параметры" */
.valuation-modal__action--secondary {
  background: transparent !important;
  border: 1px solid var(--app-primary) !important;
  color: var(--app-primary) !important;
  transition:
    background 0.2s,
    color 0.2s;
}

/* Эффект наведения для контурной кнопки */
.valuation-modal__action--secondary:hover {
  background: var(--app-primary) !important;
  color: #fff !important;
}

.valuation-modal__result {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.valuation-modal__result-card {
  padding: 16px;
  border-radius: 14px;
  border: 1px solid rgba(255, 0, 30, 0.3);
  background: rgba(255, 0, 30, 0.06);
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.valuation-modal__result-card strong {
  font-size: 1.5rem;
}

.valuation-modal__actions {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-top: 8px;
}

/* Стиль для основной кнопки "Показать на карте" */
.valuation-modal__action--primary {
  background: var(--app-primary) !important;
  border: 1px solid var(--app-primary) !important;
  color: #fff !important;
}

.valuation-modal__action--primary:hover {
  background: var(--app-primary-dark, #d9003c) !important;
  border-color: var(--app-primary-dark, #d9003c) !important;
}
</style>
