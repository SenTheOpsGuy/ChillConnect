import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'

const BookingDetails = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useSelector((state) => state.auth)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchBookingDetails()
  }, [id])

  const fetchBookingDetails = async () => {
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        setBooking(data.booking)
      } else {
        console.error('Failed to fetch booking details')
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Error fetching booking details:', error)
      navigate('/dashboard')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action) => {
    setActionLoading(true)
    try {
      const response = await fetch(`/api/bookings/${id}/${action}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      })

      if (response.ok) {
        await fetchBookingDetails() // Refresh booking details
      } else {
        const error = await response.json()
        alert(error.message || `Failed to ${action} booking`)
      }
    } catch (error) {
      console.error(`Error ${action} booking:`, error)
      alert(`Failed to ${action} booking`)
    } finally {
      setActionLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'confirmed': return 'text-green-600 bg-green-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'cancelled': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading booking details...</p>
        </div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Booking Not Found</h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="bg-pink-600 text-white px-4 py-2 rounded-md hover:bg-pink-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  const canConfirm = booking.status === 'pending' && user.role === 'PROVIDER'
  const canCancel = ['pending', 'confirmed'].includes(booking.status)
  const canComplete = booking.status === 'confirmed' && user.role === 'PROVIDER'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-pink-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">Booking #{booking.id}</h1>
                <p className="text-pink-100">
                  {new Date(booking.scheduledDate).toLocaleDateString()} at{' '}
                  {booking.scheduledTime}
                </p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Details */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Booking Details</h2>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service Type</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{booking.serviceType}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Duration</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.duration} minutes</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Location</label>
                    <p className="mt-1 text-sm text-gray-900">{booking.location || 'To be determined'}</p>
                  </div>
                  
                  {booking.specialRequests && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Special Requests</label>
                      <p className="mt-1 text-sm text-gray-900">{booking.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Participants */}
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Participants</h2>
                
                <div className="space-y-4">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Seeker</h3>
                    <p className="text-sm text-gray-600">
                      {booking.seeker?.firstName} {booking.seeker?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{booking.seeker?.email}</p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900">Provider</h3>
                    <p className="text-sm text-gray-600">
                      {booking.provider?.firstName} {booking.provider?.lastName}
                    </p>
                    <p className="text-sm text-gray-500">{booking.provider?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Information */}
            <div className="mt-6 border-t pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Information</h2>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                  <span className="text-lg font-bold text-gray-900">{booking.totalTokens} tokens</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">Payment Status:</span>
                  <span className={`text-sm font-medium ${
                    booking.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'
                  }`}>
                    {booking.paymentStatus || 'Pending'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 border-t pt-6">
              <div className="flex flex-wrap gap-3">
                {canConfirm && (
                  <button
                    onClick={() => handleAction('confirm')}
                    disabled={actionLoading}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Booking'}
                  </button>
                )}
                
                {canComplete && (
                  <button
                    onClick={() => handleAction('complete')}
                    disabled={actionLoading}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Mark Complete'}
                  </button>
                )}
                
                {canCancel && (
                  <button
                    onClick={() => handleAction('cancel')}
                    disabled={actionLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
                  >
                    {actionLoading ? 'Processing...' : 'Cancel Booking'}
                  </button>
                )}
                
                <button
                  onClick={() => navigate('/chat', { state: { bookingId: booking.id } })}
                  className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Open Chat
                </button>
                
                <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingDetails