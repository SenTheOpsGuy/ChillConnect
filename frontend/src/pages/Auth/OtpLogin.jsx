import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { requestLoginOTP, verifyLoginOTP, clearError } from '../../store/slices/authSlice'
import { FiPhone, FiMail, FiArrowLeft } from 'react-icons/fi'
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

const OtpLogin = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated, user } = useSelector((state) => state.auth)
  
  // Use string-based step state instead of boolean
  const [currentStep, setCurrentStep] = useState('email')
  const [loginType, setLoginType] = useState('email') // Default to email
  const [identifier, setIdentifier] = useState('')
  const [otp, setOtp] = useState('')
  const [userId, setUserId] = useState('')
  const [countdown, setCountdown] = useState(0)
  const [developmentOtp, setDevelopmentOtp] = useState('')

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

  // Debug useEffect for currentStep
  useEffect(() => {
    console.log('🎯 currentStep state changed to:', currentStep)
  }, [currentStep])

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    
    // TEMPORARY: Direct state change to test React state management
    console.log('🧪 TESTING: Direct state change to otp')
    setCurrentStep('otp')
    setDevelopmentOtp('123456') // Mock OTP for testing
    return
    
    if (!identifier) {
      toast.error(`Please enter your ${loginType === 'phone' ? 'phone number' : 'email address'}`)
      return
    }

    // Basic validation
    if (loginType === 'phone' && !identifier.match(/^\+?[1-9]\d{1,14}$/)) {
      toast.error('Please enter a valid phone number')
      return
    }
    
    if (loginType === 'email' && !identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      toast.error('Please enter a valid email address')
      return
    }

    try {
      console.log('Requesting OTP for:', { identifier, type: loginType })
      const result = await dispatch(requestLoginOTP({ identifier, type: loginType })).unwrap()
      console.log('OTP request result:', result)
      
      try {
        // Set states and show OTP input
        console.log('🔄 Setting OTP states...')
        setUserId(result.userId)
        setCountdown(60)
        
        // Use direct state update with string
        console.log('🔄 Changing step from email to otp')
        setCurrentStep('otp')
        console.log('🔄 setCurrentStep call completed')
        
        // Force immediate check
        setTimeout(() => {
          console.log('🔄 Timeout check - currentStep should be otp now')
        }, 100)
        
        toast.success(result.message || `OTP sent to your ${loginType}`)
        
        // In development, show and store OTP
        if (result.otp) {
          console.log('🔄 Setting development OTP:', result.otp)
          setDevelopmentOtp(result.otp)
          toast.success(`Development OTP: ${result.otp}`, { 
            duration: 30000,
            style: {
              background: '#10B981',
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold'
            }
          })
          console.log('Development OTP set successfully')
        }
        console.log('🔄 OTP success handler completed')
      } catch (stateError) {
        console.error('🚨 ERROR in state update:', stateError)
        // Try alternative approach
        console.log('🔄 Trying alternative state update...')
        setCurrentStep(() => 'otp')
      }
    } catch (error) {
      console.error('OTP request failed:', error)
      toast.error('Failed to send OTP. Please try again.')
    }
  }

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
      
      // Get redirect path based on user role
      const redirectPath = getRedirectPath(result.data?.user || result.user)
      console.log('OTP Login successful, redirecting to:', redirectPath)
      navigate(redirectPath)
    } catch (error) {
      // Error is handled by useEffect
    }
  }

  const handleResendOTP = async () => {
    if (countdown > 0) return
    
    try {
      const result = await dispatch(requestLoginOTP({ identifier, type: loginType })).unwrap()
      setCountdown(60)
      toast.success('OTP resent successfully')
      
      // Update development OTP if available
      if (result.otp) {
        setDevelopmentOtp(result.otp)
        toast.success(`New Development OTP: ${result.otp}`, { 
          duration: 30000,
          style: {
            background: '#10B981',
            color: 'white',
            fontSize: '16px',
            fontWeight: 'bold'
          }
        })
      }
    } catch (error) {
      // Error is handled by useEffect
    }
  }

  const handleBack = () => {
    setCurrentStep('email')
    setOtp('')
    setDevelopmentOtp('')
  }

  // Auto-fill development OTP
  const fillDevelopmentOtp = () => {
    if (developmentOtp) {
      setOtp(developmentOtp)
      toast.success('Development OTP filled!')
    }
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
          {currentStep === 'email' ? 'Login with OTP' : 'Enter Verification Code'}
        </h2>
        <p className="mt-2 text-center text-gray-600">
          {currentStep === 'email'
            ? 'Enter your email address to receive an OTP'
            : `We've sent a 6-digit code to your ${loginType}`
          }
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card card-elevated">
          {/* Debug info */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-2 bg-gray-100 text-xs">
              Debug: currentStep={currentStep}, userId={userId}, developmentOtp={developmentOtp}
            </div>
          )}
          
          {currentStep === 'email' ? (
            // STEP 1: Identifier Input
            <form className="space-y-6" onSubmit={handleRequestOTP}>
              {/* Login Type Toggle - Simplified to email only for now */}
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  type="button"
                  className="flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium bg-white text-gray-900 shadow-sm"
                  disabled
                >
                  <FiMail className="w-4 h-4 mr-2" />
                  Email
                </button>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <label htmlFor="identifier" className="text-sm font-medium text-gray-900">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="identifier"
                    name="identifier"
                    type="email"
                    required
                    className="input pl-12"
                    placeholder="mountainsagegiri@gmail.com"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg w-full"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Sending OTP...
                  </div>
                ) : (
                  'Send OTP'
                )}
              </button>
            </form>
          ) : currentStep === 'otp' ? (
            // STEP 2: OTP Input
            <form className="space-y-6" onSubmit={handleVerifyOTP}>
              {/* Back Button */}
              <button
                type="button"
                onClick={handleBack}
                className="flex items-center text-indigo-600 hover:text-indigo-500 text-sm font-medium"
              >
                <FiArrowLeft className="w-4 h-4 mr-1" />
                Change email address
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
          ) : (
            <div className="text-center p-4">
              <div className="text-red-500 mb-2">Debug: Invalid state</div>
              <div className="text-sm">currentStep={currentStep}</div>
              <button 
                onClick={() => setCurrentStep('email')}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
              >
                Reset to Email Input
              </button>
            </div>
          )}

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

export default OtpLogin