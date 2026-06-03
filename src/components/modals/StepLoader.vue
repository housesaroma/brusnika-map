<template>
  <div class="step-loader">
    <h4>Рассчитываем оценку</h4>
    <div class="step-loader__list">
      <div v-for="(step, index) in steps" :key="index" class="step-loader__item">
        <div class="step-loader__circle">
          <svg viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" stroke-width="3" />
            <circle
              v-if="index <= activeStepIndex"
              cx="24"
              cy="24"
              r="20"
              fill="none"
              stroke="#111827"
              stroke-width="3"
              stroke-linecap="round"
              :stroke-dasharray="strokeDashArray"
              :stroke-dashoffset="getDashOffset(index)"
            />
          </svg>
          <div class="step-loader__inner" :class="{ 'is-done-icon': index < activeStepIndex }">
            <span v-if="index < activeStepIndex">✓</span>
            <span v-else-if="index === activeStepIndex">{{ Math.round(stepProgress) }}%</span>
            <span v-else>—</span>
          </div>
        </div>
        <span
          class="step-loader__label"
          :class="{ 'is-active': index === activeStepIndex, 'is-done': index < activeStepIndex }"
        >
          {{ step.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  steps: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['done']);

const activeStepIndex = ref(0);
const stepProgress = ref(0);
const strokeDashArray = 2 * Math.PI * 20;

let interval;

function runStep(index) {
  if (index >= props.steps.length) {
    emit('done');
    return;
  }

  activeStepIndex.value = index;
  stepProgress.value = 0;
  const start = Date.now();
  const duration = props.steps[index].duration || 1000;

  clearInterval(interval);
  interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.min((elapsed / duration) * 100, 100);
    stepProgress.value = pct;

    if (pct >= 100) {
      clearInterval(interval);
      setTimeout(() => runStep(index + 1), 200);
    }
  }, 50);
}

function getDashOffset(index) {
  if (index < activeStepIndex.value) return 0;
  if (index === activeStepIndex.value) {
    return strokeDashArray * (1 - stepProgress.value / 100);
  }
  return strokeDashArray;
}

watch(
  () => props.steps,
  (newSteps) => {
    if (newSteps && newSteps.length > 0) {
      runStep(0);
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.step-loader {
  width: fit-content;
  margin: 0 auto; /* Выравнивает весь блок по центру родителя */
}

.step-loader h4 {
  margin: 0 0 16px;
  text-align: center; /* Заголовок тоже будет по центру */
}

.step-loader__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: fit-content;
}

.step-loader__item {
  display: flex;
  align-items: center;
  gap: 12px;
  white-space: nowrap; 
}

.step-loader__circle {
  position: relative;
  width: 48px;
  height: 48px;
  flex-shrink: 0; /* Чтобы круги не сжимались */
}

.step-loader__circle svg {
  width: 48px;
  height: 48px;
  transform: rotate(-90deg);
}

.step-loader__inner {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  font-size: 0.65rem;
  font-weight: 600;
  color: var(--app-foreground);
}

/* Цвет галочки для завершенных шагов (опционально, для красоты) */
.step-loader__inner.is-done-icon {
  color: #10b981; /* Зеленый цвет успеха */
}

.step-loader__label {
  font-size: 0.8rem;
  color: var(--app-muted-foreground);
}

.step-loader__label.is-active {
  color: var(--app-foreground);
  font-weight: 600;
}

.step-loader__label.is-done {
  color: var(--app-muted-foreground);
}
</style>
