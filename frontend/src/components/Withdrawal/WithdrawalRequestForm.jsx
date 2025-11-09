import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiX, FiDollarSign, FiAlertTriangle } from 'react-icons/fi'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const WithdrawalRequestForm = ({ onClose, onSuccess }) => {
  const { token } = useSelector((state) => state.auth)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [wallet, setWallet] = useState(null)
  const [formData, setFormData] = useState({
    amountTokens: '',
    paymentMethodId: '',
    providerNotes: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const PLATFORM_FEE_PERCENT = 5
  const MIN_WITHDRAWAL = 100

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [methodsRes, tokensRes] = await Promise.all([
        axios.get(`${API_URL}/api/withdrawals/payment-methods`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_URL}/api/tokens/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])

      setPaymentMethods(methodsRes.data.data.paymentMethods)
      setWallet(tokensRes.data.data.wallet)

      // Set default payment method
      const defaultMethod = methodsRes.data.data.paymentMethods.find(m => m.isDefault)
      if (defaultMethod) {
        setFormData(prev => ({ ...prev, paymentMethodId: defaultMethod.id }))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load payment methods')
    } finally {
      setLoading(false)
    }
  }

  const calculateAmounts = () => {
    const tokens = parseInt(formData.amountTokens, 10) || 0
    const amountInr = tokens * 100
    const fee = Math.floor(amountInr * (PLATFORM_FEE_PERCENT / 100))
    const netAmount = amountInr - fee

    return { tokens, amountInr, fee, netAmount }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const { tokens } = calculateAmounts()

    if (tokens < MIN_WITHDRAWAL) {
      toast.error(`Minimum withdrawal is ${MIN_WITHDRAWAL} tokens`)
      return
    }

    if (!wallet || tokens > wallet.balance) {
      toast.error('Insufficient token balance')
      return
    }

    if (!formData.paymentMethodId) {
      toast.error('Please select a payment method')
      return
    }

    try {
      setSubmitting(true)

      const response = await axios.post(
        `${API_URL}/api/withdrawals/request`,
        {
          amountTokens: tokens,
          paymentMethodId: formData.paymentMethodId,
          providerNotes: formData.providerNotes.trim() || null,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success(response.data.message)

      if (onSuccess) {
        onSuccess()
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error requesting withdrawal:', error)
      toast.error(error.response?.data?.error || 'Failed to request withdrawal')
    } finally {
      setSubmitting(false)
    }
  }

  const { tokens, amountInr, fee, netAmount } = calculateAmounts()
  const isValid = tokens >= MIN_WITHDRAWAL && wallet && tokens <= wallet.balance

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (paymentMethods.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-md w-full p-6 border border-gray-800 text-center">
          <FiAlertTriangle className="mx-auto text-yellow-500 mb-4" size={48} />
          <h2 className="text-xl font-bold text-white mb-2">No Payment Method</h2>
          <p className="text-gray-400 mb-4">
            You need to add a payment method before requesting a withdrawal.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose()
                // Navigate to add payment method
                window.location.href = '/provider/payment-methods'
              }}
              className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
            >
              Add Payment Method
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-600 bg-opacity-20 rounded-lg">
              <FiDollarSign className="text-green-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Request Withdrawal</h2>
              <p className="text-sm text-gray-400">
                Available: {wallet?.balance || 0} tokens (₹{((wallet?.balance || 0) * 100).toLocaleString()})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <FiX className="text-gray-400" size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Withdrawal Amount (Tokens) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              name="amountTokens"
              value={formData.amountTokens}
              onChange={handleChange}
              min={MIN_WITHDRAWAL}
              max={wallet?.balance || 0}
              placeholder={`Minimum ${MIN_WITHDRAWAL} tokens`}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-600 focus:outline-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Minimum withdrawal: {MIN_WITHDRAWAL} tokens (₹{(MIN_WITHDRAWAL * 100).toLocaleString()})
            </p>
          </div>

          {/* Calculation Breakdown */}
          {tokens > 0 && (
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <h3 className="text-sm font-medium text-white mb-3">Withdrawal Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Tokens:</span>
                  <span className="text-white font-medium">{tokens.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Token Value:</span>
                  <span className="text-white">₹{amountInr.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Platform Fee ({PLATFORM_FEE_PERCENT}%):</span>
                  <span className="text-red-400">-₹{fee.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-gray-700 flex justify-between">
                  <span className="text-white font-medium">You&apos;ll Receive:</span>
                  <span className="text-green-400 font-bold text-lg">₹{netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Payment Method <span className="text-red-500">*</span>
            </label>
            <select
              name="paymentMethodId"
              value={formData.paymentMethodId}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:border-green-600 focus:outline-none"
            >
              <option value="">Select payment method</option>
              {paymentMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.nickname || method.type}
                  {method.type === 'PAYPAL' && ` - ${method.paypalEmail}`}
                  {method.type === 'BANK_TRANSFER' && ` - ${method.bankName} ****${method.accountNumber?.slice(-4)}`}
                  {method.type === 'UPI' && ` - ${method.upiId}`}
                  {method.isDefault && ' (Default)'}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Notes (Optional)
            </label>
            <textarea
              name="providerNotes"
              value={formData.providerNotes}
              onChange={handleChange}
              placeholder="Any additional notes for the admin team..."
              rows={3}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-green-600 focus:outline-none resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.providerNotes.length}/500 characters
            </div>
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-500 mb-2">Important Information</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Tokens will be deducted immediately upon submission</li>
              <li>• Withdrawals are processed within 3-5 business days</li>
              <li>• A {PLATFORM_FEE_PERCENT}% platform fee is applied to all withdrawals</li>
              <li>• You can cancel pending requests before approval</li>
              <li>• Ensure your payment details are correct to avoid delays</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !isValid}
              className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  Processing...
                </>
              ) : (
                <>
                  <FiDollarSign size={18} />
                  Request ₹{netAmount.toLocaleString()}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default WithdrawalRequestForm
