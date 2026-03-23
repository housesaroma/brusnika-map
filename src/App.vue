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
        <p>
          Координаты от Яндекс: <b>{{ geocodedCentersCount }}</b> / {{ mockProperties.length }}
        </p>
        <p>
          Реальные контуры: <b>{{ realContoursCount }}</b> / {{ mockProperties.length }}
        </p>
        <p v-if="isPropertiesLoading">Загружаем объекты из локального JSON...</p>
        <p v-else-if="propertiesLoadError" class="panel__error">{{ propertiesLoadError }}</p>
        <p v-if="isCentersLoading">Уточняем координаты объектов через Яндекс...</p>
        <p v-else-if="centerLoadError" class="panel__error">{{ centerLoadError }}</p>
        <p v-if="isContoursLoading">Загружаем реальные контуры зданий...</p>
        <p v-else-if="contourLoadError" class="panel__error">{{ contourLoadError }}</p>

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
import { computed, onMounted, shallowRef, ref, watch } from 'vue';
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
const overpassEndpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.openstreetmap.ru/api/interpreter',
];
const contoursCacheKey = 'ekb-real-building-contours-v2';
const centersCacheKey = 'ekb-geocoded-centers-v1';
const localPropertiesDataUrl = '/data/parsing-properties.json';
const maxContourMatchDistanceSquared = 0.00000144;

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

const isYandexMetaLoading = ref(false);
const yandexMetaError = ref('');
const yandexMetaByPropertyId = ref({});
const isCentersLoading = ref(false);
const centerLoadError = ref('');
const isContoursLoading = ref(false);
const contourLoadError = ref('');
const isPropertiesLoading = ref(false);
const propertiesLoadError = ref('');
let activeGeocoderRequestId = 0;

const hasZone = computed(() => isPolygonClosed.value && drawingPoints.value.length >= 3);
const canFinishPolygon = computed(() => isDrawing.value && drawingPoints.value.length >= 3);

const selectedProperty = computed(
  () => mockProperties.value.find((property) => property.id === selectedPropertyId.value) || null
);

const realContoursCount = computed(
  () => mockProperties.value.filter((property) => property.contourSource === 'osm').length
);

const geocodedCentersCount = computed(
  () => mockProperties.value.filter((property) => property.centerSource === 'yandex').length
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
      const foundProperty = mockProperties.value.find((property) =>
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
  const ids = mockProperties.value
    .filter((property) => isPointInsidePolygon(property.center, polygon))
    .map((property) => property.id);

  return new Set(ids);
});

const propertiesInZone = computed(() =>
  mockProperties.value.filter((property) => insidePropertyIds.value.has(property.id))
);

const propertyFeatures = computed(() =>
  mockProperties.value.map((property) => {
    const isSelected = selectedPropertyId.value === property.id;
    const isInsideZone = insidePropertyIds.value.has(property.id);
    let fillColor = 'rgba(211, 47, 47, 0.2)';
    let strokeColor = '#c62828';

    if (isInsideZone) {
      fillColor = 'rgba(46, 125, 50, 0.28)';
      strokeColor = '#2e7d32';
    }

    if (isSelected) {
      fillColor = 'rgba(255, 152, 0, 0.35)';
      strokeColor = '#f57c00';
    }

    return {
      id: property.id,
      settings: {
        geometry: {
          type: 'Polygon',
          coordinates: [property.footprint],
        },
        style: {
          fill: fillColor,
          stroke: [
            {
              color: strokeColor,
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

onMounted(async () => {
  await loadPropertiesFromFile();

  if (!mockProperties.value.length) {
    return;
  }

  await resolvePropertyCenters();
  await loadRealBuildingContours();
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

async function loadRealBuildingContours() {
  isContoursLoading.value = true;
  contourLoadError.value = '';

  try {
    const cachedContours = getContoursCache();
    if (cachedContours) {
      mockProperties.value = mockProperties.value.map((property) => {
        const cachedFootprint = cachedContours[property.id];
        if (!cachedFootprint) {
          return property;
        }

        return {
          ...property,
          footprint: cachedFootprint,
          contourSource: 'osm',
        };
      });

      return;
    }

    const ways = await fetchBuildingsInArea(
      mockProperties.value.map((property) => property.center)
    );

    const updatedProperties = mockProperties.value.map((property) => {
      const bestWay = findNearestWayForCenter(ways, property.center);
      if (!bestWay) {
        return property;
      }

      const distance = getDistanceToCenter(property.center, bestWay.geometry);
      if (distance > maxContourMatchDistanceSquared) {
        return property;
      }

      const footprint = geometryToRing(bestWay.geometry);
      if (!footprint) {
        return property;
      }

      return {
        ...property,
        footprint,
        contourSource: 'osm',
      };
    });

    mockProperties.value = updatedProperties;

    const cachePayload = updatedProperties
      .filter((property) => property.contourSource === 'osm')
      .reduce((accumulator, property) => {
        accumulator[property.id] = property.footprint;
        return accumulator;
      }, {});

    if (Object.keys(cachePayload).length) {
      setContoursCache(cachePayload);
    }

    if (!updatedProperties.some((property) => property.contourSource === 'osm')) {
      contourLoadError.value =
        'Не удалось загрузить реальные контуры, используем fallback-полигоны.';
    }
  } catch {
    contourLoadError.value = 'Ошибка при загрузке контуров зданий. Используются fallback-полигоны.';
  } finally {
    isContoursLoading.value = false;
  }
}

async function fetchBuildingsInArea(centers) {
  const bbox = getCentersBoundingBox(centers, 0.005);
  const query = `
    [out:json][timeout:25];
    way["building"](${bbox.south},${bbox.west},${bbox.north},${bbox.east});
    out geom;
  `;

  return requestOverpassWays(query);
}

async function requestOverpassWays(query) {
  for (const endpoint of overpassEndpoints) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
          },
          body: `data=${encodeURIComponent(query)}`,
        });

        if (response.status === 429) {
          await sleep(1200 * (attempt + 1));
          continue;
        }

        if (!response.ok) {
          break;
        }

        const data = await response.json();
        const ways = data?.elements?.filter(
          (element) =>
            element.type === 'way' &&
            Array.isArray(element.geometry) &&
            element.geometry.length >= 4
        );

        if (Array.isArray(ways)) {
          return ways;
        }
      } catch {
        await sleep(400 * (attempt + 1));
      }
    }
  }

  return [];
}

function findNearestWayForCenter(ways, center) {
  if (!Array.isArray(ways) || !ways.length) {
    return null;
  }

  const containingWay = ways.find((way) => {
    const ring = geometryToRing(way.geometry);
    if (!ring) {
      return false;
    }

    return isPointInsidePolygon(center, ring);
  });

  if (containingWay) {
    return containingWay;
  }

  return ways.reduce((closest, current) => {
    const closestDistance = getDistanceToCenter(center, closest.geometry);
    const currentDistance = getDistanceToCenter(center, current.geometry);
    return currentDistance < closestDistance ? current : closest;
  }, ways[0]);
}

function geometryToRing(geometry) {
  const ring = geometry.map((point) => [point.lon, point.lat]);
  if (!ring.length) {
    return null;
  }

  const first = ring[0];
  const last = ring[ring.length - 1];
  if (first[0] !== last[0] || first[1] !== last[1]) {
    ring.push(first);
  }

  return ring;
}

function getCentersBoundingBox(centers, padding = 0.003) {
  const lngs = centers.map(([lng]) => lng);
  const lats = centers.map(([, lat]) => lat);

  return {
    west: Math.min(...lngs) - padding,
    south: Math.min(...lats) - padding,
    east: Math.max(...lngs) + padding,
    north: Math.max(...lats) + padding,
  };
}

function getContoursCache() {
  try {
    const raw = sessionStorage.getItem(contoursCacheKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function setContoursCache(cacheValue) {
  try {
    sessionStorage.setItem(contoursCacheKey, JSON.stringify(cacheValue));
  } catch {
    return;
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

function getDistanceToCenter(center, geometry) {
  const [centerLng, centerLat] = center;
  const centroid = geometry.reduce(
    (accumulator, point) => {
      return [accumulator[0] + point.lon, accumulator[1] + point.lat];
    },
    [0, 0]
  );

  const avgLng = centroid[0] / geometry.length;
  const avgLat = centroid[1] / geometry.length;

  const deltaLng = avgLng - centerLng;
  const deltaLat = avgLat - centerLat;

  return deltaLng ** 2 + deltaLat ** 2;
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

function normalizeParsedProperties(parsedProperties) {
  return parsedProperties.map((property, index) => {
    const parsedCenter = parseCoordsToLngLat(property?.coords);
    const center = parsedCenter || getFallbackCenter(index);
    const floors = Number(property?.Floor);
    const rooms = Number(property?.Rooms);
    const pricePerMeter = Number(property?.PPM);

    return {
      id: property?.Id || `row-${index + 1}`,
      name: property?.zkName || `Объект ${index + 1}`,
      addressQuery: property?.Address || property?.zkName || 'Екатеринбург',
      center,
      centerSource: parsedCenter ? 'parser' : 'fallback',
      footprint: createRectangle(center, 0.0018, 0.0012),
      contourSource: 'fallback',
      className: property?.PropertyType || 'unknown',
      floors: Number.isFinite(floors) ? floors : 0,
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
