import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  balance: 0,
  escrowBalance: 0,
  totalEarned: 0,
  totalSpent: 0,
  transactions: [],
  tokenPackages: [],
  loading: false,
  error: null,
  paymentLoading: false
}

// Async thunks
export const fetchTokenPackages = createAsyncThunk(
  'wallet/fetchTokenPackages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tokens/packages')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch token packages')
    }
  }
)

export const fetchBalance = createAsyncThunk(
  'wallet/fetchBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tokens/balance')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch balance')
    }
  }
)

export const purchaseTokens = createAsyncThunk(
  'wallet/purchaseTokens',
  async (tokenAmount, { rejectWithValue }) => {
    try {
      const response = await api.post('/tokens/purchase', { tokenAmount })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Token purchase failed')
    }
  }
)

export const executePayment = createAsyncThunk(
  'wallet/executePayment',
  async ({ paymentId, payerId }, { rejectWithValue }) => {
    try {
      const response = await api.post('/tokens/execute-payment', { paymentId, payerId })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Payment execution failed')
    }
  }
)

export const fetchTransactions = createAsyncThunk(
  'wallet/fetchTransactions',
  async ({ page = 1, limit = 20 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/tokens/transactions', { 
        params: { page, limit } 
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch transactions')
    }
  }
)

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    updateBalance: (state, action) => {
      state.balance = action.payload.balance
      state.escrowBalance = action.payload.escrowBalance || state.escrowBalance
      state.totalEarned = action.payload.totalEarned || state.totalEarned
      state.totalSpent = action.payload.totalSpent || state.totalSpent
    },
    addTransaction: (state, action) => {
      state.transactions.unshift(action.payload)
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Token Packages
      .addCase(fetchTokenPackages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTokenPackages.fulfilled, (state, action) => {
        state.loading = false
        state.tokenPackages = action.payload
      })
      .addCase(fetchTokenPackages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Balance
      .addCase(fetchBalance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchBalance.fulfilled, (state, action) => {
        state.loading = false
        state.balance = action.payload.balance
        state.escrowBalance = action.payload.escrowBalance
        state.totalEarned = action.payload.totalEarned
        state.totalSpent = action.payload.totalSpent
      })
      .addCase(fetchBalance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Purchase Tokens
      .addCase(purchaseTokens.pending, (state) => {
        state.paymentLoading = true
        state.error = null
      })
      .addCase(purchaseTokens.fulfilled, (state, action) => {
        state.paymentLoading = false
        // Payment URL will be handled by the component
      })
      .addCase(purchaseTokens.rejected, (state, action) => {
        state.paymentLoading = false
        state.error = action.payload
      })
      
      // Execute Payment
      .addCase(executePayment.pending, (state) => {
        state.paymentLoading = true
        state.error = null
      })
      .addCase(executePayment.fulfilled, (state, action) => {
        state.paymentLoading = false
        state.balance = action.payload.newBalance
        // Add transaction to the list
        state.transactions.unshift({
          id: Date.now(),
          type: 'PURCHASE',
          amount: action.payload.tokenAmount,
          description: `Token purchase - ${action.payload.tokenAmount} tokens`,
          createdAt: new Date().toISOString()
        })
      })
      .addCase(executePayment.rejected, (state, action) => {
        state.paymentLoading = false
        state.error = action.payload
      })
      
      // Fetch Transactions
      .addCase(fetchTransactions.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchTransactions.fulfilled, (state, action) => {
        state.loading = false
        state.transactions = action.payload.transactions
      })
      .addCase(fetchTransactions.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  }
})

export const { clearError, updateBalance, addTransaction } = walletSlice.actions
export default walletSlice.reducer