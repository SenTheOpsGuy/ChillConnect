import { useEffect } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Link } from 'react-router-dom'
import { 
  FiUsers, FiCalendar, FiMessageSquare, FiDollarSign, 
  FiSettings, FiHeart, FiTrendingUp, FiClock, 
} from 'react-icons/fi'
import { loadUser } from '../../store/slices/authSlice'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)

  useEffect(() => {
    if (!user) {
      dispatch(loadUser())
    }
  }, [dispatch, user])

  // Mock data for demonstration
  const stats = {
    totalConnections: 12,
    activeBookings: 3,
    messages: 28,
    earnings: 2450,
  }

  const recentActivity = [
    { id: 1, type: 'booking', message: 'New booking request from Sarah', time: '2 hours ago' },
    { id: 2, type: 'message', message: 'Message from Alex', time: '4 hours ago' },
    { id: 3, type: 'earning', message: 'Payment received: ₹500', time: '1 day ago' },
    { id: 4, type: 'booking', message: 'Booking completed with Mike', time: '2 days ago' },
  ]

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking':
        return <FiCalendar className="w-5 h-5 text-blue-500" />
      case 'message':
        return <FiMessageSquare className="w-5 h-5 text-green-500" />
      case 'earning':
        return <FiDollarSign className="w-5 h-5 text-purple-500" />
      default:
        return <FiClock className="w-5 h-5 text-gray-500" />
    }
  }

  const isProvider = user?.role === 'PROVIDER'
  const isSeeker = user?.role === 'SEEKER'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome back, {user?.profile?.firstName || 'User'}!
              </h1>
              <p className="text-gray-600">
                {user?.role === 'PROVIDER' ? 'Manage your services and bookings' : 'Find and book services'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/profile"
                className="btn btn-secondary"
              >
                <FiSettings className="w-4 h-4 mr-2" />
                Profile
              </Link>
              {isProvider && (
                <Link
                  to="/provider/services"
                  className="btn btn-primary"
                >
                  Manage Services
                </Link>
              )}
              {isSeeker && (
                <Link
                  to="/browse"
                  className="btn btn-primary"
                >
                  Browse Services
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FiUsers className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {isProvider ? 'Total Clients' : 'Connections'}
                </p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalConnections}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FiCalendar className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Active Bookings</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeBookings}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <FiMessageSquare className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Messages</p>
                <p className="text-2xl font-bold text-gray-900">{stats.messages}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <FiDollarSign className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">
                  {isProvider ? 'Earnings' : 'Spent'}
                </p>
                <p className="text-2xl font-bold text-gray-900">₹{stats.earnings.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
              </div>
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className="flex-shrink-0 mt-1">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-medium text-gray-900">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                {isProvider && (
                  <>
                    <Link
                      to="/provider/services"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiSettings className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Manage Services</span>
                    </Link>
                    <Link
                      to="/provider/bookings"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiCalendar className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">View Bookings</span>
                    </Link>
                    <Link
                      to="/provider/earnings"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiTrendingUp className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">View Earnings</span>
                    </Link>
                  </>
                )}
                {isSeeker && (
                  <>
                    <Link
                      to="/browse"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiHeart className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Browse Services</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiCalendar className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">My Bookings</span>
                    </Link>
                    <Link
                      to="/favorites"
                      className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                    >
                      <FiHeart className="w-5 h-5 text-gray-600 mr-3" />
                      <span className="text-sm font-medium text-gray-900">Favorites</span>
                    </Link>
                  </>
                )}
                <Link
                  to="/messages"
                  className="flex items-center p-3 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors"
                >
                  <FiMessageSquare className="w-5 h-5 text-gray-600 mr-3" />
                  <span className="text-sm font-medium text-gray-900">Messages</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Verification Status */}
        {!user?.isVerified && (
          <div className="mt-8">
            <div className="card border-l-4 border-yellow-400 bg-yellow-50">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FiClock className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Account Verification Pending
                  </p>
                  <p className="text-sm text-yellow-700">
                    Complete your profile verification to access all features.
                  </p>
                </div>
                <div className="ml-auto">
                  <Link
                    to="/verify"
                    className="btn btn-sm btn-primary"
                  >
                    Verify Now
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard