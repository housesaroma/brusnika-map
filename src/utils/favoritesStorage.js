import { readJson, writeJson } from './storage';
import { STORAGE_KEYS } from './constants';
import { normalizeFavorite, serializeFavorite } from './favorites';

export function loadFavorites() {
  const raw = readJson(STORAGE_KEYS.favorites, []);
  if (!Array.isArray(raw)) return [];
  return raw.map(normalizeFavorite).filter(Boolean);
}

export function saveFavorites(favorites) {
  const data = favorites.map(serializeFavorite).filter(Boolean);
  writeJson(STORAGE_KEYS.favorites, data);
}
