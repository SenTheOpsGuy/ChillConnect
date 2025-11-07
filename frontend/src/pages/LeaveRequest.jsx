import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import {
  fetchLeaveTypes,
  createLeaveRequest,
  fetchMyLeaveRequests,
  fetchMyLeaveStatistics,
  cancelLeaveRequest,
  clearError,
} from '../store/slices/leaveSlice'

const LeaveRequest = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { leaveTypes, myLeaveRequests, myStatistics, loading, error } = useSelector((state) => state.leave)

  const [formData, setFormData] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
    notes: '',
  })

  const [selectedTab, setSelectedTab] = useState('new') // 'new', 'my-requests', 'statistics'

  useEffect(() => {
    dispatch(fetchLeaveTypes())
    dispatch(fetchMyLeaveRequests())
    dispatch(fetchMyLeaveStatistics())
  }, [dispatch])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const calculateTotalDays = () => {
    if (!formData.startDate || !formData.endDate) {return 0}

    const start = new Date(formData.startDate)
    const end = new Date(formData.endDate)

    if (start > end) {return 0}

    const timeDiff = end.getTime() - start.getTime()
    const days = timeDiff / (1000 * 3600 * 24) + 1 // +1 to include both start and end dates

    return days
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.leaveTypeId || !formData.startDate || !formData.endDate || !formData.reason) {
      dispatch(clearError())
      return
    }

    const result = await dispatch(createLeaveRequest(formData))

    if (result.meta.requestStatus === 'fulfilled') {
      setFormData({
        leaveTypeId: '',
        startDate: '',
        endDate: '',
        reason: '',
        notes: '',
      })
      dispatch(fetchMyLeaveRequests())
      dispatch(fetchMyLeaveStatistics())
      setSelectedTab('my-requests')
    }
  }

  const handleCancelLeave = async (leaveRequestId) => {
    // eslint-disable-next-line no-restricted-globals
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    const result = await dispatch(cancelLeaveRequest(leaveRequestId))

    if (result.meta.requestStatus === 'fulfilled') {
      dispatch(fetchMyLeaveRequests())
      dispatch(fetchMyLeaveStatistics())
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Leave Management</h1>
          <p className="mt-2 text-gray-600">Request and manage your time off</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => dispatch(clearError())} className="text-red-700 hover:text-red-900">
              ✕
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex space-x-8">
            <button
              onClick={() => setSelectedTab('new')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'new'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              New Request
            </button>
            <button
              onClick={() => setSelectedTab('my-requests')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'my-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              My Requests
              {myLeaveRequests.length > 0 && (
                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">
                  {myLeaveRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab('statistics')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                selectedTab === 'statistics'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Statistics
            </button>
          </nav>
        </div>

        {/* New Request Tab */}
        {selectedTab === 'new' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit Leave Request</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Leave Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="leaveTypeId"
                  value={formData.leaveTypeId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select leave type...</option>
                  {leaveTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name} {type.maxDaysPerYear && `(${type.maxDaysPerYear} days/year)`}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleInputChange}
                    min={formData.startDate}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {formData.startDate && formData.endDate && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Total Days:</strong> {calculateTotalDays()} day(s)
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="reason"
                  value={formData.reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Please provide the reason for your leave request..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Any additional information..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Request'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/roster')}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  View Calendar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* My Requests Tab */}
        {selectedTab === 'my-requests' && (
          <div className="space-y-4">
            {myLeaveRequests.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <p className="text-gray-500">You haven't submitted any leave requests yet.</p>
                <button
                  onClick={() => setSelectedTab('new')}
                  className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Submit New Request
                </button>
              </div>
            ) : (
              myLeaveRequests.map((leave) => (
                <div key={leave.id} className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{leave.leaveType.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(leave.status)}`}>
                          {leave.status}
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <p>
                          <strong>Dates:</strong> {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                        <p>
                          <strong>Duration:</strong> {leave.totalDays} day(s)
                        </p>
                        <p>
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                        {leave.notes && (
                          <p>
                            <strong>Notes:</strong> {leave.notes}
                          </p>
                        )}
                        {leave.reviewedByUser && (
                          <p>
                            <strong>Reviewed by:</strong> {leave.reviewedByUser.profile?.firstName}{' '}
                            {leave.reviewedByUser.profile?.lastName} on {formatDate(leave.reviewedAt)}
                          </p>
                        )}
                        {leave.rejectionReason && (
                          <p className="text-red-600">
                            <strong>Rejection Reason:</strong> {leave.rejectionReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      {(leave.status === 'PENDING' || leave.status === 'APPROVED') && (
                        <button
                          onClick={() => handleCancelLeave(leave.id)}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Statistics Tab */}
        {selectedTab === 'statistics' && myStatistics && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Leave Statistics for {myStatistics.year}</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <p className="text-sm text-blue-600 font-medium">Total Leave Taken</p>
                <p className="text-3xl font-bold text-blue-900 mt-2">{myStatistics.totalLeaveTaken} days</p>
              </div>

              <div className="bg-green-50 rounded-lg p-6">
                <p className="text-sm text-green-600 font-medium">Total Requests</p>
                <p className="text-3xl font-bold text-green-900 mt-2">{myStatistics.leaveRequests}</p>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-4">By Leave Type</h3>
            <div className="space-y-4">
              {Object.entries(myStatistics.byType).map(([typeName, stats]) => (
                <div key={typeName} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="font-medium text-gray-900">{typeName}</h4>
                    <span className="text-sm text-gray-600">
                      {stats.days} / {stats.maxDays || '∞'} days
                    </span>
                  </div>
                  {stats.maxDays && (
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${Math.min((stats.days / stats.maxDays) * 100, 100)}%` }}
                      ></div>
                    </div>
                  )}
                  <p className="text-sm text-gray-600 mt-2">{stats.count} request(s)</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LeaveRequest
