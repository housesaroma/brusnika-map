<template>
  <aside v-if="isOpen" class="sidebar">
    <div class="sidebar__header">
      <div class="sidebar__title">
        <div class="sidebar__icon">
          <i class="pi pi-building"></i>
        </div>
        <div>
          <h2>{{ building?.address || 'Дом' }}</h2>
          <p v-if="building?.yearBuilt">Год постройки: {{ formatYear(building.yearBuilt) }}</p>
        </div>
      </div>
      <Button icon="pi pi-times" text rounded class="sidebar__close" @click="emit('close')" />
    </div>

    <div class="sidebar__count">
      Квартир в продаже: <strong>{{ flats.length }}</strong>
    </div>

    <div class="sidebar__list">
      <PropertyCard
        v-for="flat in flats"
        :key="flat.id"
        :flat="flat"
        :prediction="flat.prediction"
        :is-selected="flat.id === selectedFlatId"
        @click="emit('flat-click', flat)"
      />
      <p v-if="!flats.length" class="sidebar__empty">Нет квартир для отображения</p>
    </div>
  </aside>
</template>

<script setup>
import Button from 'primevue/button';
import PropertyCard from './PropertyCard.vue';

defineProps({
  building: {
    type: Object,
    default: null,
  },
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
});

const emit = defineEmits(['flat-click', 'close']);

function formatYear(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getFullYear()) ? '—' : date.getFullYear();
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

.sidebar__count {
  padding: 12px 18px;
  font-size: 0.8rem;
  color: var(--app-muted-foreground);
  border-bottom: 1px solid var(--app-border);
  background: rgba(248, 243, 236, 0.6);
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
