import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { FiMail, FiLock, FiBriefcase, FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { login, logout } from '../../store/slices/authSlice'

const EmployeeLogin = () => {
  const navigate = useNavigate()
  const dispatch = useDispatch()
  const { isAuthenticated, user } = useSelector((state) => state.auth)
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [isLoading, setIsLoading] = useState(false)

  // Redirect if already authenticated with proper role
  useEffect(() => {
    console.log('🔍 Employee Login useEffect - Auth state:', { isAuthenticated, user: user?.role })
    if (isAuthenticated && user && ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)) {
      console.log('✅ Employee Login useEffect - Redirecting to /admin/dashboard')
      navigate('/admin/dashboard', { replace: true })
    } else if (isAuthenticated && user) {
      console.log('❌ Employee Login useEffect - User authenticated but wrong role:', user.role)
    }
  }, [isAuthenticated, user, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields')
      return
    }

    setIsLoading(true)
    try {
      const resultAction = await dispatch(login({
        email: formData.email,
        password: formData.password,
      }))
      
      if (login.fulfilled.match(resultAction)) {
        const userData = resultAction.payload.data?.user || resultAction.payload.user
        console.log('🔍 Employee Login - User data:', userData)
        console.log('🔍 Employee Login - User role:', userData?.role)
        
        // Check if user has admin/employee privileges
        if (['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(userData.role)) {
          console.log('✅ Employee Login - Admin role confirmed, should redirect to /admin/dashboard')
          toast.success('Employee login successful!')
          // Navigation will be handled by useEffect after state updates
        } else {
          console.log('❌ Employee Login - Access denied, role:', userData?.role)
          toast.error('Access denied. Employee credentials required.')
          // Clear the login state for non-admin users
          dispatch(logout())
        }
      } else {
        console.log('❌ Employee Login - Login action was not fulfilled')
        console.log('🔍 Employee Login - Result action:', resultAction)
      }
    } catch (error) {
      toast.error(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 to-purple-800 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiBriefcase className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Employee Portal
          </h1>
          <p className="text-white/80">
            Access the ChillConnect admin dashboard
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Employee Email
            </label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Enter your company email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-white/90 mb-2">
              Password
            </label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5" />
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-12 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Signing In...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiBriefcase className="w-4 h-4 mr-2" />
                Sign In to Portal
              </div>
            )}
          </button>
        </form>

        {/* Security Notice */}
        <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
          <p className="text-yellow-200 text-xs text-center">
            🔐 This is a secure employee portal. Only authorized ChillConnect staff members should access this page.
            Unauthorized access attempts are logged and monitored.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-8 space-y-4 text-center">
          <Link
            to="/forgot-password"
            className="text-white/80 hover:text-white transition-colors duration-200 text-sm block"
          >
            Forgot your password?
          </Link>
          
          <div className="border-t border-white/10 pt-4">
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
            >
              <FiArrowLeft className="w-4 h-4" />
              Back to Main Site
            </Link>
          </div>
        </div>

        {/* Contact Support */}
        <div className="mt-6 text-center">
          <p className="text-white/60 text-xs">
            Need help accessing your account?
            <br />
            Contact IT support at 
            <a href="mailto:it-support@chillconnect.in" className="text-white/80 hover:text-white ml-1">
              it-support@chillconnect.in
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default EmployeeLogin