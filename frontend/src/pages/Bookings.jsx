import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiCalendar, FiClock, FiUser, FiMapPin } from 'react-icons/fi'

const Bookings = () => {
  const { user } = useSelector((state) => state.auth)

  // Mock booking data for demonstration
  const bookings = [
    {
      id: 1,
      providerId: 'provider-1',
      providerName: 'Sarah Johnson',
      service: 'Personal Training',
      date: '2024-01-15',
      time: '10:00 AM',
      status: 'confirmed',
      location: 'Downtown Gym',
      price: 500
    },
    {
      id: 2,
      providerId: 'provider-2',
      providerName: 'Mike Chen',
      service: 'Photography Session',
      date: '2024-01-20',
      time: '2:00 PM',
      status: 'pending',
      location: 'Central Park',
      price: 1200
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'text-green-600 bg-green-100'
      case 'pending':
        return 'text-yellow-600 bg-yellow-100'
      case 'completed':
        return 'text-blue-600 bg-blue-100'
      case 'cancelled':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-600">
          {user?.role === 'SEEKER' 
            ? 'Manage your service bookings and appointments'
            : 'View and manage your service appointments'
          }
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="text-center py-12">
          <FiCalendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No bookings yet</h3>
          <p className="text-gray-500 mb-6">
            {user?.role === 'SEEKER' 
              ? 'Start by searching for services and booking your first appointment'
              : 'Your booking requests will appear here'
            }
          </p>
          {user?.role === 'SEEKER' && (
            <Link 
              to="/search" 
              className="inline-flex items-center px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Browse Services
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{booking.service}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(booking.status)}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 mb-1">
                    <FiUser className="w-4 h-4" />
                    <span className="text-sm">{booking.providerName}</span>
                  </div>
                  <div className="flex items-center gap-4 text-gray-600 text-sm">
                    <div className="flex items-center gap-2">
                      <FiCalendar className="w-4 h-4" />
                      <span>{new Date(booking.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiClock className="w-4 h-4" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FiMapPin className="w-4 h-4" />
                      <span>{booking.location}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-semibold text-gray-900">₹{booking.price}</div>
                  <Link 
                    to={`/booking-details/${booking.id}`}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Bookings