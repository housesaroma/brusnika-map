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
