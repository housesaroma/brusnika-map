export const CITY_OPTIONS = [
  {
    id: import.meta.env.VITE_CITY_ID_MSK || '4ba2afab-2d58-4f13-901a-855d88b21f85',
    label: 'Москва',
    center: [37.617635, 55.755814],
  },
  {
    id: import.meta.env.VITE_CITY_ID_OMS || '414aa40b-6eb4-4c77-907a-b9a075159feb',
    label: 'Омск',
    center: [73.368212, 54.989347],
  },
  {
    id: import.meta.env.VITE_CITY_ID_EKB || '1927be81-0069-4550-afdb-c3d53fefa431',
    label: 'Екатеринбург',
    center: [60.597465, 56.838011],
  },
].filter((city) => city.id || city.label);

export function getDefaultCity() {
  const fromEnv = import.meta.env.VITE_DEFAULT_CITY;
  if (fromEnv) {
    const found = CITY_OPTIONS.find((city) => city.label === fromEnv || city.id === fromEnv);
    if (found) return found;
  }
  return CITY_OPTIONS.find((city) => city.id) || CITY_OPTIONS[0];
}
