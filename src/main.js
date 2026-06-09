import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createYmaps } from 'vue-yandex-maps';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import ToastService from 'primevue/toastservice';

import App from './App.vue';
import router from './router';

import 'vue-yandex-maps/css';
import 'primeicons/primeicons.css';
import './style.css';


const app = createApp(App);
const pinia = createPinia();

const yandexMapsApiKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';

if (yandexMapsApiKey) {
  app.use(
    createYmaps({
      apikey: yandexMapsApiKey,
      lang: 'ru_RU',
      initializeOn: 'onComponentMount',
    })
  );
} else {
  console.warn('VITE_YANDEX_MAPS_API_KEY is not set. Map functionality will be limited.');
}

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  theme: {
    preset: Aura,
    options: {
      darkModeSelector: false,
    },
  },
  locale: {
    startsWith: 'Начинается с',
    contains: 'Содержит',
    notContains: 'Не содержит',
    endsWith: 'Заканчивается на',
    equals: 'Равно',
    notEquals: 'Не равно',
    noFilter: 'Без фильтрации',
    lt: 'Меньше',
    lte: 'Меньше или равно',
    gt: 'Больше',
    gte: 'Больше или равно',
  },
});
app.use(ToastService);

app.mount('#app');
