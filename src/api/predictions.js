import apiClient from './client';

export const predictionsApi = {
  getFlatPrediction: (flatId) => apiClient.get(`/prediction/flat/${flatId}`),
  health: () => apiClient.get('/prediction/health'),
};

export default predictionsApi;
