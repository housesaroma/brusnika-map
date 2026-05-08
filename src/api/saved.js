import apiClient from './client';

export const savedApi = {
  getPolygons: () => apiClient.get('/saved/polygons'),
  createPolygon: (payload) => apiClient.post('/saved/polygons', payload),
  updatePolygon: (id, payload) => apiClient.put(`/saved/polygons/${id}`, payload),
  deletePolygon: async (id) => {
    try {
      return await apiClient.delete(`/saved/polygons/${id}`);
    } catch (error) {
      if (error?.response?.status !== 404) throw error;
      return apiClient.delete(`/saved/${id}`);
    }
  },
};

export default savedApi;
