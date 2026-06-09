import apiClient from './client';

export const predictionsApi = {
  getFlatPrediction: (flatId) => apiClient.get(`/Prediction/flat/${flatId}`),
  getFlatAnalogs: (flatId) => apiClient.get(`/Prediction/flat/${flatId}/analogs`),
  estimateByParams: (params) => apiClient.post('/Prediction/predict-by-parameters', params),
  health: () => apiClient.get('/Prediction/health'),
};

export default predictionsApi;
