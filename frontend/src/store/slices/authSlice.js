import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import authService from '../../services/authService'

const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: false,
  loading: false,
  error: null,
}

// Async thunks
export const register = createAsyncThunk(
  'auth/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Registration failed')
    }
  },
)

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Login failed')
    }
  },
)

export const loadUser = createAsyncThunk(
  'auth/loadUser',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser()
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Failed to load user')
    }
  },
)

export const verifyEmail = createAsyncThunk(
  'auth/verifyEmail',
  async (token, { rejectWithValue }) => {
    try {
      const response = await authService.verifyEmail(token)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Email verification failed')
    }
  },
)

export const sendPhoneOTP = createAsyncThunk(
  'auth/sendPhoneOTP',
  async (phoneNumber, { rejectWithValue }) => {
    try {
      const response = await authService.sendPhoneOTP(phoneNumber)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Failed to send OTP')
    }
  },
)

export const verifyPhone = createAsyncThunk(
  'auth/verifyPhone',
  async (otp, { rejectWithValue }) => {
    try {
      const response = await authService.verifyPhone(otp)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Phone verification failed')
    }
  },
)

export const requestLoginOTP = createAsyncThunk(
  'auth/requestLoginOTP',
  async ({ identifier, type }, { rejectWithValue }) => {
    try {
      const response = await authService.requestLoginOTP(identifier, type)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Failed to send OTP')
    }
  },
)

export const verifyLoginOTP = createAsyncThunk(
  'auth/verifyLoginOTP',
  async ({ identifier, otp, type, userId }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyLoginOTP(identifier, otp, type, userId)
      return response
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'OTP verification failed')
    }
  },
)

export const logout = createAsyncThunk(
  'auth/logout',
  (_, { rejectWithValue }) => {
    try {
      authService.logout()
      return null
    } catch (error) {
      return rejectWithValue(error.error || error.message || 'Logout failed')
    }
  },
)

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateUser: (state, action) => {
      state.user = { ...state.user, ...action.payload }
    },
  },
  extraReducers: (builder) => {
    builder
      // Register
      .addCase(register.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(register.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user
        if (action.payload.token) {
          state.token = action.payload.token
          state.isAuthenticated = true
          localStorage.setItem('token', action.payload.token)
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Login
      .addCase(login.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false
        // Handle nested data structure from backend
        const responseData = action.payload.data || action.payload
        state.user = responseData.user || action.payload.user
        state.token = responseData.token || action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', responseData.token || action.payload.token)
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Load User
      .addCase(loadUser.pending, (state) => {
        state.loading = true
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false
        state.user = action.payload.user || action.payload
        state.isAuthenticated = true
      })
      .addCase(loadUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        state.isAuthenticated = false
        state.token = null
        localStorage.removeItem('token')
      })
      
      // Verify Email
      .addCase(verifyEmail.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyEmail.fulfilled, (state) => {
        state.loading = false
        if (state.user) {
          state.user.isEmailVerified = true
        }
      })
      .addCase(verifyEmail.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Send Phone OTP
      .addCase(sendPhoneOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(sendPhoneOTP.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(sendPhoneOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Verify Phone
      .addCase(verifyPhone.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyPhone.fulfilled, (state) => {
        state.loading = false
        if (state.user) {
          state.user.isPhoneVerified = true
        }
      })
      .addCase(verifyPhone.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Request Login OTP
      .addCase(requestLoginOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(requestLoginOTP.fulfilled, (state) => {
        state.loading = false
      })
      .addCase(requestLoginOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Verify Login OTP
      .addCase(verifyLoginOTP.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(verifyLoginOTP.fulfilled, (state, action) => {
        state.loading = false
        // Handle nested data structure from backend
        const responseData = action.payload.data || action.payload
        state.user = responseData.user || action.payload.user
        state.token = responseData.token || action.payload.token
        state.isAuthenticated = true
        localStorage.setItem('token', responseData.token || action.payload.token)
      })
      .addCase(verifyLoginOTP.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Logout
      .addCase(logout.pending, (state) => {
        state.loading = true
      })
      .addCase(logout.fulfilled, (state) => {
        state.loading = false
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      })
      .addCase(logout.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
        // Still logout locally even if API call fails
        state.user = null
        state.token = null
        state.isAuthenticated = false
        localStorage.removeItem('token')
      })
  },
})

export const { clearError, updateUser } = authSlice.actions
export default authSlice.reducer