<template>
  <div class="properties-view">
    <div class="container">
      <Card>
        <template #header>
          <div class="properties-header">
            <h1 class="page-title">Объекты недвижимости</h1>
            <p class="page-subtitle">Список всех доступных объектов</p>
          </div>
        </template>
        <template #content>
          <div class="properties-placeholder">
            <i class="pi pi-building text-6xl text-gray-400 mb-4"></i>
            <p class="text-gray-500">Список объектов будет загружен из API</p>
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
.properties-view {
  padding: 2rem;
}

.properties-header {
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

.properties-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: var(--p-surface-50);
  border: 2px dashed var(--p-surface-200);
  border-radius: var(--p-card-border-radius);
}
</style>
