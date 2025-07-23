import { configureStore } from '@reduxjs/toolkit'
import authSlice from './slices/authSlice'
import userSlice from './slices/userSlice'
import bookingSlice from './slices/bookingSlice'
import chatSlice from './slices/chatSlice'
import walletSlice from './slices/walletSlice'

export const store = configureStore({
  reducer: {
    auth: authSlice,
    user: userSlice,
    booking: bookingSlice,
    chat: chatSlice,
    wallet: walletSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch