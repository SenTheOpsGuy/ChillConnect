import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import bookingSlice from './slices/bookingSlice'
import chatSlice from './slices/chatSlice'
import walletSlice from './slices/walletSlice'
import adminSlice from './slices/adminSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    booking: bookingSlice,
    chat: chatSlice,
    wallet: walletSlice,
    admin: adminSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
  devTools: process.env.NODE_ENV !== 'production',
})

// Make store globally available for debugging
if (typeof window !== 'undefined') {
  window.store = store
  console.log('🏪 Redux store initialized and made globally available')
}