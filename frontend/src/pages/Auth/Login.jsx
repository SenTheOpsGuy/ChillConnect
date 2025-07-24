import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { login, clearError } from '../../store/slices/authSlice'
import { FiEye, FiEyeOff, FiMail, FiLock } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Helper function to determine redirect path based on user role
const getRedirectPath = (user) => {
  if (!user) return '/dashboard'
  
  switch (user.role) {
    case 'SEEKER':
      return '/dashboard' // Seekers go to dashboard with search access
    case 'PROVIDER':
      return '/dashboard' // Providers go to dashboard/bookings
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'MANAGER':
      return '/admin/dashboard' // Admins go to admin dashboard
    case 'EMPLOYEE':
      return '/admin/verification-queue' // Employees go to verification queue
    default:
      return '/dashboard'
  }
}

const Login = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user)
      console.log('Redirecting user to:', redirectPath, 'Role:', user.role)
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    try {
      const result = await dispatch(login(formData)).unwrap()
      toast.success('Welcome back!')
      
      // Get redirect path based on user role
      const redirectPath = getRedirectPath(result.user)
      console.log('Login successful, redirecting to:', redirectPath, 'Role:', result.user.role)
      navigate(redirectPath)
    } catch (error) {
      // Error is handled by useEffect
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        {/* Premium Logo */}
        <div className="auth-logo">
          <div className="logo-icon">C</div>
          <span className="brand-name">ChillConnect</span>
        </div>
        
        {/* Premium Typography */}
        <div className="auth-header">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-subtitle">Sign in to your ChillConnect account</p>
        </div>

        {/* Premium Form */}
        <div className="auth-form">
          <form onSubmit={handleSubmit}>
            {/* Email Input */}
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address
              </label>
              <div className="input-group">
                <div className="input-icon">
                  <FiMail />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="email-input"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <div className="input-icon">
                  <FiLock />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="form-input"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            {/* Form Options */}
            <div className="form-options">
              <label className="checkbox-wrapper">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="checkbox-input"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="checkbox-label">Remember me</span>
              </label>

              <Link to="/forgot-password" className="forgot-link">
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="auth-button"
              data-testid="login-button"
            >
              {loading ? (
                <div className="loading-content">
                  <div className="spinner"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Additional Options */}
          <div className="auth-divider">
            <span>or</span>
          </div>

          <Link to="/login-otp" className="auth-link-button">
            Login with OTP
          </Link>

          {/* Sign Up Link */}
          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <Link to="/register" className="auth-link">
                Sign up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login