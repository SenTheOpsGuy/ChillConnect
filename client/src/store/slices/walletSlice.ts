import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import { TokenWallet, Transaction } from '../../types'

interface WalletState {
  wallet: TokenWallet | null
  transactions: Transaction[]
  loading: boolean
  error: string | null
  purchaseLoading: boolean
}

const initialState: WalletState = {
  wallet: null,
  transactions: [],
  loading: false,
  error: null,
  purchaseLoading: false,
}

export const getTokenBalance = createAsyncThunk(
  'wallet/getTokenBalance',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/tokens/balance')
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch balance')
    }
  }
)

export const createPayPalOrder = createAsyncThunk(
  'wallet/createPayPalOrder',
  async (tokenAmount: number, { rejectWithValue }) => {
    try {
      const response = await api.post('/tokens/create-paypal-order', { tokenAmount })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to create PayPal order')
    }
  }
)

export const purchaseTokens = createAsyncThunk(
  'wallet/purchaseTokens',
  async ({ tokenAmount, paypalOrderId }: { tokenAmount: number; paypalOrderId: string }, { rejectWithValue }) => {
    try {
      const response = await api.post('/tokens/purchase', { tokenAmount, paypalOrderId })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Token purchase failed')
    }
  }
)

export const getTransactionHistory = createAsyncThunk(
  'wallet/getTransactionHistory',
  async (params: { page?: number; type?: string } = {}, { rejectWithValue }) => {
    try {
      const response = await api.get('/tokens/transactions', { params })
      return response.data
    } catch (error: any) {
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
      if (state.wallet) {
        state.wallet.balance = action.payload
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Token Balance
      .addCase(getTokenBalance.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getTokenBalance.fulfilled, (state, action) => {
        state.loading = false
        state.wallet = {
          id: 'wallet',
          balance: action.payload.balance,
          escrowBalance: action.payload.escrowBalance,
          totalPurchased: action.payload.totalPurchased,
          totalSpent: action.payload.totalSpent
        }
        state.transactions = action.payload.recentTransactions || []
      })
      .addCase(getTokenBalance.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Purchase Tokens
      .addCase(purchaseTokens.pending, (state) => {
        state.purchaseLoading = true
        state.error = null
      })
      .addCase(purchaseTokens.fulfilled, (state, action) => {
        state.purchaseLoading = false
        if (state.wallet) {
          state.wallet.balance = action.payload.newBalance
        }
      })
      .addCase(purchaseTokens.rejected, (state, action) => {
        state.purchaseLoading = false
        state.error = action.payload as string
      })
      
      // Get Transaction History
      .addCase(getTransactionHistory.fulfilled, (state, action) => {
        state.transactions = action.payload.transactions
      })
  },
})

export const { clearError, updateBalance } = walletSlice.actions
export default walletSlice.reducer