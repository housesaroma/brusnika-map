<template>
  <div class="drawing-controls flex items-center gap-2 flex-wrap">
    <Button
      v-if="!isDrawing"
      label="Начать рисование"
      icon="pi pi-pencil"
      :disabled="disabled"
      @click="handleStart"
    />

    <template v-else>
      <Button
        label="Завершить полигон"
        icon="pi pi-check"
        severity="success"
        :disabled="!canFinish"
        @click="handleFinish"
      />
      <Button label="Отмена" icon="pi pi-times" severity="secondary" @click="handleCancel" />
    </template>

    <Button
      v-if="hasPolygon"
      label="Очистить геозону"
      icon="pi pi-trash"
      severity="danger"
      outlined
      :disabled="disabled"
      @click="handleClear"
    />

    <span v-if="statusText" class="status-text" :class="{ 'status-text--drawing': isDrawing }">
      {{ statusText }}
    </span>
  </div>
</template>

<script setup>
defineProps({
  isDrawing: {
    type: Boolean,
    default: false,
  },
  hasPolygon: {
    type: Boolean,
    default: false,
  },
  canFinish: {
    type: Boolean,
    default: false,
  },
  statusText: {
    type: String,
    default: '',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['start', 'finish', 'cancel', 'clear']);

function handleStart() {
  emit('start');
}

function handleFinish() {
  emit('finish');
}

function handleCancel() {
  emit('cancel');
}

function handleClear() {
  emit('clear');
}
</script>

<style>
.drawing-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.status-text {
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
}

.status-text--drawing {
  color: var(--p-primary-color);
  font-weight: 600;
}
</style>
