import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit'
import api from '../../services/api'
import { User } from '../../types'

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      return { token, user }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Login failed')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
    dateOfBirth: string
    phone: string
    role: 'SEEKER' | 'PROVIDER'
    isAdultConsent: string
    termsAccepted: string
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/register', userData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Registration failed')
    }
  }
)

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('No token found')
      }
      
      const response = await api.get('/users/profile')
      return response.data
    } catch (error: any) {
      localStorage.removeItem('token')
      return rejectWithValue('Authentication failed')
    }
  }
)

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token: string, { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/verify-email', { token })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Email verification failed')
    }
  }
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user = null
      state.token = null
      state.isAuthenticated = false
      localStorage.removeItem('token')
    },
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action: PayloadAction<Partial<User>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        state.token = action.payload.token
        state.user = action.payload.user
        state.isAuthenticated = true
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload
        state.isAuthenticated = true
      })
      .addCase(checkAuth.rejected, (state) => {
        state.loading = false
        state.isAuthenticated = false
        state.user = null
        state.token = null
      })
      
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false
        if (state.user) {
          state.user.isVerified = true
          state.user.verificationStatus = 'APPROVED'
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const { logout, clearError, updateUser } = authSlice.actions
export default authSlice.reducer