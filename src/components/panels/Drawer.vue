<template>
  <Drawer v-model:visible="visible" position="right" :header="title">
    <div class="drawer-content">
      <slot name="content">
        <p v-if="description" class="text-gray-600">{{ description }}</p>
      </slot>
    </div>
  </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import Drawer from 'primevue/drawer';

const props = defineProps({
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

const visible = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('close');
    }
  },
});
</script>

<style>
.drawer-content {
  padding: 1rem;
}
</style>
