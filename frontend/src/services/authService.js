import api from './api'

const authService = {
  // Register a new user
  register: async (userData) => {
    try {
      // Transform frontend field names to backend format
      const transformedData = {
        email: userData.email,
        password: userData.password,
        full_name: `${userData.firstName} ${userData.lastName}`.trim(),
        user_type: userData.role?.toLowerCase() || 'seeker',
        phone: userData.phone,
        date_of_birth: userData.dateOfBirth,
        age_confirmed: userData.ageConfirmed,
        consent_given: userData.consentGiven,
      }
      
      const response = await api.post('/auth/register', transformedData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials)
      if (response.data.token) {
        localStorage.setItem('token', response.data.token)
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`
      }
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Logout user
  logout: () => {
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Verify email
  verifyEmail: async (token) => {
    try {
      const response = await api.post('/verify-email', { token })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Resend verification email
  resendVerification: async (email) => {
    try {
      const response = await api.post('/resend-verification', { email })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Send email verification OTP
  sendEmailVerification: async (email, userId = null) => {
    try {
      const response = await api.post('/auth/send-email-otp', { email, userId })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Verify email OTP
  verifyEmailOTP: async (email, otp, userId = null) => {
    try {
      const response = await api.post('/auth/verify-email-otp', { email, otp, userId })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Send phone OTP
  sendPhoneOTP: async (phone) => {
    try {
      const response = await api.post('/auth/send-phone-otp', { phone })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Verify phone OTP
  verifyPhoneOTP: async (phone, otp) => {
    try {
      const response = await api.post('/auth/verify-phone-otp', { phone, otp })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Request OTP for login
  requestLoginOTP: async (identifier, type) => {
    try {
      const response = await api.post('/auth/login-otp-request', { identifier, type })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Verify OTP for login
  verifyLoginOTP: async (identifier, otp, type, userId) => {
    try {
      const response = await api.post('/auth/login-otp-verify', { identifier, otp, type, userId })
      if (response.data.data?.token || response.data.token) {
        const token = response.data.data?.token || response.data.token
        localStorage.setItem('token', token)
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },


  // Request password reset
  requestPasswordReset: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Forgot password (alias for requestPasswordReset)
  forgotPassword: async (email) => {
    try {
      console.log('🔍 AuthService - Making API call to /auth/forgot-password for:', email, '(v2.0 - fixed path)')
      const response = await api.post('/auth/forgot-password', { email })
      console.log('✅ AuthService - API response:', response.data)
      return response.data
    } catch (error) {
      console.error('❌ AuthService - API error:', error)
      throw error.response?.data || error.message
    }
  },

  // Reset password
  resetPassword: async (token, password) => {
    try {
      const response = await api.post('/auth/reset-password', { token, password })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/change-password', { 
        currentPassword, 
        newPassword, 
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.put('/profile', profileData)
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Upload profile photo
  uploadProfilePhoto: async (formData) => {
    try {
      const response = await api.post('/upload-photo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Submit document for verification
  submitDocumentVerification: async (formData) => {
    try {
      const response = await api.post('/verify-document', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Get verification status
  getVerificationStatus: async () => {
    try {
      const response = await api.get('/verification-status')
      return response.data
    } catch (error) {
      throw error.response?.data || error.message
    }
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    const token = localStorage.getItem('token')
    return !!token
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem('token')
  },

  // Initialize auth state from localStorage
  initializeAuth: () => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    }
  },
}

export default authService