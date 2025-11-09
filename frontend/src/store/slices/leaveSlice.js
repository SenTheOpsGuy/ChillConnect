import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  leaveTypes: [],
  myLeaveRequests: [],
  allLeaveRequests: [],
  currentLeaveRequest: null,
  leaveCalendar: [],
  myStatistics: null,
  loading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  },
}

// Async thunks
export const fetchLeaveTypes = createAsyncThunk(
  'leave/fetchLeaveTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/types')
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave types')
    }
  },
)

export const createLeaveRequest = createAsyncThunk(
  'leave/createLeaveRequest',
  async (leaveData, { rejectWithValue }) => {
    try {
      const response = await api.post('/leaves/requests', leaveData)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create leave request')
    }
  },
)

export const fetchMyLeaveRequests = createAsyncThunk(
  'leave/fetchMyLeaveRequests',
  async (status = null, { rejectWithValue }) => {
    try {
      const params = status ? { status } : {}
      const response = await api.get('/leaves/my-requests', { params })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave requests')
    }
  },
)

export const fetchAllLeaveRequests = createAsyncThunk(
  'leave/fetchAllLeaveRequests',
  async (filters = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/requests', { params: filters })
      return {
        leaveRequests: response.data.data,
        pagination: response.data.pagination,
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave requests')
    }
  },
)

export const fetchLeaveRequestById = createAsyncThunk(
  'leave/fetchLeaveRequestById',
  async (leaveRequestId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/leaves/requests/${leaveRequestId}`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave request')
    }
  },
)

export const approveLeaveRequest = createAsyncThunk(
  'leave/approveLeaveRequest',
  async ({ leaveRequestId, adminNotes }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/requests/${leaveRequestId}/approve`, { adminNotes })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to approve leave request')
    }
  },
)

export const rejectLeaveRequest = createAsyncThunk(
  'leave/rejectLeaveRequest',
  async ({ leaveRequestId, rejectionReason, adminNotes }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/requests/${leaveRequestId}/reject`, {
        rejectionReason,
        adminNotes,
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to reject leave request')
    }
  },
)

export const cancelLeaveRequest = createAsyncThunk(
  'leave/cancelLeaveRequest',
  async (leaveRequestId, { rejectWithValue }) => {
    try {
      const response = await api.put(`/leaves/requests/${leaveRequestId}/cancel`)
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to cancel leave request')
    }
  },
)

export const fetchMyLeaveStatistics = createAsyncThunk(
  'leave/fetchMyLeaveStatistics',
  async (year = new Date().getFullYear(), { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/my-statistics', { params: { year } })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch statistics')
    }
  },
)

export const fetchLeaveCalendar = createAsyncThunk(
  'leave/fetchLeaveCalendar',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get('/leaves/calendar', {
        params: { startDate, endDate },
      })
      return response.data.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch leave calendar')
    }
  },
)

const leaveSlice = createSlice({
  name: 'leave',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    clearCurrentLeaveRequest: (state) => {
      state.currentLeaveRequest = null
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Leave Types
      .addCase(fetchLeaveTypes.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaveTypes.fulfilled, (state, action) => {
        state.loading = false
        state.leaveTypes = action.payload
      })
      .addCase(fetchLeaveTypes.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Create Leave Request
      .addCase(createLeaveRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createLeaveRequest.fulfilled, (state, action) => {
        state.loading = false
        state.myLeaveRequests = [action.payload, ...state.myLeaveRequests]
      })
      .addCase(createLeaveRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch My Leave Requests
      .addCase(fetchMyLeaveRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyLeaveRequests.fulfilled, (state, action) => {
        state.loading = false
        state.myLeaveRequests = action.payload
      })
      .addCase(fetchMyLeaveRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch All Leave Requests
      .addCase(fetchAllLeaveRequests.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchAllLeaveRequests.fulfilled, (state, action) => {
        state.loading = false
        state.allLeaveRequests = action.payload.leaveRequests
        state.pagination = action.payload.pagination
      })
      .addCase(fetchAllLeaveRequests.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch Leave Request By ID
      .addCase(fetchLeaveRequestById.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaveRequestById.fulfilled, (state, action) => {
        state.loading = false
        state.currentLeaveRequest = action.payload
      })
      .addCase(fetchLeaveRequestById.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Approve Leave Request
      .addCase(approveLeaveRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(approveLeaveRequest.fulfilled, (state, action) => {
        state.loading = false
        // Update in allLeaveRequests
        const index = state.allLeaveRequests.findIndex(
          (req) => req.id === action.payload.id,
        )
        if (index !== -1) {
          state.allLeaveRequests[index] = action.payload
        }
        // Update currentLeaveRequest if it matches
        if (state.currentLeaveRequest?.id === action.payload.id) {
          state.currentLeaveRequest = action.payload
        }
      })
      .addCase(approveLeaveRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Reject Leave Request
      .addCase(rejectLeaveRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(rejectLeaveRequest.fulfilled, (state, action) => {
        state.loading = false
        // Update in allLeaveRequests
        const index = state.allLeaveRequests.findIndex(
          (req) => req.id === action.payload.id,
        )
        if (index !== -1) {
          state.allLeaveRequests[index] = action.payload
        }
        // Update currentLeaveRequest if it matches
        if (state.currentLeaveRequest?.id === action.payload.id) {
          state.currentLeaveRequest = action.payload
        }
      })
      .addCase(rejectLeaveRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Cancel Leave Request
      .addCase(cancelLeaveRequest.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(cancelLeaveRequest.fulfilled, (state, action) => {
        state.loading = false
        // Update in myLeaveRequests
        const index = state.myLeaveRequests.findIndex(
          (req) => req.id === action.payload.id,
        )
        if (index !== -1) {
          state.myLeaveRequests[index] = action.payload
        }
      })
      .addCase(cancelLeaveRequest.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch My Leave Statistics
      .addCase(fetchMyLeaveStatistics.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyLeaveStatistics.fulfilled, (state, action) => {
        state.loading = false
        state.myStatistics = action.payload
      })
      .addCase(fetchMyLeaveStatistics.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })

      // Fetch Leave Calendar
      .addCase(fetchLeaveCalendar.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchLeaveCalendar.fulfilled, (state, action) => {
        state.loading = false
        state.leaveCalendar = action.payload
      })
      .addCase(fetchLeaveCalendar.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, clearCurrentLeaveRequest } = leaveSlice.actions
export default leaveSlice.reducer
