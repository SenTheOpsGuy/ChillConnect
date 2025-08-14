import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Link, useNavigate } from 'react-router-dom'
import { FiEye, FiEyeOff, FiCheck, FiMail, FiPhone, FiClock, FiCheckCircle } from 'react-icons/fi'
import { register, clearError } from '../../store/slices/authSlice'
import authService from '../../services/authService'
import toast from 'react-hot-toast'

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state) => state.auth)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    phone: '',
    role: 'SEEKER',
    ageConfirmed: false,
    consentGiven: false,
  })
  
  // Verification states
  const [verificationStep, setVerificationStep] = useState('form') // 'form', 'email-verify', 'phone-verify', 'complete'
  const [emailVerified, setEmailVerified] = useState(false)
  const [phoneVerified, setPhoneVerified] = useState(false)
  const [emailOTP, setEmailOTP] = useState('')
  const [phoneOTP, setPhoneOTP] = useState('')
  const [otpTimers, setOtpTimers] = useState({ email: 0, phone: 0 })
  const [resendCooldown, setResendCooldown] = useState({ email: false, phone: false })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const validateForm = () => {
    const errors = {}

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required'
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required'
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid'
    }

    if (!formData.phone.trim()) {
      errors.phone = 'Phone number is required'
    } else if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phone)) {
      errors.phone = 'Please enter a valid phone number'
    }

    if (!formData.password) {
      errors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters'
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }

    if (!formData.dateOfBirth) {
      errors.dateOfBirth = 'Date of birth is required'
    } else {
      const age = Math.floor((Date.now() - new Date(formData.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 18) {
        errors.dateOfBirth = 'You must be 18 or older to register'
      }
    }

    if (!formData.ageConfirmed) {
      errors.ageConfirmed = 'You must confirm you are 18 or older'
    }

    if (!formData.consentGiven) {
      errors.consentGiven = 'You must agree to the terms and conditions'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // OTP verification functions
  const sendEmailVerification = async () => {
    if (!formData.email) {
      toast.error('Please enter your email address')
      return
    }
    
    try {
      const response = await authService.sendEmailVerification(formData.email)
      toast.success('Verification code sent to your email!')
      
      // For testing, show the OTP in console
      if (response.otp) {
        console.log('Email OTP:', response.otp)
        toast.success(`Test OTP: ${response.otp}`, { duration: 5000 })
      }
      
      setOtpTimers(prev => ({ ...prev, email: 60 }))
      setResendCooldown(prev => ({ ...prev, email: true }))
      
      // Start countdown timer
      const timer = setInterval(() => {
        setOtpTimers(prev => {
          const newTime = Math.max(0, prev.email - 1)
          if (newTime === 0) {
            setResendCooldown(prev => ({ ...prev, email: false }))
            clearInterval(timer)
          }
          return { ...prev, email: newTime }
        })
      }, 1000)
    } catch (error) {
      toast.error('Failed to send verification code')
    }
  }

  const sendPhoneVerification = async () => {
    if (!formData.phone) {
      toast.error('Please enter your phone number')
      return
    }
    
    try {
      const response = await authService.sendPhoneOTP(formData.phone)
      toast.success('Verification code sent to your phone!')
      
      // For testing, show the OTP in console
      if (response.otp) {
        console.log('Phone OTP:', response.otp)
        toast.success(`Test OTP: ${response.otp}`, { duration: 5000 })
      }
      
      setOtpTimers(prev => ({ ...prev, phone: 60 }))
      setResendCooldown(prev => ({ ...prev, phone: true }))
      
      // Start countdown timer
      const timer = setInterval(() => {
        setOtpTimers(prev => {
          const newTime = Math.max(0, prev.phone - 1)
          if (newTime === 0) {
            setResendCooldown(prev => ({ ...prev, phone: false }))
            clearInterval(timer)
          }
          return { ...prev, phone: newTime }
        })
      }, 1000)
    } catch (error) {
      toast.error('Failed to send verification code')
    }
  }

  const verifyEmailOTP = async () => {
    if (!emailOTP || emailOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    
    try {
      await authService.verifyEmailOTP(formData.email, emailOTP)
      setEmailVerified(true)
      toast.success('Email verified successfully!')
      setVerificationStep('phone-verify')
      // Auto-send phone verification
      setTimeout(() => {
        sendPhoneVerification()
      }, 1000)
    } catch (error) {
      toast.error(error.error || 'Email verification failed')
    }
  }

  const verifyPhoneOTP = async () => {
    if (!phoneOTP || phoneOTP.length !== 6) {
      toast.error('Please enter a valid 6-digit code')
      return
    }
    
    try {
      await authService.verifyPhoneOTP(formData.phone, phoneOTP)
      setPhoneVerified(true)
      toast.success('Phone verified successfully!')
      setVerificationStep('complete')
    } catch (error) {
      toast.error(error.error || 'Phone verification failed')
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Move to verification step
    setVerificationStep('email-verify')
    await sendEmailVerification()
  }

  const handleFinalSubmit = async () => {
    if (!emailVerified || !phoneVerified) {
      toast.error('Please verify both email and phone before continuing')
      return
    }

    try {
      const registrationData = {
        ...formData,
        emailVerified: true,
        phoneVerified: true,
      }
      
      await dispatch(register(registrationData)).unwrap()
      toast.success('Registration successful! Your account has been created.')
      navigate('/login')
    } catch (error) {
      toast.error('Registration failed. Please try again.')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          verificationStep === 'form' ? 'bg-blue-600 text-white' : 
            emailVerified ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {emailVerified ? <FiCheck className="w-4 h-4" /> : '1'}
        </div>
        <span className="text-sm font-medium text-gray-700">Form</span>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          verificationStep === 'email-verify' ? 'bg-blue-600 text-white' : 
            emailVerified ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {emailVerified ? <FiCheck className="w-4 h-4" /> : <FiMail className="w-4 h-4" />}
        </div>
        <span className="text-sm font-medium text-gray-700">Email</span>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          verificationStep === 'phone-verify' ? 'bg-blue-600 text-white' : 
            phoneVerified ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          {phoneVerified ? <FiCheck className="w-4 h-4" /> : <FiPhone className="w-4 h-4" />}
        </div>
        <span className="text-sm font-medium text-gray-700">Phone</span>
        
        <div className="w-8 h-0.5 bg-gray-300"></div>
        
        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
          verificationStep === 'complete' ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-600'
        }`}>
          <FiCheckCircle className="w-4 h-4" />
        </div>
        <span className="text-sm font-medium text-gray-700">Done</span>
      </div>
    </div>
  )

  return (
    <div className="auth-page">
      <div className="auth-container" style={{ maxWidth: '600px' }}>
        {/* Premium Logo */}
        <div className="auth-logo">
          <div className="logo-icon">C</div>
          <span className="brand-name">ChillConnect</span>
        </div>
        
        {/* Premium Typography */}
        <div className="auth-header">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Join ChillConnect today</p>
        </div>
        
        {renderStepIndicator()}
      </div>

      <div className="auth-form" style={{ marginTop: '32px' }}>
          
        {/* Step 1: Registration Form */}
        {verificationStep === 'form' && (
          <form className="space-y-6" onSubmit={handleFormSubmit}>
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="SEEKER"
                    checked={formData.role === 'SEEKER'}
                    onChange={handleChange}
                    className="mr-2"
                    data-testid="role-select"
                  />
                  Seeker
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="role"
                    value="PROVIDER"
                    checked={formData.role === 'PROVIDER'}
                    onChange={handleChange}
                    className="mr-2"
                    data-testid="role-select"
                  />
                  Provider
                </label>
              </div>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors.firstName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  value={formData.firstName}
                  onChange={handleChange}
                  data-testid="first-name-input"
                />
                {formErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.firstName}</p>
                )}
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  required
                  className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors.lastName ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                  value={formData.lastName}
                  onChange={handleChange}
                  data-testid="last-name-input"
                />
                {formErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.email}
                onChange={handleChange}
                data-testid="email-input"
              />
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number *
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                className={`mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm ${formErrors.phone ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : ''}`}
                value={formData.phone}
                onChange={handleChange}
                placeholder="+1 (555) 123-4567"
                data-testid="phone-input"
              />
              {formErrors.phone && (
                <p className="mt-1 text-sm text-red-600">{formErrors.phone}</p>
              )}
            </div>

            {/* Date of Birth */}
            <div>
              <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                name="dateOfBirth"
                type="date"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={formData.dateOfBirth}
                onChange={handleChange}
                data-testid="date-of-birth-input"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="mt-1 block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.password}
                  onChange={handleChange}
                  data-testid="password-input"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  className="mt-1 block w-full pr-10 border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  data-testid="confirm-password-input"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <FiEyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <FiEye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Age Confirmation */}
            <div className="space-y-3">
              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="ageConfirmed"
                  checked={formData.ageConfirmed}
                  onChange={handleChange}
                  required
                  className="mt-1 mr-3 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  data-testid="age-verification-checkbox"
                />
                <span className="text-sm text-gray-700">
                  I confirm that I am 18 years of age or older
                </span>
              </label>

              <label className="flex items-start">
                <input
                  type="checkbox"
                  name="consentGiven"
                  checked={formData.consentGiven}
                  onChange={handleChange}
                  required
                  className="mt-1 mr-3 h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  data-testid="terms-checkbox"
                />
                <span className="text-sm text-gray-700">
                  I am a consenting adult and agree to the{' '}
                  <Link to="/terms" className="text-primary-600 hover:text-primary-500" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-primary-600 hover:text-primary-500" target="_blank">
                    Privacy Policy
                  </Link>
                </span>
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || !formData.ageConfirmed || !formData.consentGiven}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="register-button"
              >
                {loading ? 'Processing...' : 'Continue to Verification'}
              </button>
            </div>
          </form>
        )}

        {/* Step 2: Email Verification */}
        {verificationStep === 'email-verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <FiMail className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Your Email</h3>
              <p className="text-sm text-gray-600 mb-4">
                  We&apos;ve sent a verification code to <strong>{formData.email}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="emailOTP" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit verification code
              </label>
              <input
                id="emailOTP"
                type="text"
                value={emailOTP}
                onChange={(e) => setEmailOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-widest border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={verifyEmailOTP}
                disabled={emailOTP.length !== 6}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Verify Email
              </button>
              <button
                onClick={sendEmailVerification}
                disabled={resendCooldown.email}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {resendCooldown.email ? (
                  <>
                    <FiClock className="w-4 h-4 inline mr-1" />
                    {otpTimers.email}s
                  </>
                ) : (
                  'Resend'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Phone Verification */}
        {verificationStep === 'phone-verify' && (
          <div className="space-y-6">
            <div className="text-center">
              <FiPhone className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verify Your Phone</h3>
              <p className="text-sm text-gray-600 mb-4">
                  We&apos;ve sent a verification code to <strong>{formData.phone}</strong>
              </p>
            </div>

            <div>
              <label htmlFor="phoneOTP" className="block text-sm font-medium text-gray-700 mb-2">
                  Enter 6-digit verification code
              </label>
              <input
                id="phoneOTP"
                type="text"
                value={phoneOTP}
                onChange={(e) => setPhoneOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full text-center text-2xl tracking-widest border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
                placeholder="000000"
                maxLength="6"
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={verifyPhoneOTP}
                disabled={phoneOTP.length !== 6}
                className="flex-1 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  Verify Phone
              </button>
              <button
                onClick={sendPhoneVerification}
                disabled={resendCooldown.phone}
                className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
              >
                {resendCooldown.phone ? (
                  <>
                    <FiClock className="w-4 h-4 inline mr-1" />
                    {otpTimers.phone}s
                  </>
                ) : (
                  'Resend'
                )}
              </button>
            </div>

            <button
              onClick={() => setVerificationStep('email-verify')}
              className="w-full py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
                Back to Email Verification
            </button>
          </div>
        )}

        {/* Step 4: Complete Registration */}
        {verificationStep === 'complete' && (
          <div className="space-y-6">
            <div className="text-center">
              <FiCheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Verification Complete!</h3>
              <p className="text-sm text-gray-600 mb-4">
                  Both your email and phone have been verified successfully.
              </p>
            </div>

            <div className="bg-green-50 p-4 rounded-md">
              <div className="flex items-center space-x-3 mb-2">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Email verified: {formData.email}</span>
              </div>
              <div className="flex items-center space-x-3">
                <FiCheckCircle className="w-5 h-5 text-green-600" />
                <span className="text-sm text-green-800">Phone verified: {formData.phone}</span>
              </div>
            </div>

            <button
              onClick={handleFinalSubmit}
              disabled={loading}
              className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </div>
        )}

        {/* Login Link */}
        {verificationStep === 'form' && (
          <div className="auth-footer">
            <p>
                Already have an account?{' '}
              <Link to="/login" className="auth-link">
                  Sign in here
              </Link>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register