import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiAlertTriangle, FiEye, FiMessageSquare, FiClock, FiCheckCircle, FiXCircle } from 'react-icons/fi'
import DisputeDetails from './DisputeDetails'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const MyDisputes = () => {
  const { token } = useSelector((state) => state.auth)
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [selectedDispute, setSelectedDispute] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    fetchDisputes()
  }, [page, statusFilter])

  const fetchDisputes = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 10 }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      const response = await axios.get(`${API_URL}/api/disputes/my-disputes`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })

      setDisputes(response.data.data.disputes)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching disputes:', error)
      toast.error('Failed to load disputes')
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OPEN':
        return <FiAlertTriangle className="text-yellow-500" />
      case 'INVESTIGATING':
        return <FiClock className="text-blue-500" />
      case 'RESOLVED':
        return <FiCheckCircle className="text-green-500" />
      case 'CLOSED':
        return <FiXCircle className="text-gray-500" />
      case 'ESCALATED':
        return <FiAlertTriangle className="text-red-500" />
      default:
        return <FiMessageSquare className="text-gray-500" />
    }
  }

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
    })
  }

  const handleViewDetails = async (disputeId) => {
    try {
      const response = await axios.get(`${API_URL}/api/disputes/${disputeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setSelectedDispute(response.data.data.dispute)
    } catch (error) {
      console.error('Error fetching dispute details:', error)
      toast.error('Failed to load dispute details')
    }
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Disputes</h2>
            <p className="text-gray-400">
              View and track your dispute cases
            </p>
          </div>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['ALL', 'OPEN', 'INVESTIGATING', 'RESOLVED', 'CLOSED', 'ESCALATED'].map((status) => (
            <button
              key={status}
              onClick={() => {
                setStatusFilter(status)
                setPage(1)
              }}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {status === 'ALL' ? 'All Disputes' : status.replace('_', ' ')}
            </button>
          ))}
        </div>

        {/* Disputes List */}
        {disputes.length === 0 ? (
          <div className="card text-center py-12">
            <FiMessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">No disputes found</p>
            <p className="text-gray-500 text-sm mt-2">
              {statusFilter !== 'ALL'
                ? `No disputes with status: ${statusFilter}`
                : 'You have not filed any disputes'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map((dispute) => {
              const isReporter = dispute.role === 'reporter'

              return (
                <div key={dispute.id} className="card hover:border-red-600 transition-all">
                  <div className="flex items-start gap-4">
                    {/* Status Icon */}
                    <div className={`p-3 rounded-lg border ${getStatusColor(dispute.status)}`}>
                      {getStatusIcon(dispute.status)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {/* Header */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-white font-semibold">
                              {getDisputeTypeLabel(dispute.disputeType)}
                            </h3>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(dispute.status)}`}>
                              {dispute.status}
                            </span>
                            {isReporter && (
                              <span className="px-2 py-1 bg-blue-600 bg-opacity-20 text-blue-400 rounded text-xs font-medium">
                                Reporter
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-400">
                            Case #{dispute.id.slice(0, 8)} • Filed {formatDate(dispute.createdAt)}
                          </p>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <p className="text-gray-300 text-sm mb-3 line-clamp-2">
                        {dispute.description}
                      </p>

                      {/* Booking Info */}
                      {dispute.booking && (
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <span>
                            Booking: {new Date(dispute.booking.scheduledAt).toLocaleDateString()}
                          </span>
                          <span className="capitalize">{dispute.booking.serviceType}</span>
                          <span>{dispute.booking.totalTokens} tokens</span>
                        </div>
                      )}

                      {/* Resolution (if resolved) */}
                      {dispute.status === 'RESOLVED' && dispute.resolution && (
                        <div className="p-3 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg mb-3">
                          <p className="text-xs text-green-400 font-medium mb-1">Resolution</p>
                          <p className="text-sm text-gray-300 line-clamp-2">{dispute.resolution}</p>
                          {dispute.refundIssued && (
                            <p className="text-xs text-green-400 mt-2">
                              Refund issued: {dispute.refundAmount} tokens
                            </p>
                          )}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleViewDetails(dispute.id)}
                          className="text-sm text-red-500 hover:text-red-400 flex items-center gap-2 font-medium"
                        >
                          <FiEye size={16} />
                          View Details
                        </button>

                        {dispute.evidence && dispute.evidence.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {dispute.evidence.length} evidence file(s)
                          </span>
                        )}

                        {dispute.assignedManager && (
                          <span className="text-xs text-gray-500">
                            Assigned to: {dispute.assignedManager.profile?.firstName || 'Manager'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400 px-4">
              Page {page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= pagination.totalPages}
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <DisputeDetails
          dispute={selectedDispute}
          onClose={() => setSelectedDispute(null)}
          onUpdate={fetchDisputes}
        />
      )}
    </>
  )
}

export default MyDisputes
