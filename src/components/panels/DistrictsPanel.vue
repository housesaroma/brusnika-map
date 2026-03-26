<template>
  <div class="districts-panel">
    <div class="districts-panel__header">
      <h2 class="districts-panel__title">Районы</h2>
      <Tag severity="secondary">{{ districtsStore.count }}</Tag>
    </div>

    <div v-if="loading" class="districts-panel__loading">
      <ProgressSpinner style="width: 32px; height: 32px" />
      <p class="text-gray-500 text-sm mt-2">Загрузка районов...</p>
    </div>

    <div v-else-if="error" class="districts-panel__error">
      <i class="pi pi-exclamation-triangle text-red-500 text-xl mb-2"></i>
      <p class="text-sm text-gray-600">{{ error }}</p>
    </div>

    <div v-else class="districts-panel__list">
      <div
        v-for="district in districtsStore.districts"
        :key="district.id"
        class="district-item"
        :class="{ 'district-item--active': districtsStore.selectedDistrict?.id === district.id }"
        @click="handleDistrictClick(district)"
      >
        <span class="district-item__name">{{ district.name }}</span>
        <i
          v-if="districtsStore.selectedDistrict?.id === district.id"
          class="pi pi-check-circle district-item__icon"
        ></i>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import Tag from 'primevue/tag';
import ProgressSpinner from 'primevue/progressspinner';
import { useDistrictsStore } from '@/stores/districts';

const districtsStore = useDistrictsStore();

const emit = defineEmits(['district-click']);

onMounted(() => {
  districtsStore.loadDistricts();
});

function handleDistrictClick(district) {
  if (districtsStore.selectedDistrict?.id === district.id) {
    districtsStore.clearSelection();
  } else {
    districtsStore.selectDistrict(district);
  }
  emit('district-click', district);
}
</script>

<style scoped>
.districts-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--p-surface-0);
  border-right: 1px solid var(--p-surface-200);
}

.districts-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--p-surface-200);
}

.districts-panel__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
  color: var(--p-text-color);
}

.districts-panel__loading,
.districts-panel__error {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
  text-align: center;
  flex: 1;
}

.districts-panel__list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem;
}

.district-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  margin-bottom: 0.25rem;
  background: var(--p-surface-50);
  border-radius: var(--p-border-radius);
  cursor: pointer;
  transition: all 0.2s;
}

.district-item:hover {
  background: var(--p-surface-100);
}

.district-item--active {
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
}

.district-item--active:hover {
  opacity: 0.9;
}

.district-item__name {
  font-size: 0.875rem;
  font-weight: 500;
  flex: 1;
}

.district-item__icon {
  font-size: 1rem;
  margin-left: 0.5rem;
}

.text-sm {
  font-size: 0.875rem;
}

.text-gray-500 {
  color: var(--p-text-muted-color);
}

.text-gray-600 {
  color: var(--p-text-muted-color);
}

.text-red-500 {
  color: var(--p-red-500);
}

.mt-2 {
  margin-top: 0.5rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}
</style>
