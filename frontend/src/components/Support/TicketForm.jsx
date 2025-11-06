import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { FiHelpCircle, FiX, FiUpload, FiSend } from 'react-icons/fi';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const TicketForm = ({ onClose, onSuccess, bookingId = null }) => {
  const { token } = useSelector((state) => state.auth);
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    category: '',
    priority: 'MEDIUM',
    attachments: []
  });
  const [attachmentInput, setAttachmentInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const categories = [
    { value: 'ACCOUNT', label: 'Account Issues', icon: '👤', description: 'Login, profile, settings' },
    { value: 'BOOKING', label: 'Booking Issues', icon: '📅', description: 'Booking problems or questions' },
    { value: 'PAYMENT', label: 'Payment Issues', icon: '💳', description: 'Tokens, refunds, transactions' },
    { value: 'TECHNICAL', label: 'Technical Issues', icon: '🔧', description: 'App bugs or errors' },
    { value: 'VERIFICATION', label: 'Verification', icon: '✓', description: 'Identity or age verification' },
    { value: 'SAFETY', label: 'Safety Concerns', icon: '🛡️', description: 'Report safety issues' },
    { value: 'OTHER', label: 'Other', icon: '💬', description: 'Something else' }
  ];

  const priorities = [
    { value: 'LOW', label: 'Low', color: 'text-gray-400' },
    { value: 'MEDIUM', label: 'Medium', color: 'text-blue-400' },
    { value: 'HIGH', label: 'High', color: 'text-yellow-400' },
    { value: 'URGENT', label: 'Urgent', color: 'text-red-400' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleAddAttachment = () => {
    if (!attachmentInput.trim()) {
      toast.error('Please enter a valid URL');
      return;
    }

    try {
      new URL(attachmentInput);
      setFormData({
        ...formData,
        attachments: [...formData.attachments, attachmentInput.trim()]
      });
      setAttachmentInput('');
    } catch (error) {
      toast.error('Please enter a valid URL');
    }
  };

  const handleRemoveAttachment = (index) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category) {
      toast.error('Please select a category');
      return;
    }

    if (!formData.subject.trim()) {
      toast.error('Please enter a subject');
      return;
    }

    if (!formData.description.trim()) {
      toast.error('Please provide a description');
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        ...formData,
        subject: formData.subject.trim(),
        description: formData.description.trim()
      };

      if (bookingId) {
        payload.bookingId = bookingId;
      }

      const response = await axios.post(
        `${API_URL}/api/support/tickets`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(response.data.message || 'Support ticket created successfully');

      if (onSuccess) {
        onSuccess(response.data.data.ticket);
      }

      if (onClose) {
        onClose();
      }
    } catch (error) {
      console.error('Error creating ticket:', error);
      toast.error(error.response?.data?.error || 'Failed to create support ticket');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 to-black rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-800">
        {/* Header */}
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-600 bg-opacity-20 rounded-lg">
              <FiHelpCircle className="text-blue-500" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create Support Ticket</h2>
              <p className="text-sm text-gray-400">
                Our team will respond within 24-48 hours
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
          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">
              What do you need help with? <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {categories.map((category) => (
                <label
                  key={category.value}
                  className={`flex items-start p-4 border rounded-lg cursor-pointer transition-all ${
                    formData.category === category.value
                      ? 'bg-blue-600 bg-opacity-20 border-blue-500'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.value}
                    checked={formData.category === category.value}
                    onChange={handleChange}
                    className="mt-1 text-blue-600"
                  />
                  <div className="ml-3 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-white font-medium">{category.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">{category.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Priority
            </label>
            <div className="flex gap-2">
              {priorities.map((priority) => (
                <button
                  key={priority.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: priority.value })}
                  className={`flex-1 px-4 py-2 rounded-lg border font-medium text-sm transition-all ${
                    formData.priority === priority.value
                      ? 'bg-gray-700 border-gray-600'
                      : 'bg-gray-800 border-gray-700 hover:border-gray-600'
                  } ${priority.color}`}
                >
                  {priority.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Subject <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Brief description of your issue"
              maxLength={200}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.subject.length}/200 characters
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Description <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Please provide as much detail as possible to help us assist you better
            </p>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe your issue in detail..."
              rows={6}
              maxLength={5000}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none resize-none"
            />
            <div className="text-xs text-gray-500 mt-1">
              {formData.description.length}/5000 characters
            </div>
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Attachments (Optional)
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Add links to screenshots or documents (upload to a service like Imgur first)
            </p>
            <div className="flex gap-2 mb-3">
              <input
                type="url"
                value={attachmentInput}
                onChange={(e) => setAttachmentInput(e.target.value)}
                placeholder="https://example.com/screenshot.jpg"
                className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-blue-600 focus:outline-none"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddAttachment();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleAddAttachment}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <FiUpload size={16} /> Add
              </button>
            </div>

            {formData.attachments.length > 0 && (
              <div className="space-y-2">
                {formData.attachments.map((url, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-400 hover:text-blue-300 truncate flex-1"
                    >
                      {url}
                    </a>
                    <button
                      type="button"
                      onClick={() => handleRemoveAttachment(index)}
                      className="ml-3 p-1 hover:bg-gray-700 rounded transition-colors"
                    >
                      <FiX className="text-gray-400" size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="p-4 bg-blue-600 bg-opacity-10 border border-blue-600 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-2">What happens next?</h4>
            <ul className="text-xs text-gray-300 space-y-1">
              <li>• Your ticket will be reviewed by our support team</li>
              <li>• We'll respond within 24-48 hours (usually much faster!)</li>
              <li>• You'll receive email notifications when we reply</li>
              <li>• You can track your ticket status in the Support section</li>
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
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  Creating Ticket...
                </>
              ) : (
                <>
                  <FiSend size={18} />
                  Create Ticket
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TicketForm;
