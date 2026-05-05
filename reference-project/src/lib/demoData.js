// Demo data for the apartment valuation app (Ekaterinburg)

export const DEMO_BUILDINGS = [
  { id: "b1", address: "ул. Малышева, 73", district: "Центр", lat: 56.8380, lng: 60.5970, floors: 16, year_built: 2018, material: "monolith", nearest_metro: "Площадь 1905 года", metro_distance_min: 5, flat_count: 4 },
  { id: "b2", address: "ул. Ленина, 52", district: "Центр", lat: 56.8400, lng: 60.6050, floors: 12, year_built: 2015, material: "brick", nearest_metro: "Площадь 1905 года", metro_distance_min: 8, flat_count: 3 },
  { id: "b3", address: "ул. Белинского, 108", district: "Верх-Исетский", lat: 56.8270, lng: 60.6130, floors: 25, year_built: 2022, material: "monolith_brick", nearest_metro: "Чкаловская", metro_distance_min: 12, flat_count: 5 },
  { id: "b4", address: "ул. Шевченко, 20", district: "Октябрьский", lat: 56.8190, lng: 60.6280, floors: 9, year_built: 2005, material: "panel", nearest_metro: "Чкаловская", metro_distance_min: 6, flat_count: 2 },
  { id: "b5", address: "ул. Репина, 78", district: "Верх-Исетский", lat: 56.8320, lng: 60.5800, floors: 18, year_built: 2020, material: "monolith", nearest_metro: "Динамо", metro_distance_min: 10, flat_count: 6 },
  { id: "b6", address: "ул. Токарей, 40", district: "ВИЗ", lat: 56.8450, lng: 60.5700, floors: 22, year_built: 2021, material: "monolith_brick", nearest_metro: "Динамо", metro_distance_min: 15, flat_count: 3 },
  { id: "b7", address: "пр. Космонавтов, 46", district: "Уралмаш", lat: 56.8700, lng: 60.5850, floors: 10, year_built: 2010, material: "panel", nearest_metro: "Проспект Космонавтов", metro_distance_min: 4, flat_count: 4 },
  { id: "b8", address: "ул. Крауля, 56", district: "ВИЗ", lat: 56.8410, lng: 60.5630, floors: 14, year_built: 2019, material: "monolith", nearest_metro: "Динамо", metro_distance_min: 18, flat_count: 2 },
  { id: "b9", address: "ул. Щорса, 103", district: "Ленинский", lat: 56.8130, lng: 60.5920, floors: 20, year_built: 2023, material: "monolith_brick", nearest_metro: "Чкаловская", metro_distance_min: 9, flat_count: 5 },
  { id: "b10", address: "ул. Сурикова, 31", district: "Центр", lat: 56.8350, lng: 60.6020, floors: 8, year_built: 1960, material: "brick", nearest_metro: "Площадь 1905 года", metro_distance_min: 7, flat_count: 1 },
];

const renovationTypes = ["none", "cosmetic", "euro", "designer"];
const sources = ["cian", "domclick", "avito"];

function generateFlats(building, count) {
  const flats = [];
  for (let i = 0; i < count; i++) {
    const rooms = Math.floor(Math.random() * 4) + 1;
    const area = rooms === 1 ? 30 + Math.random() * 15 : rooms === 2 ? 45 + Math.random() * 20 : rooms === 3 ? 65 + Math.random() * 25 : 85 + Math.random() * 35;
    const roundedArea = Math.round(area * 10) / 10;
    const kitchenArea = Math.round((8 + Math.random() * 10) * 10) / 10;
    const floor = Math.floor(Math.random() * building.floors) + 1;
    const basePricePerSqm = building.district === "Центр" ? 130000 : building.district === "Верх-Исетский" ? 110000 : building.district === "ВИЗ" ? 105000 : 85000;
    const pricePerSqm = basePricePerSqm + (Math.random() - 0.5) * 20000;
    const price = Math.round(roundedArea * pricePerSqm);
    const predictedPrice = Math.round(price * (0.9 + Math.random() * 0.2));
    
    flats.push({
      id: `f_${building.id}_${i}`,
      building_id: building.id,
      address: `${building.address}, кв. ${100 + i}`,
      rooms,
      area: roundedArea,
      kitchen_area: kitchenArea,
      floor,
      total_floors: building.floors,
      price,
      predicted_price: predictedPrice,
      price_per_sqm: Math.round(pricePerSqm),
      district: building.district,
      renovation: renovationTypes[Math.floor(Math.random() * renovationTypes.length)],
      balcony: Math.random() > 0.3,
      source: sources[Math.floor(Math.random() * sources.length)],
      lat: building.lat + (Math.random() - 0.5) * 0.001,
      lng: building.lng + (Math.random() - 0.5) * 0.001,
      year_built: building.year_built,
      material: building.material,
      nearest_metro: building.nearest_metro,
      metro_distance_min: building.metro_distance_min,
    });
  }
  return flats;
}

export const DEMO_FLATS = DEMO_BUILDINGS.flatMap(b => generateFlats(b, b.flat_count));

export const DISTRICTS = ["Центр", "Верх-Исетский", "ВИЗ", "Октябрьский", "Уралмаш", "Ленинский"];
export const MATERIALS = { panel: "Панельный", brick: "Кирпичный", monolith: "Монолитный", monolith_brick: "Монолит-кирпич" };
export const RENOVATIONS = { none: "Без ремонта", cosmetic: "Косметический", euro: "Евроремонт", designer: "Дизайнерский" };
export const SOURCES = { cian: "Циан", domclick: "Домклик", avito: "Авито" };

export function formatPrice(price) {
  if (price >= 1000000) return `${(price / 1000000).toFixed(1)} млн ₽`;
  if (price >= 1000) return `${(price / 1000).toFixed(0)} тыс ₽`;
  return `${price} ₽`;
}

export function formatPriceRaw(price) {
  return new Intl.NumberFormat('ru-RU').format(price) + ' ₽';
}

export function findAnalogs(flat, allFlats, count = 5) {
  return allFlats
    .filter(f => f.id !== flat.id)
    .map(f => ({
      ...f,
      similarity: 1 / (1 + Math.abs(f.rooms - flat.rooms) * 0.3 + Math.abs(f.area - flat.area) * 0.01 + Math.abs(f.floor - flat.floor) * 0.05 + (f.district === flat.district ? 0 : 0.5))
    }))
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, count);
}