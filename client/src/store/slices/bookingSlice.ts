import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import { Booking, Provider } from '../../types'

interface BookingState {
  bookings: Booking[]
  providers: Provider[]
  currentBooking: Booking | null
  loading: boolean
  error: string | null
  searchLoading: boolean
}

const initialState: BookingState = {
  bookings: [],
  providers: [],
  currentBooking: null,
  loading: false,
  error: null,
  searchLoading: false,
}

export const searchProviders = createAsyncThunk(
  'booking/searchProviders',
  async (params: { location?: string; service?: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/search', { params })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Search failed')
    }
  }
)

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData: {
    providerId: string
    type: 'INCALL' | 'OUTCALL'
    scheduledAt: string
    duration: number
    location?: string
    notes?: string
  }, { rejectWithValue }) => {
    try {
      const response = await api.post('/bookings/create', bookingData)
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Booking creation failed')
    }
  }
)

export const getMyBookings = createAsyncThunk(
  'booking/getMyBookings',
  async (params: { page?: number; status?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/bookings/my-bookings', { params })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch bookings')
    }
  }
)

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ id, status }: { id: string; status: string }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, { status })
      return { id, status, ...response.data }
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Status update failed')
    }
  }
)

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Providers
      .addCase(searchProviders.pending, (state) => {
        state.searchLoading = true
        state.error = null
      })
      .addCase(searchProviders.fulfilled, (state, action) => {
        state.searchLoading = false
        state.providers = action.payload.providers
      })
      .addCase(searchProviders.rejected, (state, action) => {
        state.searchLoading = false
        state.error = action.payload as string
      })
      
      // Create Booking
      .addCase(createBooking.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.loading = false
        state.currentBooking = action.payload.booking
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Get My Bookings
      .addCase(getMyBookings.fulfilled, (state, action) => {
        state.bookings = action.payload.bookings
      })
      
      // Update Booking Status
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const index = state.bookings.findIndex(b => b.id === action.payload.id)
        if (index !== -1) {
          state.bookings[index].status = action.payload.status
        }
      })
  },
})

export const { clearError, setCurrentBooking } = bookingSlice.actions
export default bookingSlice.reducer