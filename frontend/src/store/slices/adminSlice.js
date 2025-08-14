import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  dashboard: {
    stats: {},
    userRoleStats: [],
    bookingStatusStats: [],
    recentActivities: {},
  },
  users: [],
  verificationQueue: [],
  bookings: [],
  flaggedMessages: [],
  assignments: [],
  loading: false,
  error: null,
}

// Async thunks
export const fetchDashboard = createAsyncThunk(
  'admin/fetchDashboard',
  async (timeframe = '24h', { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/dashboard', { 
        params: { timeframe }, 
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch dashboard')
    }
  },
)

export const fetchUsers = createAsyncThunk(
  'admin/fetchUsers',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/users', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch users')
    }
  },
)

export const fetchVerificationQueue = createAsyncThunk(
  'admin/fetchVerificationQueue',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/verification-queue', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch verification queue')
    }
  },
)

export const updateVerification = createAsyncThunk(
  'admin/updateVerification',
  async ({ verificationId, status, notes }, { rejectWithValue }) => {
    try {
      await api.put(`/admin/verification/${verificationId}`, { 
        status, 
        notes, 
      })
      return { verificationId, status, notes }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update verification')
    }
  },
)

export const fetchBookings = createAsyncThunk(
  'admin/fetchBookings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/bookings', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings')
    }
  },
)

export const updateBookingStatus = createAsyncThunk(
  'admin/updateBookingStatus',
  async ({ bookingId, status, note }, { rejectWithValue }) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/status`, { 
        status, 
        note, 
      })
      return { bookingId, status, note }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update booking status')
    }
  },
)

export const fetchFlaggedMessages = createAsyncThunk(
  'admin/fetchFlaggedMessages',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/flagged-messages', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch flagged messages')
    }
  },
)

export const fetchAssignments = createAsyncThunk(
  'admin/fetchAssignments',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/assignments')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch assignments')
    }
  },
)

export const reassignTask = createAsyncThunk(
  'admin/reassignTask',
  async ({ assignmentId, newEmployeeId }, { rejectWithValue }) => {
    try {
      await api.post('/admin/assignments/reassign', { 
        assignmentId, 
        newEmployeeId, 
      })
      return { assignmentId, newEmployeeId }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to reassign task')
    }
  },
)

export const fetchMyQueue = createAsyncThunk(
  'admin/fetchMyQueue',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/admin/my-queue')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch my queue')
    }
  },
)

export const updateUserRole = createAsyncThunk(
  'admin/updateUserRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role })
      return { userId, role }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update user role')
    }
  },
)

export const suspendUser = createAsyncThunk(
  'admin/suspendUser',
  async ({ userId, suspended, reason }, { rejectWithValue }) => {
    try {
      await api.post(`/admin/users/${userId}/suspend`, { 
        suspended, 
        reason, 
      })
      return { userId, suspended, reason }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to suspend user')
    }
  },
)

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateDashboardStats: (state, action) => {
      state.dashboard.stats = { ...state.dashboard.stats, ...action.payload }
    },
    addRecentActivity: (state, action) => {
      if (state.dashboard.recentActivities.users) {
        state.dashboard.recentActivities.users.unshift(action.payload)
        state.dashboard.recentActivities.users = state.dashboard.recentActivities.users.slice(0, 5)
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Dashboard
      .addCase(fetchDashboard.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDashboard.fulfilled, (state, action) => {
        state.loading = false
        state.dashboard = action.payload
      })
      .addCase(fetchDashboard.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Users
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false
        state.users = action.payload.users
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Verification Queue
      .addCase(fetchVerificationQueue.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchVerificationQueue.fulfilled, (state, action) => {
        state.loading = false
        state.verificationQueue = action.payload.verifications
      })
      .addCase(fetchVerificationQueue.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Verification
      .addCase(updateVerification.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateVerification.fulfilled, (state, action) => {
        state.loading = false
        const verification = state.verificationQueue.find(v => v.id === action.payload.verificationId)
        if (verification) {
          verification.status = action.payload.status
          verification.notes = action.payload.notes
        }
      })
      .addCase(updateVerification.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Bookings
      .addCase(fetchBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.bookings
      })
      .addCase(fetchBookings.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update Booking Status
      .addCase(updateBookingStatus.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.loading = false
        const booking = state.bookings.find(b => b.id === action.payload.bookingId)
        if (booking) {
          booking.status = action.payload.status
          if (action.payload.note) {
            booking.notes = action.payload.note
          }
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Flagged Messages
      .addCase(fetchFlaggedMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchFlaggedMessages.fulfilled, (state, action) => {
        state.loading = false
        state.flaggedMessages = action.payload.messages
      })
      .addCase(fetchFlaggedMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Assignments
      .addCase(fetchAssignments.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAssignments.fulfilled, (state, action) => {
        state.loading = false
        state.assignments = action.payload.workloads
      })
      .addCase(fetchAssignments.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Reassign Task
      .addCase(reassignTask.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(reassignTask.fulfilled, (state) => {
        state.loading = false
        // Update assignment in the list
      })
      .addCase(reassignTask.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch My Queue
      .addCase(fetchMyQueue.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyQueue.fulfilled, (state, action) => {
        state.loading = false
        state.myQueue = action.payload.queue
      })
      .addCase(fetchMyQueue.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Update User Role
      .addCase(updateUserRole.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        state.loading = false
        const user = state.users.find(u => u.id === action.payload.userId)
        if (user) {
          user.role = action.payload.role
        }
      })
      .addCase(updateUserRole.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Suspend User
      .addCase(suspendUser.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(suspendUser.fulfilled, (state, action) => {
        state.loading = false
        const user = state.users.find(u => u.id === action.payload.userId)
        if (user) {
          user.isVerified = !action.payload.suspended
        }
      })
      .addCase(suspendUser.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, updateDashboardStats, addRecentActivity } = adminSlice.actions
export default adminSlice.reducer