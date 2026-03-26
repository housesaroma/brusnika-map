<template>
  <Drawer v-model:visible="visible" position="right" :header="headerTitle">
    <div v-if="property" class="property-drawer">
      <div v-if="property.planUrl" class="property-drawer__image-container">
        <img :src="property.planUrl" :alt="property.name || property.address" class="property-drawer__image" />
      </div>

      <div class="property-drawer__content">
        <div class="property-drawer__price">{{ formatPrice(property.price) }}</div>

        <div class="property-drawer__section">
          <h3 class="property-drawer__title">{{ property.name || 'Объект недвижимости' }}</h3>
          <p class="property-drawer__address">{{ property.address }}</p>
        </div>

        <div class="property-drawer__section">
          <div class="property-drawer__meta">
            <div class="meta-item">
              <span class="meta-item__label">Тип сделки</span>
              <span class="meta-item__value">{{ formatDealType(property.dealType) }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Тип объекта</span>
              <span class="meta-item__value">{{ formatPropertyType(property.propertyType) }}</span>
            </div>
          </div>
        </div>

        <div class="property-drawer__section">
          <div class="property-drawer__meta">
            <div class="meta-item">
              <span class="meta-item__label">Площадь</span>
              <span class="meta-item__value">{{ property.area }} м²</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Комнат</span>
              <span class="meta-item__value">{{ property.rooms }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-item__label">Этаж</span>
              <span class="meta-item__value">{{ property.floor }}</span>
            </div>
          </div>
        </div>

        <div class="property-drawer__section">
          <div class="property-drawer__meta">
            <div class="meta-item">
              <span class="meta-item__label">Цена за м²</span>
              <span class="meta-item__value">{{ formatPrice(property.pricePerMeter) }}</span>
            </div>
          </div>
        </div>

        <div v-if="property.endOfBuilding" class="property-drawer__section">
          <div class="property-drawer__meta">
            <div class="meta-item">
              <span class="meta-item__label">Срок сдачи</span>
              <span class="meta-item__value">{{ property.endOfBuilding }}</span>
            </div>
          </div>
        </div>

        <div v-if="property.description" class="property-drawer__section">
          <h4 class="property-drawer__subtitle">Описание</h4>
          <p class="property-drawer__description">{{ property.description }}</p>
        </div>

        <div class="property-drawer__actions">
          <a v-if="property.url" :href="property.url" target="_blank" rel="noopener noreferrer" class="btn-primary">
            <i class="pi pi-external-link"></i>
            Открыть источник
          </a>
        </div>
      </div>
    </div>
  </Drawer>
</template>

<script setup>
import { computed } from 'vue';
import Drawer from 'primevue/drawer';
import { useFormatters } from '@/composables/useFormatters';

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  property: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

const { formatPrice, formatDealType, formatPropertyType } = useFormatters();

const visible = computed({
  get: () => props.isOpen,
  set: (value) => {
    if (!value) {
      emit('close');
    }
  },
});

const headerTitle = computed(() => {
  return props.property?.name || 'Информация об объекте';
});
</script>

<style scoped>
.property-drawer {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.property-drawer__image-container {
  flex-shrink: 0;
  margin: 0 -1rem 1rem;
  overflow: hidden;
}

.property-drawer__image {
  width: 100%;
  height: 200px;
  object-fit: cover;
  display: block;
}

.property-drawer__content {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.property-drawer__price {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--p-text-color);
  margin-bottom: 1rem;
}

.property-drawer__section {
  margin-bottom: 1.25rem;
}

.property-drawer__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--p-text-color);
}

.property-drawer__address {
  margin: 0;
  font-size: 0.875rem;
  color: var(--p-text-muted-color);
  line-height: 1.5;
}

.property-drawer__subtitle {
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0 0 0.5rem;
  color: var(--p-text-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.property-drawer__description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.6;
  color: var(--p-text-muted-color);
  white-space: pre-line;
}

.property-drawer__meta {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.meta-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.meta-item__label {
  font-size: 0.75rem;
  color: var(--p-text-muted-color);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-item__value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--p-text-color);
}

.property-drawer__actions {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--p-surface-200);
}

.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--p-primary-color);
  color: var(--p-primary-contrast-color);
  text-decoration: none;
  border-radius: var(--p-button-border-radius);
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-primary i {
  font-size: 1rem;
}
</style>
