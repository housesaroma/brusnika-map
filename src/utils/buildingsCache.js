import { readJson, removeKey, writeJson } from './storage';
import { STORAGE_KEYS } from './constants';

const SCHEMA_VERSION = 1;

function getTtlMs() {
  const hoursRaw = Number(import.meta.env.VITE_BUILDINGS_CACHE_TTL_HOURS);
  const hours = Number.isFinite(hoursRaw) && hoursRaw > 0 ? hoursRaw : 24;
  return hours * 60 * 60 * 1000;
}

function nowMs() {
  return Date.now();
}

function readCache() {
  const fallback = { version: SCHEMA_VERSION, byCity: {} };
  const raw = readJson(STORAGE_KEYS.buildingsCache, fallback);
  if (!raw || typeof raw !== 'object') return fallback;
  if (raw.version !== SCHEMA_VERSION) return fallback;
  if (!raw.byCity || typeof raw.byCity !== 'object') return fallback;
  return raw;
}

function writeCache(cache) {
  writeJson(STORAGE_KEYS.buildingsCache, cache);
}

export function loadBuildingsCache(cityId) {
  if (!cityId) return null;
  const cache = readCache();
  const entry = cache.byCity?.[cityId];
  if (!entry || typeof entry !== 'object') return null;
  if (!Array.isArray(entry.buildings)) return null;
  const fetchedAt = Number(entry.fetchedAt) || 0;
  const ageMs = Math.max(0, nowMs() - fetchedAt);
  return {
    buildings: entry.buildings,
    fetchedAt,
    isFresh: fetchedAt > 0 && ageMs <= getTtlMs(),
    ageMs,
  };
}

export function saveBuildingsCache(cityId, buildings) {
  if (!cityId) return;
  if (!Array.isArray(buildings)) return;

  const cache = readCache();
  cache.byCity = cache.byCity || {};
  cache.byCity[cityId] = {
    fetchedAt: nowMs(),
    buildings,
  };
  writeCache(cache);
}

export function clearBuildingsCache() {
  removeKey(STORAGE_KEYS.buildingsCache);
}
