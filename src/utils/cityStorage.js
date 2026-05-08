import { readJson, writeJson } from './storage';
import { STORAGE_KEYS } from './constants';

export function loadCitySelection() {
  return readJson(STORAGE_KEYS.city, null);
}

export function saveCitySelection(city) {
  writeJson(STORAGE_KEYS.city, city);
}
