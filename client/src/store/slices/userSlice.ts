import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import { Profile, Verification } from '../../types'

interface UserState {
  profile: Profile | null
  verifications: Verification[]
  loading: boolean
  error: string | null
}

const initialState: UserState = {
  profile: null,
  verifications: [],
  loading: false,
  error: null,
}

export const updateProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: Partial<Profile>, { rejectWithValue }) => {
    try {
      const response = await api.put('/users/profile', profileData)
      return response.data.profile
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Profile update failed')
    }
  }
)

export const getVerificationStatus = createAsyncThunk(
  'user/getVerificationStatus',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/users/verification-status')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch verification status')
    }
  }
)

export const submitVerification = createAsyncThunk(
  'user/submitVerification',
  async (data: { type: string; documentUrls: string[] }, { rejectWithValue }) => {
    try {
      const response = await api.post('/users/submit-verification', data)
      return response.data.verification
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Verification submission failed')
    }
  }
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false
        state.profile = action.payload
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Get Verification Status
      .addCase(getVerificationStatus.fulfilled, (state, action) => {
        state.verifications = action.payload.verifications
      })
      
      // Submit Verification
      .addCase(submitVerification.fulfilled, (state, action) => {
        state.verifications.push(action.payload)
      })
  },
})

export const { clearError } = userSlice.actions
export default userSlice.reducer