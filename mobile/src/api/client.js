import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getToken } from '../utils/authStorage';

const client = axios.create({ baseURL: `${API_BASE_URL}/api` });

// Runs before every request this client makes - attaches the JWT automatically
// so no individual screen has to remember to add the Authorization header itself.
client.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default client;
