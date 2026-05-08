<template>
  <Dialog v-model:visible="visible" modal class="filters-modal" :style="{ width: '560px' }">
    <template #header>
      <div class="filters-modal__header">
        <i class="pi pi-filter"></i>
        <h3>Фильтры</h3>
      </div>
    </template>

    <div class="filters-modal__content">
      <div class="filters-modal__grid">
        <div class="field">
          <label>Комнат от</label>
          <InputText v-model="filters.roomsMin" type="number" placeholder="1" />
        </div>
        <div class="field">
          <label>Комнат до</label>
          <InputText v-model="filters.roomsMax" type="number" placeholder="5" />
        </div>
      </div>

      <div class="filters-modal__grid">
        <div class="field">
          <label>Площадь от (м²)</label>
          <InputText v-model="filters.areaMin" type="number" placeholder="20" />
        </div>
        <div class="field">
          <label>Площадь до (м²)</label>
          <InputText v-model="filters.areaMax" type="number" placeholder="200" />
        </div>
      </div>

      <div class="filters-modal__grid">
        <div class="field">
          <label>Цена от (₽)</label>
          <InputText v-model="filters.priceMin" type="number" placeholder="1 000 000" />
        </div>
        <div class="field">
          <label>Цена до (₽)</label>
          <InputText v-model="filters.priceMax" type="number" placeholder="20 000 000" />
        </div>
      </div>

      <div class="filters-modal__grid">
        <div class="field">
          <label>Этаж от</label>
          <InputText v-model="filters.floorMin" type="number" placeholder="1" />
        </div>
        <div class="field">
          <label>Этаж до</label>
          <InputText v-model="filters.floorMax" type="number" placeholder="25" />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="filters-modal__footer">
        <Button label="Сбросить" text @click="handleReset" />
        <Button label="Поиск" class="filters-modal__action" @click="handleApply" />
      </div>
    </template>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import { DEFAULT_FILTERS } from '@/utils/filters';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  currentFilters: {
    type: Object,
    default: () => ({ ...DEFAULT_FILTERS }),
  },
});

const emit = defineEmits(['close', 'apply']);

const visible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const filters = ref({ ...DEFAULT_FILTERS });

watch(
  () => props.currentFilters,
  (value) => {
    filters.value = { ...DEFAULT_FILTERS, ...(value || {}) };
  },
  { immediate: true }
);

function handleReset() {
  filters.value = { ...DEFAULT_FILTERS };
  emit('apply', { ...DEFAULT_FILTERS });
  emit('close');
}

function handleApply() {
  emit('apply', { ...filters.value });
  emit('close');
}
</script>

<style scoped>
.filters-modal__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filters-modal__header h3 {
  margin: 0;
}

.filters-modal__content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.filters-modal__grid {
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

.filters-modal__footer {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
  width: 100%;
}

.filters-modal__action {
  background: var(--app-primary);
  border: none;
}
</style>
