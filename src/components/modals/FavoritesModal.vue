<template>
  <Dialog v-model:visible="visible" modal class="favorites-modal" :style="{ width: '480px' }">
    <template #header>
      <div class="favorites-modal__header">
        <i class="pi pi-star"></i>
        <h3>Избранные настройки</h3>
      </div>
    </template>

    <div class="favorites-modal__content">
      <div v-if="!favorites.length" class="favorites-modal__empty">
        <i class="pi pi-star"></i>
        <p>Нет сохраненных конфигураций</p>
        <small>Сохраните фильтры или полигон, чтобы они появились здесь</small>
      </div>

      <div v-else class="favorites-modal__list">
        <div v-for="fav in favorites" :key="fav.id" class="favorite-card">
          <div class="favorite-card__header">
            <div v-if="editingId === fav.id" class="favorite-card__edit">
              <InputText v-model="editingName" class="favorite-card__input" />
              <Button icon="pi pi-check" text rounded @click="saveName(fav)" />
            </div>
            <div v-else class="favorite-card__title">
              <span>{{ fav.name }}</span>
              <Button icon="pi pi-pencil" text rounded @click="startEdit(fav)" />
            </div>
            <Button
              icon="pi pi-trash"
              text
              rounded
              severity="danger"
              @click="emit('delete', fav)"
            />
          </div>

          <div class="favorite-card__tags">
            <Tag v-if="hasPolygon(fav)" severity="secondary">Полигон</Tag>
            <Tag v-if="hasFilters(fav)" severity="secondary">Фильтры</Tag>
          </div>

          <Button
            label="Применить"
            outlined
            size="small"
            class="favorite-card__apply"
            @click="emit('select', fav)"
          />
        </div>
      </div>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import InputText from 'primevue/inputtext';
import Tag from 'primevue/tag';

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  favorites: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['close', 'select', 'delete', 'rename']);

const visible = computed({
  get: () => props.open,
  set: (value) => {
    if (!value) emit('close');
  },
});

const editingId = ref(null);
const editingName = ref('');

function startEdit(fav) {
  editingId.value = fav.id;
  editingName.value = fav.name;
}

function saveName(fav) {
  emit('rename', { ...fav, name: editingName.value });
  editingId.value = null;
}

function hasPolygon(fav) {
  return Array.isArray(fav.geoPoints) && fav.geoPoints.length > 2;
}

function hasFilters(fav) {
  return !!fav.filters && Object.values(fav.filters).some((value) => value);
}
</script>

<style scoped>
.favorites-modal__header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.favorites-modal__header h3 {
  margin: 0;
}

.favorites-modal__content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorites-modal__empty {
  text-align: center;
  color: var(--app-muted-foreground);
  padding: 32px 12px;
}

.favorites-modal__empty i {
  font-size: 2rem;
  opacity: 0.3;
}

.favorites-modal__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.favorite-card {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 12px;
}

.favorite-card__header {
  display: flex;
  justify-content: space-between;
  gap: 8px;
  align-items: center;
}

.favorite-card__title {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.favorite-card__edit {
  display: flex;
  align-items: center;
  gap: 6px;
  flex: 1;
}

.favorite-card__input {
  flex: 1;
}

.favorite-card__tags {
  display: flex;
  gap: 6px;
  margin: 8px 0;
}

.favorite-card__apply {
  width: 100%;
}
</style>
