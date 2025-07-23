import axios from 'axios'
import toast from 'react-hot-toast'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    const { response } = error

    if (response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    if (response?.status === 403) {
      toast.error('Access denied')
      return Promise.reject(error)
    }

    if (response?.status === 429) {
      toast.error('Too many requests. Please try again later.')
      return Promise.reject(error)
    }

    if (response?.status >= 500) {
      toast.error('Server error. Please try again later.')
      return Promise.reject(error)
    }

    // Handle network errors
    if (!response) {
      toast.error('Network error. Please check your connection.')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api