<template>
  <div class="home-view">
    <h1>Brusnika Map</h1>
    <p class="subtitle">Инструмент для оценки рыночной стоимости недвижимости</p>

    <div class="actions">
      <router-link to="/map" class="btn btn--primary">Открыть карту</router-link>
      <router-link to="/properties" class="btn btn--secondary">Объекты</router-link>
    </div>
  </div>
</template>

<script setup>
// Home view - landing page
</script>

<style scoped>
.home-view {
  text-align: center;
  padding: 48px 24px;
}

h1 {
  font-size: 32px;
  margin: 0 0 8px;
}

.subtitle {
  color: #666;
  margin: 0 0 32px;
}

.actions {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.btn {
  padding: 12px 24px;
  border-radius: 8px;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.2s;
}

.btn--primary {
  background: #1565c0;
  color: #fff;
}

.btn--primary:hover {
  background: #0d47a1;
}

.btn--secondary {
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
}

.btn--secondary:hover {
  background: #e0e0e0;
}
</style>
