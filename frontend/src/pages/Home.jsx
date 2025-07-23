import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { FiSearch, FiCalendar, FiMessageSquare, FiDollarSign } from 'react-icons/fi'

const Home = () => {
  const { user } = useSelector((state) => state.auth)

  const getQuickActions = () => {
    if (user?.role === 'SEEKER') {
      return [
        { name: 'Search Providers', href: '/search', icon: FiSearch, color: 'bg-blue-500' },
        { name: 'My Bookings', href: '/bookings', icon: FiCalendar, color: 'bg-green-500' },
        { name: 'Messages', href: '/messages', icon: FiMessageSquare, color: 'bg-purple-500' },
        { name: 'Wallet', href: '/wallet', icon: FiDollarSign, color: 'bg-yellow-500' },
      ]
    } else if (user?.role === 'PROVIDER') {
      return [
        { name: 'My Services', href: '/services', icon: FiCalendar, color: 'bg-blue-500' },
        { name: 'Messages', href: '/messages', icon: FiMessageSquare, color: 'bg-purple-500' },
        { name: 'Earnings', href: '/earnings', icon: FiDollarSign, color: 'bg-green-500' },
      ]
    } else {
      return [
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: FiCalendar, color: 'bg-blue-500' },
        { name: 'User Management', href: '/admin/users', icon: FiCalendar, color: 'bg-purple-500' },
      ]
    }
  }

  const quickActions = getQuickActions()

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.profile?.firstName}!
        </h1>
        <p className="text-gray-600">
          {user?.role === 'SEEKER' && 'Find and book services with ease'}
          {user?.role === 'PROVIDER' && 'Manage your services and bookings'}
          {['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && 'Monitor and manage the platform'}
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.name}
              to={action.href}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${action.color} text-white mr-4`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">{action.name}</h3>
                  <p className="text-sm text-gray-500">Quick access</p>
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Stats or Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <FiCalendar className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New booking request</p>
                  <p className="text-xs text-gray-500">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <FiMessageSquare className="w-4 h-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New message received</p>
                  <p className="text-xs text-gray-500">4 hours ago</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FiDollarSign className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Token purchase successful</p>
                  <p className="text-xs text-gray-500">Yesterday</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Account Status</h3>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Email Verified</span>
              <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Phone Verified</span>
              <span className={`badge ${user?.isPhoneVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isPhoneVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Age Verified</span>
              <span className={`badge ${user?.isAgeVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isAgeVerified ? 'Verified' : 'Pending'}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Account Status</span>
              <span className={`badge ${user?.isVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isVerified ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home