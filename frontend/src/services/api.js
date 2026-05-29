import axios from 'axios';

const API_BASE = 'https://b3de-81-196-7-134.ngrok-free.app/api';

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