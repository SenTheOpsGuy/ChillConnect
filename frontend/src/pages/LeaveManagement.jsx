import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchAllLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  clearError,
} from '../store/slices/leaveSlice'

const LeaveManagement = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const { allLeaveRequests, pagination, loading, error } = useSelector((state) => state.leave)

  const [filters, setFilters] = useState({
    status: 'PENDING',
    page: 1,
  })

  const [selectedLeave, setSelectedLeave] = useState(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [adminNotes, setAdminNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  // Check if user has permission
  const isAuthorized = ['MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role)

  useEffect(() => {
    if (!isAuthorized) {
      navigate('/')
      return
    }

    dispatch(fetchAllLeaveRequests(filters))
  }, [filters, isAuthorized, dispatch, navigate])

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }))
  }

  const handlePageChange = (newPage) => {
    setFilters((prev) => ({ ...prev, page: newPage }))
  }

  const openApprovalModal = (leave) => {
    setSelectedLeave(leave)
    setAdminNotes('')
    setShowApprovalModal(true)
  }

  const openRejectionModal = (leave) => {
    setSelectedLeave(leave)
    setRejectionReason('')
    setAdminNotes('')
    setShowRejectionModal(true)
  }

  const handleApprove = async () => {
    if (!selectedLeave) {return}

    const result = await dispatch(
      approveLeaveRequest({
        leaveRequestId: selectedLeave.id,
        adminNotes,
      }),
    )

    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Leave request approved successfully!')
      setShowApprovalModal(false)
      setSelectedLeave(null)
      dispatch(fetchAllLeaveRequests(filters))
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  const handleReject = async () => {
    if (!selectedLeave || !rejectionReason) {
      return
    }

    const result = await dispatch(
      rejectLeaveRequest({
        leaveRequestId: selectedLeave.id,
        rejectionReason,
        adminNotes,
      }),
    )

    if (result.meta.requestStatus === 'fulfilled') {
      setSuccessMessage('Leave request rejected')
      setShowRejectionModal(false)
      setSelectedLeave(null)
      dispatch(fetchAllLeaveRequests(filters))
      setTimeout(() => setSuccessMessage(''), 5000)
    }
  }

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-2 text-gray-600">Review and manage employee leave requests</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} className="text-red-700 hover:text-red-900">
              ✕
            </button>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{successMessage}</span>
            <button onClick={() => setSuccessMessage('')} className="text-green-700 hover:text-green-900">
              ✕
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => navigate('/roster')}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Leave Requests List */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading leave requests...</p>
            </div>
          </div>
        ) : allLeaveRequests.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <p className="text-gray-500">No leave requests found with the selected filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {allLeaveRequests.map((leave) => (
              <div key={leave.id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {leave.user.profile?.firstName} {leave.user.profile?.lastName}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(leave.status)}`}>
                        {leave.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <strong>Leave Type:</strong> {leave.leaveType.name}
                        </p>
                        <p className="text-gray-600">
                          <strong>Dates:</strong> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                        <p className="text-gray-600">
                          <strong>Duration:</strong> {leave.totalDays} day(s)
                        </p>
                        <p className="text-gray-600">
                          <strong>Employee:</strong> {leave.user.email}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-gray-600">
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                        {leave.notes && (
                          <p className="text-gray-600">
                            <strong>Notes:</strong> {leave.notes}
                          </p>
                        )}
                        <p className="text-gray-600">
                          <strong>Requested on:</strong> {formatDate(leave.createdAt)}
                        </p>
                        {leave.reviewedByUser && (
                          <p className="text-gray-600">
                            <strong>Reviewed by:</strong> {leave.reviewedByUser.profile?.firstName}{' '}
                            {leave.reviewedByUser.profile?.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    {leave.rejectionReason && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-sm text-red-800">
                          <strong>Rejection Reason:</strong> {leave.rejectionReason}
                        </p>
                      </div>
                    )}

                    {leave.adminNotes && (
                      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                        <p className="text-sm text-blue-800">
                          <strong>Admin Notes:</strong> {leave.adminNotes}
                        </p>
                      </div>
                    )}
                  </div>

                  {leave.status === 'PENDING' && (
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => openApprovalModal(leave)}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => openRejectionModal(leave)}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Previous
            </button>

            <span className="px-4 py-2 bg-gray-100 rounded-lg">
              Page {pagination.page} of {pagination.totalPages}
            </span>

            <button
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {/* Approval Modal */}
        {showApprovalModal && selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Approve Leave Request</h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Employee:</strong> {selectedLeave.user.profile?.firstName}{' '}
                  {selectedLeave.user.profile?.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Leave Type:</strong> {selectedLeave.leaveType.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Duration:</strong> {selectedLeave.totalDays} day(s)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add any notes for the employee..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleApprove}
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? 'Approving...' : 'Confirm Approval'}
                </button>
                <button
                  onClick={() => setShowApprovalModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectionModal && selectedLeave && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Reject Leave Request</h2>

              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Employee:</strong> {selectedLeave.user.profile?.firstName}{' '}
                  {selectedLeave.user.profile?.lastName}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Leave Type:</strong> {selectedLeave.leaveType.name}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Duration:</strong> {selectedLeave.totalDays} day(s)
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Provide a reason for rejection..."
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notes (Optional)
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional internal notes..."
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleReject}
                  disabled={loading || !rejectionReason}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition-colors font-medium"
                >
                  {loading ? 'Rejecting...' : 'Confirm Rejection'}
                </button>
                <button
                  onClick={() => setShowRejectionModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaveManagement
