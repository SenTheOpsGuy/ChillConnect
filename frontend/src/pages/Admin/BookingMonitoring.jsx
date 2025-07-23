import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  FiCalendar, FiMapPin, FiClock, FiDollarSign, FiUser, 
  FiMessageSquare, FiEye, FiAlertTriangle, FiCheck, FiX,
  FiFilter, FiSearch, FiPhone, FiMail
} from 'react-icons/fi'
import { fetchBookings, updateBookingStatus } from '../../store/slices/adminSlice'

const BookingMonitoring = () => {
  const dispatch = useDispatch()
  const { bookings, loading } = useSelector((state) => state.admin)
  const { user: currentUser } = useSelector((state) => state.auth)

  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: '',
    dateRange: '7d',
    page: 1,
    limit: 20
  })
  const [selectedBooking, setSelectedBooking] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')

  useEffect(() => {
    dispatch(fetchBookings(filters))
  }, [dispatch, filters])

  const handleStatusUpdate = async (bookingId, status, note) => {
    try {
      await dispatch(updateBookingStatus({ bookingId, status, note })).unwrap()
      setShowStatusModal(false)
      setSelectedBooking(null)
      setNewStatus('')
      setStatusNote('')
    } catch (error) {
      console.error('Failed to update booking status:', error)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'CONFIRMED': 'bg-blue-100 text-blue-800 border-blue-200',
      'IN_PROGRESS': 'bg-purple-100 text-purple-800 border-purple-200',
      'COMPLETED': 'bg-green-100 text-green-800 border-green-200',
      'CANCELLED': 'bg-red-100 text-red-800 border-red-200',
      'DISPUTED': 'bg-orange-100 text-orange-800 border-orange-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getTypeColor = (type) => {
    const colors = {
      'INCALL': 'bg-blue-50 text-blue-700',
      'OUTCALL': 'bg-green-50 text-green-700'
    }
    return colors[type] || 'bg-gray-50 text-gray-700'
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const calculateDuration = (startTime, endTime) => {
    const start = new Date(startTime)
    const end = new Date(endTime)
    const diffMs = end - start
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    return `${diffHours}h ${diffMinutes}m`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Booking Monitoring</h1>
          <p className="text-gray-600">Monitor and manage all platform bookings</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-3">
              <FiClock className="w-5 h-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'PENDING').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-3">
              <FiCheck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Confirmed</p>
              <p className="text-xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'CONFIRMED').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-3">
              <FiCalendar className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'IN_PROGRESS').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg mr-3">
              <FiAlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Disputed</p>
              <p className="text-xl font-bold text-gray-900">
                {bookings.filter(b => b.status === 'DISPUTED').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="DISPUTED">Disputed</option>
          </select>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Types</option>
            <option value="INCALL">Incall</option>
            <option value="OUTCALL">Outcall</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      <div className="card">
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div 
              key={booking.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex items-center space-x-2">
                      <FiUser className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {booking.seeker?.profile?.firstName} {booking.seeker?.profile?.lastName}
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-sm font-medium text-gray-900">
                        {booking.provider?.profile?.firstName} {booking.provider?.profile?.lastName}
                      </span>
                    </div>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getTypeColor(booking.type)}`}>
                      {booking.type}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-2">
                      <FiCalendar className="w-4 h-4" />
                      <span>{new Date(booking.startTime).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiClock className="w-4 h-4" />
                      <span>{calculateDuration(booking.startTime, booking.endTime)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiDollarSign className="w-4 h-4" />
                      <span>{formatCurrency(booking.totalAmount)}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <FiMapPin className="w-4 h-4" />
                      <span className="truncate">{booking.location || 'Location not specified'}</span>
                    </div>
                  </div>

                  {booking.notes && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <p className="text-sm text-gray-600">
                        <strong>Notes:</strong> {booking.notes}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(booking.status)}`}>
                    {booking.status}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedBooking(booking)
                      setShowDetailsModal(true)
                    }}
                    className="btn btn-secondary btn-sm"
                  >
                    <FiEye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  {['ADMIN', 'MANAGER'].includes(currentUser?.role) && (
                    <button
                      onClick={() => {
                        setSelectedBooking(booking)
                        setShowStatusModal(true)
                      }}
                      className="btn btn-primary btn-sm"
                    >
                      Update Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {bookings.length === 0 && (
            <div className="text-center py-8">
              <FiCalendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No bookings found</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">
                Booking Details
              </h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Participants */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Participants</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Seeker</p>
                    <p className="text-sm text-gray-900">
                      {selectedBooking.seeker?.profile?.firstName} {selectedBooking.seeker?.profile?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedBooking.seeker?.email}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.seeker?.profile?.phone}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 mb-2">Provider</p>
                    <p className="text-sm text-gray-900">
                      {selectedBooking.provider?.profile?.firstName} {selectedBooking.provider?.profile?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">{selectedBooking.provider?.email}</p>
                    <p className="text-sm text-gray-600">{selectedBooking.provider?.profile?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Booking Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Booking Information</h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Type:</span>
                    <span className="text-sm font-medium text-gray-900">{selectedBooking.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Start Time:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedBooking.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">End Time:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {new Date(selectedBooking.endTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Duration:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {calculateDuration(selectedBooking.startTime, selectedBooking.endTime)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Location:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {selectedBooking.location || 'Not specified'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Total Amount:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {formatCurrency(selectedBooking.totalAmount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedBooking.status)}`}>
                      {selectedBooking.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Special Notes</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{selectedBooking.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Status Update Modal */}
      {showStatusModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update Booking Status
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Select status</option>
                  <option value="PENDING">Pending</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="DISPUTED">Disputed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Note (Optional)
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note about this status change..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowStatusModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStatusUpdate(selectedBooking.id, newStatus, statusNote)}
                disabled={!newStatus}
                className="btn btn-primary"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BookingMonitoring