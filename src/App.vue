<template>
  <div class="app">
    <header class="app-header">
      <router-link to="/" class="app-header__logo">Brusnika Map</router-link>
      <nav class="app-header__nav">
        <router-link to="/map" class="app-header__link">Карта</router-link>
        <router-link to="/properties" class="app-header__link">Объекты</router-link>
      </nav>
    </header>

    <main class="app-main">
      <router-view />
    </main>

    <footer class="app-footer">
      <p>&copy; 2026 Brusnika. Инструмент оценки недвижимости.</p>
    </footer>
  </div>
</template>

<script setup>
// Main app layout - router outlet container
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
}

.app-header__logo {
  font-size: 20px;
  font-weight: 700;
  color: #1565c0;
  text-decoration: none;
}

.app-header__logo:hover {
  color: #0d47a1;
}

.app-header__nav {
  display: flex;
  gap: 24px;
}

.app-header__link {
  color: #333;
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

.app-header__link:hover {
  color: #1565c0;
}

.app-header__link.router-link-active {
  color: #1565c0;
}

.app-main {
  flex: 1;
  background: #f5f5f5;
}

.app-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background: #fff;
  text-align: center;
}

.app-footer p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
</style>
