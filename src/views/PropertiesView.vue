<template>
  <div class="properties-view">
    <h1>Объекты недвижимости</h1>
    <p class="subtitle">Список всех доступных объектов</p>

    <div class="properties-list">
      <p class="placeholder">Список объектов будет загружен из API</p>
    </div>
  </div>
</template>

<script setup>
// Properties view - list of all properties
</script>

<style scoped>
.properties-view {
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

.properties-list {
  border: 1px solid #ddd;
  border-radius: 12px;
  padding: 24px;
  min-height: 400px;
  background: #fafafa;
}

.placeholder {
  color: #999;
  text-align: center;
}
</style>
