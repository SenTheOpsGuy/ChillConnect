import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiAlertTriangle, FiX, FiUpload } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const DisputeForm = ({ booking, onClose, onSuccess }) => {
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    disputeType: '',
    description: '',
    evidence: []
  });
  const [evidenceInput, setEvidenceInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const disputeTypes = [
    { value: 'NO_SHOW', label: 'No Show', description: 'The other party did not show up' },
    { value: 'SERVICE_QUALITY', label: 'Service Quality Issue', description: 'Service did not meet expectations' },
    { value: 'PAYMENT_ISSUE', label: 'Payment Issue', description: 'Problems with payment or tokens' },
    { value: 'BEHAVIOR_ISSUE', label: 'Behavior Issue', description: 'Inappropriate or unprofessional behavior' },
    { value: 'TERMS_VIOLATION', label: 'Terms Violation', description: 'Violation of platform terms' },
    { value: 'OTHER', label: 'Other', description: 'Other issue not listed above' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddEvidence = () => {
    if (!evidenceInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    // Basic URL validation
    try {
      new URL(evidenceInput);
      setFormData({
        ...formData,
        evidence: [...formData.evidence, evidenceInput.trim()]
      });
      setEvidenceInput('');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  };

  const handleRemoveEvidence = (index) => {
    setFormData({
      ...formData,
      evidence: formData.evidence.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.disputeType) {
      toast.error('Please select a dispute type');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    if (formData.description.trim().length < 20) {
      toast.error('Description must be at least 20 characters');
      return;
    }

    try {
      setSubmitting(true);

      await axios.post(
        `${API_URL}/api/disputes`,
        {
          bookingId: booking.id,
          disputeType: formData.disputeType,
          description: formData.description.trim(),
          evidence: formData.evidence
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Dispute filed successfully. Our team will review it shortly.');

      if (onSuccess) {
        onSuccess();
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error filing dispute:', error);
      toast.error(error.response?.data?.error || 'Failed to file dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-red-600 bg-opacity-20 rounded-lg">
              <FiAlertTriangle className="text-red-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">File a Dispute</h2>
              <p className="text-sm text-gray-400">
                Report an issue with booking #{booking.id.slice(0, 8)}
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
          {/* Booking Info */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <h3 className="text-sm font-medium text-gray-400 mb-2">Booking Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Date:</span>
                <span className="text-white ml-2">
                  {new Date(booking.scheduledAt).toLocaleDateString()}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Service:</span>
                <span className="text-white ml-2 capitalize">{booking.serviceType}</span>
              </div>
              <div>
                <span className="text-gray-500">Amount:</span>
                <span className="text-white ml-2">{booking.totalTokens} tokens</span>
              </div>
              <div>
                <span className="text-gray-500">Status:</span>
                <span className="text-white ml-2 capitalize">{booking.status}</span>
              </div>
            </div>
          </div>

          {/* Dispute Type */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              What is the issue? <span className="text-red-500">*</span>
            </label>
            <div className="space-y-2">
              {disputeTypes.map((type) => (
                <label
                  key={type.value}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.disputeType === type.value
                      ? 'bg-red-600 bg-opacity-20 border-red-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="disputeType"
                    value={type.value}
                    checked={formData.disputeType === type.value}
                    onChange={handleChange}
                    className="mt-1 text-red-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="text-white font-medium">{type.label}</div>
                    <div className="text-sm text-gray-400">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Detailed Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Please provide a clear and detailed explanation of the issue (minimum 20 characters)
            </p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe what happened..."
              rows={6}
              maxLength={2000}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{formData.description.length}/2000 characters</span>
              <span>Minimum 20 characters</span>
            </div>
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Evidence (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Add links to screenshots, documents, or other evidence (upload to a service like Imgur first)
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={evidenceInput}
                onChange={(e) => setEvidenceInput(e.target.value)}
                placeholder="https://example.com/evidence.jpg"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddEvidence();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddEvidence}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FiUpload size={16} /> Add
              </button>
            </div>

            {/* Evidence List */}
            {formData.evidence.length > 0 && (
              <div className="space-y-2">
                {formData.evidence.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-red-400 hover:text-red-300 truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidence(index)}
                      className="ml-3 p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <FiX className="text-gray-400" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Important Notice */}
          <div className="p-4 bg-yellow-600 bg-opacity-10 border border-yellow-600 rounded-lg">
            <h4 className="text-sm font-medium text-yellow-500 mb-2">Important Notice</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Filing a dispute will pause this booking until resolved</li>
              <li>• Our support team will review your dispute within 24-48 hours</li>
              <li>• Both parties will be notified and may be asked for additional information</li>
              <li>• False or frivolous disputes may result in account penalties</li>
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
                  Filing Dispute...
                </>
              ) : (
                <>
                  <FiAlertTriangle size={18} />
                  File Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DisputeForm;
