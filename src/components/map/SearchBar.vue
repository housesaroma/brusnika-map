<template>
  <div class="search-bar">
    <i class="pi pi-search search-bar__icon"></i>
    <AutoComplete
      v-model="query"
      :suggestions="suggestions"
      option-label="label"
      append-to="self"
      :force-selection="false"
      class="search-bar__input"
      placeholder="Поиск адреса или объекта..."
      @complete="handleSuggest"
      @item-select="handleSuggestionSelect"
      @keydown.enter="handleSearch"
    />
    <Button
      :label="loading ? '...' : 'Показать'"
      class="search-bar__button"
      size="small"
      :disabled="loading"
      @click="handleSearch"
    />
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref } from 'vue';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import { geocodeAddress, suggestAddresses } from '@/api/geocoder';
import { useToast } from 'primevue/usetoast';

const props = defineProps({
  cityLabel: {
    type: String,
    default: '',
  },
});

const emit = defineEmits(['search']);

const toast = useToast();
const query = ref('');
const loading = ref(false);
const suggestions = ref([]);
let suggestTimer = null;

onBeforeUnmount(() => {
  if (suggestTimer) {
    clearTimeout(suggestTimer);
    suggestTimer = null;
  }
});

async function handleSuggest(event) {
  const value = String(event?.query || '').trim();
  if (!value) {
    suggestions.value = [];
    return;
  }

  if (suggestTimer) {
    clearTimeout(suggestTimer);
  }

  suggestTimer = setTimeout(async () => {
    try {
      suggestions.value = await suggestAddresses(value, { cityLabel: props.cityLabel, limit: 8 });
    } catch {
      suggestions.value = [];
    }
  }, 300);
}

function handleSuggestionSelect(event) {
  const selected = event?.value;
  if (!selected?.coordinates) return;
  emit('search', selected);
}

async function handleSearch() {
  if (!String(query.value || '').trim()) return;

  if (typeof query.value === 'object' && query.value?.coordinates) {
    emit('search', query.value);
    return;
  }

  loading.value = true;

  try {
    const fullQuery = props.cityLabel ? `${query.value}, ${props.cityLabel}` : query.value;
    const result = await geocodeAddress(fullQuery);
    if (result?.coordinates) {
      emit('search', result);
    } else {
      toast.add({
        severity: 'warn',
        summary: 'Поиск',
        detail: 'Объект не найден. Уточните запрос.',
        life: 3000,
      });
    }
  } catch {
    toast.add({
      severity: 'error',
      summary: 'Поиск',
      detail: 'Ошибка поиска. Проверьте ключ API.',
      life: 3000,
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.search-bar {
  position: absolute;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  width: min(420px, 92vw);
  background: rgba(255, 255, 255, 0.95);
  border-radius: 18px;
  border: 1px solid var(--app-border);
  box-shadow: var(--app-shadow);
  backdrop-filter: blur(10px);
}

.search-bar__icon {
  color: var(--app-muted-foreground);
  font-size: 0.875rem;
}

.search-bar__input {
  flex: 1;
  position: relative;
}

.search-bar__input :deep(.p-inputtext) {
  width: 100%;
  border: none;
  box-shadow: none;
  font-size: 0.875rem;
  padding: 0.35rem 0;
}

.search-bar__input :deep(.p-inputtext:focus) {
  box-shadow: none;
}

.search-bar__input :deep(.p-autocomplete-overlay) {
  left: 0 !important;
  right: 0;
  width: 100%;
}

.search-bar__button {
  background: var(--app-primary);
  border: none;
  border-radius: 12px;
  padding: 0 12px;
  font-size: 0.75rem;
  font-weight: 600;
}
</style>
