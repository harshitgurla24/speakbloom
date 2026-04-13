import axios from 'axios'
import { API_BASE } from './constants'

export const ACCESS_TOKEN_KEY = 'speakbloom_access_token'

const apiClient = axios.create({
  baseURL: API_BASE,
})

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// API Key Management
export const apiKeyMethods = {
  // Save or update API key
  saveApiKey: (apiKey, provider = 'groq') =>
    apiClient.post('/api-key/save', { api_key: apiKey, provider }),
  
  // Validate API key before saving
  validateApiKey: (apiKey) =>
    apiClient.post('/api-key/validate', { api_key: apiKey }),
  
  // Check if user has API key (without retrieving it)
  getStatus: () =>
    apiClient.get('/api-key/status'),
  
  // Delete stored API key
  deleteApiKey: () =>
    apiClient.delete('/api-key/delete'),
}

// User Stats Management
export const userStatsMethods = {
  // Update user stats after a practice session
  updateStats: (data) =>
    apiClient.post('/user/stats/update', data),
}

// Admin Methods
export const adminMethods = {
  // Get admin dashboard with all users' stats
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),
  
  // Get all users info
  getUsers: () =>
    apiClient.get('/admin/users'),
  
  // Get summary admin stats
  getStats: () =>
    apiClient.get('/admin/stats'),
}

export default apiClient
