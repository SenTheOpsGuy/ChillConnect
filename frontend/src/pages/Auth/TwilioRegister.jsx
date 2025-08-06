import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import axios from 'axios'

const TwilioRegister = () => {
  const [currentStep, setCurrentStep] = useState('role') // role, details, verify-phone, verify-email
  const [userRole, setUserRole] = useState('SEEKER')
  const [registrationData, setRegistrationData] = useState({})
  const [verificationSent, setVerificationSent] = useState({ phone: false, email: false })

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm()

  // Handle role selection
  const handleRoleSelection = (role) => {
    setUserRole(role)
    setCurrentStep('details')
    toast.success(`Selected role: ${role}`)
  }

  // Handle user details submission
  const onSubmitDetails = async (data) => {
    const userData = {
      ...data,
      role: userRole,
      phoneNumber: `+91${data.phoneNumber}` // Add +91 prefix for Indian numbers
    }
    
    setRegistrationData(userData)
    
    try {
      // Send phone verification
      await sendPhoneVerification(userData.phoneNumber)
      setCurrentStep('verify-phone')
    } catch (error) {
      toast.error('Failed to send phone verification')
    }
  }

  // Send phone verification via Twilio
  const sendPhoneVerification = async (phoneNumber) => {
    try {
      const response = await axios.post('/api/auth/send-phone-verification', {
        phoneNumber
      })
      
      if (response.data.success) {
        setVerificationSent(prev => ({ ...prev, phone: true }))
        toast.success('Verification code sent to your phone!')
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send verification')
    }
  }

  // Send email verification
  const sendEmailVerification = async (email) => {
    try {
      const response = await axios.post('/api/auth/send-email-verification', {
        email
      })
      
      if (response.data.success) {
        setVerificationSent(prev => ({ ...prev, email: true }))
        toast.success('Verification email sent!')
      }
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Failed to send email verification')
    }
  }

  // Verify phone OTP
  const verifyPhoneOTP = async (otp) => {
    try {
      const response = await axios.post('/api/auth/verify-phone', {
        phoneNumber: registrationData.phoneNumber,
        otp
      })
      
      if (response.data.success) {
        toast.success('Phone verified successfully!')
        // Send email verification
        await sendEmailVerification(registrationData.email)
        setCurrentStep('verify-email')
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid verification code')
    }
  }

  // Verify email
  const verifyEmail = async (token) => {
    try {
      const response = await axios.post('/api/auth/verify-email', {
        email: registrationData.email,
        token
      })
      
      if (response.data.success) {
        // Complete registration
        await completeRegistration()
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Email verification failed')
    }
  }

  // Complete user registration
  const completeRegistration = async () => {
    try {
      const registrationPayload = {
        ...registrationData,
        ageConfirmed: 'true',
        consentGiven: 'true'
      }
      
      const response = await axios.post('/api/auth/twilio-register', registrationPayload)
      
      if (response.data.success) {
        // Store token and user data
        localStorage.setItem('token', response.data.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.data.user))
        
        toast.success('Registration completed successfully!')
        // Redirect to dashboard
        window.location.href = '/dashboard'
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed')
    }
  }

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

        <div className="auth-form" style={{ marginTop: '32px' }}>
          {/* Step 1: Role Selection */}
          {currentStep === 'role' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 text-center">
                  Choose Your Account Type
                </h3>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Select whether you're looking for services or providing them
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Seeker Card */}
                <div 
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all duration-200"
                  onClick={() => handleRoleSelection('SEEKER')}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">I'm a Seeker</h4>
                    <p className="text-sm text-gray-600">
                      Looking for companionship and social connections
                    </p>
                  </div>
                </div>

                {/* Provider Card */}
                <div 
                  className="border-2 border-gray-200 rounded-lg p-6 cursor-pointer hover:border-green-500 hover:bg-green-50 transition-all duration-200"
                  onClick={() => handleRoleSelection('PROVIDER')}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">I'm a Provider</h4>
                    <p className="text-sm text-gray-600">
                      Offering companionship and social services
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: User Details Form */}
          {currentStep === 'details' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={() => setCurrentStep('role')}
                  className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back
                </button>
                <div className="text-sm text-gray-600">
                  Account Type: <span className="font-semibold text-blue-600">{userRole}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4">
                {/* First Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    {...register('firstName', { required: 'First name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your first name"
                  />
                  {errors.firstName && (
                    <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    {...register('lastName', { required: 'Last name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your last name"
                  />
                  {errors.lastName && (
                    <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email', { 
                      required: 'Email is required',
                      pattern: {
                        value: /^\S+@\S+$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                      +91
                    </span>
                    <input
                      type="tel"
                      {...register('phoneNumber', { 
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[6-9]\d{9}$/,
                          message: 'Enter a valid 10-digit Indian mobile number'
                        }
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="9876543210"
                      maxLength="10"
                    />
                  </div>
                  {errors.phoneNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 10-digit mobile number without +91
                  </p>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password *
                  </label>
                  <input
                    type="password"
                    {...register('password', { 
                      required: 'Password is required',
                      minLength: {
                        value: 8,
                        message: 'Password must be at least 8 characters'
                      }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Create a strong password"
                  />
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            </div>
          )}

          {/* Step 3: Phone Verification */}
          {currentStep === 'verify-phone' && (
            <PhoneVerification 
              onVerify={verifyPhoneOTP}
              phoneNumber={registrationData.phoneNumber}
              onResend={() => sendPhoneVerification(registrationData.phoneNumber)}
            />
          )}

          {/* Step 4: Email Verification */}
          {currentStep === 'verify-email' && (
            <EmailVerification 
              email={registrationData.email}
              onResend={() => sendEmailVerification(registrationData.email)}
            />
          )}

          {/* Login Link */}
          <div className="auth-footer mt-8">
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// Phone Verification Component
const PhoneVerification = ({ onVerify, phoneNumber, onResend }) => {
  const [otp, setOtp] = useState('')
  const [isVerifying, setIsVerifying] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (otp.length === 6) {
      setIsVerifying(true)
      await onVerify(otp)
      setIsVerifying(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Verify Your Phone Number
        </h3>
        <p className="text-sm text-gray-600">
          We've sent a 6-digit verification code to<br />
          <strong>{phoneNumber}</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Verification Code
          </label>
          <input
            type="text"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center text-lg tracking-widest"
            placeholder="000000"
            maxLength="6"
          />
        </div>

        <button
          type="submit"
          disabled={otp.length !== 6 || isVerifying}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md disabled:opacity-50"
        >
          {isVerifying ? 'Verifying...' : 'Verify Phone Number'}
        </button>

        <button
          type="button"
          onClick={onResend}
          className="w-full text-blue-600 hover:text-blue-500 text-sm"
        >
          Didn't receive the code? Resend
        </button>
      </form>
    </div>
  )
}

// Email Verification Component
const EmailVerification = ({ email, onResend }) => {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Check Your Email
        </h3>
        <p className="text-sm text-gray-600">
          We've sent a verification link to<br />
          <strong>{email}</strong>
        </p>
        <p className="text-sm text-gray-600 mt-4">
          Click the link in your email to complete your account setup.
        </p>
      </div>

      <button
        onClick={onResend}
        className="w-full text-blue-600 hover:text-blue-500 text-sm"
      >
        Didn't receive the email? Resend
      </button>
    </div>
  )
}

export default TwilioRegister