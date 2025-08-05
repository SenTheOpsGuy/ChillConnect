import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SignUp } from '@clerk/clerk-react'
import toast from 'react-hot-toast'

const ClerkRegister = () => {
  const [showClerkSignUp, setShowClerkSignUp] = useState(false)
  const [userRole, setUserRole] = useState('SEEKER')

  // Handle role selection and show Clerk SignUp component
  const handleRoleSelection = (role) => {
    setUserRole(role)
    setShowClerkSignUp(true)
    toast.success(`Selected role: ${role}`)
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
          {!showClerkSignUp ? (
            /* Role Selection Step */
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

              <div className="text-center">
                <p className="text-xs text-gray-500 mt-4">
                  By continuing, you agree to our{' '}
                  <Link to="/terms" className="text-blue-600 hover:text-blue-500" target="_blank">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="/privacy" className="text-blue-600 hover:text-blue-500" target="_blank">
                    Privacy Policy
                  </Link>
                </p>
              </div>
            </div>
          ) : (
            /* Clerk SignUp Component */
            <div className="space-y-6">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-4">
                  <button
                    onClick={() => setShowClerkSignUp(false)}
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
              </div>

              {/* Clerk SignUp Component */}
              <div className="flex justify-center">
                <SignUp
                  appearance={{
                    variables: {
                      colorPrimary: '#2563eb',
                      colorBackground: '#ffffff',
                      colorInputBackground: '#ffffff',
                      colorInputText: '#1f2937',
                      fontFamily: '"Inter", sans-serif',
                      borderRadius: '0.5rem'
                    },
                    elements: {
                      rootBox: 'w-full',
                      card: 'shadow-none border-0 w-full',
                      headerTitle: 'text-xl font-semibold text-gray-900',
                      headerSubtitle: 'text-sm text-gray-600',
                      socialButtonsBlockButton: 'border border-gray-300 hover:bg-gray-50',
                      formButtonPrimary: 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md',
                      formFieldInput: 'border border-gray-300 rounded-md px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                      footerActionLink: 'text-blue-600 hover:text-blue-500'
                    }
                  }}
                  forceRedirectUrl="/dashboard"
                  signInUrl="/login"
                  unsafeMetadata={{ 
                    role: userRole,
                    accountType: userRole,
                    registrationSource: 'clerk'
                  }}
                  initialValues={{
                    phoneNumber: '+91'
                  }}
                />
              </div>
            </div>
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

export default ClerkRegister