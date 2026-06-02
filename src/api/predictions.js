import apiClient from './client';

export const predictionsApi = {
  getFlatPrediction: (flatId) => apiClient.get(`/Prediction/flat/${flatId}`),
  getFlatAnalogs: (flatId) =>
    apiClient.get(`/Prediction/flat/${flatId}/analogs`),
  health: () => apiClient.get('/Prediction/health'),
};

export default predictionsApi;
