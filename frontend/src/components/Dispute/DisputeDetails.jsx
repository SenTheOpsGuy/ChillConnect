import { useState } from 'react'
import { useSelector } from 'react-redux'
import PropTypes from 'prop-types'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiX,
  FiAlertTriangle,
  FiUser,
  FiCalendar,
  FiFileText,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiExternalLink,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const DisputeDetails = ({ dispute, onClose, onUpdate }) => {
  const { token, user } = useSelector((state) => state.auth)
  const [showAppealForm, setShowAppealForm] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isReporter = dispute.reportedBy === user.id
  const canAppeal =
    dispute.status === 'RESOLVED' &&
    isReporter &&
    !dispute.appealedAt

  const getStatusColor = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-500 border-yellow-600'
      case 'INVESTIGATING':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600'
      case 'RESOLVED':
        return 'bg-green-600 bg-opacity-20 text-green-500 border-green-600'
      case 'CLOSED':
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
      case 'ESCALATED':
        return 'bg-red-600 bg-opacity-20 text-red-500 border-red-600'
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
    }
  }

  const getDisputeTypeLabel = (type) => {
    const labels = {
      NO_SHOW: 'No Show',
      SERVICE_QUALITY: 'Service Quality',
      PAYMENT_ISSUE: 'Payment Issue',
      BEHAVIOR_ISSUE: 'Behavior Issue',
      TERMS_VIOLATION: 'Terms Violation',
      OTHER: 'Other',
    }
    return labels[type] || type
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleAppeal = async () => {
    if (!appealReason.trim()) {
      toast.error('Please provide a reason for your appeal')
      return
    }

    if (appealReason.trim().length < 20) {
      toast.error('Appeal reason must be at least 20 characters')
      return
    }

    try {
      setSubmitting(true)

      await axios.post(
        `${API_URL}/api/disputes/${dispute.id}/appeal`,
        { appealReason: appealReason.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Appeal submitted successfully')
      setShowAppealForm(false)
      setAppealReason('')

      if (onUpdate) {
        onUpdate()
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting appeal:', error)
      toast.error(error.response?.data?.error || 'Failed to submit appeal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-lg border ${getStatusColor(dispute.status)}`}>
              <FiAlertTriangle size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">
                {getDisputeTypeLabel(dispute.disputeType)} Dispute
              </h2>
              <p className="text-sm text-gray-400">
                Case #{dispute.id.slice(0, 8)}
              </p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-sm font-medium border ${getStatusColor(dispute.status)}`}>
              {dispute.status}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="text-gray-400" size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Timeline */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-1">
                <FiCalendar size={16} />
                <span className="text-xs font-medium">Filed</span>
              </div>
              <p className="text-white text-sm">{formatDate(dispute.createdAt)}</p>
            </div>

            {dispute.updatedAt && dispute.updatedAt !== dispute.createdAt && (
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiClock size={16} />
                  <span className="text-xs font-medium">Last Updated</span>
                </div>
                <p className="text-white text-sm">{formatDate(dispute.updatedAt)}</p>
              </div>
            )}

            {dispute.resolvedAt && (
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <div className="flex items-center gap-2 text-gray-400 mb-1">
                  <FiCheckCircle size={16} />
                  <span className="text-xs font-medium">Resolved</span>
                </div>
                <p className="text-white text-sm">{formatDate(dispute.resolvedAt)}</p>
              </div>
            )}
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FiUser size={16} />
                <span className="text-xs font-medium">Reporter</span>
              </div>
              <p className="text-white">
                {dispute.reporter
                  ? `${dispute.reporter.profile?.firstName} ${dispute.reporter.profile?.lastName}`
                  : 'Unknown'}
              </p>
              {isReporter && (
                <span className="inline-block mt-1 px-2 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded text-xs">
                  You
                </span>
              )}
            </div>

            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <div className="flex items-center gap-2 text-gray-400 mb-2">
                <FiUser size={16} />
                <span className="text-xs font-medium">Reported Against</span>
              </div>
              <p className="text-white">
                {dispute.reportedUser
                  ? `${dispute.reportedUser.profile?.firstName} ${dispute.reportedUser.profile?.lastName}`
                  : 'Unknown'}
              </p>
              {!isReporter && (
                <span className="inline-block mt-1 px-2 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded text-xs">
                  You
                </span>
              )}
            </div>
          </div>

          {/* Booking Details */}
          {dispute.booking && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
                <FiFileText size={16} />
                Booking Details
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Date:</span>
                  <span className="text-white ml-2">
                    {new Date(dispute.booking.scheduledAt).toLocaleDateString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Service:</span>
                  <span className="text-white ml-2 capitalize">{dispute.booking.serviceType}</span>
                </div>
                <div>
                  <span className="text-gray-500">Amount:</span>
                  <span className="text-white ml-2">{dispute.booking.totalTokens} tokens</span>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <span className="text-white ml-2 capitalize">{dispute.booking.status}</span>
                </div>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <FiMessageSquare size={16} />
              Description
            </h3>
            <p className="text-white leading-relaxed whitespace-pre-wrap">
              {dispute.description}
            </p>
          </div>

          {/* Evidence */}
          {dispute.evidence && dispute.evidence.length > 0 && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-gray-400 mb-3">
                Evidence ({dispute.evidence.length})
              </h3>
              <div className="space-y-2">
                {dispute.evidence.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 p-3 bg-gray-900 hover:bg-gray-700 rounded-lg border border-gray-700 transition-colors group"
                  >
                    <FiExternalLink className="text-gray-400 group-hover:text-red-400" size={16} />
                    <span className="text-sm text-gray-300 group-hover:text-white truncate flex-1">
                      {url}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Assigned Manager */}
          {dispute.assignedManager && (
            <div className="p-4 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg">
              <h3 className="text-sm font-medium text-blue-400 mb-2">
                Assigned Support Manager
              </h3>
              <p className="text-white">
                {dispute.assignedManager.profile?.firstName} {dispute.assignedManager.profile?.lastName}
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Your case is being reviewed by our support team
              </p>
            </div>
          )}

          {/* Resolution */}
          {dispute.status === 'RESOLVED' && dispute.resolution && (
            <div className="p-4 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg">
              <h3 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                <FiCheckCircle size={16} />
                Resolution
              </h3>
              <p className="text-white leading-relaxed mb-3 whitespace-pre-wrap">
                {dispute.resolution}
              </p>
              {dispute.refundIssued && (
                <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
                  <p className="text-sm text-green-400 font-medium">
                    Refund Issued: {dispute.refundAmount} tokens
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    The refund has been credited to your wallet
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Appeal Info */}
          {dispute.appealedAt && (
            <div className="p-4 bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg">
              <h3 className="text-sm font-medium text-yellow-400 mb-2">
                Appeal Submitted
              </h3>
              <p className="text-sm text-gray-300 mb-2">{dispute.appealReason}</p>
              <p className="text-xs text-gray-400">
                Submitted: {formatDate(dispute.appealedAt)}
              </p>
            </div>
          )}

          {/* Appeal Form */}
          {canAppeal && !showAppealForm && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-gray-300 mb-3">
                Not satisfied with the resolution? You can appeal this decision.
              </p>
              <button
                onClick={() => setShowAppealForm(true)}
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition-colors"
              >
                Appeal Decision
              </button>
            </div>
          )}

          {showAppealForm && (
            <div className="p-4 bg-gray-800 rounded-lg border border-yellow-600">
              <h3 className="text-white font-medium mb-3">Appeal This Resolution</h3>
              <p className="text-sm text-gray-400 mb-4">
                Please explain why you believe this resolution is unfair (minimum 20 characters)
              </p>
              <textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain your reason for appealing..."
                rows={4}
                maxLength={1000}
                className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-yellow-600 focus:outline-none resize-none mb-3"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {appealReason.length}/1000 characters
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowAppealForm(false)
                      setAppealReason('')
                    }}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAppeal}
                    disabled={submitting || appealReason.trim().length < 20}
                    className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <div className="spinner w-4 h-4"></div>
                        Submitting...
                      </>
                    ) : (
                      'Submit Appeal'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

DisputeDetails.propTypes = {
  dispute: PropTypes.shape({
    id: PropTypes.string.isRequired,
    reportedBy: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    appealedAt: PropTypes.string,
    disputeType: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    resolvedAt: PropTypes.string,
    description: PropTypes.string.isRequired,
    evidence: PropTypes.arrayOf(PropTypes.string),
    resolution: PropTypes.string,
    refundIssued: PropTypes.bool,
    refundAmount: PropTypes.number,
    appealReason: PropTypes.string,
    reporter: PropTypes.shape({
      profile: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
    }),
    reportedUser: PropTypes.shape({
      profile: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
    }),
    booking: PropTypes.shape({
      scheduledAt: PropTypes.string,
      serviceType: PropTypes.string,
      totalTokens: PropTypes.number,
      status: PropTypes.string,
    }),
    assignedManager: PropTypes.shape({
      profile: PropTypes.shape({
        firstName: PropTypes.string,
        lastName: PropTypes.string,
      }),
    }),
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onUpdate: PropTypes.func.isRequired,
}

export default DisputeDetails
