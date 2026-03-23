import { createApp } from 'vue';
import { createYmaps } from 'vue-yandex-maps';
import App from './App.vue';
import 'vue-yandex-maps/css';

const app = createApp(App);
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
  console.warn('VITE_YANDEX_MAPS_API_KEY is empty. Map is disabled.');
}

app.mount('#app');
