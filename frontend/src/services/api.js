import axios from 'axios';

const API_BASE = 'https://exception-sectional-skittle.ngrok-free.dev/api';

const axiosInstance = axios.create({
  baseURL: API_BASE,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
});

export const getProducts = async (params = {}) => {
  const response = await axiosInstance.get('/products', { params });
  return response.data;
};

export const getCategories = async () => {
  const response = await axiosInstance.get('/categories');
  return response.data;
};

export const getProduct = async (id) => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};