import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  bookings: [],
  providers: [],
  currentBooking: null,
  loading: false,
  error: null,
  searchFilters: {
    location: '',
    service: '',
    date: '',
    page: 1,
    limit: 20,
  },
}

// Async thunks
export const searchProviders = createAsyncThunk(
  'booking/searchProviders',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/search', { params: filters })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Search failed')
    }
  },
)

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/create', bookingData)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Booking creation failed')
    }
  },
)

export const fetchMyBookings = createAsyncThunk(
  'booking/fetchMyBookings',
  async (params, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my-bookings', { params })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings')
    }
  },
)

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ bookingId, status, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, { status, reason })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Status update failed')
    }
  },
)

export const fetchBookingDetails = createAsyncThunk(
  'booking/fetchBookingDetails',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`)
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch booking details')
    }
  },
)

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateSearchFilters: (state, action) => {
      state.searchFilters = { ...state.searchFilters, ...action.payload }
    },
    clearBookings: (state) => {
      state.bookings = []
    },
    clearProviders: (state) => {
      state.providers = []
    },
  },
  extraReducers: (builder) => {
    builder
      // Search Providers
      .addCase(searchProviders.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(searchProviders.fulfilled, (state, action) => {
        state.loading = false
        state.providers = action.payload.providers
      })
      .addCase(searchProviders.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.bookings.unshift(action.payload.booking)
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch My Bookings
      .addCase(fetchMyBookings.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading = false
        state.bookings = action.payload.bookings
      })
      .addCase(fetchMyBookings.rejected, (state, action) => {
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
        const booking = state.bookings.find(b => b.id === action.payload.booking.id)
        if (booking) {
          booking.status = action.payload.booking.status
          booking.completedAt = action.payload.booking.completedAt
        }
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Booking Details
      .addCase(fetchBookingDetails.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBookingDetails.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload.booking
      })
      .addCase(fetchBookingDetails.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearError, updateSearchFilters, clearBookings, clearProviders } = bookingSlice.actions
export default bookingSlice.reducer