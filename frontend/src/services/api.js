import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

export const getProducts = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/products`, { params });
  return response.data;
};

export const getCategories = async () => {
  const response = await axios.get(`${API_BASE}/categories`);
  return response.data;
};

export const getProduct = async (id) => {
  const response = await axios.get(`${API_BASE}/products/${id}`);
  return response.data;
};