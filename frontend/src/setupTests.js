import '@testing-library/jest-dom'

// Mock import.meta.env for Vite
global.import = {
  meta: {
    env: {
      VITE_API_BASE_URL: 'http://localhost:5000/api',
      NODE_ENV: 'test'
    }
  }
}

// Mock react-hot-toast to avoid issues in tests
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
  loading: jest.fn(),
  dismiss: jest.fn()
}))

// Mock react-router-dom hooks
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({
    pathname: '/',
    search: '',
    hash: '',
    state: null
  })
}))

// Mock environment variables
process.env.REACT_APP_API_URL = 'http://localhost:5000'
process.env.NODE_ENV = 'test'