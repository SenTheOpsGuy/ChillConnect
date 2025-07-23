import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../store/store'

const Home = () => {
  const { isAuthenticated } = useSelector((state: RootState) => state.auth)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">
                Booking Platform
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <Link
                  to="/app/dashboard"
                  className="btn-primary"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="btn-outline"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="btn-primary"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Secure Adult Services
            <span className="block text-primary-600">Booking Platform</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-600">
            A safe, token-based platform for booking adult services with comprehensive 
            monitoring, escrow protection, and 18+ age verification.
          </p>
          
          {!isAuthenticated && (
            <div className="mt-10 flex justify-center space-x-4">
              <Link
                to="/register"
                className="btn-primary text-lg px-8 py-3"
              >
                Start Booking
              </Link>
              <Link
                to="/register"
                className="btn-outline text-lg px-8 py-3"
              >
                Become a Provider
              </Link>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Secure & Safe
            </h3>
            <p className="text-gray-600">
              18+ age verification, comprehensive monitoring, and secure escrow system 
              protect all users.
            </p>
          </div>

          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Token-Based Payments
            </h3>
            <p className="text-gray-600">
              Secure token system with PayPal integration. 1 token = ₹100. 
              Guaranteed payments for providers.
            </p>
          </div>

          <div className="card card-body text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Monitored Communication
            </h3>
            <p className="text-gray-600">
              Real-time chat with safety monitoring, content moderation, 
              and 24/7 support availability.
            </p>
          </div>
        </div>

        {/* Age Verification Notice */}
        <div className="mt-16 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-yellow-800">
                18+ Age Verification Required
              </h3>
              <p className="text-yellow-700 mt-1">
                This platform is restricted to adults 18 years and older. 
                Age verification is mandatory during registration.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2025 Booking Platform. All rights reserved.</p>
            <div className="mt-4 space-x-6">
              <a href="#" className="text-gray-500 hover:text-gray-700">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Terms of Service</a>
              <a href="#" className="text-gray-500 hover:text-gray-700">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Home