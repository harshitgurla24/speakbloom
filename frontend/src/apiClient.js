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

export default apiClient
