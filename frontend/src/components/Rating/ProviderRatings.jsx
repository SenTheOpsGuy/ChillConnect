import React, { useState, useEffect } from 'react'
import { useSelector } from 'react-redux'
import axios from 'axios'
import { toast } from 'react-hot-toast'
import { FiFilter, FiMessageSquare } from 'react-icons/fi'
import RatingStars from './RatingStars'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const ProviderRatings = ({ providerId }) => {
  const { token } = useSelector((state) => state.auth)
  const [ratings, setRatings] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [filterRating, setFilterRating] = useState(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState(null)

  useEffect(() => {
    fetchRatings()
  }, [providerId, filterRating, page])

  const fetchRatings = async () => {
    try {
      setLoading(true)
      const params = { page, limit: 10 }
      if (filterRating) {
        params.rating = filterRating
      }

      const response = await axios.get(
        `${API_URL}/api/ratings/provider/${providerId}`,
        {
          params,
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      setRatings(response.data.data.ratings)
      setStatistics(response.data.data.statistics)
      setPagination(response.data.data.pagination)
    } catch (error) {
      console.error('Error fetching ratings:', error)
      toast.error('Failed to load ratings')
    } finally {
      setLoading(false)
    }
  }

  const getRatingPercentage = (star) => {
    if (!statistics || !statistics.breakdown) {return 0}
    const breakdown = statistics.breakdown
    const total = statistics.totalRatings || 0
    const count = breakdown[star] || 0
    return total > 0 ? (count / total) * 100 : 0
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {return 'Today'}
    if (diffDays === 1) {return 'Yesterday'}
    if (diffDays < 7) {return `${diffDays} days ago`}
    if (diffDays < 30) {return `${Math.floor(diffDays / 7)} weeks ago`}
    if (diffDays < 365) {return `${Math.floor(diffDays / 30)} months ago`}
    return date.toLocaleDateString()
  }

  if (loading && page === 1) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!statistics || statistics.totalRatings === 0) {
    return (
      <div className="text-center py-12">
        <FiMessageSquare className="mx-auto text-gray-600 mb-4" size={48} />
        <p className="text-gray-400 text-lg">No ratings yet</p>
        <p className="text-gray-500 text-sm mt-2">
          Be the first to rate this provider
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Summary */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Overall Rating */}
          <div className="text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
              <div className="text-6xl font-bold text-white">
                {statistics.averageRating.toFixed(1)}
              </div>
              <div>
                <RatingStars rating={statistics.averageRating} size="lg" />
                <p className="text-gray-400 text-sm mt-2">
                  {statistics.totalRatings} {statistics.totalRatings === 1 ? 'rating' : 'ratings'}
                </p>
              </div>
            </div>
          </div>

          {/* Rating Breakdown */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const percentage = getRatingPercentage(star)
              const count = statistics.breakdown?.[star] || 0

              return (
                <button
                  key={star}
                  onClick={() => setFilterRating(filterRating === star ? null : star)}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    filterRating === star ? 'bg-red-900 bg-opacity-20' : 'hover:bg-gray-800'
                  }`}
                >
                  <span className="text-sm text-gray-300 w-12">{star} star</span>
                  <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-400 w-8 text-right">{count}</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Filter Status */}
        {filterRating && (
          <div className="mt-4 flex items-center justify-between p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <FiFilter className="text-red-500" />
              <span className="text-sm text-gray-300">
                Showing {filterRating}-star ratings
              </span>
            </div>
            <button
              onClick={() => {
                setFilterRating(null)
                setPage(1)
              }}
              className="text-sm text-red-500 hover:text-red-400"
            >
              Clear filter
            </button>
          </div>
        )}
      </div>

      {/* Ratings List */}
      <div className="space-y-4">
        {ratings.map((rating) => (
          <div key={rating.id} className="card">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <div className="avatar avatar-md">
                {rating.seeker
                  ? `${rating.seeker.profile.firstName[0]}${rating.seeker.profile.lastName[0]}`
                  : '?'}
              </div>

              {/* Content */}
              <div className="flex-1">
                {/* Header */}
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-white font-medium">
                      {rating.anonymous
                        ? 'Anonymous User'
                        : `${rating.seeker.profile.firstName} ${rating.seeker.profile.lastName}`}
                    </p>
                    <p className="text-sm text-gray-400">
                      {formatDate(rating.createdAt)}
                    </p>
                  </div>
                  <RatingStars rating={rating.rating} size="sm" />
                </div>

                {/* Review Text */}
                {rating.review && (
                  <p className="text-gray-300 mb-3 leading-relaxed">
                    {rating.review}
                  </p>
                )}

                {/* Provider Response */}
                {rating.response && (
                  <div className="mt-4 p-4 bg-gray-800 rounded-lg border-l-4 border-red-600">
                    <p className="text-sm text-gray-400 mb-2 font-medium">
                      Provider Response
                    </p>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      {rating.response}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      {formatDate(rating.respondedAt)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
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

      {/* Empty State for Filtered Results */}
      {ratings.length === 0 && filterRating && (
        <div className="text-center py-12">
          <p className="text-gray-400">No {filterRating}-star ratings found</p>
          <button
            onClick={() => {
              setFilterRating(null)
              setPage(1)
            }}
            className="mt-4 text-red-500 hover:text-red-400"
          >
            Show all ratings
          </button>
        </div>
      )}
    </div>
  )
}

export default ProviderRatings
