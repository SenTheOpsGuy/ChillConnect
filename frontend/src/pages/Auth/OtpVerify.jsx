import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { verifyLoginOTP, requestLoginOTP, clearError } from '../../store/slices/authSlice'
import { FiArrowLeft } from 'react-icons/fi'
import toast from 'react-hot-toast'

// Helper function to determine redirect path based on user role
const getRedirectPath = (user) => {
  if (!user) return '/dashboard'
  
  switch (user.role) {
    case 'SEEKER':
      return '/dashboard'
    case 'PROVIDER':
      return '/dashboard'
    case 'SUPER_ADMIN':
    case 'ADMIN':
    case 'MANAGER':
      return '/admin/dashboard'
    case 'EMPLOYEE':
      return '/admin/verification-queue'
    default:
      return '/dashboard'
  }
}

const OtpVerify = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth)
  
  const [otp, setOtp] = useState('')
  const [countdown, setCountdown] = useState(60)
  
  // Get data from navigation state
  const { identifier, loginType, userId, developmentOtp } = location.state || {}

  useEffect(() => {
    // Redirect if no identifier/userId in state
    if (!identifier || !userId) {
      toast.error('Please request OTP first')
      navigate('/login-otp')
      return
    }
  }, [identifier, userId, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    if (isAuthenticated && user) {
      const redirectPath = getRedirectPath(user)
      console.log('Login successful, redirecting to:', redirectPath, 'Role:', user.role)
      navigate(redirectPath)
    }
  }, [isAuthenticated, user, navigate])

  useEffect(() => {
    let interval = null
    if (countdown > 0) {
      interval = setInterval(() => {
        setCountdown(countdown - 1)
      }, 1000)
    } else if (countdown === 0) {
      clearInterval(interval)
    }
    return () => clearInterval(interval)
  }, [countdown])

  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    
    if (!otp || otp.length !== 6) {
      toast.error('Please enter a valid 6-digit OTP')
      return
    }

    try {
      const result = await dispatch(verifyLoginOTP({ 
        identifier, 
        otp, 
        type: loginType, 
        userId 
      })).unwrap()
      
      toast.success('Login successful!')
      
      // Navigation will be handled by the useEffect above
    } catch (error) {
      // Error is handled by useEffect
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    try {
      const result = await dispatch(requestLoginOTP({ 
        identifier, 
        type: loginType 
      })).unwrap()
      
      setCountdown(60)
      toast.success('OTP resent successfully')
      
      // Update the navigation state with new OTP info
      navigate('/otp-verify', { 
        state: { 
          identifier,
          loginType,
          userId: result.userId,
          developmentOtp: result.otp 
        },
        replace: true 
      })
      
    } catch (error) {
      // Error is handled by useEffect
    }
  }

  const handleBack = () => {
    navigate('/login-otp')
  }

  // Auto-fill development OTP
  const fillDevelopmentOtp = () => {
    if (developmentOtp) {
      setOtp(developmentOtp)
      toast.success('Development OTP filled!')
    }
  }

  if (!identifier || !userId) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Invalid Access
            </h2>
            <p className="text-gray-600 mb-6">
              Please request an OTP first.
            </p>
            <Link
              to="/login-otp"
              className="btn btn-primary"
            >
              Request OTP
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">C</span>
          </div>
        </div>
        
        {/* Title */}
        <h2 className="mt-8 text-center text-2xl font-semibold text-gray-900">
          Enter Verification Code
        </h2>
        <p className="mt-2 text-center text-gray-600">
          We've sent a 6-digit code to your {loginType === 'phone' ? 'phone number' : 'email'}
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card card-elevated">
          <form className="space-y-6" onSubmit={handleVerifyOTP}>
            {/* Back Button */}
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
            >
              <FiArrowLeft className="w-4 h-4 mr-1" />
              Change {loginType === 'phone' ? 'phone number' : 'email address'}
            </button>

            {/* OTP Input */}
            <div className="space-y-2">
              <label htmlFor="otp" className="text-sm font-medium text-gray-900">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                inputMode="numeric"
                maxLength="6"
                pattern="[0-9]{6}"
                required
                className="input text-center text-2xl font-mono tracking-widest"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                autoComplete="one-time-code"
              />
              <p className="text-sm text-gray-500 text-center">
                Sent to {identifier}
              </p>
            </div>

            {/* Development Helper */}
            {process.env.NODE_ENV === 'development' && developmentOtp && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800 mb-2">
                  <strong>Development Mode:</strong> OTP: {developmentOtp}
                </p>
                <button
                  type="button"
                  onClick={fillDevelopmentOtp}
                  className="bg-blue-600 text-white px-3 py-1 rounded text-sm"
                >
                  Auto-fill OTP
                </button>
              </div>
            )}

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-sm text-gray-500">
                  Resend OTP in {countdown} seconds
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  className="text-sm text-indigo-600 hover:text-indigo-500 font-medium"
                >
                  Resend OTP
                </button>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="btn btn-primary btn-lg w-full"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </div>
              ) : (
                'Verify & Login'
              )}
            </button>
          </form>

          {/* Back to regular login */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-sm text-gray-600">
              Want to use password instead?{' '}
              <Link
                to="/login"
                className="font-medium text-indigo-600 hover:text-indigo-500 focus-ring rounded-lg px-2 py-1"
              >
                Login with password
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OtpVerify