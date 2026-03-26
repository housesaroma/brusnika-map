import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const usePolygonsStore = defineStore('polygons', () => {
  const items = ref([]);
  const activePolygon = ref(null);
  const isDrawing = ref(false);
  const drawingPoints = ref([]);

  const hasActivePolygon = computed(() => activePolygon.value !== null);
  const canFinishPolygon = computed(() => isDrawing.value && drawingPoints.value.length >= 3);

  function startDrawing() {
    isDrawing.value = true;
    drawingPoints.value = [];
    activePolygon.value = null;
  }

  function addPoint(coordinates) {
    if (!isDrawing.value) return;
    drawingPoints.value = [...drawingPoints.value, coordinates];
  }

  function finishPolygon() {
    if (!canFinishPolygon.value) return;

    isDrawing.value = false;
    activePolygon.value = {
      id: `polygon-${Date.now()}`,
      coordinates: [...drawingPoints.value],
      createdAt: new Date().toISOString(),
    };

    items.value.push(activePolygon.value);
  }

  function cancelDrawing() {
    isDrawing.value = false;
    drawingPoints.value = [];
  }

  function clearActivePolygon() {
    activePolygon.value = null;
    drawingPoints.value = [];
    isDrawing.value = false;
  }

  function removePolygon(id) {
    items.value = items.value.filter((polygon) => polygon.id !== id);
    if (activePolygon.value?.id === id) {
      activePolygon.value = null;
    }
  }

  function setActivePolygon(polygon) {
    activePolygon.value = polygon;
  }

  return {
    items,
    activePolygon,
    isDrawing,
    drawingPoints,
    hasActivePolygon,
    canFinishPolygon,
    startDrawing,
    addPoint,
    finishPolygon,
    cancelDrawing,
    clearActivePolygon,
    removePolygon,
    setActivePolygon,
  };
});
