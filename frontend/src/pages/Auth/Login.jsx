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
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Minimalist Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
        </div>
        
        {/* Clean Typography */}
        <h2 className="mt-8 text-center text-2xl font-semibold text-gray-900">
          Welcome back
        </h2>
        <p className="mt-2 text-center text-muted">
          Sign in to your ChillConnect account
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card card-elevated">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Email - Clean input design */}
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-gray-900">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input pl-12"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  data-testid="email-input"
                />
              </div>
            </div>

            {/* Password - Enhanced UX */}
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium text-gray-900">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="input pl-12 pr-12"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-4 flex items-center focus-ring rounded-xl"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
            </div>

            {/* Simplified options row */}
            <div className="flex items-center justify-between pt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  className="w-4 h-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded focus-ring"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>

              <Link
                to="/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-500 focus-ring rounded-lg px-2 py-1"
              >
                Forgot password?
              </Link>
            </div>

            {/* Enhanced Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg w-full mt-8"
              data-testid="login-button"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* OTP Login option */}
          <div className="mt-6 text-center">
            <Link
              to="/login-otp"
              className="text-sm text-indigo-600 hover:text-indigo-500 font-medium focus-ring rounded-lg px-2 py-1"
            >
              Login with OTP instead
            </Link>
          </div>

          {/* Clean sign up link */}
          <div className="mt-6 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-muted">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-medium text-indigo-600 hover:text-indigo-500 focus-ring rounded-lg px-2 py-1"
              >
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