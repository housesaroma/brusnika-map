<template>
  <aside v-if="isOpen" class="sidebar">
    <div class="sidebar__header">
      <div class="sidebar__title">
        <div class="sidebar__icon">
          <i :class="mode === 'polygon' ? 'pi pi-map-marker' : 'pi pi-filter'"></i>
        </div>
        <div>
          <h2>{{ title }}</h2>
          <p>{{ flats.length }} квартир найдено</p>
        </div>
      </div>
      <Button icon="pi pi-times" text rounded class="sidebar__close" @click="emit('close')" />
    </div>

    <div class="sidebar__actions">
      <Button
        label="Таблица объектов"
        icon="pi pi-table"
        size="small"
        outlined
        class="sidebar__table-button"
        @click="emit('show-table')"
      />
    </div>

    <div v-if="mode === 'polygon' && polygons.length" class="sidebar__polygons">
      <p>Выбранные полигоны ({{ selectedCount }})</p>
      <div class="sidebar__polygon-list">
        <div v-for="polygon in polygons" :key="polygon.id" class="sidebar__polygon-item">
          <label class="sidebar__polygon-label">
            <input
              type="checkbox"
              :checked="polygon.selected"
              @change="emit('toggle-polygon', polygon.id)"
            />
            <span>{{ polygon.name }}</span>
          </label>
          <div class="sidebar__polygon-actions">
            <Button
              icon="pi pi-pencil"
              text
              rounded
              size="small"
              :severity="polygon.id === editingPolygonId ? 'warn' : 'secondary'"
              @click="emit('edit-polygon', polygon.id)"
            />
            <Button
              icon="pi pi-trash"
              text
              rounded
              size="small"
              severity="danger"
              @click="emit('remove-polygon', polygon.id)"
            />
          </div>
        </div>
      </div>
      <small class="sidebar__polygon-hint"
        >Клик по полигону на карте включает или выключает выбор</small
      >
    </div>

    <div v-if="mode === 'polygon'" class="sidebar__save">
      <p>Сохранить полигон в избранное:</p>
      <div class="sidebar__save-controls">
        <InputText
          v-model="polygonName"
          class="sidebar__input"
          placeholder="Название полигона..."
          @keydown.enter="handleSave"
        />
        <Button
          :label="saved ? 'Сохранено' : 'Сохранить'"
          size="small"
          :severity="saved ? 'secondary' : 'danger'"
          class="sidebar__save-button"
          @click="handleSave"
        />
      </div>
    </div>

    <div class="sidebar__list">
      <PropertyCard
        v-for="flat in flats"
        :key="flat.id"
        :flat="flat"
        :is-selected="flat.id === selectedFlatId"
        @click="emit('flat-click', flat)"
      />
      <p v-if="!flats.length" class="sidebar__empty">{{ emptyText }}</p>
    </div>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import PropertyCard from './PropertyCard.vue';

const props = defineProps({
  flats: {
    type: Array,
    default: () => [],
  },
  selectedFlatId: {
    type: String,
    default: null,
  },
  isOpen: {
    type: Boolean,
    default: false,
  },
  mode: {
    type: String,
    default: 'filters',
    validator: (value) => ['filters', 'polygon'].includes(value),
  },
  polygons: {
    type: Array,
    default: () => [],
  },
  editingPolygonId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits([
  'flat-click',
  'close',
  'save',
  'show-table',
  'toggle-polygon',
  'edit-polygon',
  'remove-polygon',
]);

const selectedCount = computed(() => props.polygons.filter((polygon) => polygon.selected).length);

const polygonName = ref('');
const saved = ref(false);

const title = computed(() =>
  props.mode === 'polygon' ? 'Объекты в полигоне' : 'Результаты фильтрации'
);

const emptyText = computed(() =>
  props.mode === 'polygon'
    ? 'Нет объектов в выбранной области'
    : 'Нет объектов по заданным фильтрам'
);

function handleSave() {
  const name = polygonName.value.trim() || `Полигон ${new Date().toLocaleDateString('ru-RU')}`;
  emit('save', name);
  saved.value = true;
  setTimeout(() => {
    saved.value = false;
  }, 2000);
}
</script>

<style scoped>
.sidebar {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  width: 380px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  border-right: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
  z-index: 4;
}

.sidebar__header {
  padding: 18px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  border-bottom: 1px solid var(--app-border);
}

.sidebar__title {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.sidebar__title h2 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.sidebar__title p {
  margin: 4px 0 0;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.sidebar__icon {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 0, 30, 0.1);
  color: var(--app-primary);
  display: grid;
  place-items: center;
}

.sidebar__close {
  margin-top: -4px;
}

.sidebar__actions {
  padding: 12px 18px;
  border-bottom: 1px solid var(--app-border);
}

.sidebar__table-button {
  width: 100%;
}

.sidebar__polygons {
  padding: 14px 18px;
  border-bottom: 1px solid var(--app-border);
  background: rgba(248, 243, 236, 0.45);
}

.sidebar__polygons p {
  margin: 0 0 8px;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.sidebar__polygon-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar__polygon-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid var(--app-border);
  background: rgba(255, 255, 255, 0.8);
}

.sidebar__polygon-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.8rem;
  cursor: pointer;
}

.sidebar__polygon-actions {
  display: flex;
  gap: 4px;
}

.sidebar__polygon-hint {
  display: block;
  margin-top: 8px;
  color: var(--app-muted-foreground);
  font-size: 0.7rem;
}

.sidebar__save {
  padding: 14px 18px;
  border-bottom: 1px solid var(--app-border);
  background: rgba(248, 243, 236, 0.6);
}

.sidebar__save p {
  margin: 0 0 8px;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
}

.sidebar__save-controls {
  display: flex;
  gap: 8px;
}

.sidebar__input {
  flex: 1;
}

.sidebar__save-button {
  white-space: nowrap;
}

.sidebar__list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sidebar__empty {
  text-align: center;
  color: var(--app-muted-foreground);
  margin-top: 40px;
}
</style>
