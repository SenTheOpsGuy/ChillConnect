import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from 'react-query'
import { configureStore } from '@reduxjs/toolkit'
import { Toaster } from 'react-hot-toast'

import authSlice from '@/store/slices/authSlice'
import bookingSlice from '@/store/slices/bookingSlice'
import chatSlice from '@/store/slices/chatSlice'
import walletSlice from '@/store/slices/walletSlice'
import adminSlice from '@/store/slices/adminSlice'

// Test store creator
export function createTestStore(preloadedState = {}) {
  return configureStore({
    reducer: {
      auth: authSlice,
      booking: bookingSlice,
      chat: chatSlice,
      wallet: walletSlice,
      admin: adminSlice,
    },
    preloadedState,
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  })
}

// Test query client
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        cacheTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

// Custom render function
export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = createTestStore(preloadedState),
    queryClient = createTestQueryClient(),
    ...renderOptions
  } = {},
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            {children}
            <Toaster position='top-right' />
          </BrowserRouter>
        </QueryClientProvider>
      </Provider>
    )
  }

  return {
    store,
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Mock authenticated user state
export const mockAuthenticatedState = {
  auth: {
    isAuthenticated: true,
    user: global.testUser,
    token: 'mock-jwt-token',
    loading: false,
    error: null,
  },
}

// Mock provider state
export const mockProviderState = {
  auth: {
    isAuthenticated: true,
    user: global.testProvider,
    token: 'mock-jwt-token',
    loading: false,
    error: null,
  },
}

// Mock admin state
export const mockAdminState = {
  auth: {
    isAuthenticated: true,
    user: {
      ...global.testUser,
      role: 'ADMIN',
    },
    token: 'mock-jwt-token',
    loading: false,
    error: null,
  },
}

// Mock booking state
export const mockBookingState = {
  booking: {
    bookings: [
      {
        id: 'booking-1',
        serviceType: 'INCALL',
        status: 'CONFIRMED',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        tokenAmount: 500,
        provider: global.testProvider,
        seeker: global.testUser,
      },
    ],
    currentBooking: null,
    loading: false,
    error: null,
  },
}

// Mock wallet state
export const mockWalletState = {
  wallet: {
    balance: 1000,
    totalEarned: 2000,
    totalSpent: 1000,
    transactions: [],
    loading: false,
    error: null,
  },
}

// Helper functions
export function waitForLoadingToFinish() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

export function mockLocalStorage() {
  const storage = {}

  return {
    getItem: vi.fn(key => storage[key] || null),
    setItem: vi.fn((key, value) => {
      storage[key] = value
    }),
    removeItem: vi.fn(key => {
      delete storage[key]
    }),
    clear: vi.fn(() => {
      Object.keys(storage).forEach(key => delete storage[key])
    }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { renderWithProviders as render }
