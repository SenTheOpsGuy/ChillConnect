import { describe, it, expect, beforeEach } from 'vitest'
import authReducer, {
  loginStart,
  loginSuccess,
  loginFailure,
  logout,
  loadUser,
  clearError,
  updateProfile,
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
      expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState)
    })

    it('should handle loginStart', () => {
      const actual = authReducer(initialState, loginStart())
      expect(actual.loading).toBe(true)
      expect(actual.error).toBe(null)
    })

    it('should handle loginSuccess', () => {
      const payload = {
        user: global.testUser,
        token: 'test-token',
      }
      const actual = authReducer(initialState, loginSuccess(payload))
      
      expect(actual.loading).toBe(false)
      expect(actual.isAuthenticated).toBe(true)
      expect(actual.user).toEqual(payload.user)
      expect(actual.token).toBe(payload.token)
      expect(actual.error).toBe(null)
    })

    it('should handle loginFailure', () => {
      const errorMessage = 'Invalid credentials'
      const actual = authReducer(initialState, loginFailure(errorMessage))
      
      expect(actual.loading).toBe(false)
      expect(actual.isAuthenticated).toBe(false)
      expect(actual.user).toBe(null)
      expect(actual.token).toBe(null)
      expect(actual.error).toBe(errorMessage)
    })

    it('should handle logout', () => {
      const authenticatedState = {
        ...initialState,
        isAuthenticated: true,
        user: global.testUser,
        token: 'test-token',
      }
      
      const actual = authReducer(authenticatedState, logout())
      expect(actual).toEqual(initialState)
    })

    it('should handle clearError', () => {
      const stateWithError = {
        ...initialState,
        error: 'Some error',
      }
      
      const actual = authReducer(stateWithError, clearError())
      expect(actual.error).toBe(null)
    })

    it('should handle updateProfile', () => {
      const authenticatedState = {
        ...initialState,
        isAuthenticated: true,
        user: global.testUser,
        token: 'test-token',
      }
      
      const updatedProfile = {
        ...global.testUser.profile,
        firstName: 'Updated',
        lastName: 'Name',
      }
      
      const actual = authReducer(authenticatedState, updateProfile(updatedProfile))
      expect(actual.user.profile).toEqual(updatedProfile)
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
      let state = authReducer(initialState, loginStart())
      expect(state.loading).toBe(true)

      state = authReducer(state, loginStart())
      expect(state.loading).toBe(true)
      expect(state.error).toBe(null)
    })

    it('should handle logout when not authenticated', () => {
      const actual = authReducer(initialState, logout())
      expect(actual).toEqual(initialState)
    })

    it('should handle profile update when not authenticated', () => {
      const updatedProfile = { firstName: 'Test' }
      const actual = authReducer(initialState, updateProfile(updatedProfile))
      expect(actual.user).toBe(null)
    })
  })
})