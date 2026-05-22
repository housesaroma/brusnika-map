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
        :is-editing="isEditing"
        :polygons="polygons"
        :vertex-points="vertexPoints"
        :drawing-enabled-at="drawingEnabledAt"
        :heat-mode="heatMode"
        :heat-points="heatPoints"
        :search-target="searchTarget"
        @building-click="handleBuildingClick"
        @add-point="handleAddPoint"
        @map-click="handleMapClick"
        @update-vertex="handleUpdateVertex"
        @favorites="showFavorites = true"
        @toggle-drawing="toggleDrawing"
      />

      <div v-if="isDrawing || isEditing" class="drawing-hint">
        <template v-if="isDrawing">
          <span>
            Точек: <strong>{{ polygonPoints.length }}</strong> · перетаскивайте вершины
          </span>
          <div class="drawing-hint__divider"></div>
          <button :disabled="polygonPoints.length < 3" @click="finishPolygon">Завершить</button>
        </template>
        <template v-else>
          <span>Редактирование полигона · перетащите точку</span>
          <div class="drawing-hint__divider"></div>
          <button @click="stopEditingPolygon">Готово</button>
        </template>
      </div>

      <PropertySidebar
        :building="selectedBuilding"
        :flats="selectedBuildingFlats"
        :selected-flat-id="selectedFlat?.id"
        :is-open="!!selectedBuilding && !isResultsSidebarOpen && !showResultsTable"
        @close="clearBuildingSelection"
        @flat-click="handleFlatClick"
      />

      <FilterResultsSidebar
        :is-open="isResultsSidebarOpen"
        :mode="resultsSidebarMode"
        :flats="displayFlats"
        :polygons="polygons"
        :editing-polygon-id="editingPolygonId"
        :selected-flat-id="selectedFlat?.id"
        @close="closeResultsSidebar"
        @flat-click="handleFlatClick"
        @save="handleSavePolygon"
        @show-table="openResultsTable"
        @toggle-polygon="togglePolygonSelection"
        @edit-polygon="startEditingPolygon"
        @remove-polygon="removePolygon"
      />

      <FlatsResultsTable
        :is-open="showResultsTable"
        :rows="tableRows"
        :title="resultsTableTitle"
        :selected-flat-id="selectedFlat?.id"
        @close="closeResultsTable"
        @flat-click="handleFlatClick"
      />
    </div>

    <PropertyDetailModal
      :open="showDetailModal"
      :flat="selectedFlat"
      :flat-details="flatDetails"
      :closest-metro="closestMetro"
      :loading-details="flatDetailsLoading"
      :prediction="prediction"
      :loading-prediction="predictionLoading"
      :analogs="flatAnalogs"
      :loading-analogs="analogsLoading"
      @close="closeDetailModal"
      @select-analog="handleAnalogSelect"
    />

    <ValuationModal :open="showValuation" @close="showValuation = false" />

    <FiltersModal
      v-model:open="showFilters"
      :current-filters="filters"
      @apply="handleApplyFilters"
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
import FilterResultsSidebar from '@/components/sidebar/FilterResultsSidebar.vue';
import FlatsResultsTable from '@/components/panels/FlatsResultsTable.vue';
import PropertyDetailModal from '@/components/modals/PropertyDetailModal.vue';
import ValuationModal from '@/components/modals/ValuationModal.vue';
import FiltersModal from '@/components/modals/FiltersModal.vue';
import FavoritesModal from '@/components/modals/FavoritesModal.vue';

import mapApi from '@/api/map';
import { findClosestMetro } from '@/api/geocoder';
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
import { serializeGeoPoints } from '@/utils/geo';
import { getHeatValue, normalizeHeatValues } from '@/utils/heatmap';
import { favoriteToServerPayload, normalizeFavorite } from '@/utils/favorites';
import { usePointInPolygon } from '@/composables/usePointInPolygon';
import { loadBuildingsCache, saveBuildingsCache } from '@/utils/buildingsCache';
import { dedupeBuildings, withBuildingMarkerKeys } from '@/utils/buildings';
import { normalizePrediction, normalizeAnalogList, analogToFlatStub } from '@/utils/prediction';
import { normalizeFlatDetails } from '@/utils/normalizeFlatDetails';
import { buildFlatTableRow } from '@/utils/flatTable';
import { closeRing, createPolygonId } from '@/utils/polygons';
import {
  buildDistrictFavoritesForCity,
  favoriteToMapPolygon,
  isDistrictsSeeded,
  markDistrictsSeeded,
  mergeDistrictFavorites,
} from '@/utils/polygonFavoritesSeed';

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
const flatDetails = ref(null);
const flatDetailsLoading = ref(false);
const closestMetro = ref([]);
const flatAnalogs = ref([]);
const analogsLoading = ref(false);

const isDrawing = ref(false);
const isEditing = ref(false);
const polygonPoints = ref([]);
const polygons = ref([]);
const editingPolygonId = ref(null);
const showFilterResultsSidebar = ref(false);
const showResultsTable = ref(false);
const drawingEnabledAt = ref(0);

const heatMode = ref(null);

const searchTarget = ref(null);

const heatmapOptions = computed(() => {
  // Heatmap is built purely on the frontend from already loaded map data.
  // Buildings allow: count/year. Flats allow: price/sqm/predicted.
  const options = [];
  const hasBuildings = displayBuildings.value.length > 0;
  const hasFlats = displayFlats.value.length > 0;

  if (hasFlats) {
    options.push({ id: 'price', label: 'По цене' });
    options.push({ id: 'sqm', label: 'По цене м²' });
    options.push({ id: 'count', label: 'По кол-ву объявлений' });
  } else if (hasBuildings) {
    options.push({ id: 'count', label: 'По кол-ву объявлений' });
  }

  if (hasBuildings) {
    options.push({ id: 'year', label: 'По году постройки' });
  }

  return options;
});

const hasFilters = computed(() => hasActiveFiltersUtil(filters.value));

const selectedPolygons = computed(() =>
  polygons.value.filter((polygon) => polygon.selected && polygon.points.length >= 3)
);

const isPolygonModeActive = computed(() => selectedPolygons.value.length > 0);

const resultsSidebarMode = computed(() => (isPolygonModeActive.value ? 'polygon' : 'filters'));

const isResultsSidebarOpen = computed(() => {
  if (showResultsTable.value || selectedBuilding.value || flatsLoadFailed.value) return false;
  if (isPolygonModeActive.value) return true;
  return showFilterResultsSidebar.value && hasFilters.value && flatsLoadedOnce.value;
});

const resultsTableTitle = computed(() =>
  isPolygonModeActive.value ? 'Объекты в полигонах' : 'Результаты фильтрации'
);

const vertexPoints = computed(() => {
  if (isDrawing.value) return polygonPoints.value;
  if (isEditing.value && editingPolygonId.value) {
    const polygon = polygons.value.find((item) => item.id === editingPolygonId.value);
    return polygon?.points || [];
  }
  return [];
});

const closedSelectedRings = computed(() =>
  selectedPolygons.value.map((polygon) => closeRing(polygon.points)).filter(Boolean)
);

const tableRows = computed(() => displayFlats.value.map((flat) => buildFlatTableRow(flat)));

const filteredFlats = computed(() => applyFiltersToFlats(flats.value, filters.value));

const displayFlats = computed(() => {
  if (!closedSelectedRings.value.length) return filteredFlats.value;
  return filteredFlats.value.filter(
    (flat) =>
      flat.center && closedSelectedRings.value.some((ring) => isPointInside(flat.center, ring))
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

  const mapped = buildings.value
    .map((building) => ({
      ...building,
      flatCount: canUseFlatsForCounts
        ? (countsByBuildingId.get(building.id) ?? countsByCoord.get(building.coordKey) ?? 0)
        : building.flatCount || 0,
    }))
    .filter((building) => building.flatCount > 0);

  return withBuildingMarkerKeys(mapped);
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
  if (!heatMode.value) return [];
  const mode = heatMode.value;
  const buildingsItems = buildHeatItemsFromBuildings(displayBuildings.value);
  const flatsItems = buildHeatItemsFromFlats(displayFlats.value);

  // `count` can be derived from both buildings and flats.
  // Prefer buildings (more stable), fallback to flats when buildings are not available.
  const items =
    mode === 'year'
      ? buildingsItems
      : mode === 'count'
        ? buildingsItems.length
          ? buildingsItems
          : flatsItems
        : flatsItems;

  if (!items.length) return [];

  const values = items.map((item) => getHeatValue(item, mode));
  const normalized = normalizeHeatValues(values);

  return items
    .map((item, index) => ({
      id: index,
      coordinates: item.coordinates,
      value: normalized[index] ?? 0,
    }))
    .filter((point) => Array.isArray(point.coordinates) && point.coordinates.length === 2);
});

function buildHeatItemsFromBuildings(buildingsList) {
  if (!Array.isArray(buildingsList) || !buildingsList.length) return [];
  return buildingsList
    .filter((building) => Array.isArray(building.center) && building.center.length === 2)
    .map((building) => ({
      FlatsCount: Number(building.flatCount || 0),
      YearBuilt: building.yearBuilt || 0,
      coordinates: building.center,
    }));
}

function buildHeatItemsFromFlats(flatsList) {
  if (!Array.isArray(flatsList) || !flatsList.length) return [];

  const buckets = new Map();

  for (const flat of flatsList) {
    if (!Array.isArray(flat.center) || flat.center.length !== 2) continue;
    const key = flat.coordKey || JSON.stringify(flat.center);
    const existing = buckets.get(key);
    if (!existing) {
      buckets.set(key, {
        coordinates: flat.center,
        sumPrice: flat.price || 0,
        sumSqmPrice: flat.sqm || 0,
        count: 1,
      });
    } else {
      existing.sumPrice += flat.price || 0;
      existing.sumSqmPrice += flat.sqm || 0;
      existing.count += 1;
    }
  }

  return Array.from(buckets.values()).map((bucket) => ({
    MedianActualPrice: bucket.count ? bucket.sumPrice / bucket.count : 0,
    PricePerSqm: bucket.count ? bucket.sumSqmPrice / bucket.count : 0,
    FlatsCount: bucket.count,
    coordinates: bucket.coordinates,
  }));
}

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
  () => heatMode.value,
  (mode) => {
    // If user selected a mode that requires flats but flats are not loaded,
    // auto-disable to avoid confusing "empty" heatmap state.
    const needsFlats = mode === 'price' || mode === 'sqm' || mode === 'predicted';
    if (needsFlats && !displayFlats.value.length) {
      heatMode.value = null;
      toast.add({
        severity: 'warn',
        summary: 'Тепловая карта',
        detail: 'Для этого режима нужны загруженные квартиры.',
        life: 3000,
      });
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

async function seedDistrictFavoritesForCity() {
  const city = selectedCity.value;
  if (!city?.id || isDistrictsSeeded(city.id)) return;

  try {
    const districtFavorites = await buildDistrictFavoritesForCity(city);
    if (!districtFavorites.length) return;
    favorites.value = mergeDistrictFavorites(favorites.value, districtFavorites, city.id);
    markDistrictsSeeded(city.id);
  } catch (error) {
    console.warn('Failed to seed district favorites', error);
  }
}

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

  await loadBuildings();
  await seedDistrictFavoritesForCity();
  await loadFlats();
}

async function loadBuildings() {
  const cityId = selectedCity.value?.id;
  if (!cityId) return;

  const cached = loadBuildingsCache(cityId);
  if (cached?.buildings?.length) {
    const cachedBuildings = dedupeBuildings(cached.buildings);
    buildings.value = cachedBuildings;
    buildingsLoaded.value = cachedBuildings.length;
    buildingsTotal.value = cachedBuildings.length;

    // If cache is still fresh, skip network completely.
    if (cached.isFresh) {
      buildingsLoading.value = false;
      return;
    }
    // Stale-while-revalidate: show cached data immediately, refresh silently.
  } else {
    buildings.value = [];
    buildingsLoaded.value = 0;
    buildingsTotal.value = 0;
  }

  try {
    // Only show loader overlay when we have nothing to show yet.
    buildingsLoading.value = !cached?.buildings?.length;
    const pageSize = 200;
    let page = 1;
    let total = 0;
    const nextBuildings = [];

    do {
      const { data } = await mapApi.getBuildings(cityId, { page, pageSize });
      const list = data.Buildings || data.buildings || [];
      total = data.Amount || data.amount || list.length;
      buildingsTotal.value = Number(total) || nextBuildings.length + list.length;
      nextBuildings.push(...list.map(normalizeBuilding));
      buildingsLoaded.value = nextBuildings.length;
      page += 1;
      if (!list.length) break;
    } while (nextBuildings.length < total);

    // Important: assign once to avoid massive child-patching while map initializes.
    const uniqueBuildings = dedupeBuildings(nextBuildings);
    buildings.value = uniqueBuildings;
    saveBuildingsCache(cityId, uniqueBuildings);
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
    const normalized = list.map((flat) => normalizeFlat(flat));
    const addressByCoord = new Map(
      buildings.value
        .filter((building) => building.coordKey && building.address)
        .map((building) => [building.coordKey, building.address])
    );

    flats.value = normalized.map((flat) => {
      if (flat.address && flat.address !== 'Без адреса') return flat;
      const address = addressByCoord.get(flat.coordKey);
      return address ? { ...flat, address } : flat;
    });
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
    GeoPoint:
      selectedPolygons.value.length === 1
        ? serializeGeoPoints(selectedPolygons.value[0].points)
        : '',
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
  showResultsTable.value = false;
  selectedFlat.value = null;
}

function clearBuildingSelection() {
  selectedBuilding.value = null;
  selectedFlat.value = null;
}

function handleFlatClick(flat) {
  if (!flat?.id) return;

  selectedFlat.value = flat;
  showDetailModal.value = true;
  flatDetails.value = null;
  closestMetro.value = [];
  flatAnalogs.value = [];
  fetchFlatDetails(flat);
  fetchPrediction(flat.id);
  fetchAnalogs(flat.id);
}

function handleAnalogSelect(analog) {
  const flat = analogToFlatStub(analog);
  if (!flat?.id) return;
  handleFlatClick(flat);
}

function closeDetailModal() {
  showDetailModal.value = false;
  flatDetails.value = null;
  closestMetro.value = [];
  flatAnalogs.value = [];
}

async function fetchAnalogs(flatId) {
  if (!flatId) return;

  analogsLoading.value = true;
  flatAnalogs.value = [];

  try {
    const { data } = await predictionsApi.getFlatAnalogs(flatId);
    flatAnalogs.value = normalizeAnalogList(data);
  } catch (error) {
    console.error(error);
    toast.add({
      severity: 'warn',
      summary: 'Аналоги',
      detail: 'Не удалось загрузить аналоги.',
      life: 3000,
    });
  } finally {
    analogsLoading.value = false;
  }
}

async function fetchFlatDetails(flat) {
  if (!flat?.id) return;

  flatDetailsLoading.value = true;
  flatDetails.value = null;
  closestMetro.value = [];

  try {
    const { data } = await mapApi.getFlat(flat.id);
    const details = normalizeFlatDetails(data);
    flatDetails.value = details;

    if (!details?.metro && Array.isArray(flat.center) && flat.center.length === 2) {
      try {
        closestMetro.value = await findClosestMetro(flat.center, { results: 3, skip: 1 });
      } catch (metroError) {
        console.warn('Failed to resolve closest metro', metroError);
      }
    }
  } catch (error) {
    console.error(error);
    toast.add({
      severity: 'warn',
      summary: 'Квартира',
      detail: 'Не удалось загрузить детали объекта.',
      life: 3000,
    });
  } finally {
    flatDetailsLoading.value = false;
  }
}

async function fetchPrediction(flatId) {
  if (!flatId) return;
  predictionLoading.value = true;
  prediction.value = null;

  try {
    const { data } = await predictionsApi.getFlatPrediction(flatId);
    prediction.value = normalizePrediction(data);
  } catch (error) {
    console.error(error);
  } finally {
    predictionLoading.value = false;
  }
}

function handleApplyFilters(nextFilters) {
  showFilters.value = false;
  filters.value = { ...DEFAULT_FILTERS, ...nextFilters };
  saveFilters(filters.value);
  showFilterResultsSidebar.value = hasActiveFiltersUtil(filters.value);
  showResultsTable.value = false;
  selectedBuilding.value = null;
  loadFlats();
}

function toggleDrawing() {
  showFilters.value = false;

  if (isDrawing.value) {
    isDrawing.value = false;
    polygonPoints.value = [];
    return;
  }

  stopEditingPolygon();
  isDrawing.value = true;
  polygonPoints.value = [];
  showFilterResultsSidebar.value = false;
  showResultsTable.value = false;
  drawingEnabledAt.value = Date.now();
}

function handleAddPoint(point) {
  polygonPoints.value = [...polygonPoints.value, point];
}

function handleUpdateVertex({ index, coordinates, commit = true }) {
  if (!Array.isArray(coordinates) || coordinates.length !== 2) return;

  if (isDrawing.value) {
    const next = [...polygonPoints.value];
    if (!next[index]) return;
    next[index] = coordinates;
    polygonPoints.value = next;
    return;
  }

  if (!editingPolygonId.value) return;
  const polygonIndex = polygons.value.findIndex((item) => item.id === editingPolygonId.value);
  if (polygonIndex < 0) return;

  const nextPoints = [...polygons.value[polygonIndex].points];
  if (!nextPoints[index]) return;
  nextPoints[index] = coordinates;
  polygons.value[polygonIndex] = {
    ...polygons.value[polygonIndex],
    points: nextPoints,
  };

  if (commit) {
    loadFlats('polygon');
  }
}

function handleMapClick(coords) {
  const hitCandidates = polygons.value
    .filter((polygon) => polygon.points.length >= 3)
    .map((polygon) => ({ id: polygon.id, ring: closeRing(polygon.points) }))
    .filter((item) => item.ring);

  for (let index = hitCandidates.length - 1; index >= 0; index -= 1) {
    const candidate = hitCandidates[index];
    if (isPointInside(coords, candidate.ring)) {
      togglePolygonSelection(candidate.id);
      return;
    }
  }
}

function togglePolygonSelection(polygonId) {
  const polygonIndex = polygons.value.findIndex((item) => item.id === polygonId);
  if (polygonIndex < 0) return;
  polygons.value[polygonIndex] = {
    ...polygons.value[polygonIndex],
    selected: !polygons.value[polygonIndex].selected,
  };
  showFilterResultsSidebar.value = false;
  showResultsTable.value = false;
  selectedBuilding.value = null;
  loadFlats('polygon');
}

function startEditingPolygon(polygonId) {
  const polygon = polygons.value.find((item) => item.id === polygonId);
  if (!polygon || polygon.points.length < 3) return;
  isDrawing.value = false;
  polygonPoints.value = [];
  isEditing.value = true;
  editingPolygonId.value = polygonId;
}

function stopEditingPolygon() {
  isEditing.value = false;
  editingPolygonId.value = null;
}

function removePolygon(polygonId) {
  polygons.value = polygons.value.filter((item) => item.id !== polygonId);
  if (editingPolygonId.value === polygonId) {
    stopEditingPolygon();
  }
  loadFlats(polygons.value.some((item) => item.selected) ? 'polygon' : 'filters');
}

function applyFavoritePolygon(favorite) {
  const mapPolygon = favoriteToMapPolygon(favorite);
  if (!mapPolygon) return;

  const existingIndex = polygons.value.findIndex((item) => item.presetId === favorite.id);
  if (existingIndex >= 0) {
    polygons.value[existingIndex] = {
      ...polygons.value[existingIndex],
      selected: !polygons.value[existingIndex].selected,
    };
  } else {
    polygons.value.push(mapPolygon);
  }
}

function finishPolygon() {
  if (polygonPoints.value.length < 3) return;

  const polygon = {
    id: createPolygonId(),
    name: 'Новый полигон',
    points: [...polygonPoints.value],
    selected: true,
    isDistrict: false,
  };

  polygons.value.push(polygon);
  polygonPoints.value = [];
  isDrawing.value = false;
  showFilterResultsSidebar.value = false;
  showResultsTable.value = false;
  selectedBuilding.value = null;
  startEditingPolygon(polygon.id);
  loadFlats('polygon');
}

function closeResultsSidebar() {
  if (isPolygonModeActive.value) {
    polygons.value = polygons.value.map((polygon) => ({ ...polygon, selected: false }));
    stopEditingPolygon();
    loadFlats();
    return;
  }

  showFilterResultsSidebar.value = false;
}

function openResultsTable() {
  showResultsTable.value = true;
}

function closeResultsTable() {
  showResultsTable.value = false;
}

async function handleSavePolygon(name) {
  const polygonToSave =
    (editingPolygonId.value && polygons.value.find((item) => item.id === editingPolygonId.value)) ||
    selectedPolygons.value[0];

  if (!polygonToSave?.points?.length) return;

  const favorite = {
    id: `fav_${Date.now()}`,
    name,
    filters: { ...filters.value },
    geoPoints: [...polygonToSave.points],
    cityId: selectedCity.value?.id || null,
    source: 'local',
    isDistrict: false,
  };

  polygonToSave.presetId = favorite.id;
  polygonToSave.name = name;

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
  const hasPolygon = Array.isArray(favorite.geoPoints) && favorite.geoPoints.length > 2;
  const hasFilterConfig =
    !!favorite.filters &&
    Object.values(favorite.filters).some(
      (value) => value !== '' && value !== null && value !== undefined
    );

  if (hasFilterConfig) {
    filters.value = { ...DEFAULT_FILTERS, ...favorite.filters };
    saveFilters(filters.value);
  }

  let reason = 'filters';

  if (hasPolygon) {
    applyFavoritePolygon(favorite);
    showFilterResultsSidebar.value = false;
    reason = 'polygon';
  } else {
    showFilterResultsSidebar.value = hasFilterConfig;
  }

  selectedBuilding.value = null;
  selectedFlat.value = null;
  showResultsTable.value = false;
  showFavorites.value = false;
  loadFlats(reason);
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
  polygons.value = [];
  polygonPoints.value = [];
  isDrawing.value = false;
  stopEditingPolygon();
  showFilterResultsSidebar.value = false;
  showResultsTable.value = false;
  heatMode.value = null;
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
