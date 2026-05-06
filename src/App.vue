<template>
  <div class="app-root">
    <router-view />
    <Toast />
  </div>
</template>

<script setup>
import Toast from 'primevue/toast';
</script>

<style>
.app-root {
  min-height: 100vh;
}
</style>
