<template>
  <section
    v-if="isOpen"
    class="flats-table-panel"
    :class="{
      'flats-table-panel--fullscreen': isFullscreen,
      'flats-table-panel--resizing': isResizing,
    }"
    :style="panelStyle"
  >
    <div
      class="flats-table-panel__resize"
      role="separator"
      aria-orientation="horizontal"
      @mousedown="startResize"
    >
      <span></span>
    </div>

    <header class="flats-table-panel__header">
      <div class="flats-table-panel__title">
        <i class="pi pi-table"></i>
        <div>
          <h2>{{ title }}</h2>
          <p>{{ rows.length }} объектов</p>
        </div>
      </div>

      <div class="flats-table-panel__toolbar">
        <IconField v-if="!isFullscreen" class="flats-table-panel__search">
          <InputIcon class="pi pi-search" />
          <InputText v-model="globalFilter" placeholder="Поиск по таблице..." />
        </IconField>

        <div class="flats-table-panel__actions">
          <Button
            :title="isFullscreen ? 'Выйти из полноэкранного режима' : 'На весь экран'"
            :icon="isFullscreen ? 'pi pi-window-minimize' : 'pi pi-window-maximize'"
            text
            rounded
            @click="toggleFullscreen"
          />
          <Button
            title="Скрыть таблицу"
            icon="pi pi-times"
            text
            rounded
            severity="secondary"
            @click="emit('close')"
          />
        </div>
      </div>
    </header>

    <div class="flats-table-panel__body">
      <!-- Добавлены resizable-columns и column-resize-mode -->
      <DataTable
        v-model:filters="tableFilters"
        :value="rows"
        :global-filter-fields="globalFilterFields"
        :loading="loading"
        data-key="id"
        paginator
        :rows="25"
        :rows-per-page-options="[10, 25, 50, 100]"
        sort-mode="multiple"
        removable-sort
        filter-display="row"
        scrollable
        scroll-height="flex"
        striped-rows
        size="small"
        resizable-columns
        column-resize-mode="expand"
        class="flats-table-panel__datatable"
        :row-class="rowClass"
        @row-click="handleRowClick"
      >
        <template #loading>
          <div class="flats-table-panel__skeleton">
            <div
              v-for="rowIndex in skeletonRows"
              :key="rowIndex"
              class="flats-table-panel__skeleton-row"
            >
              <Skeleton v-for="cellIndex in skeletonCells" :key="cellIndex" height="14px" />
            </div>
          </div>
        </template>
        <template #empty>
          <div class="flats-table-panel__empty">Нет объектов для отображения</div>
        </template>

        <!-- Колонки оптимизированы по ширине для вмещения новых данных -->
        <Column
          field="address"
          header="Адрес"
          sortable
          :show-filter-menu="false"
          style="min-width: 50px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              placeholder="Адрес"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <!-- Удалили колонку "Район" -->

        <!-- НОВЫЙ ФИЛЬТР: Полигон -->
        <Column field="polygon" header="Полигон" sortable style="min-width: 27px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              placeholder="Полигон"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column field="rooms" header="Комнат" sortable data-type="numeric" style="min-width: 20px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="number"
              placeholder="Кол-во"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column
          field="area"
          header="Площадь, м²"
          sortable
          data-type="numeric"
          style="min-width: 23px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="number"
              placeholder="м²"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column field="floor" header="Этаж" sortable data-type="numeric" style="min-width: 18px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="number"
              placeholder="Этаж"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column field="buildYear" header="Год" sortable data-type="numeric" style="min-width: 22px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="number"
              placeholder="Год"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <!-- НОВЫЙ ФИЛЬТР: Материал стен -->
        <Column field="material" header="Материал" sortable style="min-width: 27px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              type="text"
              placeholder="Материал"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column
          field="priceLabel"
          header="Цена"
          sortable
          sort-field="price"
          style="min-width: 28px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" placeholder="Цена" @input="filterCallback()" />
          </template>
          <template #body="{ data }">
            <span v-if="data.deviationPercent != null && data.deviationPercent > 0" class="price--favorable">
              {{ data.priceLabel }}
            </span>
            <span v-else>{{ data.priceLabel }}</span>
          </template>
        </Column>

        <Column
          field="predictedPriceLabel"
          header="Прогноз"
          sortable
          sort-field="predictedPrice"
          style="min-width: 28px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" placeholder="Прогноз" @input="filterCallback()" />
          </template>
          <template #body="{ data }">
            <span v-if="data.predictedPrice" :class="deviationClass(data.deviationPercent)">
              {{ data.predictedPriceLabel }}
            </span>
            <span v-else>—</span>
          </template>
        </Column>

        <Column
          field="deviationLabel"
          header="Откл."
          sortable
          sort-field="deviationPercent"
          style="min-width: 23px"
        >
          <template #body="{ data }">
            <span v-if="data.deviationPercent != null" :class="deviationClass(data.deviationPercent)">
              {{ data.deviationLabel }}
            </span>
            <span v-else>—</span>
          </template>
        </Column>

        <Column
          field="sqmLabel"
          header="Цена / м²"
          sortable
          sort-field="sqm"
          style="min-width: 27px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" placeholder="₽/м²" @input="filterCallback()" />
          </template>
        </Column>

        <Column field="sourceLabel" header="Источник" sortable style="min-width: 25px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText
              v-model="filterModel.value"
              placeholder="Источник"
              @input="filterCallback()"
            />
          </template>
        </Column>

        <Column field="statusLabel" header="Статус" sortable style="min-width: 27px">
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" placeholder="Статус" @input="filterCallback()" />
          </template>
        </Column>

        <Column
          field="publishedLabel"
          header="Дата"
          sortable
          sort-field="publishedAt"
          style="min-width: 25px"
        >
          <template #filter="{ filterModel, filterCallback }">
            <InputText v-model="filterModel.value" placeholder="Дата" @input="filterCallback()" />
          </template>
        </Column>

        <Column
          field="priceChangeLabel"
          header="Изм."
          sortable
          sort-field="priceChangePercent"
          style="min-width: 23px"
        >
          <template #body="{ data }">
            <span
              v-if="data.priceChangePercent != null"
              :class="data.priceChangePercent > 0 ? 'trend--up' : 'trend--down'"
            >
              {{ data.priceChangeLabel }}
            </span>
            <span v-else>—</span>
          </template>
        </Column>
      </DataTable>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue';
import DataTable from 'primevue/datatable';
import Column from 'primevue/column';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import IconField from 'primevue/iconfield';
import InputIcon from 'primevue/inputicon';
import Skeleton from 'primevue/skeleton';
import { FilterMatchMode } from '@primevue/core/api';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  rows: {
    type: Array,
    default: () => [],
  },
  selectedFlatId: {
    type: String,
    default: null,
  },
  title: {
    type: String,
    default: 'Таблица объектов',
  },
  loading: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['close', 'flat-click']);

const DEFAULT_HEIGHT = 50;
const MIN_HEIGHT = 220;
const MAX_HEIGHT_PERCENT = 95;

const panelHeight = ref(DEFAULT_HEIGHT);
const isFullscreen = ref(false);
const isResizing = ref(false);
const skeletonRows = Array.from({ length: 8 }, (_, index) => index);
// Обновленное количество ячеек для скелетона (убрали район, добавили прогноз и отклонение)
const skeletonCells = Array.from({ length: 15 }, (_, index) => index);
const globalFilter = ref('');

// Добавлены новые поля для глобальной фильтрации
const globalFilterFields = [
  'address',
  'polygon',
  'rooms',
  'area',
  'floor',
  'buildYear',
  'material',
  'priceLabel',
  'predictedPriceLabel',
  'deviationLabel',
  'sqmLabel',
  'sourceLabel',
  'statusLabel',
  'publishedLabel',
  'priceChangeLabel',
];

// Добавлены новые правила фильтрации
const tableFilters = ref({
  global: { value: null, matchMode: FilterMatchMode.CONTAINS },
  address: { value: null, matchMode: FilterMatchMode.CONTAINS },
  polygon: { value: null, matchMode: FilterMatchMode.CONTAINS },
  rooms: { value: null, matchMode: FilterMatchMode.EQUALS },
  area: { value: null, matchMode: FilterMatchMode.EQUALS },
  floor: { value: null, matchMode: FilterMatchMode.EQUALS },
  buildYear: { value: null, matchMode: FilterMatchMode.EQUALS },
  material: { value: null, matchMode: FilterMatchMode.CONTAINS },
  priceLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  predictedPriceLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  deviationLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  sqmLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  sourceLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  statusLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  publishedLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
  priceChangeLabel: { value: null, matchMode: FilterMatchMode.CONTAINS },
});

const panelStyle = computed(() => {
  if (isFullscreen.value) return { height: '100%' };
  return { height: `${panelHeight.value}%` };
});

watch(globalFilter, (value) => {
  tableFilters.value.global.value = value || null;
});

watch(
  () => props.isOpen,
  (open) => {
    if (!open) {
      isFullscreen.value = false;
      panelHeight.value = DEFAULT_HEIGHT;
      globalFilter.value = '';
      tableFilters.value.global.value = null;
    }
  }
);

let resizeContext = null;

function startResize(event) {
  if (isFullscreen.value) return;

  const panel = event.currentTarget?.closest('.flats-table-panel');
  if (!panel?.parentElement) return;

  isResizing.value = true;
  const parentHeight = panel.parentElement.clientHeight;
  const startY = event.clientY;
  const startHeightPx = panel.clientHeight;

  resizeContext = {
    parentHeight,
    startY,
    startHeightPx,
    onMove: null,
    onUp: null,
  };

  resizeContext.onMove = (moveEvent) => {
    const delta = resizeContext.startY - moveEvent.clientY;
    const nextPx = Math.min(
      (resizeContext.parentHeight * MAX_HEIGHT_PERCENT) / 100,
      Math.max(MIN_HEIGHT, resizeContext.startHeightPx + delta)
    );
    panelHeight.value = Math.round((nextPx / resizeContext.parentHeight) * 100);
  };

  resizeContext.onUp = () => {
    isResizing.value = false;
    window.removeEventListener('mousemove', resizeContext.onMove);
    window.removeEventListener('mouseup', resizeContext.onUp);
    resizeContext = null;
  };

  window.addEventListener('mousemove', resizeContext.onMove);
  window.addEventListener('mouseup', resizeContext.onUp);
}

function toggleFullscreen() {
  isFullscreen.value = !isFullscreen.value;
}

function rowClass(data) {
  const classes = [];
  if (data.id === props.selectedFlatId) {
    classes.push('flats-table-panel__row--selected');
  }
  // Выгодная квартира: прогнозная цена выше объявленной (deviationPercent > 0)
  if (data.deviationPercent != null && data.deviationPercent > 0) {
    classes.push('flats-table-panel__row--favorable');
  }
  return classes.join(' ');
}

function deviationClass(deviation) {
  if (!Number.isFinite(deviation)) return '';
  return deviation > 0 ? 'trend--up' : 'trend--down';
}

function handleRowClick(event) {
  const flat = event?.data?.flat;
  if (flat) emit('flat-click', flat);
}

onBeforeUnmount(() => {
  if (!resizeContext) return;
  window.removeEventListener('mousemove', resizeContext.onMove);
  window.removeEventListener('mouseup', resizeContext.onUp);
});
</script>

<style scoped>
.flats-table-panel {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  background: rgba(255, 255, 255, 0.98);
  border-top: 1px solid var(--app-border);
  box-shadow: 0 -8px 24px rgba(15, 23, 42, 0.12);
}

.flats-table-panel__skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
}

.flats-table-panel__skeleton-row {
  display: grid;
  /* Обновленная сетка скелетона под новое количество колонок (15) */
  grid-template-columns: 2fr repeat(14, minmax(0, 1fr));
  gap: 12px;
  align-items: center;
}

.flats-table-panel--fullscreen {
  top: 0;
  height: 100% !important;
}

.flats-table-panel--resizing {
  user-select: none;
}

.flats-table-panel__resize {
  height: 10px;
  cursor: ns-resize;
  display: grid;
  place-items: center;
  flex-shrink: 0;
}

.flats-table-panel__resize span {
  width: 48px;
  height: 4px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.2);
}

.flats-table-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--app-border);
  flex-shrink: 0;
}

.flats-table-panel__title {
  display: flex;
  gap: 10px;
  align-items: center;
}

.flats-table-panel__title h2 {
  margin: 0;
  font-size: 0.95rem;
}

.flats-table-panel__title p {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.flats-table-panel__title i {
  color: var(--app-primary);
  font-size: 1.1rem;
}

.flats-table-panel__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  justify-content: flex-end;
}

.flats-table-panel__search {
  min-width: 180px;
  max-width: 250px;
}

.flats-table-panel__search :deep(.p-inputtext) {
  font-size: 0.75rem;
  padding: 4px 8px;
}

.flats-table-panel__actions {
  display: flex;
  gap: 4px;
}

.flats-table-panel__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0 12px 12px;
}

.flats-table-panel__datatable {
  flex: 1;
  min-height: 0;
}

.flats-table-panel__datatable :deep(.p-datatable-tbody > tr) {
  cursor: pointer;
}

.flats-table-panel__datatable :deep(.flats-table-panel__row--selected) {
  background: rgba(255, 0, 30, 0.08) !important;
}

/* Выгодная квартира: прогнозная цена выше объявленной */
.flats-table-panel__datatable :deep(.flats-table-panel__row--favorable) {
  background: rgba(4, 120, 87, 0.08) !important;
}

.price--favorable {
  color: #047857;
  font-weight: 600;
}

/* Делаем дефолтные плейсхолдеры в инпутах фильтрации более прозрачными */
.flats-table-panel__datatable :deep(.p-column-filter-row .p-inputtext::placeholder) {
  opacity: 0.4;
}

.flats-table-panel__datatable :deep(.p-column-filter-row .p-inputtext) {
  font-size: 0.65rem !important;
  padding: 2px 4px !important;
  min-height: 24px !important;
  width: 60px !important;
}

/* Стилизация ползунков-разделителей колонок PrimeVue (чтобы было видно область перетаскивания) */
.flats-table-panel__datatable :deep(.p-datatable-column-resizer) {
  width: 8px;
  background: transparent;
  transition: background 0.2s;
}

.flats-table-panel__datatable :deep(.p-datatable-column-resizer:hover) {
  background: rgba(15, 23, 42, 0.1);
}

.flats-table-panel__empty {
  padding: 24px;
  text-align: center;
  color: var(--app-muted-foreground);
}

.trend--up {
  color: #047857;
  font-weight: 600;
}

.trend--down {
  color: #b91c1c;
  font-weight: 600;
}

.flats-table-panel__datatable :deep(.p-datatable-thead > tr > th) {
  font-size: 0.75rem;
  padding: 8px 6px;
}

.flats-table-panel__datatable :deep(.p-datatable-tbody > tr > td) {
  font-size: 0.8rem;
  padding: 8px 6px;
}
</style>
