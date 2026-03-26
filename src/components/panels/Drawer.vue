<template>
  <aside class="drawer" :class="{ 'drawer--open': isOpen }">
    <header class="drawer__header">
      <h3>{{ title }}</h3>
      <button type="button" class="drawer__close" aria-label="Закрыть" @click="handleClose">
        ×
      </button>
    </header>

    <div class="drawer__content">
      <slot name="content">
        <p v-if="description">{{ description }}</p>
      </slot>
    </div>
  </aside>
</template>

<script setup>
defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: '',
  },
  description: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['close']);

function handleClose() {
  emit('close');
}
</script>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: min(420px, 92vw);
  height: 100vh;
  background: #fff;
  border-left: 1px solid #dedede;
  box-shadow: -4px 0 20px rgba(0, 0, 0, 0.12);
  transform: translateX(100%);
  transition: transform 0.2s ease;
  z-index: 20;
}

.drawer--open {
  transform: translateX(0);
}

.drawer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ececec;
}

.drawer__header h3 {
  margin: 0;
  font-size: 20px;
}

.drawer__close {
  border: none;
  background: transparent;
  font-size: 28px;
  line-height: 1;
  cursor: pointer;
  color: #666;
}

.drawer__close:hover {
  color: #333;
}

.drawer__content {
  padding: 16px;
}

.drawer__content p {
  margin: 0 0 10px;
}
</style>
