import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { requestLoginOTP, clearError } from '../../store/slices/authSlice'
import { FiMail, FiPhone } from 'react-icons/fi'
import toast from 'react-hot-toast'

const OtpRequest = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error } = useSelector((state) => state.auth)
  
  const [loginType, setLoginType] = useState('email') // 'email' or 'phone'
  const [identifier, setIdentifier] = useState('')

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const handleRequestOTP = async (e) => {
    e.preventDefault()
    
    if (!identifier) {
      toast.error(`Please enter your ${loginType === 'phone' ? 'phone number' : 'email address'}`)
      return
    }

    // Validation based on login type
    if (loginType === 'phone') {
      if (!identifier.match(/^\+?[1-9]\d{1,14}$/)) {
        toast.error('Please enter a valid phone number (e.g., +1234567890)')
        return
      }
    } else {
      if (!identifier.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
        toast.error('Please enter a valid email address')
        return
      }
    }

    try {
      console.log('Requesting OTP for:', { identifier, type: loginType })
      const result = await dispatch(requestLoginOTP({ 
        identifier, 
        type: loginType, 
      })).unwrap()
      
      console.log('OTP request successful:', result)
      toast.success(`OTP sent to your ${loginType === 'phone' ? 'phone number' : 'email'}!`)
      
      // Navigate to OTP verification page with data
      navigate('/otp-verify', { 
        state: { 
          identifier,
          loginType,
          userId: result.userId,
          developmentOtp: result.otp, // For development only
        }, 
      })
      
    } catch (error) {
      console.error('OTP request failed:', error)
      toast.error('Failed to send OTP. Please try again.')
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
          Login with OTP
        </h2>
        <p className="mt-2 text-center text-gray-600">
          Enter your {loginType === 'phone' ? 'phone number' : 'email address'} to receive a verification code
        </p>
      </div>

      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="card card-elevated">
          <form className="space-y-6" onSubmit={handleRequestOTP}>
            {/* Login Type Toggle */}
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                type="button"
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === 'phone'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setLoginType('phone')
                  setIdentifier('')
                }}
              >
                <FiPhone className="w-4 h-4 mr-2" />
                Phone
              </button>
              <button
                type="button"
                className={`flex-1 flex items-center justify-center py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                  loginType === 'email'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                onClick={() => {
                  setLoginType('email')
                  setIdentifier('')
                }}
              >
                <FiMail className="w-4 h-4 mr-2" />
                Email
              </button>
            </div>

            {/* Identifier Input */}
            <div className="space-y-2">
              <label htmlFor="identifier" className="text-sm font-medium text-gray-900">
                {loginType === 'phone' ? 'Phone Number' : 'Email Address'}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {loginType === 'phone' ? (
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiMail className="h-5 w-5 text-gray-400" />
                  )}
                </div>
                <input
                  id="identifier"
                  name="identifier"
                  type={loginType === 'phone' ? 'tel' : 'email'}
                  required
                  className="input pl-12"
                  placeholder={loginType === 'phone' ? '+1234567890' : 'your-email@example.com'}
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

export default OtpRequest