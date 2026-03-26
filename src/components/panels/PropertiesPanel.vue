<template>
  <div class="properties-panel">
    <header class="properties-panel__header">
      <h2>{{ title }}</h2>
      <slot name="actions" />
    </header>

    <div class="properties-panel__stats">
      <p v-if="showTotal">
        Всего: <b>{{ totalCount }}</b>
      </p>
      <p v-if="showInZone">
        В зоне: <b>{{ inZoneCount }}</b>
      </p>
    </div>

    <div class="properties-panel__status">
      <p v-if="loading">{{ loadingText }}</p>
      <p v-else-if="error" class="properties-panel__error">{{ error }}</p>
    </div>

    <div class="properties-panel__content">
      <slot name="content" />
    </div>

    <ul v-if="items?.length" class="properties-panel__list">
      <li
        v-for="item in items"
        :key="item.id"
        class="properties-panel__item"
        @click="handleItemClick(item)"
      >
        <span>{{ item.name }}</span>
        <span v-if="badgeText" class="badge">{{ badgeText }}</span>
      </li>
    </ul>

    <p v-else-if="!loading && !error" class="properties-panel__empty">
      {{ emptyText }}
    </p>
  </div>
</template>

<script setup>
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
  loadingText: {
    type: String,
    default: 'Загрузка...',
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

function handleItemClick(item) {
  emit('item-click', item);
}
</script>

<style scoped>
.properties-panel {
  border: 1px solid #dedede;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}

.properties-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.properties-panel__header h2 {
  margin: 0;
  font-size: 18px;
}

.properties-panel__stats {
  display: flex;
  gap: 16px;
  margin-bottom: 10px;
}

.properties-panel__stats p {
  margin: 0;
  font-size: 14px;
}

.properties-panel__status {
  margin-bottom: 10px;
}

.properties-panel__status p {
  margin: 0;
  font-size: 14px;
}

.properties-panel__error {
  color: #b71c1c;
}

.properties-panel__content {
  margin-bottom: 12px;
}

.properties-panel__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.properties-panel__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #ececec;
  border-radius: 8px;
  padding: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.properties-panel__item:hover {
  background: #f9f9f9;
}

.badge {
  font-size: 12px;
  border-radius: 99px;
  padding: 3px 8px;
  background: #e5f6ea;
  color: #147438;
  white-space: nowrap;
}

.properties-panel__empty {
  color: #666;
  font-size: 14px;
  text-align: center;
  padding: 24px;
}
</style>
