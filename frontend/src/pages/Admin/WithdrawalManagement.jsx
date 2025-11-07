import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiDollarSign,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiTrendingUp,
} from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const WithdrawalManagement = () => {
  const { token } = useSelector((state) => state.auth)
  const [withdrawals, setWithdrawals] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null)
  const [actionType, setActionType] = useState('') // 'approve', 'reject', 'complete'
  const [formData, setFormData] = useState({
    rejectionReason: '',
    adminNotes: '',
    transactionId: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
    fetchStatistics()
  }, [page, statusFilter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 20 }
      if (statusFilter) {
        params.status = statusFilter
      }

      const response = await axios.get(`${API_URL}/api/withdrawals/admin/all`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
      })

      setWithdrawals(response.data.data.requests)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching withdrawals:', error)
      toast.error('Failed to load withdrawals')
    } finally {
      setLoading(false)
    }
  }

  const fetchStatistics = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/withdrawals/admin/statistics`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setStatistics(response.data.data.statistics)
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const handleApprove = async () => {
    try {
      setSubmitting(true)
      await axios.put(
        `${API_URL}/api/withdrawals/admin/${selectedWithdrawal.id}/approve`,
        { adminNotes: formData.adminNotes.trim() || null },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Withdrawal approved successfully')
      fetchWithdrawals()
      fetchStatistics()
      closeModal()
    } catch (error) {
      console.error('Error approving withdrawal:', error)
      toast.error(error.response?.data?.error || 'Failed to approve withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleReject = async () => {
    if (!formData.rejectionReason.trim()) {
      toast.error('Please provide a rejection reason')
      return
    }

    try {
      setSubmitting(true)
      await axios.put(
        `${API_URL}/api/withdrawals/admin/${selectedWithdrawal.id}/reject`,
        {
          rejectionReason: formData.rejectionReason.trim(),
          adminNotes: formData.adminNotes.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Withdrawal rejected and tokens refunded')
      fetchWithdrawals()
      fetchStatistics()
      closeModal()
    } catch (error) {
      console.error('Error rejecting withdrawal:', error)
      toast.error(error.response?.data?.error || 'Failed to reject withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async () => {
    if (!formData.transactionId.trim()) {
      toast.error('Please provide a transaction ID')
      return
    }

    try {
      setSubmitting(true)
      await axios.put(
        `${API_URL}/api/withdrawals/admin/${selectedWithdrawal.id}/complete`,
        {
          transactionId: formData.transactionId.trim(),
          adminNotes: formData.adminNotes.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Withdrawal marked as completed')
      fetchWithdrawals()
      fetchStatistics()
      closeModal()
    } catch (error) {
      console.error('Error completing withdrawal:', error)
      toast.error(error.response?.data?.error || 'Failed to complete withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  const openModal = (withdrawal, type) => {
    setSelectedWithdrawal(withdrawal)
    setActionType(type)
    setFormData({ rejectionReason: '', adminNotes: '', transactionId: '' })
  }

  const closeModal = () => {
    setSelectedWithdrawal(null)
    setActionType('')
    setFormData({ rejectionReason: '', adminNotes: '', transactionId: '' })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-600 bg-opacity-20 text-yellow-500 border-yellow-600'
      case 'APPROVED':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600'
      case 'PROCESSING':
        return 'bg-blue-600 bg-opacity-20 text-blue-500 border-blue-600'
      case 'COMPLETED':
        return 'bg-green-600 bg-opacity-20 text-green-500 border-green-600'
      case 'REJECTED':
        return 'bg-red-600 bg-opacity-20 text-red-500 border-red-600'
      case 'CANCELLED':
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
      default:
        return 'bg-gray-600 bg-opacity-20 text-gray-500 border-gray-600'
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getPaymentMethodDisplay = (method) => {
    if (!method) {return 'N/A'}
    if (method.type === 'PAYPAL') {return `PayPal: ${method.paypalEmail}`}
    if (method.type === 'BANK_TRANSFER') {return `Bank: ${method.bankName} ****${method.accountNumber?.slice(-4)}`}
    if (method.type === 'UPI') {return `UPI: ${method.upiId}`}
    return method.type
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Withdrawal Management</h1>
        <p className="text-gray-400">Review and process provider withdrawal requests</p>
      </div>

      {/* Statistics */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Requests</span>
              <FiDollarSign className="text-blue-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.total}
            </div>
            <div className="text-sm text-gray-500">All time</div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Pending</span>
              <FiClock className="text-yellow-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              {statistics.byStatus?.PENDING?.count || 0}
            </div>
            <div className="text-sm text-gray-500">
              ₹{(statistics.pendingAmountInr || 0).toLocaleString()}
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Total Paid</span>
              <FiTrendingUp className="text-green-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₹{(statistics.totalAmountPaidInr || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {statistics.totalTokensWithdrawn || 0} tokens
            </div>
          </div>

          <div className="card">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400">Fees Collected</span>
              <FiCheckCircle className="text-purple-500" size={20} />
            </div>
            <div className="text-3xl font-bold text-white mb-1">
              ₹{(statistics.totalFeesCollected || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">5% platform fee</div>
          </div>
        </div>
      )}

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['', 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((status) => (
          <button
            key={status || 'all'}
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
            {status || 'All'}
          </button>
        ))}
      </div>

      {/* Withdrawals Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 border-b border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Request #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Provider</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Fee</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Net</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {withdrawals.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-12 text-center text-gray-400">
                    No withdrawal requests found
                  </td>
                </tr>
              ) : (
                withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-4">
                      <div className="text-white font-mono text-sm">
                        #{withdrawal.requestNumber}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        {withdrawal.user?.profile?.firstName} {withdrawal.user?.profile?.lastName}
                      </div>
                      <div className="text-xs text-gray-500">{withdrawal.user?.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-white text-sm">
                        ₹{withdrawal.amountInr.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500">{withdrawal.amountTokens} tokens</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-red-400 text-sm">
                        ₹{withdrawal.processingFee.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-green-400 text-sm font-medium">
                        ₹{withdrawal.netAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                        {withdrawal.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-gray-300 text-sm">
                        {formatDate(withdrawal.createdAt)}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex gap-2">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => openModal(withdrawal, 'approve')}
                              className="text-sm text-green-500 hover:text-green-400"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => openModal(withdrawal, 'reject')}
                              className="text-sm text-red-500 hover:text-red-400"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {withdrawal.status === 'APPROVED' && (
                          <button
                            onClick={() => openModal(withdrawal, 'complete')}
                            className="text-sm text-blue-500 hover:text-blue-400"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 p-4 border-t border-gray-800">
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

      {/* Action Modal */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-2xl w-full border border-gray-800">
            <div className="p-6">
              <h2 className="text-xl font-bold text-white mb-4">
                {actionType === 'approve' && 'Approve Withdrawal'}
                {actionType === 'reject' && 'Reject Withdrawal'}
                {actionType === 'complete' && 'Complete Withdrawal'}
              </h2>

              {/* Withdrawal Details */}
              <div className="p-4 bg-gray-800 rounded-lg mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Request #</p>
                    <p className="text-white font-medium">#{selectedWithdrawal.requestNumber}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Provider</p>
                    <p className="text-white">
                      {selectedWithdrawal.user?.profile?.firstName} {selectedWithdrawal.user?.profile?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400">Net Amount</p>
                    <p className="text-green-400 font-bold">₹{selectedWithdrawal.netAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Payment Method</p>
                    <p className="text-white text-xs">
                      {getPaymentMethodDisplay(selectedWithdrawal.paymentMethod)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4">
                {actionType === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Rejection Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={formData.rejectionReason}
                      onChange={(e) => setFormData({ ...formData, rejectionReason: e.target.value })}
                      placeholder="Explain why this withdrawal is being rejected..."
                      rows={3}
                      maxLength={1000}
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
                    />
                  </div>
                )}

                {actionType === 'complete' && (
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Transaction ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.transactionId}
                      onChange={(e) => setFormData({ ...formData, transactionId: e.target.value })}
                      placeholder="PayPal/Bank/UPI transaction ID"
                      className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-600 focus:outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={formData.adminNotes}
                    onChange={(e) => setFormData({ ...formData, adminNotes: e.target.value })}
                    placeholder="Internal notes about this withdrawal..."
                    rows={2}
                    maxLength={1000}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <button
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (actionType === 'approve') {handleApprove()}
                    if (actionType === 'reject') {handleReject()}
                    if (actionType === 'complete') {handleComplete()}
                  }}
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                      actionType === 'reject' ? 'bg-red-600 hover:bg-red-700 text-white' :
                        'bg-blue-600 hover:bg-blue-700 text-white'
                  }`}
                >
                  {submitting ? 'Processing...' : (
                    actionType === 'approve' ? 'Approve' :
                      actionType === 'reject' ? 'Reject' :
                        'Mark Complete'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WithdrawalManagement
