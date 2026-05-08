export const DEFAULT_FILTERS = {
  roomsMin: '',
  roomsMax: '',
  areaMin: '',
  areaMax: '',
  priceMin: '',
  priceMax: '',
  floorMin: '',
  floorMax: '',
};

export function hasActiveFilters(filters) {
  if (!filters) return false;
  return Object.values(filters).some(
    (value) => value !== '' && value !== null && value !== undefined
  );
}

export function applyFiltersToFlats(flats, filters) {
  if (!filters) return flats;
  return flats.filter((flat) => {
    if (filters.roomsMin && flat.rooms < Number(filters.roomsMin)) return false;
    if (filters.roomsMax && flat.rooms > Number(filters.roomsMax)) return false;
    if (filters.areaMin && flat.area < Number(filters.areaMin)) return false;
    if (filters.areaMax && flat.area > Number(filters.areaMax)) return false;
    if (filters.priceMin && flat.price < Number(filters.priceMin)) return false;
    if (filters.priceMax && flat.price > Number(filters.priceMax)) return false;
    if (filters.floorMin && flat.floor < Number(filters.floorMin)) return false;
    if (filters.floorMax && flat.floor > Number(filters.floorMax)) return false;
    return true;
  });
}
