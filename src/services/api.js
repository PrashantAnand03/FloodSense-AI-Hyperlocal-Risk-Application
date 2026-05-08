import axios from 'axios';
import { supabase } from '../lib/supabase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Axios instance ────────────────────────────────────────────
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
});

// Attach token to every request dynamically
api.interceptors.request.use(async (config) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      config.headers['Authorization'] = `Bearer ${session.access_token}`;
    }
  } catch (err) {
    console.warn('[API] Token error:', err.message);
  }
  return config;
});

// ── Auth & Users ──────────────────────────────────────────────
export const fetchUsers = () =>
  api.get('/auth/users').then(r => r.data.users);

export const deleteUser = (id) =>
  api.delete(`/auth/users/${id}`).then(r => r.data);

// ── Weather ───────────────────────────────────────────────────
export const getWeatherByCoords = (lat, lon) =>
  api.get('/weather/current', { params: { lat, lon } }).then(r => r.data);

export const getForecast = (lat, lon) =>
  api.get('/weather/forecast', { params: { lat, lon } }).then(r => r.data);

export const searchLocations = (q) =>
  api.get('/weather/search', { params: { q } }).then(r => r.data);

// ── Risk ──────────────────────────────────────────────────────
export const calculateRisk = (lat, lon, locationName, simulateExtreme = false) =>
  api.post('/risk/calculate', { lat, lon, locationName, simulateExtreme }).then(r => r.data);

export const calculateMultiRisk = (locations) =>
  api.post('/risk/multi', { locations }).then(r => r.data);

export const calculateForecastRisk = (lat, lon) =>
  api.post('/risk/forecast', { lat, lon }).then(r => r.data);

// ── Elevation ─────────────────────────────────────────────────
export const getElevation = (lat, lon) =>
  api.get('/elevation', { params: { lat, lon } }).then(r => r.data);

// ── Saved Locations ───────────────────────────────────────────
export const fetchSavedLocations = () =>
  api.get('/locations').then(r => r.data.locations);

export const saveLocationToDb = (name, lat, lon) =>
  api.post('/locations', { name, lat, lon }).then(r => r.data);

export const deleteLocationFromDb = (id) =>
  api.delete(`/locations/${id}`).then(r => r.data);

// ── Risk History ──────────────────────────────────────────────
export const fetchHistory = (limit = 50) =>
  api.get('/history', { params: { limit } }).then(r => r.data.history);

export const fetchHistoryStats = () =>
  api.get('/history/stats').then(r => r.data.stats);

export const saveAssessmentToDb = (payload) =>
  api.post('/history', payload).then(r => r.data);

export const deleteAssessmentFromDb = (id) =>
  api.delete(`/history/${id}`).then(r => r.data);

export default api;
