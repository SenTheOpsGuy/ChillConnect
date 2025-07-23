import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  FiUser, FiFileText, FiCheck, FiX, FiEye, FiClock, 
  FiAlertCircle, FiDownload 
} from 'react-icons/fi'
import { fetchVerificationQueue, updateVerification } from '../../store/slices/adminSlice'

const VerificationQueue = () => {
  const dispatch = useDispatch()
  const { verificationQueue, loading } = useSelector((state) => state.admin)
  const { user: currentUser } = useSelector((state) => state.auth)
  
  const [selectedVerification, setSelectedVerification] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [reviewNotes, setReviewNotes] = useState('')
  const [filters, setFilters] = useState({
    status: 'PENDING',
    page: 1,
    limit: 20
  })

  useEffect(() => {
    dispatch(fetchVerificationQueue(filters))
  }, [dispatch, filters])

  const handleApprove = async (verificationId) => {
    try {
      await dispatch(updateVerification({ 
        verificationId, 
        status: 'APPROVED', 
        notes: reviewNotes 
      })).unwrap()
      setShowModal(false)
      setSelectedVerification(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Failed to approve verification:', error)
    }
  }

  const handleReject = async (verificationId) => {
    try {
      await dispatch(updateVerification({ 
        verificationId, 
        status: 'REJECTED', 
        notes: reviewNotes 
      })).unwrap()
      setShowModal(false)
      setSelectedVerification(null)
      setReviewNotes('')
    } catch (error) {
      console.error('Failed to reject verification:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800',
      'IN_PROGRESS': 'bg-blue-100 text-blue-800',
      'APPROVED': 'bg-green-100 text-green-800',
      'REJECTED': 'bg-red-100 text-red-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      'PENDING': FiClock,
      'IN_PROGRESS': FiAlertCircle,
      'APPROVED': FiCheck,
      'REJECTED': FiX
    }
    return icons[status] || FiClock
  }

  const calculateAge = (dateOfBirth) => {
    if (!dateOfBirth) return 'N/A'
    const age = Math.floor((Date.now() - new Date(dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    return age
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Verification Queue</h1>
          <p className="text-gray-600">Review and approve user verifications</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Queue Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-3">
              <FiClock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {verificationQueue.filter(v => v.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-3">
              <FiAlertCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">In Progress</p>
              <p className="text-xl font-bold text-gray-900">
                {verificationQueue.filter(v => v.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-3">
              <FiCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Approved</p>
              <p className="text-xl font-bold text-gray-900">
                {verificationQueue.filter(v => v.status === 'APPROVED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-3">
              <FiX className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Rejected</p>
              <p className="text-xl font-bold text-gray-900">
                {verificationQueue.filter(v => v.status === 'REJECTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Queue */}
      <div className="card">
        <div className="space-y-4">
          {verificationQueue.map((verification) => (
            <div 
              key={verification.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="avatar avatar-md">
                    <span className="text-lg">
                      {verification.user?.profile?.firstName?.charAt(0) || 'U'}
                      {verification.user?.profile?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {verification.user?.profile?.firstName} {verification.user?.profile?.lastName}
                    </h3>
                    <p className="text-sm text-gray-500">{verification.user?.email}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-sm text-gray-600">
                        Age: {calculateAge(verification.user?.profile?.dateOfBirth)}
                      </span>
                      <span className="text-sm text-gray-600">
                        Role: {verification.user?.role?.replace('_', ' ')}
                      </span>
                      <span className="text-sm text-gray-600">
                        Document: {verification.documentType}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(verification.status)}`}>
                    {React.createElement(getStatusIcon(verification.status), { className: 'w-3 h-3 mr-1' })}
                    {verification.status}
                  </span>
                  {verification.status === 'PENDING' && (
                    <button
                      onClick={() => {
                        setSelectedVerification(verification)
                        setShowModal(true)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      <FiEye className="w-4 h-4 mr-1" />
                      Review
                    </button>
                  )}
                </div>
              </div>
              
              {verification.notes && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Notes:</strong> {verification.notes}
                  </p>
                </div>
              )}
              
              <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                <span>Submitted: {new Date(verification.createdAt).toLocaleDateString()}</span>
                {verification.assignedAt && (
                  <span>Assigned: {new Date(verification.assignedAt).toLocaleDateString()}</span>
                )}
                {verification.employee && (
                  <span>
                    Assigned to: {verification.employee.profile?.firstName} {verification.employee.profile?.lastName}
                  </span>
                )}
              </div>
            </div>
          ))}

          {verificationQueue.length === 0 && (
            <div className="text-center py-8">
              <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No verifications found</p>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                Review Verification
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            {/* User Info */}
            <div className="mb-6">
              <div className="flex items-center space-x-4 mb-4">
                <div className="avatar avatar-lg">
                  <span className="text-xl">
                    {selectedVerification.user?.profile?.firstName?.charAt(0) || 'U'}
                    {selectedVerification.user?.profile?.lastName?.charAt(0) || ''}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">
                    {selectedVerification.user?.profile?.firstName} {selectedVerification.user?.profile?.lastName}
                  </h4>
                  <p className="text-sm text-gray-500">{selectedVerification.user?.email}</p>
                  <p className="text-sm text-gray-500">
                    Age: {calculateAge(selectedVerification.user?.profile?.dateOfBirth)} | 
                    Role: {selectedVerification.user?.role?.replace('_', ' ')}
                  </p>
                </div>
              </div>
            </div>

            {/* Document Info */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Document Type:</strong> {selectedVerification.documentType}
                </p>
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Submitted:</strong> {new Date(selectedVerification.createdAt).toLocaleDateString()}
                </p>
                <div className="flex items-center space-x-2">
                  <button className="btn btn-secondary btn-sm">
                    <FiDownload className="w-4 h-4 mr-1" />
                    Download Document
                  </button>
                  <button className="btn btn-secondary btn-sm">
                    <FiEye className="w-4 h-4 mr-1" />
                    View Document
                  </button>
                </div>
              </div>
            </div>

            {/* Review Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review Notes
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Add notes about your decision..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(selectedVerification.id)}
                className="btn btn-error"
              >
                <FiX className="w-4 h-4 mr-1" />
                Reject
              </button>
              <button
                onClick={() => handleApprove(selectedVerification.id)}
                className="btn btn-success"
              >
                <FiCheck className="w-4 h-4 mr-1" />
                Approve
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VerificationQueue