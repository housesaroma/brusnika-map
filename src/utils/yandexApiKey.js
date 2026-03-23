const runtimeStorageKey = 'runtime-yandex-maps-api-key';

export function getYandexMapsApiKey() {
  const envKey = import.meta.env.VITE_YANDEX_MAPS_API_KEY || '';
  if (envKey) {
    return envKey;
  }

  if (typeof window === 'undefined') {
    return '';
  }

  try {
    return localStorage.getItem(runtimeStorageKey) || '';
  } catch {
    return '';
  }
}

export function saveYandexMapsApiKey(apiKey) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(runtimeStorageKey, apiKey.trim());
  } catch {
    return;
  }
}
