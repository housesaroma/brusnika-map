<template>
  <main class="prototype-page">
    <h1>Прототип геозон: объекты Екатеринбурга</h1>
    <p class="subtitle">
      Кликните <b>Начать рисование</b>, поставьте минимум 3 точки и завершите полигон.
    </p>

    <div v-if="hasApiKey" class="toolbar">
      <button type="button" :disabled="isDrawing" @click="startDrawing">Начать рисование</button>
      <button type="button" :disabled="!canFinishPolygon" @click="finishPolygon">
        Завершить полигон
      </button>
      <button type="button" :disabled="!hasZone" @click="clearZone">Очистить геозону</button>
      <span class="status" :class="{ 'status--drawing': isDrawing }">
        {{ statusText }}
      </span>
    </div>

    <div class="layout">
      <section v-if="hasApiKey" class="map-wrap">
        <yandex-map v-model="map" :settings="settings" width="100%" height="600px">
          <yandex-map-default-scheme-layer />
          <yandex-map-default-features-layer />

          <yandex-map-listener :settings="listenerSettings" />

          <yandex-map-feature v-if="drawingLineFeature" :settings="drawingLineFeature" />
          <yandex-map-feature v-if="polygonFeature" :settings="polygonFeature" />

          <yandex-map-marker
            v-for="marker in displayedMarkers"
            :key="marker.id"
            :settings="{ coordinates: marker.center }"
            position="top left-center"
          >
            <div
              class="property-marker"
              :class="getMarkerClass(marker)"
              @mouseenter="setHoveredProperty(marker)"
              @mouseleave="clearHoveredProperty"
              @click.stop="handleMarkerClick(marker)"
            >
              <span class="property-marker__price">{{ getMarkerLabel(marker) }}</span>

              <article
                v-if="
                  isPriceMode &&
                  marker.kind === 'property' &&
                  hoveredPropertyId === marker.property.id
                "
                class="marker-hover-card"
              >
                <p class="marker-hover-card__address">
                  {{ marker.property.address || marker.property.addressQuery }}
                </p>
                <p class="marker-hover-card__meta">
                  Площадь: {{ formatArea(marker.property.area) }}
                </p>
                <img
                  v-if="marker.property.planUrl"
                  :src="marker.property.planUrl"
                  :alt="`План ${marker.property.name}`"
                  class="marker-hover-card__image"
                />
              </article>
            </div>
          </yandex-map-marker>
        </yandex-map>
      </section>

      <section v-if="hasApiKey" class="panel">
        <h2>Объекты в геозоне</h2>
        <p>
          Всего: <b>{{ mockProperties.length }}</b>
        </p>
        <p>
          В зоне: <b>{{ propertiesInZone.length }}</b>
        </p>
        <p>
          С координатами: <b>{{ locatedPropertiesCount }}</b> / {{ mockProperties.length }}
        </p>
        <p v-if="isPropertiesLoading">Загружаем объекты из локального JSON...</p>
        <p v-else-if="propertiesLoadError" class="panel__error">{{ propertiesLoadError }}</p>
        <p v-if="isCentersLoading">Уточняем координаты объектов через Яндекс...</p>
        <p v-else-if="centerLoadError" class="panel__error">{{ centerLoadError }}</p>
        <ul class="properties-list">
          <li
            v-for="property in propertiesInZone"
            :key="`list-${property.id}`"
            class="properties-list__item"
            @click="openPropertyDrawer(property.id)"
          >
            <span>{{ property.name }}</span>
            <span class="badge badge--inside">Открыть</span>
          </li>
        </ul>
        <p v-if="hasZone && !propertiesInZone.length" class="empty-zone">
          В выбранной геозоне объектов не найдено.
        </p>
      </section>

      <div v-else class="map-placeholder">
        <div class="map-placeholder__content">
          <p class="map-placeholder__title">Введите API-ключ Яндекс Карт</p>
          <p class="map-placeholder__hint">
            Можно указать ключ один раз прямо в интерфейсе и начать пользоваться сайтом.
          </p>
          <input
            v-model="runtimeApiKeyInput"
            type="text"
            class="map-placeholder__input"
            placeholder="Например: 12345678-xxxx-xxxx-xxxx-1234567890ab"
          />
          <button type="button" class="map-placeholder__button" @click="applyRuntimeApiKey">
            Сохранить и запустить карту
          </button>
          <p v-if="runtimeApiKeyError" class="map-placeholder__error">{{ runtimeApiKeyError }}</p>
          <p class="map-placeholder__env">
            Или задайте <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code>.
          </p>
        </div>
      </div>
    </div>

    <aside v-if="selectedProperty" class="drawer" :class="{ 'drawer--open': isDrawerOpen }">
      <header class="drawer__header">
        <h3>{{ selectedProperty.name }}</h3>
        <button type="button" class="drawer__close" @click="closeDrawer">×</button>
      </header>

      <div class="drawer__content">
        <p><b>Адрес:</b> {{ selectedProperty.address || selectedProperty.addressQuery }}</p>
        <p><b>Цена, ₽:</b> {{ selectedProperty.price.toLocaleString('ru-RU') }}</p>
        <p><b>Цена за м², ₽:</b> {{ selectedProperty.pricePerMeter.toLocaleString('ru-RU') }}</p>
        <p><b>Площадь:</b> {{ formatArea(selectedProperty.area) }}</p>
        <p><b>Комнат:</b> {{ selectedProperty.rooms }}</p>
        <p><b>Этаж:</b> {{ selectedProperty.floor }}</p>
        <p><b>Тип:</b> {{ selectedProperty.propertyType }}</p>
        <p><b>Сделка:</b> {{ selectedProperty.dealType }}</p>
        <p><b>Статус:</b> {{ selectedProperty.status }}</p>
        <p><b>Срок сдачи:</b> {{ selectedProperty.endOfBuilding || '—' }}</p>

        <img
          v-if="selectedProperty.planUrl"
          :src="selectedProperty.planUrl"
          :alt="`План ${selectedProperty.name}`"
          class="drawer__image"
        />

        <p v-if="selectedProperty.url">
          <b>Ссылка:</b>
          <a :href="selectedProperty.url" target="_blank" rel="noopener noreferrer"
            >Открыть объявление</a
          >
        </p>

        <p v-if="selectedProperty.description" class="drawer__description">
          {{ selectedProperty.description }}
        </p>

        <div class="drawer__section">
          <h4>Данные Яндекс (геокодер)</h4>
          <p v-if="isYandexMetaLoading">Загрузка...</p>
          <p v-else-if="yandexMetaError" class="drawer__error">{{ yandexMetaError }}</p>
          <template v-else-if="selectedYandexMeta">
            <p><b>Объект:</b> {{ selectedYandexMeta.title }}</p>
            <p><b>Адрес:</b> {{ selectedYandexMeta.address }}</p>
          </template>
          <p v-else>Нет дополнительных данных.</p>
        </div>
      </div>
    </aside>
  </main>
</template>

<script setup>
import { computed, onMounted, shallowRef, ref, watch } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapMarker,
  YandexMapFeature,
  YandexMapListener,
} from 'vue-yandex-maps';
import { getYandexMapsApiKey, saveYandexMapsApiKey } from './utils/yandexApiKey';

const map = shallowRef(null);
const yandexMapsApiKey = getYandexMapsApiKey();
const hasApiKey = Boolean(yandexMapsApiKey);
const centersCacheKey = 'ekb-geocoded-centers-v1';
const localPropertiesDataUrl = '/data/parsing-properties.json';

const settings = {
  location: {
    center: [60.597465, 56.838011],
    zoom: 11,
  },
};

const mockProperties = ref([]);

const isDrawing = ref(false);
const drawingPoints = ref([]);
const isPolygonClosed = ref(false);
const selectedPropertyId = ref(null);
const isDrawerOpen = ref(false);
const hoveredPropertyId = ref(null);

const isYandexMetaLoading = ref(false);
const yandexMetaError = ref('');
const yandexMetaByPropertyId = ref({});
const isCentersLoading = ref(false);
const centerLoadError = ref('');
const isPropertiesLoading = ref(false);
const propertiesLoadError = ref('');
const mapZoom = ref(settings.location.zoom);
const runtimeApiKeyInput = ref('');
const runtimeApiKeyError = ref('');
let activeGeocoderRequestId = 0;

const hasZone = computed(() => isPolygonClosed.value && drawingPoints.value.length >= 3);
const canFinishPolygon = computed(() => isDrawing.value && drawingPoints.value.length >= 3);

const selectedProperty = computed(
  () => mockProperties.value.find((property) => property.id === selectedPropertyId.value) || null
);

const locatedPropertiesCount = computed(
  () => mockProperties.value.filter((property) => isValidCenter(property.center)).length
);

const selectedYandexMeta = computed(() => {
  if (!selectedPropertyId.value) {
    return null;
  }

  return yandexMetaByPropertyId.value[selectedPropertyId.value] || null;
});

const listenerSettings = {
  onUpdate: (event) => {
    if (event?.location?.zoom) {
      mapZoom.value = event.location.zoom;
    }
  },
  onClick: (_, mapEvent) => {
    const coordinates =
      mapEvent?.coordinates ||
      mapEvent?.lngLat ||
      mapEvent?.coordPosition ||
      mapEvent?.location?.center ||
      null;

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      return;
    }

    if (!isDrawing.value || isPolygonClosed.value) {
      clearHoveredProperty();
      return;
    }

    drawingPoints.value = [...drawingPoints.value, coordinates];
  },
};

const closedPolygonCoordinates = computed(() => {
  if (!hasZone.value) {
    return [];
  }

  const points = [...drawingPoints.value];
  const first = points[0];
  const last = points[points.length - 1];

  if (first[0] !== last[0] || first[1] !== last[1]) {
    points.push(first);
  }

  return points;
});

const drawingLineFeature = computed(() => {
  if (drawingPoints.value.length < 2 || isPolygonClosed.value) {
    return null;
  }

  return {
    geometry: {
      type: 'LineString',
      coordinates: drawingPoints.value,
    },
    style: {
      stroke: [{ color: '#1976d2', width: 3 }],
    },
  };
});

const polygonFeature = computed(() => {
  if (!hasZone.value) {
    return null;
  }

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [closedPolygonCoordinates.value],
    },
    style: {
      fill: 'rgba(25, 118, 210, 0.2)',
      stroke: [{ color: '#1976d2', width: 3 }],
    },
  };
});

const insidePropertyIds = computed(() => {
  if (!hasZone.value) {
    return new Set();
  }

  const polygon = closedPolygonCoordinates.value;
  const ids = mockProperties.value
    .filter((property) => isPointInsidePolygon(property.center, polygon))
    .map((property) => property.id);

  return new Set(ids);
});

const propertiesInZone = computed(() =>
  mockProperties.value.filter((property) => insidePropertyIds.value.has(property.id))
);

const mappableProperties = computed(() =>
  mockProperties.value.filter((property) => isValidCenter(property.center))
);

const isPriceMode = computed(() => mapZoom.value >= 14);
const isBuildingMode = computed(() => mapZoom.value >= 12 && mapZoom.value < 14);

const buildingMarkers = computed(() => {
  const grouped = new Map();

  for (const property of mappableProperties.value) {
    const key = getBuildingKey(property);
    const existing = grouped.get(key);

    if (existing) {
      existing.properties.push(property);
      existing.sumLng += property.center[0];
      existing.sumLat += property.center[1];
      continue;
    }

    grouped.set(key, {
      key,
      properties: [property],
      sumLng: property.center[0],
      sumLat: property.center[1],
    });
  }

  return Array.from(grouped.values()).map((group) => ({
    id: `building-${group.key}`,
    kind: 'building',
    count: group.properties.length,
    propertyIds: group.properties.map((item) => item.id),
    center: [group.sumLng / group.properties.length, group.sumLat / group.properties.length],
  }));
});

const areaClusterMarkers = computed(() => {
  if (!buildingMarkers.value.length) {
    return [];
  }

  if (mapZoom.value <= 8.5) {
    const totalCount = buildingMarkers.value.reduce((sum, marker) => sum + marker.count, 0);
    const sumLng = buildingMarkers.value.reduce(
      (sum, marker) => sum + marker.center[0] * marker.count,
      0
    );
    const sumLat = buildingMarkers.value.reduce(
      (sum, marker) => sum + marker.center[1] * marker.count,
      0
    );

    return [
      {
        id: 'cluster-all',
        kind: 'cluster',
        count: totalCount,
        propertyIds: buildingMarkers.value.flatMap((marker) => marker.propertyIds),
        center: [sumLng / totalCount, sumLat / totalCount],
      },
    ];
  }

  const cellSize = getClusterCellSize(mapZoom.value);
  const grouped = new Map();

  for (const marker of buildingMarkers.value) {
    const [lng, lat] = marker.center;
    const gridX = Math.floor(lng / cellSize);
    const gridY = Math.floor(lat / cellSize);
    const key = `${gridX}:${gridY}`;
    const existing = grouped.get(key);

    if (existing) {
      existing.markers.push(marker);
      existing.sumLng += lng * marker.count;
      existing.sumLat += lat * marker.count;
      existing.count += marker.count;
      existing.propertyIds.push(...marker.propertyIds);
      continue;
    }

    grouped.set(key, {
      key,
      markers: [marker],
      sumLng: lng * marker.count,
      sumLat: lat * marker.count,
      count: marker.count,
      propertyIds: [...marker.propertyIds],
    });
  }

  return Array.from(grouped.values()).map((group) => ({
    id: `cluster-${group.key}`,
    kind: 'cluster',
    count: group.count,
    propertyIds: group.propertyIds,
    center: [group.sumLng / group.count, group.sumLat / group.count],
  }));
});

const displayedMarkers = computed(() => {
  if (isPriceMode.value) {
    return mappableProperties.value.map((property) => ({
      id: `property-${property.id}`,
      kind: 'property',
      count: 1,
      propertyIds: [property.id],
      property,
      center: property.center,
    }));
  }

  if (isBuildingMode.value) {
    return buildingMarkers.value;
  }

  return areaClusterMarkers.value;
});

const statusText = computed(() => {
  if (isDrawing.value) {
    return `Режим рисования: точек ${drawingPoints.value.length}`;
  }

  if (hasZone.value) {
    return `Геозона задана: объектов внутри ${propertiesInZone.value.length}`;
  }

  return 'Геозона не задана';
});

onMounted(async () => {
  await loadPropertiesFromFile();

  if (!mockProperties.value.length) {
    return;
  }

  await resolvePropertyCenters();
});

async function loadPropertiesFromFile() {
  isPropertiesLoading.value = true;
  propertiesLoadError.value = '';

  try {
    const response = await fetch(localPropertiesDataUrl);
    if (!response.ok) {
      throw new Error('Не удалось открыть файл с объектами.');
    }

    const payload = await response.json();
    const properties = Array.isArray(payload?.Properties) ? payload.Properties : [];
    const normalized = normalizeParsedProperties(properties);

    if (!normalized.length) {
      throw new Error('В файле нет объектов для отображения.');
    }

    mockProperties.value = normalized;
  } catch {
    propertiesLoadError.value = 'Не удалось загрузить локальный JSON с объектами.';
  } finally {
    isPropertiesLoading.value = false;
  }
}

async function resolvePropertyCenters() {
  isCentersLoading.value = true;
  centerLoadError.value = '';

  try {
    const cachedCenters = getCentersCache();
    if (cachedCenters) {
      mockProperties.value = mockProperties.value.map((property) => {
        const cachedCenter = cachedCenters[property.id];
        if (!cachedCenter) {
          return property;
        }

        return {
          ...property,
          center: cachedCenter,
          centerSource: 'yandex',
        };
      });

      return;
    }

    const unresolvedProperties = mockProperties.value.filter(
      (property) => !isValidCenter(property.center)
    );

    if (!unresolvedProperties.length) {
      return;
    }

    const geocodingQueue = unresolvedProperties.slice(0, 80);
    const updatedProperties = [];

    for (const property of geocodingQueue) {
      const center = await fetchPropertyCenterFromYandex(property.addressQuery || property.name);
      if (!center) {
        updatedProperties.push(property);
        continue;
      }

      updatedProperties.push({
        ...property,
        center,
        centerSource: 'yandex',
      });

      await sleep(120);
    }

    const updatedById = updatedProperties.reduce((accumulator, property) => {
      accumulator[property.id] = property;
      return accumulator;
    }, {});

    mockProperties.value = mockProperties.value.map(
      (property) => updatedById[property.id] || property
    );

    const cachePayload = updatedProperties
      .filter((property) => property.centerSource === 'yandex')
      .reduce((accumulator, property) => {
        accumulator[property.id] = property.center;
        return accumulator;
      }, {});

    if (Object.keys(cachePayload).length) {
      setCentersCache(cachePayload);
    }

    if (!updatedProperties.some((property) => property.centerSource === 'yandex')) {
      centerLoadError.value =
        'Не удалось уточнить координаты через Яндекс, используем координаты из файла.';
    }
  } catch {
    centerLoadError.value = 'Ошибка геокодирования Яндекс. Используем координаты из файла.';
  } finally {
    isCentersLoading.value = false;
  }
}

async function fetchPropertyCenterFromYandex(queryText) {
  if (!yandexMapsApiKey) {
    return null;
  }

  const scopedQuery = `${queryText}, Екатеринбург`;
  const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandexMapsApiKey}&format=json&geocode=${encodeURIComponent(scopedQuery)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const pos =
      data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject?.Point?.pos || '';

    const [lngRaw, latRaw] = pos.split(' ');
    const lng = Number(lngRaw);
    const lat = Number(latRaw);

    if (!Number.isFinite(lng) || !Number.isFinite(lat)) {
      return null;
    }

    return [lng, lat];
  } catch {
    return null;
  }
}

function getCentersCache() {
  try {
    const raw = sessionStorage.getItem(centersCacheKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function setCentersCache(cacheValue) {
  try {
    sessionStorage.setItem(centersCacheKey, JSON.stringify(cacheValue));
  } catch {
    return;
  }
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function startDrawing() {
  isDrawing.value = true;
  isPolygonClosed.value = false;
  drawingPoints.value = [];
  closeDrawer();
}

function finishPolygon() {
  if (!canFinishPolygon.value) {
    return;
  }

  isDrawing.value = false;
  isPolygonClosed.value = true;
}

function clearZone() {
  isDrawing.value = false;
  isPolygonClosed.value = false;
  drawingPoints.value = [];
}

function openPropertyDrawer(propertyId) {
  hoveredPropertyId.value = null;
  selectedPropertyId.value = propertyId;
  isDrawerOpen.value = true;
}

function closeDrawer() {
  isDrawerOpen.value = false;
  selectedPropertyId.value = null;
  yandexMetaError.value = '';
  isYandexMetaLoading.value = false;
}

watch(
  selectedProperty,
  async (property) => {
    if (!property || !yandexMapsApiKey) {
      return;
    }

    if (yandexMetaByPropertyId.value[property.id]) {
      yandexMetaError.value = '';
      return;
    }

    const requestId = activeGeocoderRequestId + 1;
    activeGeocoderRequestId = requestId;

    isYandexMetaLoading.value = true;
    yandexMetaError.value = '';

    try {
      const geocode = `${property.center[0]},${property.center[1]}`;
      const url = `https://geocode-maps.yandex.ru/1.x/?apikey=${yandexMapsApiKey}&format=json&geocode=${encodeURIComponent(geocode)}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Не удалось получить ответ геокодера.');
      }

      const data = await response.json();
      if (requestId !== activeGeocoderRequestId) {
        return;
      }

      const geoObject = data?.response?.GeoObjectCollection?.featureMember?.[0]?.GeoObject;
      const title = geoObject?.name || 'Не определено';
      const address =
        geoObject?.metaDataProperty?.GeocoderMetaData?.text ||
        geoObject?.description ||
        'Не определено';

      yandexMetaByPropertyId.value = {
        ...yandexMetaByPropertyId.value,
        [property.id]: { title, address },
      };
    } catch {
      if (requestId === activeGeocoderRequestId) {
        yandexMetaError.value = 'Не удалось загрузить данные геокодера Яндекса.';
      }
    } finally {
      if (requestId === activeGeocoderRequestId) {
        isYandexMetaLoading.value = false;
      }
    }
  },
  { immediate: true }
);

function setHoveredProperty(marker) {
  if (!isPriceMode.value || marker.kind !== 'property') {
    hoveredPropertyId.value = null;
    return;
  }

  hoveredPropertyId.value = marker.property.id;
}

function clearHoveredProperty() {
  hoveredPropertyId.value = null;
}

function getMarkerClass(marker) {
  const hasSelected = Boolean(
    selectedPropertyId.value && marker.propertyIds.includes(selectedPropertyId.value)
  );
  const hasInsideZone = marker.propertyIds.some((propertyId) =>
    insidePropertyIds.value.has(propertyId)
  );

  return {
    'property-marker--selected': hasSelected,
    'property-marker--inside': hasInsideZone,
    'property-marker--count': marker.kind !== 'property',
    'property-marker--cluster': marker.kind === 'cluster',
  };
}

function getMarkerLabel(marker) {
  if (marker.kind === 'property') {
    return formatPrice(marker.property.price);
  }

  return String(marker.count);
}

function handleMarkerClick(marker) {
  if (marker.kind === 'property') {
    openPropertyDrawer(marker.property.id);
    return;
  }

  if (marker.propertyIds.length === 1) {
    openPropertyDrawer(marker.propertyIds[0]);
    return;
  }

  zoomToMarker(marker.center, marker.kind === 'cluster' ? 2 : 1);
}

function zoomToMarker(center, deltaZoom) {
  const nextZoom = Math.min(18, mapZoom.value + deltaZoom);

  if (!map.value || typeof map.value.update !== 'function') {
    return;
  }

  map.value.update({
    location: {
      center,
      zoom: nextZoom,
      duration: 220,
    },
  });
}

function getBuildingKey(property) {
  const rawAddress = property.address || property.addressQuery || '';
  const normalizedAddress = rawAddress.trim().toLowerCase();
  if (normalizedAddress) {
    return normalizedAddress;
  }

  return `${property.center[0].toFixed(5)}:${property.center[1].toFixed(5)}`;
}

function getClusterCellSize(zoom) {
  if (zoom <= 9.5) {
    return 0.25;
  }

  if (zoom <= 10.5) {
    return 0.14;
  }

  if (zoom <= 11.5) {
    return 0.08;
  }

  return 0.04;
}

function formatPrice(price) {
  if (!Number.isFinite(price)) {
    return '—';
  }

  return `${Math.round(price).toLocaleString('ru-RU')} ₽`;
}

function formatArea(area) {
  if (!Number.isFinite(area)) {
    return '—';
  }

  return `${area.toLocaleString('ru-RU')} м²`;
}

function isPointInsidePolygon(point, polygonRing) {
  if (polygonRing.length < 4) {
    return false;
  }

  const [x, y] = point;
  let isInside = false;

  for (let index = 0; index < polygonRing.length - 1; index += 1) {
    const [x1, y1] = polygonRing[index];
    const [x2, y2] = polygonRing[index + 1];

    if (isPointOnSegment(point, [x1, y1], [x2, y2])) {
      return true;
    }

    const intersects = y1 > y !== y2 > y && x < ((x2 - x1) * (y - y1)) / (y2 - y1) + x1;

    if (intersects) {
      isInside = !isInside;
    }
  }

  return isInside;
}

function isPointOnSegment(point, segmentStart, segmentEnd) {
  const [x, y] = point;
  const [x1, y1] = segmentStart;
  const [x2, y2] = segmentEnd;

  const crossProduct = (y - y1) * (x2 - x1) - (x - x1) * (y2 - y1);
  if (Math.abs(crossProduct) > 1e-10) {
    return false;
  }

  const dotProduct = (x - x1) * (x2 - x1) + (y - y1) * (y2 - y1);
  if (dotProduct < 0) {
    return false;
  }

  const squaredLength = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  return dotProduct <= squaredLength;
}

function normalizeParsedProperties(parsedProperties) {
  return parsedProperties.map((property, index) => {
    const parsedCenter = parseCoordsToLngLat(property?.coords);
    const center = parsedCenter || getFallbackCenter(index);
    const floor = Number(property?.Floor);
    const rooms = Number(property?.Rooms);
    const area = Number(property?.Area);
    const price = Number(property?.Price);
    const pricePerMeter = Number(property?.PPM);

    return {
      id: String(property?.Id || `row-${index + 1}`),
      name: property?.zkName || `Объект ${index + 1}`,
      addressQuery: property?.Address || property?.zkName || 'Екатеринбург',
      address: property?.Address || '',
      center,
      centerSource: parsedCenter ? 'parser' : 'fallback',
      price: Number.isFinite(price) ? Math.round(price) : 0,
      area: Number.isFinite(area) ? area : 0,
      rooms: Number.isFinite(rooms) ? rooms : 0,
      floor: Number.isFinite(floor) ? floor : 0,
      dealType: property?.DealType || 'unknown',
      propertyType: property?.PropertyType || 'unknown',
      status: property?.Status || 'unknown',
      isApart: property?.isApart ?? null,
      endOfBuilding: property?.EndOfBuilding || '',
      planUrl: property?.planUrl || '',
      url: property?.Url || '',
      description: property?.Description || '',
      className: property?.PropertyType || 'unknown',
      apartments: Number.isFinite(rooms) ? rooms : 0,
      pricePerMeter: Number.isFinite(pricePerMeter) ? Math.round(pricePerMeter) : 0,
    };
  });
}

function parseCoordsToLngLat(rawCoords) {
  if (typeof rawCoords !== 'string') {
    return null;
  }

  const normalized = rawCoords.replaceAll(',', '.').replaceAll(/\s+/g, ' ').trim();
  const [firstRaw, secondRaw] = normalized.split(' ');
  const first = Number(firstRaw);
  const second = Number(secondRaw);

  if (!Number.isFinite(first) || !Number.isFinite(second)) {
    return null;
  }

  if (Math.abs(first) <= 90 && Math.abs(second) <= 180) {
    return [second, first];
  }

  if (Math.abs(first) <= 180 && Math.abs(second) <= 90) {
    return [first, second];
  }

  return null;
}

function getFallbackCenter(index) {
  const [baseLng, baseLat] = settings.location.center;
  const columns = 28;
  const offsetLng = ((index % columns) - columns / 2) * 0.0022;
  const offsetLat = (Math.floor(index / columns) - 6) * 0.0017;

  return [baseLng + offsetLng, baseLat + offsetLat];
}

function isValidCenter(center) {
  return (
    Array.isArray(center) &&
    center.length === 2 &&
    Number.isFinite(center[0]) &&
    Number.isFinite(center[1])
  );
}

function applyRuntimeApiKey() {
  const trimmedKey = runtimeApiKeyInput.value.trim();
  if (!trimmedKey) {
    runtimeApiKeyError.value = 'Введите API-ключ Яндекс Карт.';
    return;
  }

  runtimeApiKeyError.value = '';
  saveYandexMapsApiKey(trimmedKey);
  window.location.reload();
}
</script>

<style scoped>
.prototype-page {
  width: min(1320px, 96vw);
  margin: 24px auto;
  font-family: Inter, Arial, sans-serif;
}

h1 {
  margin: 0;
  font-size: 26px;
}

.subtitle {
  margin: 8px 0 16px;
  color: #4f4f4f;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}

.toolbar button {
  border: 1px solid #cbcbcb;
  border-radius: 8px;
  padding: 8px 12px;
  background: #fff;
  cursor: pointer;
}

.toolbar button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.status {
  font-size: 14px;
  color: #666;
}

.status--drawing {
  color: #1565c0;
  font-weight: 600;
}

.layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 320px;
  gap: 12px;
}

.map-wrap {
  border: 1px solid #dedede;
  border-radius: 10px;
  overflow: hidden;
}

.property-marker {
  position: relative;
  transform: translate(-50%, -100%);
  background: #ffffff;
  border: 1px solid #d94444;
  border-radius: 999px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 4px 8px;
  cursor: pointer;
  min-width: 78px;
  text-align: center;
}

.property-marker--inside {
  border-color: #2e7d32;
}

.property-marker--selected {
  border-color: #f57c00;
  box-shadow: 0 4px 14px rgba(245, 124, 0, 0.35);
}

.property-marker__price {
  font-size: 11px;
  font-weight: 700;
  color: #2d2d2d;
  white-space: nowrap;
}

.marker-hover-card {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  width: 220px;
  background: #fff;
  border: 1px solid #dddddd;
  border-radius: 8px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  padding: 8px;
  z-index: 5;
}

.marker-hover-card__address {
  margin: 0;
  font-size: 12px;
  color: #333;
}

.marker-hover-card__meta {
  margin: 6px 0;
  font-size: 12px;
  color: #555;
}

.marker-hover-card__image {
  display: block;
  width: 100%;
  max-height: 120px;
  object-fit: cover;
  border-radius: 6px;
}

.panel {
  border: 1px solid #dedede;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}

.panel h2 {
  margin: 0 0 10px;
}

.panel p {
  margin: 0 0 8px;
}

.panel__error {
  color: #b71c1c;
}

.properties-list {
  list-style: none;
  margin: 12px 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.properties-list__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #ececec;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
}

.properties-list__item:hover {
  background: #f9f9f9;
}

.empty-zone {
  margin-top: 10px;
  color: #666;
}

.badge {
  font-size: 12px;
  border-radius: 99px;
  padding: 3px 8px;
  background: #f0f0f0;
  color: #555;
  white-space: nowrap;
}

.badge--inside {
  background: #e5f6ea;
  color: #147438;
}

.map-placeholder {
  width: 100%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 24px;
  box-sizing: border-box;
  border: 1px dashed #c8c8c8;
  border-radius: 8px;
  color: #444;
  background: #fafafa;
}

.map-placeholder__content {
  width: min(520px, 100%);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.map-placeholder__title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}

.map-placeholder__hint {
  margin: 0;
  color: #555;
}

.map-placeholder__input {
  border: 1px solid #cbcbcb;
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
}

.map-placeholder__button {
  border: 1px solid #1565c0;
  border-radius: 8px;
  padding: 10px 12px;
  background: #1565c0;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

.map-placeholder__error {
  margin: 0;
  color: #b71c1c;
  font-size: 13px;
}

.map-placeholder__env {
  margin: 0;
  color: #666;
  font-size: 13px;
}

.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 92vw);
  height: 100vh;
  background: #fff;
  border-left: 1px solid #dedede;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
  transform: translateX(100%);
  transition: transform 0.2s ease;
  z-index: 20;
}

.drawer--open {
  transform: translateX(0);
}

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ececec;
}

.drawer__header h3 {
  margin: 0;
  font-size: 20px;
}

.drawer__close {
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
}

.drawer__content {
  padding: 16px;
}

.drawer__content p {
  margin: 0 0 10px;
}

.drawer__image {
  width: 100%;
  border-radius: 8px;
  margin: 8px 0 12px;
  object-fit: cover;
  max-height: 220px;
}

.drawer__description {
  white-space: pre-wrap;
  line-height: 1.45;
}

.drawer__section {
  margin-top: 18px;
  padding-top: 12px;
  border-top: 1px solid #ececec;
}

.drawer__section h4 {
  margin: 0 0 10px;
}

.drawer__error {
  color: #b71c1c;
}

@media (max-width: 1024px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
