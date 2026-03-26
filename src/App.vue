<template>
  <div class="app">
    <Menubar class="app-header" :model="menuItems">
      <template #start>
        <router-link to="/" class="app-header__logo">
          <i class="pi pi-map mr-2"></i>
          Brusnika Map
        </router-link>
      </template>
    </Menubar>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <div class="container">
        <p class="text-sm text-gray-600">&copy; 2026 Brusnika. Инструмент оценки недвижимости.</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import Menubar from 'primevue/menubar';

const menuItems = [
  {
    label: 'Карта',
    icon: 'pi pi-map',
    to: '/map',
  },
  {
    label: 'Объекты',
    icon: 'pi pi-building',
    to: '/properties',
  },
];
</script>

<style>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  border-radius: 0;
  padding: 0 1rem;
}

.app-header__logo {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  font-size: 1.25rem;
  color: var(--p-primary-color);
  text-decoration: none;
}

.app-header__logo:hover {
  color: var(--p-primary-hover-color);
}

.app-main {
  flex: 1;
  background: var(--p-surface-100);
}

.app-footer {
  border-top: 1px solid var(--p-surface-200);
  background: var(--p-surface-0);
  padding: 1rem 0;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 1rem;
}
</style>
