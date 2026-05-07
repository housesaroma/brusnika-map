<template>
  <div class="map-screen">
    <LeftNavPanel
      :total-flats="displayBuildings.length"
      :has-active-filters="hasFilters"
      :heat-mode="heatMode"
      :heatmap-options="heatmapOptions"
      :selected-city="selectedCity"
      :city-options="cityOptions"
      @valuation="showValuation = true"
      @filters="showFilters = true"
      @heatmap="handleHeatmapToggle"
      @city-change="handleCityChange"
    />

    <div class="map-stage">
      <SearchBar :city-label="selectedCity?.label" @search="handleSearch" />

      <MapCanvas
        :center="selectedCity?.center"
        :zoom="12"
        :loading="isMapLoading"
        :loading-phase="loadingPhase"
        :loading-percent="loadingPercent"
        :loading-loaded="buildingsLoaded"
        :loading-total="buildingsTotal"
        :buildings="displayBuildings"
        :selected-building-id="selectedBuilding?.id || null"
        :analog-flats="[]"
        :is-drawing="isDrawing"
        :polygon-points="polygonPoints"
        :saved-polygon="activePolygon"
        :drawing-enabled-at="drawingEnabledAt"
        :heat-mode="heatMode"
        :heat-points="heatPoints"
        :search-target="searchTarget"
        @building-click="handleBuildingClick"
        @add-point="handleAddPoint"
        @favorites="showFavorites = true"
        @toggle-drawing="toggleDrawing"
      />

      <div v-if="isDrawing" class="drawing-hint">
        <span>
          Точек: <strong>{{ polygonPoints.length }}</strong>
        </span>
        <div class="drawing-hint__divider"></div>
        <button :disabled="polygonPoints.length < 3" @click="finishPolygon">
          Завершить полигон
        </button>
      </div>

      <PropertySidebar
        :building="selectedBuilding"
        :flats="selectedBuildingFlats"
        :selected-flat-id="selectedFlat?.id"
        :is-open="!!selectedBuilding && !showPolygonSidebar"
        @close="clearBuildingSelection"
        @flat-click="handleFlatClick"
      />

      <PolygonSidebar
        :is-open="showPolygonSidebar"
        :flats="displayFlats"
        :selected-flat-id="selectedFlat?.id"
        @close="closePolygonSidebar"
        @flat-click="handleFlatClick"
        @save="handleSavePolygon"
      />
    </div>

    <PropertyDetailModal
      :open="showDetailModal"
      :flat="selectedFlat"
      :prediction="prediction"
      :loading-prediction="predictionLoading"
      @close="showDetailModal = false"
    />

    <ValuationModal :open="showValuation" @close="showValuation = false" />

    <FiltersModal
      :open="showFilters"
      :current-filters="filters"
      @close="showFilters = false"
      @apply="handleApplyFilters"
      @save="handleSaveFilters"
    />

    <FavoritesModal
      :open="showFavorites"
      :favorites="cityFavorites"
      @close="showFavorites = false"
      @select="handleSelectFavorite"
      @delete="handleDeleteFavorite"
      @rename="handleRenameFavorite"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';

import LeftNavPanel from '@/components/toolbar/LeftNavPanel.vue';
import MapCanvas from '@/components/map/MapCanvas.vue';
import SearchBar from '@/components/map/SearchBar.vue';
import PropertySidebar from '@/components/sidebar/PropertySidebar.vue';
import PolygonSidebar from '@/components/sidebar/PolygonSidebar.vue';
import PropertyDetailModal from '@/components/modals/PropertyDetailModal.vue';
import ValuationModal from '@/components/modals/ValuationModal.vue';
import FiltersModal from '@/components/modals/FiltersModal.vue';
import FavoritesModal from '@/components/modals/FavoritesModal.vue';

import mapApi from '@/api/map';
import savedApi from '@/api/saved';
import predictionsApi from '@/api/predictions';

import { CITY_OPTIONS, getDefaultCity } from '@/utils/cities';
import { loadCitySelection, saveCitySelection } from '@/utils/cityStorage';
import { loadFilters, saveFilters } from '@/utils/filtersStorage';
import { loadFavorites, saveFavorites } from '@/utils/favoritesStorage';
import {
  DEFAULT_FILTERS,
  hasActiveFilters as hasActiveFiltersUtil,
  applyFiltersToFlats,
} from '@/utils/filters';
import { normalizeBuilding, normalizeFlat } from '@/utils/normalize';
import { parseGeoPointString, serializeGeoPoints } from '@/utils/geo';
import { getHeatValue, normalizeHeatValues } from '@/utils/heatmap';
import { favoriteToServerPayload, normalizeFavorite } from '@/utils/favorites';
import { usePointInPolygon } from '@/composables/usePointInPolygon';

const toast = useToast();
const { isPointInside } = usePointInPolygon();

const cityOptions = CITY_OPTIONS;
const selectedCity = ref(getDefaultCity());
const savedCity = loadCitySelection();
if (savedCity?.id) {
  const match = cityOptions.find((city) => city.id === savedCity.id);
  if (match) selectedCity.value = match;
}

const buildings = ref([]);
const flats = ref([]);
const buildingsLoading = ref(false);
const flatsLoading = ref(false);
const buildingsLoaded = ref(0);
const buildingsTotal = ref(0);
const flatsLoadedOnce = ref(false);
const flatsLoadFailed = ref(false);
const flatsLoadingReason = ref('filters');

const filters = ref(loadFilters());
const favorites = ref(loadFavorites());
const favoritesSynced = ref(false);

const selectedBuilding = ref(null);
const selectedFlat = ref(null);

const showDetailModal = ref(false);
const showValuation = ref(false);
const showFilters = ref(false);
const showFavorites = ref(false);

const prediction = ref(null);
const predictionLoading = ref(false);

const isDrawing = ref(false);
const polygonPoints = ref([]);
const activePolygon = ref(null);
const showPolygonSidebar = ref(false);
const drawingEnabledAt = ref(0);

const heatMode = ref(null);
const heatData = ref([]);

const searchTarget = ref(null);

const heatmapOptions = computed(() => {
  const options = [
    { id: 'price', label: 'По цене' },
    { id: 'count', label: 'По кол-ву объявлений' },
    { id: 'year', label: 'По году постройки' },
  ];
  if (
    heatData.value.some((item) => Number(item.MedianPredictedPrice || item.medianPredictedPrice))
  ) {
    options.push({ id: 'predicted', label: 'По прогнозной цене' });
  }
  return options;
});

const hasFilters = computed(() => hasActiveFiltersUtil(filters.value));

const closedPolygon = computed(() => {
  if (!activePolygon.value || activePolygon.value.length < 3) return null;
  const points = [...activePolygon.value];
  const [firstLng, firstLat] = points[0];
  const [lastLng, lastLat] = points[points.length - 1];
  if (firstLng !== lastLng || firstLat !== lastLat) {
    points.push([firstLng, firstLat]);
  }
  return points;
});

const filteredFlats = computed(() => applyFiltersToFlats(flats.value, filters.value));

const displayFlats = computed(() => {
  if (!closedPolygon.value) return filteredFlats.value;
  return filteredFlats.value.filter((flat) =>
    flat.center ? isPointInside(flat.center, closedPolygon.value) : false
  );
});

const displayBuildings = computed(() => {
  const countsByBuildingId = new Map();
  const countsByCoord = new Map();
  displayFlats.value.forEach((flat) => {
    if (flat.buildingId) {
      countsByBuildingId.set(flat.buildingId, (countsByBuildingId.get(flat.buildingId) || 0) + 1);
      return;
    }
    if (!flat.coordKey) return;
    countsByCoord.set(flat.coordKey, (countsByCoord.get(flat.coordKey) || 0) + 1);
  });

  const canUseFlatsForCounts = flatsLoadedOnce.value && !flatsLoadFailed.value;

  return buildings.value
    .map((building) => ({
      ...building,
      flatCount: canUseFlatsForCounts
        ? (countsByBuildingId.get(building.id) ?? countsByCoord.get(building.coordKey) ?? 0)
        : building.flatCount || 0,
    }))
    .filter((building) => building.flatCount > 0);
});

const selectedBuildingFlats = computed(() => {
  if (!selectedBuilding.value) return [];
  if (!flatsLoadedOnce.value || flatsLoadFailed.value) return [];

  const selectedId = selectedBuilding.value.id;
  if (selectedId) {
    const byId = displayFlats.value.filter((flat) => flat.buildingId === selectedId);
    if (byId.length) return byId;
  }
  const selectedCoordKey = selectedBuilding.value.coordKey;
  if (!selectedCoordKey) return [];
  return displayFlats.value.filter((flat) => flat.coordKey === selectedCoordKey);
});

const cityFavorites = computed(() =>
  favorites.value.filter(
    (favorite) => favorite.cityId && favorite.cityId === selectedCity.value?.id
  )
);

const heatPoints = computed(() => {
  if (!heatMode.value || !heatData.value.length) return [];
  const values = heatData.value.map((item) => getHeatValue(item, heatMode.value));
  const normalized = normalizeHeatValues(values);
  return heatData.value
    .map((item, index) => ({
      id: item.coordinates || item.Coordinates || index,
      coordinates: parseGeoPointString(item.coordinates || item.Coordinates || '')[0],
      value: normalized[index] ?? 0,
    }))
    .filter((point) => Array.isArray(point.coordinates));
});

const isMapLoading = computed(() => buildingsLoading.value || flatsLoading.value);
const loadingPhase = computed(() => {
  if (buildingsLoading.value) return 'buildings';
  if (flatsLoading.value) return flatsLoadingReason.value;
  return null;
});
const loadingPercent = computed(() => {
  if (!buildingsLoading.value) return null;
  if (!Number.isFinite(buildingsTotal.value) || buildingsTotal.value <= 0) return null;
  const ratio = (buildingsLoaded.value / buildingsTotal.value) * 100;
  return Math.max(0, Math.min(100, Math.round(ratio)));
});

watch(showFavorites, (value) => {
  if (value) {
    syncFavorites();
  }
});

watch(
  () => selectedCity.value,
  () => {
    if (selectedCity.value) {
      saveCitySelection(selectedCity.value);
      resetMapState();
      loadCityData();
    }
  }
);

watch(
  () => favorites.value,
  (value) => {
    saveFavorites(value);
  },
  { deep: true }
);

onMounted(() => {
  loadCityData();
});

async function loadCityData() {
  if (!selectedCity.value?.id) {
    toast.add({
      severity: 'warn',
      summary: 'Город',
      detail: 'Не задан идентификатор города для API.',
      life: 4000,
    });
    return;
  }

  await Promise.all([loadBuildings(), loadFlats(), loadHeatmapIfNeeded()]);
}

async function loadBuildings() {
  buildings.value = [];
  buildingsLoading.value = true;
  buildingsLoaded.value = 0;
  buildingsTotal.value = 0;

  try {
    const pageSize = 200;
    let page = 1;
    let total = 0;
    const nextBuildings = [];

    do {
      const { data } = await mapApi.getBuildings(selectedCity.value.id, { page, pageSize });
      const list = data.Buildings || data.buildings || [];
      total = data.Amount || data.amount || list.length;
      buildingsTotal.value = Number(total) || nextBuildings.length + list.length;
      nextBuildings.push(...list.map(normalizeBuilding));
      buildingsLoaded.value = nextBuildings.length;
      page += 1;
      if (!list.length) break;
    } while (nextBuildings.length < total);

    // Important: assign once to avoid massive child-patching while map initializes.
    buildings.value = nextBuildings;
  } catch (error) {
    console.error(error);
    toast.add({
      severity: 'error',
      summary: 'Карта',
      detail: 'Не удалось загрузить здания.',
      life: 3000,
    });
  } finally {
    if (buildingsTotal.value > 0) {
      buildingsLoaded.value = Math.min(buildingsLoaded.value, buildingsTotal.value);
    }
    buildingsLoading.value = false;
  }
}

async function loadFlats(reason = 'filters') {
  flats.value = [];
  flatsLoading.value = true;
  flatsLoadingReason.value = reason;
  flatsLoadFailed.value = false;

  const payload = buildFilterPayload();
  if (!payload) {
    flatsLoading.value = false;
    flatsLoadFailed.value = true;
    return;
  }

  try {
    const { data } = await mapApi.searchFlats(payload);
    const list = data || [];
    flats.value = list.map((flat) => normalizeFlat(flat));
    flatsLoadedOnce.value = true;
  } catch (error) {
    console.error(error);
    flatsLoadFailed.value = true;
    toast.add({
      severity: 'error',
      summary: 'Карта',
      detail: 'Не удалось загрузить квартиры.',
      life: 3000,
    });
  } finally {
    flatsLoading.value = false;
  }
}

async function loadHeatmapIfNeeded() {
  if (!selectedCity.value?.id) return;
  if (!heatMode.value) return;
  await loadHeatmap();
}

async function loadHeatmap() {
  try {
    const { data } = await mapApi.getHeatmap(selectedCity.value.id);
    heatData.value = data.HeatMapObjects || data.heatMapObjects || [];
  } catch (error) {
    console.error(error);
    toast.add({
      severity: 'warn',
      summary: 'Тепловая карта',
      detail: 'Не удалось загрузить данные тепловой карты.',
      life: 3000,
    });
  }
}

function buildFilterPayload() {
  if (!selectedCity.value?.id) return null;

  const limit = Number(import.meta.env.VITE_MAP_FLATS_LIMIT || 2000);
  const [minArea, maxArea] = normalizeRange(filters.value.areaMin, filters.value.areaMax, 1e6);
  const [minRooms, maxRooms] = normalizeRange(filters.value.roomsMin, filters.value.roomsMax, 20);
  const [minFloor, maxFloor] = normalizeRange(filters.value.floorMin, filters.value.floorMax, 200);
  const [minPrice, maxPrice] = normalizeRange(filters.value.priceMin, filters.value.priceMax, 1e12);

  return {
    CityId: selectedCity.value.id,
    minArea,
    maxArea,
    minRooms,
    maxRooms,
    minFloor,
    maxFloor,
    minPrice,
    maxPrice,
    minSQM: 0,
    maxSQM: 0,
    GeoPoint: activePolygon.value ? serializeGeoPoints(activePolygon.value) : '',
    Limit: limit,
  };
}

function normalizeRange(minRaw, maxRaw, defaultMax) {
  const min = Number(minRaw) || 0;
  const max = Number(maxRaw) || 0;
  if (!min && !max) return [0, 0];
  if (!max) return [min, defaultMax];
  if (!min) return [0, max];
  return [min, max];
}

function handleSearch(result) {
  searchTarget.value = result;
}

function handleBuildingClick(building) {
  selectedBuilding.value = building;
  showPolygonSidebar.value = false;
  selectedFlat.value = null;
}

function clearBuildingSelection() {
  selectedBuilding.value = null;
  selectedFlat.value = null;
}

function handleFlatClick(flat) {
  selectedFlat.value = flat;
  showDetailModal.value = true;
  fetchPrediction(flat.id);
}

async function fetchPrediction(flatId) {
  if (!flatId) return;
  predictionLoading.value = true;
  prediction.value = null;

  try {
    const { data } = await predictionsApi.getFlatPrediction(flatId);
    prediction.value = {
      predictedPrice: data.predictedPrice ?? data.PredictedPrice,
      deviationPercent: data.deviationPercent ?? data.DeviationPercent,
      actualPrice: data.actualPrice ?? data.ActualPrice,
      status: data.status ?? data.Status,
      recommendation: data.recommendation ?? data.Recommendation,
      confidence: data.confidence ?? data.Confidence,
    };
  } catch (error) {
    console.error(error);
  } finally {
    predictionLoading.value = false;
  }
}

function handleApplyFilters(nextFilters) {
  filters.value = { ...DEFAULT_FILTERS, ...nextFilters };
  saveFilters(filters.value);
  loadFlats();
}

function handleSaveFilters(nextFilters) {
  const favorite = {
    id: `fav_${Date.now()}`,
    name: `Конфигурация ${favorites.value.length + 1}`,
    filters: { ...nextFilters },
    geoPoints: activePolygon.value || [],
    cityId: selectedCity.value?.id || null,
    source: 'local',
  };
  favorites.value = [favorite, ...favorites.value];
  toast.add({
    severity: 'success',
    summary: 'Избранное',
    detail: 'Конфигурация сохранена',
    life: 3000,
  });
}

function toggleDrawing() {
  if (isDrawing.value) {
    isDrawing.value = false;
    polygonPoints.value = [];
    return;
  }

  isDrawing.value = true;
  polygonPoints.value = [];
  activePolygon.value = null;
  showPolygonSidebar.value = false;
  drawingEnabledAt.value = Date.now();
}

function handleAddPoint(point) {
  polygonPoints.value = [...polygonPoints.value, point];
}

function finishPolygon() {
  if (polygonPoints.value.length < 3) return;
  activePolygon.value = [...polygonPoints.value];
  polygonPoints.value = [];
  isDrawing.value = false;
  showPolygonSidebar.value = true;
  loadFlats('polygon');
}

function closePolygonSidebar() {
  showPolygonSidebar.value = false;
  activePolygon.value = null;
  loadFlats();
}

async function handleSavePolygon(name) {
  if (!activePolygon.value?.length) return;

  const favorite = {
    id: `fav_${Date.now()}`,
    name,
    filters: { ...filters.value },
    geoPoints: [...activePolygon.value],
    cityId: selectedCity.value?.id || null,
    source: 'local',
  };

  favorites.value = [favorite, ...favorites.value];
  toast.add({ severity: 'success', summary: 'Избранное', detail: 'Полигон сохранен', life: 3000 });

  try {
    const payload = favoriteToServerPayload(favorite);
    const { data } = await savedApi.createPolygon(payload);
    if (data?.id || data?.Id) {
      favorite.source = 'server';
      favorite.serverId = data.id || data.Id;
    }
  } catch (error) {
    console.warn('Failed to sync polygon to server', error);
  }
}

function handleSelectFavorite(favorite) {
  if (favorite.filters) {
    filters.value = { ...DEFAULT_FILTERS, ...favorite.filters };
  }
  if (favorite.geoPoints?.length > 2) {
    activePolygon.value = [...favorite.geoPoints];
    showPolygonSidebar.value = true;
  } else {
    activePolygon.value = null;
    showPolygonSidebar.value = false;
  }
  selectedBuilding.value = null;
  selectedFlat.value = null;
  showFavorites.value = false;
  loadFlats('polygon');
}

async function handleDeleteFavorite(favorite) {
  favorites.value = favorites.value.filter((item) => item.id !== favorite.id);
  if (favorite.serverId) {
    try {
      await savedApi.deletePolygon(favorite.serverId);
    } catch (error) {
      console.warn('Failed to delete polygon on server', error);
    }
  }
  toast.add({ severity: 'success', summary: 'Избранное', detail: 'Удалено', life: 3000 });
}

function handleRenameFavorite(updated) {
  favorites.value = favorites.value.map((item) =>
    item.id === updated.id ? { ...item, name: updated.name } : item
  );
}

function handleHeatmapToggle(mode) {
  heatMode.value = mode;
  if (heatMode.value) {
    loadHeatmap();
  }
}

function handleCityChange(city) {
  selectedCity.value = city;
}

async function syncFavorites() {
  if (favoritesSynced.value) return;
  try {
    const { data } = await savedApi.getPolygons();
    const list = data?.SavedPolygons || data?.savedPolygons || [];
    const serverFavorites = list
      .map((item) =>
        normalizeFavorite({
          id: item.id || item.Id,
          name: 'Полигон',
          geoPoints: item.GeoPoints || item.geoPoints,
          cityId: item.CityId || item.cityId || null,
          source: 'server',
          serverId: item.id || item.Id,
        })
      )
      .filter(Boolean);

    const merged = [...serverFavorites, ...favorites.value];
    const unique = [];
    const seen = new Set();

    merged.forEach((fav) => {
      const key = fav.serverId || fav.id;
      if (seen.has(key)) return;
      seen.add(key);
      unique.push(fav);
    });

    favorites.value = unique;
    favoritesSynced.value = true;
  } catch (error) {
    console.warn('Failed to load server favorites', error);
  }
}

function resetMapState() {
  selectedBuilding.value = null;
  selectedFlat.value = null;
  activePolygon.value = null;
  polygonPoints.value = [];
  showPolygonSidebar.value = false;
  heatMode.value = null;
  heatData.value = [];
}
</script>

<style scoped>
.map-screen {
  height: 100vh;
  display: flex;
  background: var(--app-bg);
}

.map-stage {
  position: relative;
  flex: 1;
  overflow: hidden;
}

.drawing-hint {
  position: absolute;
  left: 50%;
  bottom: 24px;
  transform: translateX(-50%);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 0, 30, 0.3);
  border-radius: 14px;
  padding: 10px 14px;
  display: flex;
  gap: 10px;
  align-items: center;
  box-shadow: var(--app-shadow);
  z-index: 6;
}

.drawing-hint button {
  border: none;
  background: transparent;
  color: var(--app-primary);
  font-weight: 600;
  cursor: pointer;
}

.drawing-hint button:disabled {
  color: var(--app-muted-foreground);
  cursor: not-allowed;
}

.drawing-hint__divider {
  width: 1px;
  height: 16px;
  background: var(--app-border);
}
</style>
