import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000', // Change to your FastAPI backend URL
});

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export default api; 