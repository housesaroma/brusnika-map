<template>
  <div class="drawing-controls">
    <button
      v-if="!isDrawing"
      type="button"
      class="btn btn--primary"
      :disabled="disabled"
      @click="handleStart"
    >
      Начать рисование
    </button>

    <template v-else>
      <button type="button" class="btn btn--success" :disabled="!canFinish" @click="handleFinish">
        Завершить полигон
      </button>

      <button type="button" class="btn btn--secondary" @click="handleCancel">Отмена</button>
    </template>

    <button
      v-if="hasPolygon"
      type="button"
      class="btn btn--danger"
      :disabled="disabled"
      @click="handleClear"
    >
      Очистить геозону
    </button>

    <span v-if="statusText" class="status" :class="{ 'status--drawing': isDrawing }">
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

<style scoped>
.drawing-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 12px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn--primary {
  background: #1565c0;
  color: #fff;
  border-color: #1565c0;
}

.btn--primary:hover:not(:disabled) {
  background: #0d47a1;
}

.btn--secondary {
  background: #fff;
  color: #333;
  border-color: #cbcbcb;
}

.btn--secondary:hover:not(:disabled) {
  background: #f5f5f5;
}

.btn--success {
  background: #2e7d32;
  color: #fff;
  border-color: #2e7d32;
}

.btn--success:hover:not(:disabled) {
  background: #1b5e20;
}

.btn--danger {
  background: #fff;
  color: #d32f2f;
  border-color: #d32f2f;
}

.btn--danger:hover:not(:disabled) {
  background: #ffebee;
}

.status {
  font-size: 14px;
  color: #666;
}

.status--drawing {
  color: #1565c0;
  font-weight: 600;
}
</style>
