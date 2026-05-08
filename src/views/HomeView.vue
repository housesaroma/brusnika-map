<template>
  <div class="home-view">
    <div class="container">
      <Card class="welcome-card">
        <template #content>
          <div class="welcome-content">
            <h1 class="welcome-title">Brusnika Map</h1>
            <p class="welcome-subtitle">
              Инструмент для оценки рыночной стоимости недвижимости с визуализацией на карте
            </p>

            <div class="welcome-actions">
              <Button
                label="Открыть карту"
                icon="pi pi-map"
                size="large"
                @click="$router.push('/map')"
              />
              <Button
                label="Объекты"
                icon="pi pi-building"
                size="large"
                severity="secondary"
                @click="$router.push('/properties')"
              />
            </div>
          </div>
        </template>
      </Card>
    </div>
  </div>
</template>

<script setup>
import Card from 'primevue/card';
import Button from 'primevue/button';
</script>

<style>
.home-view {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 140px);
  padding: 2rem;
}

.welcome-card {
  width: 100%;
  max-width: 600px;
}

.welcome-content {
  text-align: center;
  padding: 2rem 1rem;
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 0.5rem;
  color: var(--p-text-color);
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: var(--p-text-muted-color);
  margin: 0 0 2rem;
}

.welcome-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}
</style>
