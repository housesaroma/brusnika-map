<template>
  <aside class="left-nav">
    <div class="left-nav__header">
      <div class="left-nav__brand">
        <div class="left-nav__logo">
          <i class="pi pi-building"></i>
        </div>
        <div>
          <h1 class="left-nav__title">Оценка квартир</h1>
          <p class="left-nav__subtitle">
            <i class="pi pi-map-marker"></i>
            {{ selectedCity?.label || 'Город' }}
          </p>
        </div>
      </div>
      <div class="left-nav__count">{{ totalFlats }} объектов на карте</div>
      <Dropdown
        v-if="cityOptions.length > 1"
        :model-value="selectedCity"
        :options="cityOptions"
        option-label="label"
        class="left-nav__city"
        @update:model-value="handleCityChange"
      />
    </div>

    <nav class="left-nav__items">
      <button class="left-nav__item" @click="emit('valuation')">
        <i class="pi pi-calculator"></i>
        <div>
          <span>Оценка стоимости</span>
          <small>Прогноз цены по параметрам</small>
        </div>
      </button>

      <button
        class="left-nav__item"
        :class="{ 'left-nav__item--active': hasActiveFilters }"
        @click="emit('filters')"
      >
        <i class="pi pi-filter"></i>
        <div>
          <span>Фильтры</span>
          <small>Поиск квартир на карте</small>
        </div>
        <span v-if="hasActiveFilters" class="left-nav__badge">Активны</span>
      </button>

      <div class="left-nav__heatmap">
        <button
          class="left-nav__item"
          :class="{ 'left-nav__item--active': !!heatMode }"
          @click="toggleHeatmapMenu"
        >
          <i class="pi pi-fire"></i>
          <div>
            <span>Тепловая карта</span>
            <small>{{ heatModeLabel || 'Выберите параметр' }}</small>
          </div>
          <i
            v-if="!heatMode"
            class="pi pi-chevron-right left-nav__chevron"
            :class="{ rotated: showHeatmapMenu }"
          ></i>
        </button>

        <div v-if="showHeatmapMenu && !heatMode" class="left-nav__submenu">
          <button v-for="mode in heatmapOptions" :key="mode.id" @click="selectHeatMode(mode.id)">
            {{ mode.label }}
          </button>
        </div>
      </div>
    </nav>

    <footer class="left-nav__footer">ООО Брусника · 2026</footer>
  </aside>
</template>

<script setup>
import { computed, ref } from 'vue';
import Dropdown from 'primevue/dropdown';

const props = defineProps({
  totalFlats: {
    type: Number,
    default: 0,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  heatMode: {
    type: String,
    default: null,
  },
  heatmapOptions: {
    type: Array,
    default: () => [],
  },
  selectedCity: {
    type: Object,
    default: null,
  },
  cityOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['valuation', 'filters', 'heatmap', 'city-change']);

const showHeatmapMenu = ref(false);

const heatModeLabel = computed(
  () => props.heatmapOptions.find((mode) => mode.id === props.heatMode)?.label
);

function toggleHeatmapMenu() {
  if (props.heatMode) {
    emit('heatmap', null);
    showHeatmapMenu.value = false;
    return;
  }
  showHeatmapMenu.value = !showHeatmapMenu.value;
}

function selectHeatMode(mode) {
  emit('heatmap', mode);
  showHeatmapMenu.value = false;
}

function handleCityChange(city) {
  emit('city-change', city);
}
</script>

<style scoped>
.left-nav {
  width: 220px;
  background: rgba(255, 255, 255, 0.95);
  border-right: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
  display: flex;
  flex-direction: column;
  z-index: 5;
}

.left-nav__header {
  padding: 20px 18px 16px;
  border-bottom: 1px solid var(--app-border);
}

.left-nav__brand {
  display: flex;
  gap: 12px;
  align-items: center;
}

.left-nav__logo {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: var(--app-primary);
  color: var(--app-primary-contrast);
  display: grid;
  place-items: center;
}

.left-nav__title {
  font-size: 0.9rem;
  margin: 0;
  font-weight: 700;
}

.left-nav__subtitle {
  margin: 4px 0 0;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
  display: flex;
  gap: 4px;
  align-items: center;
}

.left-nav__count {
  margin-top: 12px;
  background: var(--app-muted);
  border-radius: 10px;
  padding: 6px 8px;
  font-size: 0.75rem;
  text-align: center;
  font-weight: 600;
}

.left-nav__city {
  width: 100%;
  margin-top: 10px;
}

.left-nav__items {
  flex: 1;
  padding: 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.left-nav__item {
  width: 100%;
  border: none;
  background: transparent;
  padding: 12px;
  border-radius: 14px;
  display: flex;
  gap: 10px;
  align-items: flex-start;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.2s ease,
    color 0.2s ease;
  color: var(--app-foreground);
}

.left-nav__item i {
  color: var(--app-primary);
  font-size: 0.95rem;
  margin-top: 2px;
}

.left-nav__item span {
  display: block;
  font-weight: 600;
  font-size: 0.85rem;
}

.left-nav__item small {
  display: block;
  font-size: 0.7rem;
  color: var(--app-muted-foreground);
  margin-top: 2px;
}

.left-nav__item:hover {
  background: var(--app-muted);
}

.left-nav__item--active {
  background: var(--app-primary);
  color: var(--app-primary-contrast);
}

.left-nav__item--active i,
.left-nav__item--active small {
  color: var(--app-primary-contrast);
}

.left-nav__badge {
  margin-left: auto;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  padding: 2px 8px;
  font-size: 0.6rem;
  font-weight: 600;
}

.left-nav__heatmap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.left-nav__submenu {
  margin-left: 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 6px;
  background: rgba(241, 237, 232, 0.6);
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.left-nav__submenu button {
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
}

.left-nav__submenu button:hover {
  background: var(--app-card);
}

.left-nav__chevron {
  margin-left: auto;
  font-size: 0.75rem;
  color: var(--app-muted-foreground);
  transition: transform 0.2s ease;
}

.left-nav__chevron.rotated {
  transform: rotate(90deg);
}

.left-nav__footer {
  padding: 14px 12px;
  text-align: center;
  font-size: 0.65rem;
  color: var(--app-muted-foreground);
  border-top: 1px solid var(--app-border);
}
</style>
