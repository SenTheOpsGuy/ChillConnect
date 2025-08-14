import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000/api',
      NODE_ENV: 'test',
    },
  },
}

// Mock react-hot-toast to avoid issues in tests
vi.mock('react-hot-toast', () => ({
  success: vi.fn(),
  error: vi.fn(),
  loading: vi.fn(),
  dismiss: vi.fn(),
}))

// Mock react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useLocation: () => ({
      pathname: '/',
      search: '',
      hash: '',
      state: null,
    }),
  }
})

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:5000'
process.env.NODE_ENV = 'test'