import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createYmaps } from 'vue-yandex-maps';

import App from './App.vue';
import router from './router';

import 'vue-yandex-maps/css';
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

app.mount('#app');
