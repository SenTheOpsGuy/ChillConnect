import React, { useState } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiX, FiCheck } from 'react-icons/fi'
import RatingStars from './RatingStars'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const RatingSubmission = ({ booking, onClose, onSubmitted }) => {
  const { token } = useSelector((state) => state.auth)
  const [rating, setRating] = useState(0)
  const [review, setReview] = useState('')
  const [anonymous, setAnonymous] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (rating === 0) {
      toast.error('Please select a star rating')
      return
    }

    try {
      setSubmitting(true)

      await axios.post(
        `${API_URL}/api/ratings`,
        {
          bookingId: booking.id,
          rating,
          review: review.trim() || undefined,
          anonymous,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Rating submitted successfully!')

      if (onSubmitted) {
        onSubmitted()
      }

      if (onClose) {
        onClose()
      }
    } catch (error) {
      console.error('Error submitting rating:', error)
      toast.error(error.response?.data?.error || 'Failed to submit rating')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl max-w-md w-full border border-gray-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">Rate Your Experience</h2>
            <p className="text-gray-400 text-sm">
              How was your booking with {booking.provider?.profile?.firstName}?
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <FiX className="text-gray-400" size={24} />
            </button>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Star Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              Your Rating <span className="text-red-500">*</span>
            </label>
            <div className="flex justify-center">
              <RatingStars
                rating={rating}
                size="xl"
                interactive={true}
                onChange={setRating}
              />
            </div>
          </div>

          {/* Review Text */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Review (Optional)
            </label>
            <textarea
              value={review}
              onChange={(e) => setReview(e.target.value)}
              placeholder="Share your experience (max 500 characters)"
              rows={4}
              maxLength={500}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">
                Be respectful and constructive in your feedback
              </p>
              <span className="text-xs text-gray-500">
                {review.length}/500
              </span>
            </div>
          </div>

          {/* Anonymous Option */}
          <div className="flex items-center gap-3 p-4 bg-gray-800 rounded-lg">
            <input
              type="checkbox"
              id="anonymous"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              className="w-5 h-5 bg-gray-700 border-gray-600 rounded focus:ring-red-600 focus:ring-2"
            />
            <label htmlFor="anonymous" className="text-sm text-gray-300 cursor-pointer flex-1">
              <span className="font-medium">Submit anonymously</span>
              <p className="text-xs text-gray-500 mt-1">
                Your name won&apos;t be shown with this rating
              </p>
            </label>
          </div>

          {/* Booking Details */}
          <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
            <p className="text-xs text-gray-400 mb-2">BOOKING DETAILS</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-300">Date:</span>
              <span className="text-white">
                {new Date(booking.scheduledAt).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-300">Type:</span>
              <span className="text-white capitalize">{booking.serviceType}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-300">Amount:</span>
              <span className="text-white">{booking.tokenAmount} tokens</span>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={submitting || rating === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                <>
                  <div className="spinner w-4 h-4"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <FiCheck />
                  Submit Rating
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default RatingSubmission
