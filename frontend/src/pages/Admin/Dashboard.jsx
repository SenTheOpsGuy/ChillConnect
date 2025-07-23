import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  FiUsers, FiCalendar, FiMessageSquare, FiDollarSign, 
  FiTrendingUp, FiShield, FiAlertCircle, FiActivity 
} from 'react-icons/fi'
import { fetchDashboard } from '../../store/slices/adminSlice'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { dashboard, loading } = useSelector((state) => state.admin)
  const [timeframe, setTimeframe] = useState('24h')

  useEffect(() => {
    dispatch(fetchDashboard(timeframe))
  }, [dispatch, timeframe])

  const stats = dashboard.stats || {}
  const userRoleStats = dashboard.userRoleStats || []
  const bookingStatusStats = dashboard.bookingStatusStats || []
  const recentActivities = dashboard.recentActivities || {}

  const statCards = [
    {
      title: 'Total Users',
      value: stats.totalUsers || 0,
      icon: FiUsers,
      color: 'blue',
      change: '+12%'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings || 0,
      icon: FiCalendar,
      color: 'green',
      change: '+8%'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications || 0,
      icon: FiShield,
      color: 'yellow',
      change: '-5%'
    },
    {
      title: 'Revenue',
      value: `₹${(stats.revenue || 0).toLocaleString()}`,
      icon: FiDollarSign,
      color: 'purple',
      change: '+15%'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages || 0,
      icon: FiMessageSquare,
      color: 'indigo',
      change: '+22%'
    },
    {
      title: 'Flagged Messages',
      value: stats.flaggedMessages || 0,
      icon: FiAlertCircle,
      color: 'red',
      change: '-3%'
    }
  ]

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-500 text-blue-600 bg-blue-100',
      green: 'bg-green-500 text-green-600 bg-green-100',
      yellow: 'bg-yellow-500 text-yellow-600 bg-yellow-100',
      purple: 'bg-purple-500 text-purple-600 bg-purple-100',
      indigo: 'bg-indigo-500 text-indigo-600 bg-indigo-100',
      red: 'bg-red-500 text-red-600 bg-red-100'
    }
    return colors[color] || colors.blue
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
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Platform overview and key metrics</p>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const colorClasses = getColorClasses(stat.color).split(' ')
          
          return (
            <div key={index} className="card">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${colorClasses[2]} mr-4`}>
                  <Icon className={`w-6 h-6 ${colorClasses[1]}`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm ${stat.change.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change} from last period
                  </p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Charts and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Role Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">User Role Distribution</h3>
          </div>
          <div className="space-y-3">
            {userRoleStats.map((rolestat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {rolestat.role?.toLowerCase()}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-500 h-2 rounded-full" 
                      style={{ width: `${(rolestat._count?.role || 0) * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {rolestat._count?.role || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Booking Status</h3>
          </div>
          <div className="space-y-3">
            {bookingStatusStats.map((statusStat, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-gray-600 capitalize">
                  {statusStat.status?.toLowerCase()}
                </span>
                <div className="flex items-center space-x-2">
                  <div className="w-20 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full" 
                      style={{ width: `${(statusStat._count?.status || 0) * 10}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {statusStat._count?.status || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Users</h3>
          </div>
          <div className="space-y-3">
            {(recentActivities.users || []).map((user, index) => (
              <div key={index} className="flex items-center space-x-3">
                <div className="avatar avatar-sm">
                  <span className="text-xs">
                    {user.name?.split(' ').map(n => n.charAt(0)).join('') || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role?.toLowerCase()} • {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Bookings</h3>
          </div>
          <div className="space-y-3">
            {(recentActivities.bookings || []).map((booking, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {booking.type} Booking
                  </p>
                  <p className="text-xs text-gray-500">
                    {booking.seeker?.firstName} → {booking.provider?.firstName}
                  </p>
                </div>
                <span className={`badge badge-${booking.status === 'COMPLETED' ? 'success' : 'warning'}`}>
                  {booking.status?.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Transactions</h3>
          </div>
          <div className="space-y-3">
            {(recentActivities.transactions || []).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {transaction.type?.replace('_', ' ').toLowerCase()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {transaction.user?.firstName} {transaction.user?.lastName}
                  </p>
                </div>
                <span className={`text-sm font-medium ${transaction.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard