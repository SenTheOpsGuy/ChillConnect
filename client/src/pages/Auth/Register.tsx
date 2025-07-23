import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

import { RootState } from '../../store/store'
import { register as registerUser, clearError } from '../../store/slices/authSlice'

interface RegisterForm {
  email: string
  password: string
  confirmPassword: string
  firstName: string
  lastName: string
  dateOfBirth: string
  phone: string
  role: 'SEEKER' | 'PROVIDER'
  isAdultConsent: boolean
  termsAccepted: boolean
}

const Register = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { loading, error, isAuthenticated } = useSelector((state: RootState) => state.auth)
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/app/dashboard')
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (error) {
      toast.error(error)
      dispatch(clearError())
    }
  }, [error, dispatch])

  const onSubmit = (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    const { confirmPassword, ...registerData } = data
    dispatch(registerUser({
      ...registerData,
      isAdultConsent: 'true',
      termsAccepted: 'true'
    }) as any).then((result: any) => {
      if (result.type === 'auth/register/fulfilled') {
        toast.success('Registration successful! Please check your email for verification.')
        navigate('/login')
      }
    })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link
              to="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              sign in to existing account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  {...register('firstName', { required: 'First name is required' })}
                  className={`mt-1 input ${errors.firstName ? 'input-error' : ''}`}
                  placeholder="First name"
                />
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  {...register('lastName', { required: 'Last name is required' })}
                  className={`mt-1 input ${errors.lastName ? 'input-error' : ''}`}
                  placeholder="Last name"
                />
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                type="email"
                className={`mt-1 input ${errors.email ? 'input-error' : ''}`}
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                {...register('phone', { required: 'Phone number is required' })}
                type="tel"
                className={`mt-1 input ${errors.phone ? 'input-error' : ''}`}
                placeholder="+91 9876543210"
              />
              {errors.phone && (
                <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                {...register('dateOfBirth', { required: 'Date of birth is required' })}
                type="date"
                className={`mt-1 input ${errors.dateOfBirth ? 'input-error' : ''}`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <select
                {...register('role', { required: 'Please select account type' })}
                className={`mt-1 input ${errors.role ? 'input-error' : ''}`}
              >
                <option value="">Select account type</option>
                <option value="SEEKER">Seeker - Book services</option>
                <option value="PROVIDER">Provider - Offer services</option>
              </select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                    message: 'Password must contain uppercase, lowercase, and number'
                  }
                })}
                type="password"
                className={`mt-1 input ${errors.password ? 'input-error' : ''}`}
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match'
                })}
                type="password"
                className={`mt-1 input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Confirm your password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center">
              <input
                {...register('isAdultConsent', { required: 'You must confirm you are 18+' })}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                I confirm that I am 18 years of age or older and a consenting adult
              </label>
            </div>
            {errors.isAdultConsent && (
              <p className="text-sm text-red-600">{errors.isAdultConsent.message}</p>
            )}

            <div className="flex items-center">
              <input
                {...register('termsAccepted', { required: 'You must accept the terms' })}
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="text-primary-600 hover:text-primary-500">
                  Privacy Policy
                </a>
              </label>
            </div>
            {errors.termsAccepted && (
              <p className="text-sm text-red-600">{errors.termsAccepted.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/"
              className="text-sm text-primary-600 hover:text-primary-500"
            >
              ← Back to home
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register