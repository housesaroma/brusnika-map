import { readJson, writeJson } from './storage';
import { STORAGE_KEYS } from './constants';
import { DEFAULT_FILTERS } from './filters';

export function loadFilters() {
  return readJson(STORAGE_KEYS.filters, { ...DEFAULT_FILTERS });
}

export function saveFilters(filters) {
  writeJson(STORAGE_KEYS.filters, filters);
}
