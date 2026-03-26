import apiClient from './client';

export const propertiesApi = {
  getAll: (params) => apiClient.get('/properties', { params }),

  getById: (id) => apiClient.get(`/properties/${id}`),

  create: (data) => apiClient.post('/properties', data),

  update: (id, data) => apiClient.put(`/properties/${id}`, data),

  remove: (id) => apiClient.delete(`/properties/${id}`),

  search: (query) => apiClient.get('/properties/search', { params: { query } }),

  // Временный метод для загрузки из JSON (симуляция бэка)
  getMockData: async () => {
    const response = await fetch('/data/parsing-properties.json');
    if (!response.ok) {
      throw new Error('Failed to load mock data');
    }
    return response.json();
  },
};

export default propertiesApi;
