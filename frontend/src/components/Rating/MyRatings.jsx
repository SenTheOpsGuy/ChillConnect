import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiMessageSquare, FiSend } from 'react-icons/fi'
import RatingStars from './RatingStars'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const MyRatings = ({ type = 'received' }) => {
  const { token, user } = useSelector((state) => state.auth)
  const [ratings, setRatings] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)
  const [respondingTo, setRespondingTo] = useState(null)
  const [response, setResponse] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchRatings()
  }, [type, page])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      const endpoint = type === 'received' ? '/api/ratings/my-received' : '/api/ratings/my-ratings'
      const response = await axios.get(`${API_URL}${endpoint}`, {
        params: { page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` },
      })

      setRatings(response.data.data.ratings)
      if (response.data.data.statistics) {
        setStatistics(response.data.data.statistics)
      }
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching ratings:', error)
      toast.error('Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }

  const handleRespond = async (ratingId) => {
    if (!response.trim()) {
      toast.error('Please enter a response')
      return
    }

    try {
      setSubmitting(true)

      await axios.put(
        `${API_URL}/api/ratings/${ratingId}/response`,
        { response: response.trim() },
        { headers: { Authorization: `Bearer ${token}` } },
      )

      toast.success('Response submitted successfully')
      setRespondingTo(null)
      setResponse('')
      fetchRatings()
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error(error.response?.data?.error || 'Failed to submit response')
    } finally {
      setSubmitting(false)
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

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (ratings.length === 0) {
    return (
      <div className="card text-center py-12">
        <FiMessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
        <p className="text-gray-400 text-lg">
          {type === 'received' ? 'No ratings received yet' : 'No ratings given yet'}
        </p>
        <p className="text-gray-500 text-sm mt-2">
          {type === 'received'
            ? 'Complete bookings to receive ratings from clients'
            : 'Rate providers after completing bookings'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics (for received ratings only) */}
      {type === 'received' && statistics && (
        <div className="card">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {statistics.averageRating.toFixed(1)}
              </div>
              <RatingStars rating={statistics.averageRating} size="md" />
              <p className="text-gray-400 text-sm mt-2">Average Rating</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {statistics.totalRatings}
              </div>
              <p className="text-gray-400 text-sm">Total Ratings</p>
            </div>

            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-2">
                {statistics.breakdown && statistics.breakdown['5'] ? statistics.breakdown['5'] : 0}
              </div>
              <p className="text-gray-400 text-sm">5-Star Ratings</p>
            </div>
          </div>
        </div>
      )}

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => {
          const otherUser = type === 'received' ? rating.seeker : rating.provider
          const isResponding = respondingTo === rating.id

          return (
            <div key={rating.id} className="card">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="avatar avatar-md">
                  {otherUser && !rating.anonymous
                    ? `${otherUser.profile.firstName[0]}${otherUser.profile.lastName[0]}`
                    : '?'}
                </div>

                {/* Content */}
                <div className="flex-1">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-white font-medium">
                        {rating.anonymous || !otherUser
                          ? 'Anonymous User'
                          : `${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatDate(rating.createdAt)}
                      </p>
                    </div>
                    <RatingStars rating={rating.rating} size="sm" />
                  </div>

                  {/* Booking Info */}
                  {rating.booking && (
                    <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                      <span>
                        {new Date(rating.booking.scheduledAt).toLocaleDateString()}
                      </span>
                      <span className="capitalize">{rating.booking.serviceType}</span>
                    </div>
                  )}

                  {/* Review Text */}
                  {rating.review && (
                    <p className="text-gray-300 mb-3 leading-relaxed">
                      {rating.review}
                    </p>
                  )}

                  {/* Response Section (for received ratings) */}
                  {type === 'received' && (
                    <>
                      {rating.response ? (
                        <div className="mt-4 p-4 bg-gray-800 rounded-lg border-l-4 border-green-600">
                          <p className="text-sm text-gray-400 mb-2 font-medium">
                            Your Response
                          </p>
                          <p className="text-gray-300 text-sm leading-relaxed">
                            {rating.response}
                          </p>
                          <p className="text-xs text-gray-500 mt-2">
                            {formatDate(rating.respondedAt)}
                          </p>
                        </div>
                      ) : (
                        <>
                          {!isResponding ? (
                            <button
                              onClick={() => setRespondingTo(rating.id)}
                              className="text-sm text-red-500 hover:text-red-400 flex items-center gap-2"
                            >
                              <FiMessageSquare size={16} />
                              Respond to this rating
                            </button>
                          ) : (
                            <div className="mt-4 space-y-3">
                              <textarea
                                value={response}
                                onChange={(e) => setResponse(e.target.value)}
                                placeholder="Write a professional response (max 500 characters)"
                                rows={4}
                                maxLength={500}
                                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:border-red-600 focus:outline-none resize-none"
                              />
                              <div className="flex items-center justify-between">
                                <span className="text-xs text-gray-500">
                                  {response.length}/500
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      setRespondingTo(null)
                                      setResponse('')
                                    }}
                                    className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleRespond(rating.id)}
                                    disabled={submitting || !response.trim()}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                  >
                                    {submitting ? (
                                      <>
                                        <div className="spinner w-3 h-3"></div>
                                        Sending...
                                      </>
                                    ) : (
                                      <>
                                        <FiSend size={14} />
                                        Send Response
                                      </>
                                    )}
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

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
  )
}

export default MyRatings
