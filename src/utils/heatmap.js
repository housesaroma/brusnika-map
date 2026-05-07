export function getHeatValue(item, mode) {
  if (!item) return 0;
  switch (mode) {
    case 'price':
      return Number(item.MedianActualPrice || item.medianActualPrice || 0);
    case 'sqm':
      return Number(item.PricePerSqm || item.pricePerSqm || item.SQM || item.sqm || 0);
    case 'count':
      return Number(item.FlatsCount || item.flatsCount || 0);
    case 'year':
      return Number(item.YearBuilt || item.yearBuilt || 0);
    case 'predicted':
      return Number(item.MedianPredictedPrice || item.medianPredictedPrice || 0);
    default:
      return 0;
  }
}

export function normalizeHeatValues(values) {
  if (!values.length) return [];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return values.map(() => 0.5);
  }
  return values.map((val) => (val - min) / (max - min));
}

export function heatColorFromValue(value) {
  const stops = [
    [0, [0, 0, 255]],
    [0.25, [0, 200, 150]],
    [0.5, [80, 220, 0]],
    [0.75, [255, 180, 0]],
    [1, [255, 0, 0]],
  ];

  let index = 0;
  while (index < stops.length - 2 && value > stops[index + 1][0]) {
    index += 1;
  }

  const [t0, c0] = stops[index];
  const [t1, c1] = stops[index + 1];
  const t = (value - t0) / (t1 - t0 || 1);

  const r = Math.round(c0[0] + t * (c1[0] - c0[0]));
  const g = Math.round(c0[1] + t * (c1[1] - c0[1]));
  const b = Math.round(c0[2] + t * (c1[2] - c0[2]));

  return `rgba(${r}, ${g}, ${b}, 0.45)`;
}
