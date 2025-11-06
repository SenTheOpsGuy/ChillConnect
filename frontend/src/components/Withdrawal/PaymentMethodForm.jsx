import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiX, FiSave } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const PaymentMethodForm = ({ onClose, onSuccess }) => {
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    type: '',
    nickname: '',
    // PayPal
    paypalEmail: '',
    // Bank Transfer
    accountHolderName: '',
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
    // UPI
    upiId: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const paymentTypes = [
    { value: 'PAYPAL', label: 'PayPal', icon: '💳', description: 'Fast international payments' },
    { value: 'BANK_TRANSFER', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer (India)' },
    { value: 'UPI', label: 'UPI', icon: '📱', description: 'Instant UPI payments' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.type) {
      toast.error('Please select a payment method type');
      return;
    }

    // Validate based on type
    if (formData.type === 'PAYPAL' && !formData.paypalEmail) {
      toast.error('PayPal email is required');
      return;
    }

    if (formData.type === 'BANK_TRANSFER') {
      if (!formData.accountHolderName || !formData.accountNumber || !formData.ifscCode || !formData.bankName) {
        toast.error('All bank details are required');
        return;
      }
      if (formData.ifscCode.length !== 11) {
        toast.error('IFSC code must be 11 characters');
        return;
      }
    }

    if (formData.type === 'UPI' && !formData.upiId) {
      toast.error('UPI ID is required');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        type: formData.type,
        nickname: formData.nickname.trim() || null
      };

      if (formData.type === 'PAYPAL') {
        payload.paypalEmail = formData.paypalEmail.trim();
      } else if (formData.type === 'BANK_TRANSFER') {
        payload.accountHolderName = formData.accountHolderName.trim();
        payload.accountNumber = formData.accountNumber.trim();
        payload.ifscCode = formData.ifscCode.trim().toUpperCase();
        payload.bankName = formData.bankName.trim();
        payload.branchName = formData.branchName.trim() || null;
      } else if (formData.type === 'UPI') {
        payload.upiId = formData.upiId.trim();
      }

      await axios.post(
        `${API_URL}/api/withdrawals/payment-methods`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Payment method added successfully');

      if (onSuccess) {
        onSuccess();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      toast.error(error.response?.data?.error || 'Failed to add payment method');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Add Payment Method</h2>
            <p className="text-sm text-gray-400">
              Add a payment method for receiving withdrawals
            </p>
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
          {/* Payment Type Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              Payment Method Type <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {paymentTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.type === type.value
                      ? 'bg-red-600 bg-opacity-20 border-red-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value={type.value}
                    checked={formData.type === type.value}
                    onChange={handleChange}
                    className="mt-1 text-red-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{type.icon}</span>
                      <span className="text-white font-medium">{type.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Nickname */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Nickname (Optional)
            </label>
            <input
              type="text"
              name="nickname"
              value={formData.nickname}
              onChange={handleChange}
              placeholder="e.g., My PayPal, SBI Savings"
              maxLength={100}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
            />
          </div>

          {/* PayPal Fields */}
          {formData.type === 'PAYPAL' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                PayPal Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="paypalEmail"
                value={formData.paypalEmail}
                onChange={handleChange}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
              />
            </div>
          )}

          {/* Bank Transfer Fields */}
          {formData.type === 'BANK_TRANSFER' && (
            <>
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Account Holder Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountHolderName"
                  value={formData.accountHolderName}
                  onChange={handleChange}
                  placeholder="As per bank records"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="accountNumber"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    IFSC Code <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="ifscCode"
                    value={formData.ifscCode}
                    onChange={handleChange}
                    placeholder="e.g., SBIN0001234"
                    maxLength={11}
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g., State Bank of India"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Branch Name (Optional)
                  </label>
                  <input
                    type="text"
                    name="branchName"
                    value={formData.branchName}
                    onChange={handleChange}
                    placeholder="e.g., Connaught Place"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                  />
                </div>
              </div>
            </>
          )}

          {/* UPI Fields */}
          {formData.type === 'UPI' && (
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                UPI ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="upiId"
                value={formData.upiId}
                onChange={handleChange}
                placeholder="username@upi"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter your UPI ID (e.g., 9876543210@paytm or username@okaxis)
              </p>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-2">Important Information</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Ensure all details are accurate to avoid payment delays</li>
              <li>• Payment methods will be verified before first withdrawal</li>
              <li>• You can add multiple payment methods</li>
              <li>• Withdrawals typically take 3-5 business days to process</li>
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
              disabled={submitting}
              className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  Adding...
                </>
              ) : (
                <>
                  <FiSave size={18} />
                  Add Payment Method
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentMethodForm;
