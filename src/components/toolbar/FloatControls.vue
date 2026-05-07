<template>
  <div class="float-controls">
    <Button
      icon="pi pi-star"
      class="float-controls__button float-controls__button--favorite"
      severity="secondary"
      rounded
      @click="emit('favorites')"
    />

    <Button
      :icon="isDrawing ? 'pi pi-times' : 'pi pi-pencil'"
      class="float-controls__button"
      :class="{ 'float-controls__button--active': isDrawing }"
      rounded
      @click="emit('toggle-drawing')"
    />

    <div class="float-controls__zoom">
      <Button
        icon="pi pi-plus"
        class="float-controls__zoom-button"
        rounded
        @click="emit('zoom-in')"
      />
      <Button
        icon="pi pi-minus"
        class="float-controls__zoom-button"
        rounded
        @click="emit('zoom-out')"
      />
    </div>
  </div>
</template>

<script setup>
import Button from 'primevue/button';

defineProps({
  isDrawing: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['favorites', 'toggle-drawing', 'zoom-in', 'zoom-out']);
</script>

<style scoped>
.float-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: center;
}

.float-controls__button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.float-controls__button :deep(.pi) {
  font-size: 0.9rem;
  color: #111827;
}

.float-controls__button--favorite :deep(.pi) {
  color: var(--app-primary);
}

.float-controls__button--active {
  background: rgba(255, 255, 255, 0.95);
  border-color: #ff001e;
}

.float-controls__button--active :deep(.pi) {
  color: #111827;
}

.float-controls__zoom {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.float-controls__zoom-button {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
}

.float-controls__zoom-button :deep(.pi) {
  font-size: 0.9rem;
  color: #111827;
}
</style>
