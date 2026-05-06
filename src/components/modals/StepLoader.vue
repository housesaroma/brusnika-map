<template>
  <div class="step-loader">
    <h4>Рассчитываем оценку</h4>
    <div class="step-loader__list">
      <div v-for="(step, index) in steps" :key="step.label" class="step-loader__item">
        <div class="step-loader__circle">
          <svg viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" fill="none" stroke="#e5e7eb" stroke-width="3" />
            <circle
              v-if="index <= stepIndex"
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
          <div class="step-loader__inner">
            <span v-if="index < stepIndex">✓</span>
            <span v-else-if="index === stepIndex">{{ Math.round(stepProgress) }}%</span>
            <span v-else>—</span>
          </div>
        </div>
        <span
          class="step-loader__label"
          :class="{ 'is-active': index === stepIndex, 'is-done': index < stepIndex }"
        >
          {{ step.label }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from 'vue';

const emit = defineEmits(['done']);

const steps = [
  { label: 'Анализируем параметры квартиры', duration: 800 },
  { label: 'Ищем похожие объявления', duration: 1200 },
  { label: 'Считаем и уточняем оценку', duration: 1000 },
];

const stepIndex = ref(0);
const stepProgress = ref(0);
const strokeDashArray = 2 * Math.PI * 20;

let timer;
let interval;

function runStep(index) {
  if (index >= steps.length) {
    emit('done');
    return;
  }

  stepIndex.value = index;
  stepProgress.value = 0;
  const start = Date.now();
  const duration = steps[index].duration;

  clearInterval(interval);
  interval = setInterval(() => {
    const elapsed = Date.now() - start;
    const pct = Math.min((elapsed / duration) * 100, 100);
    stepProgress.value = pct;

    if (pct >= 100) {
      clearInterval(interval);
      timer = setTimeout(() => runStep(index + 1), 80);
    }
  }, 30);
}

function getDashOffset(index) {
  if (index < stepIndex.value) return 0;
  if (index === stepIndex.value) {
    return strokeDashArray * (1 - stepProgress.value / 100);
  }
  return strokeDashArray;
}

onMounted(() => {
  runStep(0);
});

onUnmounted(() => {
  clearInterval(interval);
  clearTimeout(timer);
});
</script>

<style scoped>
.step-loader h4 {
  margin: 0 0 16px;
}

.step-loader__list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.step-loader__item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.step-loader__circle {
  position: relative;
  width: 48px;
  height: 48px;
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
