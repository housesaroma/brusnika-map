import apiClient from './client';

export const mapApi = {
  getBuildings: (cityId, params = {}) => apiClient.get(`/map/${cityId}/buildings`, { params }),
  getBuildingFlats: (cityId, buildingId) => apiClient.get(`/map/${cityId}/${buildingId}/flats`),
  searchFlats: (payload) => apiClient.post('/map/search', payload),
  getHeatmap: (cityId) => apiClient.get(`/map/${cityId}/heatmap`),
};

export default mapApi;
