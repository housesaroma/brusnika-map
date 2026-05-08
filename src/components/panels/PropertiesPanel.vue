<template>
  <Card class="properties-panel">
    <template #header>
      <div class="properties-panel__header">
        <h2 class="properties-panel__title">{{ title }}</h2>
        <slot name="actions" />
      </div>
    </template>
    <template #content>
      <div v-if="showTotal || showInZone" class="properties-panel__stats">
        <Tag v-if="showTotal" severity="info">
          <span class="text-sm"
            >Всего: <b>{{ totalCount }}</b></span
          >
        </Tag>
        <Tag v-if="showInZone" severity="success">
          <span class="text-sm"
            >В зоне: <b>{{ inZoneCount }}</b></span
          >
        </Tag>
      </div>

      <div class="properties-panel__status">
        <ProgressSpinner v-if="loading" style="width: 40px; height: 40px" />
        <Message v-else-if="error" severity="error" :closable="false">
          {{ error }}
        </Message>
      </div>

      <div class="properties-panel__content">
        <slot name="content" />
      </div>

      <Listbox
        v-if="items?.length"
        :model-value="selectedItem"
        :options="items"
        option-label="name"
        class="properties-panel__list"
        @update:model-value="handleItemClick"
      >
        <template #option="slotProps">
          <div class="listbox-option">
            <span>{{ slotProps.option.name }}</span>
            <Tag v-if="badgeText" size="small">{{ badgeText }}</Tag>
          </div>
        </template>
      </Listbox>

      <div v-else-if="!loading && !error" class="properties-panel__empty">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-2"></i>
        <p class="text-gray-500">{{ emptyText }}</p>
      </div>
    </template>
  </Card>
</template>

<script setup>
import { ref } from 'vue';
import Card from 'primevue/card';
import Tag from 'primevue/tag';
import Listbox from 'primevue/listbox';
import ProgressSpinner from 'primevue/progressspinner';
import Message from 'primevue/message';

defineProps({
  title: {
    type: String,
    default: 'Объекты',
  },
  items: {
    type: Array,
    default: () => [],
  },
  totalCount: {
    type: Number,
    default: 0,
  },
  inZoneCount: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
  emptyText: {
    type: String,
    default: 'Нет данных',
  },
  showTotal: {
    type: Boolean,
    default: true,
  },
  showInZone: {
    type: Boolean,
    default: true,
  },
  badgeText: {
    type: String,
    default: 'Открыть',
  },
});

const emit = defineEmits(['item-click']);

const selectedItem = ref(null);

function handleItemClick(item) {
  selectedItem.value = item;
  emit('item-click', item);
}
</script>

<style>
.properties-panel {
  height: 100%;
}

.properties-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
}

.properties-panel__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
}

.properties-panel__stats {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.properties-panel__status {
  margin-bottom: 1rem;
}

.properties-panel__content {
  margin-bottom: 1rem;
}

.properties-panel__list {
  max-height: 400px;
  overflow-y: auto;
}

.listbox-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.properties-panel__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  text-align: center;
}
</style>
