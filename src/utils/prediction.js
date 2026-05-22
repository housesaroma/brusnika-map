import { parseCoordsToLngLat } from '@/utils/geo';
import { formatPricePerSqm } from '@/utils/formatters';

export function normalizeAnalogItem(item) {
  if (!item) return null;

  const id = item.flatId || item.FlatId || item.id;
  if (!id) return null;

  const price = Number(item.price ?? item.Price ?? 0);
  const area = Number(item.area ?? item.Area ?? 0);
  const sqmRaw = item.sqm ?? item.SQM ?? item.pricePerSqm ?? item.PricePerSqm;
  const sqm = Number(sqmRaw) || (area > 0 && price > 0 ? price / area : 0);
  const coordsRaw =
    item.coords || item.Coords || item.geoPoint || item.GeoPoint || item.geo_point || '';

  return {
    id,
    flatId: id,
    rooms: Number(item.rooms ?? item.Rooms ?? 0),
    area,
    floor: Number(item.floor ?? item.Floor ?? 0),
    price,
    sqm,
    similarity: Number(item.similarityScore ?? item.SimilarityScore ?? item.similarity ?? 0),
    address: item.address ?? item.Address ?? 'Без адреса',
    pricePerSqm: formatPricePerSqm(sqm),
    center: parseCoordsToLngLat(coordsRaw),
  };
}

export function normalizeAnalogList(data) {
  const list = Array.isArray(data)
    ? data
    : data?.analogs || data?.Analogs || data?.similarFlats || data?.SimilarFlats || [];

  return list.map(normalizeAnalogItem).filter(Boolean);
}

export function analogToFlatStub(analog) {
  if (!analog) return null;
  return {
    id: analog.flatId || analog.id,
    rooms: analog.rooms,
    area: analog.area,
    floor: analog.floor,
    price: analog.price,
    sqm: analog.sqm,
    address: analog.address,
    center: analog.center,
  };
}

export function normalizePrediction(data) {
  if (!data) return null;

  const similarFlats = data.similarFlats || data.SimilarFlats || [];
  const maxSimilarity = similarFlats.reduce((max, item) => {
    const score = Number(item.similarityScore ?? item.SimilarityScore ?? 0);
    return Number.isFinite(score) ? Math.max(max, score) : max;
  }, 0);

  const predictedPrice = data.predictedPrice ?? data.PredictedPrice ?? null;
  const predictedPriceMlnRaw = data.predictedPriceMln ?? data.PredictedPriceMln;
  const predictedPriceMln =
    predictedPriceMlnRaw ?? (Number.isFinite(predictedPrice) ? predictedPrice / 1_000_000 : null);

  return {
    predictionTime: data.predictionTime ?? data.PredictionTime ?? null,
    actualPrice: data.actualPrice ?? data.ActualPrice ?? null,
    predictedPrice,
    predictedPriceMln,
    deviationPercent: data.deviationPercent ?? data.DeviationPercent ?? null,
    status: data.status ?? data.Status ?? null,
    recommendation: data.recommendation ?? data.Recommendation ?? null,
    confidence: data.confidence ?? data.Confidence ?? null,
    modelVersion: data.modelVersion ?? data.ModelVersion ?? null,
    similarFlats,
    maxSimilarity,
  };
}
