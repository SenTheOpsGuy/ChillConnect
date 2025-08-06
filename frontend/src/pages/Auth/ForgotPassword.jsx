import { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiMail, FiArrowLeft, FiCheck } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { authService } from '../../services/authService'

const ForgotPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email) {
      toast.error('Please enter your email address')
      return
    }

    setIsLoading(true)
    try {
      await authService.forgotPassword(email)
      setEmailSent(true)
      toast.success('Password reset email sent!')
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 px-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiCheck className="w-8 h-8 text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-4">
            Check Your Email
          </h1>
          
          <p className="text-white/80 mb-6 leading-relaxed">
            We've sent a password reset link to <span className="font-medium text-white">{email}</span>. 
            Check your inbox and follow the instructions to reset your password.
          </p>
          
          <div className="text-sm text-white/60 mb-6">
            Didn't receive the email? Check your spam folder or try again in a few minutes.
          </div>
          
          <Link
            to="/login"
            className="btn btn-secondary w-full flex items-center justify-center gap-2"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-600 to-red-800 px-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <FiMail className="w-8 h-8 text-white" />
          </div>
          
          <h1 className="text-2xl font-bold text-white mb-2">
            Forgot Password?
          </h1>
          <p className="text-white/80">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/90 mb-2">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/30 focus:border-transparent"
              placeholder="Enter your email address"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="auth-button w-full"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Sending...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <FiMail className="w-4 h-4 mr-2" />
                Send Reset Link
              </div>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link
            to="/login"
            className="text-white/80 hover:text-white transition-colors duration-200 flex items-center justify-center gap-2 text-sm"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword