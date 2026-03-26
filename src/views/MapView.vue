<template>
  <div class="map-view">
    <div class="container">
      <Card>
        <template #header>
          <div class="map-header">
            <h1 class="page-title">Карта объектов</h1>
            <p class="page-subtitle">Визуализация недвижимости на карте Екатеринбурга</p>
          </div>
        </template>
        <template #content>
          <div class="map-placeholder">
            <i class="pi pi-map text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">Здесь будет карта с объектами</p>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
</script>

<style>
.map-view {
  padding: 2rem;
}

.map-header {
  padding: 1.5rem;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--p-text-color);
}

.page-subtitle {
  margin: 0;
  color: var(--p-text-muted-color);
}

.map-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 500px;
  background: var(--p-surface-50);
  border: 2px dashed var(--p-surface-200);
  border-radius: var(--p-card-border-radius);
}
</style>
