import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

const initialState = {
  shifts: [],
  myShifts: [],
  organizationRoster: [],
  currentShift: null,
  availableEmployees: null,
  statistics: null,
  loading: false,
  error: null
};

// Async thunks
export const createShift = createAsyncThunk(
  'roster/createShift',
  async (shiftData, { rejectWithValue }) => {
    try {
      const response = await api.post('/roster/shifts', shiftData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create shift');
    }
  }
);

export const fetchShifts = createAsyncThunk(
  'roster/fetchShifts',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get('/roster/shifts', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shifts');
    }
  }
);

export const fetchShiftById = createAsyncThunk(
  'roster/fetchShiftById',
  async (shiftId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/roster/shifts/${shiftId}`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch shift');
    }
  }
);

export const updateShift = createAsyncThunk(
  'roster/updateShift',
  async ({ shiftId, updateData }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/roster/shifts/${shiftId}`, updateData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to update shift');
    }
  }
);

export const deleteShift = createAsyncThunk(
  'roster/deleteShift',
  async (shiftId, { rejectWithValue }) => {
    try {
      await api.delete(`/roster/shifts/${shiftId}`);
      return shiftId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to delete shift');
    }
  }
);

export const fetchMyShifts = createAsyncThunk(
  'roster/fetchMyShifts',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get('/roster/my-shifts', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch my shifts');
    }
  }
);

export const fetchOrganizationRoster = createAsyncThunk(
  'roster/fetchOrganizationRoster',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await api.get('/roster/organization', { params: filters });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch organization roster');
    }
  }
);

export const fetchRosterStatistics = createAsyncThunk(
  'roster/fetchRosterStatistics',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await api.get('/roster/statistics', {
        params: { startDate, endDate }
      });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch statistics');
    }
  }
);

export const fetchAvailableEmployees = createAsyncThunk(
  'roster/fetchAvailableEmployees',
  async ({ startDate, endDate, role }, { rejectWithValue }) => {
    try {
      const params = { startDate, endDate };
      if (role) params.role = role;
      const response = await api.get('/roster/available-employees', { params });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch available employees');
    }
  }
);

const rosterSlice = createSlice({
  name: 'roster',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentShift: (state) => {
      state.currentShift = null;
    },
    clearShifts: (state) => {
      state.shifts = [];
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Shift
      .addCase(createShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createShift.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = [...state.shifts, action.payload];
      })
      .addCase(createShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Shifts
      .addCase(fetchShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = action.payload;
      })
      .addCase(fetchShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Shift By ID
      .addCase(fetchShiftById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentShift = action.payload;
      })
      .addCase(fetchShiftById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Shift
      .addCase(updateShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateShift.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.shifts.findIndex((shift) => shift.id === action.payload.id);
        if (index !== -1) {
          state.shifts[index] = action.payload;
        }
        if (state.currentShift?.id === action.payload.id) {
          state.currentShift = action.payload;
        }
      })
      .addCase(updateShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Shift
      .addCase(deleteShift.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteShift.fulfilled, (state, action) => {
        state.loading = false;
        state.shifts = state.shifts.filter((shift) => shift.id !== action.payload);
        if (state.currentShift?.id === action.payload) {
          state.currentShift = null;
        }
      })
      .addCase(deleteShift.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch My Shifts
      .addCase(fetchMyShifts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMyShifts.fulfilled, (state, action) => {
        state.loading = false;
        state.myShifts = action.payload;
      })
      .addCase(fetchMyShifts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Organization Roster
      .addCase(fetchOrganizationRoster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrganizationRoster.fulfilled, (state, action) => {
        state.loading = false;
        state.organizationRoster = action.payload;
      })
      .addCase(fetchOrganizationRoster.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Roster Statistics
      .addCase(fetchRosterStatistics.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRosterStatistics.fulfilled, (state, action) => {
        state.loading = false;
        state.statistics = action.payload;
      })
      .addCase(fetchRosterStatistics.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Available Employees
      .addCase(fetchAvailableEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAvailableEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.availableEmployees = action.payload;
      })
      .addCase(fetchAvailableEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { clearError, clearCurrentShift, clearShifts } = rosterSlice.actions;
export default rosterSlice.reducer;
