import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import {
  FiDollarSign,
  FiPlus,
  FiClock,
  FiCheckCircle,
  FiXCircle,
  FiAlertTriangle,
} from 'react-icons/fi'
import WithdrawalRequestForm from './WithdrawalRequestForm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const MyWithdrawals = () => {
  const { token } = useSelector((state) => state.auth)
  const [withdrawals, setWithdrawals] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [showRequestForm, setShowRequestForm] = useState(false)

  useEffect(() => {
    fetchWithdrawals()
  }, [page, statusFilter])

  const fetchWithdrawals = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 10 }
      if (statusFilter !== 'ALL') {
        params.status = statusFilter
      }

      const response = await axios.get(`${API_URL}/api/withdrawals/my-requests`, {
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

  const handleCancel = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal? Tokens will be refunded.')) {
      return
    }

    try {
      await axios.put(
        `${API_URL}/api/withdrawals/${withdrawalId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Withdrawal cancelled and tokens refunded')
      fetchWithdrawals()
    } catch (error) {
      console.error('Error cancelling withdrawal:', error)
      toast.error(error.response?.data?.error || 'Failed to cancel withdrawal')
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <FiClock className="text-yellow-500" />
      case 'APPROVED':
        return <FiCheckCircle className="text-blue-500" />
      case 'PROCESSING':
        return <FiClock className="text-blue-500" />
      case 'COMPLETED':
        return <FiCheckCircle className="text-green-500" />
      case 'REJECTED':
        return <FiXCircle className="text-red-500" />
      case 'CANCELLED':
        return <FiXCircle className="text-gray-500" />
      default:
        return <FiAlertTriangle className="text-gray-500" />
    }
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
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const getPaymentMethodDisplay = (method) => {
    if (!method) {return 'N/A'}
    if (method.nickname) {return method.nickname}
    if (method.type === 'PAYPAL') {return method.paypalEmail}
    if (method.type === 'BANK_TRANSFER') {return `${method.bankName} ****${method.accountNumber?.slice(-4)}`}
    if (method.type === 'UPI') {return method.upiId}
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
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">My Withdrawals</h2>
            <p className="text-gray-400">
              View and manage your withdrawal requests
            </p>
          </div>
          <button
            onClick={() => setShowRequestForm(true)}
            className="btn-primary flex items-center gap-2"
          >
            <FiPlus /> Request Withdrawal
          </button>
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['ALL', 'PENDING', 'APPROVED', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'].map((status) => (
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
              {status === 'ALL' ? 'All' : status}
            </button>
          ))}
        </div>

        {/* Withdrawals List */}
        {withdrawals.length === 0 ? (
          <div className="card text-center py-12">
            <FiDollarSign className="mx-auto text-gray-600 mb-4" size={48} />
            <p className="text-gray-400 text-lg">No withdrawals found</p>
            <p className="text-gray-500 text-sm mt-2 mb-4">
              {statusFilter !== 'ALL'
                ? `No withdrawals with status: ${statusFilter}`
                : 'You have not requested any withdrawals yet'}
            </p>
            <button
              onClick={() => setShowRequestForm(true)}
              className="btn-primary inline-flex items-center gap-2"
            >
              <FiPlus /> Request Your First Withdrawal
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="card">
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className={`p-3 rounded-lg border ${getStatusColor(withdrawal.status)}`}>
                    {getStatusIcon(withdrawal.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="text-white font-semibold">
                            ₹{withdrawal.netAmount.toLocaleString()}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium border ${getStatusColor(withdrawal.status)}`}>
                            {withdrawal.status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-400">
                          Request #{withdrawal.requestNumber} • {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Breakdown */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-800 rounded-lg mb-3">
                      <div>
                        <p className="text-xs text-gray-500">Tokens</p>
                        <p className="text-white font-medium">{withdrawal.amountTokens}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Gross Amount</p>
                        <p className="text-white">₹{withdrawal.amountInr.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Fee</p>
                        <p className="text-red-400">-₹{withdrawal.processingFee.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Payment Method</p>
                        <p className="text-white text-xs truncate">
                          {getPaymentMethodDisplay(withdrawal.paymentMethod)}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Reason */}
                    {withdrawal.status === 'REJECTED' && withdrawal.rejectionReason && (
                      <div className="p-3 bg-red-600 bg-opacity-10 border border-red-600 rounded-lg mb-3">
                        <p className="text-xs text-red-400 font-medium mb-1">Rejection Reason</p>
                        <p className="text-sm text-gray-300">{withdrawal.rejectionReason}</p>
                      </div>
                    )}

                    {/* Transaction ID */}
                    {withdrawal.status === 'COMPLETED' && withdrawal.transactionId && (
                      <div className="p-3 bg-green-600 bg-opacity-10 border border-green-600 rounded-lg mb-3">
                        <p className="text-xs text-green-400 font-medium mb-1">Transaction ID</p>
                        <p className="text-sm text-gray-300 font-mono">{withdrawal.transactionId}</p>
                      </div>
                    )}

                    {/* Admin Notes */}
                    {withdrawal.adminNotes && (
                      <div className="p-3 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg mb-3">
                        <p className="text-xs text-blue-400 font-medium mb-1">Admin Notes</p>
                        <p className="text-sm text-gray-300">{withdrawal.adminNotes}</p>
                      </div>
                    )}

                    {/* Provider Notes */}
                    {withdrawal.providerNotes && (
                      <p className="text-xs text-gray-500 mb-3">
                        Your notes: {withdrawal.providerNotes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {withdrawal.status === 'PENDING' && (
                        <button
                          onClick={() => handleCancel(withdrawal.id)}
                          className="text-sm text-red-500 hover:text-red-400 font-medium"
                        >
                          Cancel Request
                        </button>
                      )}

                      {withdrawal.approvedByUser && (
                        <span className="text-xs text-gray-500">
                          Reviewed by: {withdrawal.approvedByUser.profile?.firstName} {withdrawal.approvedByUser.profile?.lastName}
                        </span>
                      )}

                      {withdrawal.processedAt && (
                        <span className="text-xs text-gray-500">
                          Processed: {formatDate(withdrawal.processedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
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

      {/* Request Form Modal */}
      {showRequestForm && (
        <WithdrawalRequestForm
          onClose={() => setShowRequestForm(false)}
          onSuccess={() => {
            setShowRequestForm(false)
            fetchWithdrawals()
          }}
        />
      )}
    </>
  )
}

export default MyWithdrawals
