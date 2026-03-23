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

          <yandex-map-feature
            v-for="feature in propertyFeatures"
            :key="feature.id"
            :settings="feature.settings"
          />
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
        Укажите <code>VITE_YANDEX_MAPS_API_KEY</code> в <code>.env.local</code>, чтобы загрузить
        карту.
      </div>
    </div>

    <aside v-if="selectedProperty" class="drawer" :class="{ 'drawer--open': isDrawerOpen }">
      <header class="drawer__header">
        <h3>{{ selectedProperty.name }}</h3>
        <button type="button" class="drawer__close" @click="closeDrawer">×</button>
      </header>

      <div class="drawer__content">
        <p><b>Класс:</b> {{ selectedProperty.className }}</p>
        <p><b>Этажей:</b> {{ selectedProperty.floors }}</p>
        <p><b>Квартир:</b> {{ selectedProperty.apartments }}</p>
        <p>
          <b>Средняя цена, ₽/м²:</b> {{ selectedProperty.pricePerMeter.toLocaleString('ru-RU') }}
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
import { computed, shallowRef, ref, watch } from 'vue';
import {
  YandexMap,
  YandexMapDefaultSchemeLayer,
  YandexMapDefaultFeaturesLayer,
  YandexMapFeature,
  YandexMapListener,
} from 'vue-yandex-maps';

const map = shallowRef(null);
const hasApiKey = Boolean(import.meta.env.VITE_YANDEX_MAPS_API_KEY);
const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

const settings = {
  location: {
    center: [60.597465, 56.838011],
    zoom: 11,
  },
};

const mockProperties = [
  {
    id: 1,
    name: 'ЖК Северный квартал',
    center: [60.5674, 56.8514],
    footprint: createRectangle([60.5674, 56.8514], 0.0024, 0.0015),
    className: 'Комфорт',
    floors: 25,
    apartments: 420,
    pricePerMeter: 178000,
  },
  {
    id: 2,
    name: 'ЖК Центр Сити',
    center: [60.6038, 56.8387],
    footprint: createRectangle([60.6038, 56.8387], 0.0019, 0.0012),
    className: 'Бизнес',
    floors: 30,
    apartments: 350,
    pricePerMeter: 245000,
  },
  {
    id: 3,
    name: 'ЖК Южный парк',
    center: [60.6143, 56.8069],
    footprint: createRectangle([60.6143, 56.8069], 0.0026, 0.0016),
    className: 'Комфорт',
    floors: 20,
    apartments: 510,
    pricePerMeter: 165000,
  },
  {
    id: 4,
    name: 'ЖК ВИЗ Панорама',
    center: [60.5586, 56.8322],
    footprint: createRectangle([60.5586, 56.8322], 0.0021, 0.0013),
    className: 'Комфорт+',
    floors: 22,
    apartments: 300,
    pricePerMeter: 189000,
  },
  {
    id: 5,
    name: 'ЖК Пионерский',
    center: [60.6432, 56.8498],
    footprint: createRectangle([60.6432, 56.8498], 0.0028, 0.0017),
    className: 'Стандарт',
    floors: 16,
    apartments: 600,
    pricePerMeter: 152000,
  },
  {
    id: 6,
    name: 'ЖК Ботанический',
    center: [60.6194, 56.7968],
    footprint: createRectangle([60.6194, 56.7968], 0.0022, 0.0014),
    className: 'Комфорт',
    floors: 18,
    apartments: 480,
    pricePerMeter: 171000,
  },
  {
    id: 7,
    name: 'ЖК Уралмаш',
    center: [60.6115, 56.8892],
    footprint: createRectangle([60.6115, 56.8892], 0.0025, 0.0016),
    className: 'Стандарт',
    floors: 14,
    apartments: 720,
    pricePerMeter: 139000,
  },
  {
    id: 8,
    name: 'ЖК Академический',
    center: [60.5144, 56.7913],
    footprint: createRectangle([60.5144, 56.7913], 0.003, 0.0019),
    className: 'Комфорт',
    floors: 17,
    apartments: 810,
    pricePerMeter: 146000,
  },
];

const isDrawing = ref(false);
const drawingPoints = ref([]);
const isPolygonClosed = ref(false);
const selectedPropertyId = ref(null);
const isDrawerOpen = ref(false);

const isYandexMetaLoading = ref(false);
const yandexMetaError = ref('');
const yandexMetaByPropertyId = ref({});
let activeGeocoderRequestId = 0;

const hasZone = computed(() => isPolygonClosed.value && drawingPoints.value.length >= 3);
const canFinishPolygon = computed(() => isDrawing.value && drawingPoints.value.length >= 3);

const selectedProperty = computed(
  () => mockProperties.find((property) => property.id === selectedPropertyId.value) || null
);

const selectedYandexMeta = computed(() => {
  if (!selectedPropertyId.value) {
    return null;
  }

  return yandexMetaByPropertyId.value[selectedPropertyId.value] || null;
});

const listenerSettings = {
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
      const foundProperty = mockProperties.find((property) =>
        isPointInsidePolygon(coordinates, property.footprint)
      );

      if (foundProperty) {
        openPropertyDrawer(foundProperty.id);
      }

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
  const ids = mockProperties
    .filter((property) => isPointInsidePolygon(property.center, polygon))
    .map((property) => property.id);

  return new Set(ids);
});

const propertiesInZone = computed(() =>
  mockProperties.filter((property) => insidePropertyIds.value.has(property.id))
);

const propertyFeatures = computed(() =>
  mockProperties.map((property) => {
    const isSelected = selectedPropertyId.value === property.id;
    const isInsideZone = insidePropertyIds.value.has(property.id);

    return {
      id: property.id,
      settings: {
        geometry: {
          type: 'Polygon',
          coordinates: [property.footprint],
        },
        style: {
          fill: isSelected
            ? 'rgba(255, 152, 0, 0.35)'
            : isInsideZone
              ? 'rgba(46, 125, 50, 0.28)'
              : 'rgba(211, 47, 47, 0.2)',
          stroke: [
            {
              color: isSelected ? '#f57c00' : isInsideZone ? '#2e7d32' : '#c62828',
              width: isSelected ? 3 : 2,
            },
          ],
        },
      },
    };
  })
);

const statusText = computed(() => {
  if (isDrawing.value) {
    return `Режим рисования: точек ${drawingPoints.value.length}`;
  }

  if (hasZone.value) {
    return `Геозона задана: объектов внутри ${propertiesInZone.value.length}`;
  }

  return 'Геозона не задана';
});

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

function createRectangle(center, deltaLng, deltaLat) {
  const [lng, lat] = center;

  return [
    [lng - deltaLng, lat - deltaLat],
    [lng + deltaLng, lat - deltaLat],
    [lng + deltaLng, lat + deltaLat],
    [lng - deltaLng, lat + deltaLat],
    [lng - deltaLng, lat - deltaLat],
  ];
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
