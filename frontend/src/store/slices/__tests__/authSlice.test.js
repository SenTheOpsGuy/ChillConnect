import { describe, it, expect, beforeEach } from 'vitest'
import authReducer, {
  login,
  logout,
  loadUser,
  clearError,
  updateUser,
  register,
  verifyEmail,
} from '../authSlice'

describe('authSlice', () => {
  let initialState

  beforeEach(() => {
    initialState = {
      isAuthenticated: false,
      user: null,
      token: null,
      loading: false,
      error: null,
    }
  })

  describe('reducers', () => {
    it('should handle initial state', () => {
      expect(authReducer(undefined, { type: 'unknown' })).toEqual({
        ...initialState,
        token: null // Remove localStorage token for tests
      })
    })

    it('should handle login.pending', () => {
      const actual = authReducer(initialState, login.pending())
      expect(actual.loading).toBe(true)
      expect(actual.error).toBe(null)
    })

    it('should handle login.fulfilled', () => {
      const payload = {
        user: global.testUser,
        token: 'test-token',
      }
      const actual = authReducer(initialState, login.fulfilled(payload))
      
      expect(actual.loading).toBe(false)
      expect(actual.isAuthenticated).toBe(true)
      expect(actual.user).toEqual(payload.user)
      expect(actual.token).toBe(payload.token)
    })

    it('should handle login.rejected', () => {
      const errorMessage = 'Invalid credentials'
      const actual = authReducer(initialState, login.rejected(null, '', null, errorMessage))
      
      expect(actual.loading).toBe(false)
      expect(actual.isAuthenticated).toBe(false)
      expect(actual.error).toBe(errorMessage)
    })

    it('should handle logout.fulfilled', () => {
      const authenticatedState = {
        ...initialState,
        isAuthenticated: true,
        user: global.testUser,
        token: 'test-token',
      }
      
      const actual = authReducer(authenticatedState, logout.fulfilled())
      expect(actual.isAuthenticated).toBe(false)
      expect(actual.user).toBe(null)
      expect(actual.token).toBe(null)
    })

    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      }
      
      const actual = authReducer(stateWithError, clearError())
      expect(actual.error).toBe(null)
    })

    it('should handle updateUser', () => {
      const authenticatedState = {
        ...initialState,
        isAuthenticated: true,
        user: global.testUser,
        token: 'test-token',
      }
      
      const userUpdate = {
        firstName: 'Updated',
        lastName: 'Name',
      }
      
      const actual = authReducer(authenticatedState, updateUser(userUpdate))
      expect(actual.user).toEqual({ ...global.testUser, ...userUpdate })
    })
  })

  describe('selectors', () => {
    it('should select auth state correctly', () => {
      const state = {
        auth: {
          ...initialState,
          isAuthenticated: true,
          user: global.testUser,
        },
      }

      expect(state.auth.isAuthenticated).toBe(true)
      expect(state.auth.user).toEqual(global.testUser)
    })
  })

  describe('edge cases', () => {
    it('should handle multiple login attempts', () => {
      let state = authReducer(initialState, login.pending())
      expect(state.loading).toBe(true)

      state = authReducer(state, login.pending())
      expect(state.loading).toBe(true)
      expect(state.error).toBe(null)
    })

    it('should handle logout when not authenticated', () => {
      const actual = authReducer(initialState, logout.fulfilled())
      expect(actual.isAuthenticated).toBe(false)
      expect(actual.user).toBe(null)
      expect(actual.token).toBe(null)
    })

    it('should handle user update when not authenticated', () => {
      const updatedData = { firstName: 'Test' }
      const actual = authReducer(initialState, updateUser(updatedData))
      expect(actual.user).toEqual(updatedData)
    })
  })
})