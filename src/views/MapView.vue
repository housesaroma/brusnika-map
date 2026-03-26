<template>
  <div class="map-view">
    <h1>Карта объектов</h1>
    <p class="subtitle">Визуализация недвижимости на карте Екатеринбурга</p>

    <div class="map-container">
      <p class="placeholder">Здесь будет карта с объектами</p>
    </div>
  </div>
</template>

<script setup>
// Map view - main map with properties
</script>

<style scoped>
.map-view {
  padding: 24px;
}

h1 {
  font-size: 24px;
  margin: 0 0 8px;
}

.subtitle {
  color: #666;
  margin: 0 0 24px;
}

.map-container {
  border: 1px solid #ddd;
  border-radius: 12px;
  height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fafafa;
}

.placeholder {
  color: #999;
}
</style>
