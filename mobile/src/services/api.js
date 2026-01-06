import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/env';

// Base URL from centralized config
const BASE_URL = API_URL;

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      // You might want to redirect to login here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  verifyStudent: (studentId) => api.post('/auth/verify-student', { studentId }),
  updatePassword: (data) => api.put('/auth/update-password', data),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  uploadProfileImage: (formData) => api.post('/users/profile/image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getVisits: (params) => api.get('/users/visits', { params }),
  getChallenges: (params) => api.get('/users/challenges', { params }),
  getRewards: (status) => api.get('/users/rewards', { params: { status } }),
  getLeaderboard: (limit) => api.get('/users/leaderboard', { params: { limit } }),
  updateLocation: (location) => api.put('/users/location', location),
};

// Museum API
export const museumAPI = {
  getAll: () => api.get('/museums'),
  getNearby: (latitude, longitude, radius) => 
    api.get('/museums/nearby', { params: { latitude, longitude, radius } }),
  detect: (latitude, longitude) => 
    api.get('/museums/detect', { params: { latitude, longitude } }),
  getById: (id) => api.get(`/museums/${id}`),
  getBeys: (id) => api.get(`/museums/${id}/beys`),
  getHotspots: (id, latitude, longitude) => 
    api.get(`/museums/${id}/hotspots`, { params: { latitude, longitude } }),
};

// Bey API
export const beyAPI = {
  getAll: (params) => api.get('/beys', { params }),
  getTimeline: () => api.get('/beys/timeline'),
  getById: (id) => api.get(`/beys/${id}`),
  getPuzzleInfo: (id) => api.get(`/beys/${id}/puzzle-info`),
  getUserProgress: (id) => api.get(`/beys/${id}/user-progress`),
  search: (query) => api.get(`/beys/search/${query}`),
};

// Dynasty API
export const dynastyAPI = {
  getAll: () => api.get('/dynasties'),
  getById: (id) => api.get(`/dynasties/${id}`),
};

// Visit API
export const visitAPI = {
  start: (data) => api.post('/visits/start', data),
  end: (id, data) => api.put(`/visits/${id}/end`, data),
  getActive: () => api.get('/visits/active'),
  updateLocation: (id, location) => api.put(`/visits/${id}/location`, location),
  getById: (id) => api.get(`/visits/${id}`),
};

// Challenge API
export const challengeAPI = {
  start: (data) => api.post('/challenges/start', data),
  collectPiece: (id, data) => api.post(`/challenges/${id}/collect-piece`, data),
  useHint: (id) => api.post(`/challenges/${id}/use-hint`),
  pause: (id) => api.put(`/challenges/${id}/pause`),
  resume: (id) => api.put(`/challenges/${id}/resume`),
  abandon: (id) => api.put(`/challenges/${id}/abandon`),
  getById: (id) => api.get(`/challenges/${id}`),
};

// Reward API
export const rewardAPI = {
  getAll: (params) => api.get('/rewards', { params }),
  getById: (id) => api.get(`/rewards/${id}`),
  redeem: (id, location) => api.post(`/rewards/${id}/redeem`, { location }),
  verify: (code) => api.get(`/rewards/verify/${code}`),
};

// Export API_URL for image URL construction
export { API_URL };

export default api;
