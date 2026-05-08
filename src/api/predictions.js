import apiClient from './client';

export const predictionsApi = {
  getFlatPrediction: (flatId) => apiClient.get(`/Prediction/flat/${flatId}`),
  health: () => apiClient.get('/Prediction/health'),
};

export default predictionsApi;
