import { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { 
  FiCheck, FiClock, FiX, FiAlertCircle, FiShield, 
  FiUser, FiMail, FiPhone, FiCamera, FiFileText 
} from 'react-icons/fi'
import ProfilePhotoUpload from '../components/Upload/ProfilePhotoUpload'
import DocumentUpload from '../components/Upload/DocumentUpload'
import api from '../services/api'
import toast from 'react-hot-toast'

const Verification = () => {
  const { user } = useSelector((state) => state.auth)
  const navigate = useNavigate()
  
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [activeStep, setActiveStep] = useState(0)
  const [loading, setLoading] = useState(true)
  const [phoneCode, setPhoneCode] = useState('')
  const [sendingCode, setSendingCode] = useState(false)
  const [verifyingCode, setVerifyingCode] = useState(false)

  useEffect(() => {
    loadVerificationStatus()
  }, [])

  const loadVerificationStatus = async () => {
    try {
      const response = await api.get('/auth/verification-status')
      setVerificationStatus(response.data)
      
      // Determine active step based on verification status
      if (!response.data.isEmailVerified) {
        setActiveStep(0)
      } else if (!response.data.isPhoneVerified) {
        setActiveStep(1)
      } else if (!response.data.profile?.profilePhoto) {
        setActiveStep(2)
      } else if (!response.data.isAgeVerified) {
        setActiveStep(3)
      } else {
        setActiveStep(4)
      }
    } catch (error) {
      toast.error('Failed to load verification status')
    } finally {
      setLoading(false)
    }
  }

  const handleEmailVerification = async () => {
    try {
      await api.post('/auth/resend-verification', { email: user.email })
      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      toast.error('Failed to send verification email')
    }
  }

  const handlePhoneVerification = async () => {
    if (!user.phone) {
      toast.error('Please update your phone number in your profile')
      return
    }

    setSendingCode(true)
    try {
      await api.post('/auth/send-phone-otp', { phone: user.phone })
      toast.success('Verification code sent to your phone')
    } catch (error) {
      toast.error('Failed to send verification code')
    } finally {
      setSendingCode(false)
    }
  }

  const handleVerifyPhoneCode = async () => {
    if (!phoneCode) {
      toast.error('Please enter the verification code')
      return
    }

    setVerifyingCode(true)
    try {
      await api.post('/auth/verify-phone-otp', { otp: phoneCode })
      toast.success('Phone verified successfully!')
      setVerificationStatus(prev => ({ ...prev, isPhoneVerified: true }))
      setActiveStep(2)
    } catch (error) {
      toast.error('Invalid verification code')
    } finally {
      setVerifyingCode(false)
    }
  }

  const handleProfilePhotoUpdate = () => {
    setActiveStep(3)
    toast.success('Profile photo updated!')
  }

  const handleDocumentUpload = () => {
    toast.success('Documents uploaded for verification!')
    loadVerificationStatus()
  }

  const getStepStatus = (step) => {
    switch (step) {
      case 0:
        return verificationStatus?.isEmailVerified ? 'completed' : 'current'
      case 1:
        return verificationStatus?.isPhoneVerified ? 'completed' : 
               verificationStatus?.isEmailVerified ? 'current' : 'pending'
      case 2:
        return verificationStatus?.profile?.profilePhoto ? 'completed' : 
               verificationStatus?.isPhoneVerified ? 'current' : 'pending'
      case 3:
        return verificationStatus?.isAgeVerified ? 'completed' : 
               verificationStatus?.profile?.profilePhoto ? 'current' : 'pending'
      default:
        return 'pending'
    }
  }

  const steps = [
    {
      title: 'Email Verification',
      description: 'Verify your email address',
      icon: FiMail,
      status: getStepStatus(0)
    },
    {
      title: 'Phone Verification',
      description: 'Verify your phone number',
      icon: FiPhone,
      status: getStepStatus(1)
    },
    {
      title: 'Profile Photo',
      description: 'Upload your profile photo',
      icon: FiCamera,
      status: getStepStatus(2)
    },
    {
      title: 'Identity Verification',
      description: 'Upload government-issued ID',
      icon: FiFileText,
      status: getStepStatus(3)
    }
  ]

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <FiCheck className="w-5 h-5 text-green-600" />
      case 'current':
        return <FiClock className="w-5 h-5 text-blue-600" />
      default:
        return <FiClock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 border-green-200'
      case 'current':
        return 'bg-blue-100 border-blue-200'
      default:
        return 'bg-gray-100 border-gray-200'
    }
  }

  const isVerificationComplete = () => {
    return verificationStatus?.isEmailVerified && 
           verificationStatus?.isPhoneVerified && 
           verificationStatus?.profile?.profilePhoto && 
           verificationStatus?.isAgeVerified
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiShield className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Account Verification</h1>
        <p className="text-gray-600">
          Complete your verification to access all platform features
        </p>
      </div>

      {/* Verification Complete */}
      {isVerificationComplete() && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <FiCheck className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-green-900">
                Verification Complete!
              </h3>
              <p className="text-green-700">
                Your account has been fully verified. You can now access all platform features.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center flex-1">
              <div className={`flex items-center space-x-3 p-4 rounded-lg border-2 ${getStatusColor(step.status)} flex-1`}>
                <div className="flex-shrink-0">
                  {getStatusIcon(step.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-300 mx-2"></div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Verification Steps */}
      <div className="space-y-8">
        {/* Email Verification */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <FiMail className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Email Verification</h3>
                <p className="text-sm text-gray-600">Verify your email address</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {verificationStatus?.isEmailVerified ? (
              <div className="flex items-center space-x-3 text-green-600">
                <FiCheck className="w-5 h-5" />
                <span>Email verified successfully</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  We've sent a verification email to <strong>{user.email}</strong>
                </p>
                <button
                  onClick={handleEmailVerification}
                  className="btn btn-primary"
                >
                  Resend Verification Email
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Phone Verification */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <FiPhone className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Phone Verification</h3>
                <p className="text-sm text-gray-600">Verify your phone number</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {verificationStatus?.isPhoneVerified ? (
              <div className="flex items-center space-x-3 text-green-600">
                <FiCheck className="w-5 h-5" />
                <span>Phone verified successfully</span>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-gray-600">
                  Verify your phone number: <strong>{user.phone || 'Not provided'}</strong>
                </p>
                {!user.phone ? (
                  <p className="text-red-600 text-sm">
                    Please update your phone number in your profile first
                  </p>
                ) : (
                  <div className="space-y-4">
                    <button
                      onClick={handlePhoneVerification}
                      disabled={sendingCode}
                      className="btn btn-primary"
                    >
                      {sendingCode ? 'Sending...' : 'Send Verification Code'}
                    </button>
                    
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={phoneCode}
                        onChange={(e) => setPhoneCode(e.target.value)}
                        placeholder="Enter verification code"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleVerifyPhoneCode}
                        disabled={verifyingCode || !phoneCode}
                        className="btn btn-secondary"
                      >
                        {verifyingCode ? 'Verifying...' : 'Verify'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Profile Photo */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <FiCamera className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                <p className="text-sm text-gray-600">Upload your profile photo</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            {verificationStatus?.profile?.profilePhoto ? (
              <div className="flex items-center space-x-3 text-green-600 mb-4">
                <FiCheck className="w-5 h-5" />
                <span>Profile photo uploaded</span>
              </div>
            ) : null}
            <ProfilePhotoUpload
              currentPhoto={verificationStatus?.profile?.profilePhoto}
              onPhotoUpdate={handleProfilePhotoUpdate}
              size="lg"
            />
          </div>
        </div>

        {/* Identity Verification */}
        <div className="card">
          <div className="card-header">
            <div className="flex items-center space-x-3">
              <FiFileText className="w-6 h-6 text-blue-600" />
              <div>
                <h3 className="text-lg font-medium text-gray-900">Identity Verification</h3>
                <p className="text-sm text-gray-600">Upload government-issued ID</p>
              </div>
            </div>
          </div>
          <div className="card-body">
            <DocumentUpload
              documentType="ID"
              onUploadComplete={handleDocumentUpload}
              existingDocuments={verificationStatus?.verifications || []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Verification