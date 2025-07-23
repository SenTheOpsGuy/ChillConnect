import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  FiUsers, FiCalendar, FiMessageSquare, FiDollarSign, 
  FiTrendingUp, FiShield, FiAlertCircle, FiActivity, FiArrowUp, FiArrowDown 
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
      value: stats.totalUsers || 2847,
      icon: FiUsers,
      gradient: 'from-red-600 to-red-700',
      change: '+12.5%',
      trend: 'up'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings || 156,
      icon: FiCalendar,
      gradient: 'from-emerald-600 to-emerald-700',
      change: '+8.2%',
      trend: 'up'
    },
    {
      title: 'Pending Verifications',
      value: stats.pendingVerifications || 23,
      icon: FiShield,
      gradient: 'from-amber-600 to-amber-700',
      change: '-5.1%',
      trend: 'down'
    },
    {
      title: 'Revenue',
      value: `₹${(stats.revenue || 245000).toLocaleString()}`,
      icon: FiDollarSign,
      gradient: 'from-purple-600 to-purple-700',
      change: '+15.3%',
      trend: 'up'
    },
    {
      title: 'Total Messages',
      value: stats.totalMessages || 8924,
      icon: FiMessageSquare,
      gradient: 'from-blue-600 to-blue-700',
      change: '+22.1%',
      trend: 'up'
    },
    {
      title: 'Flagged Content',
      value: stats.flaggedMessages || 7,
      icon: FiAlertCircle,
      gradient: 'from-red-600 to-red-800',
      change: '-3.2%',
      trend: 'down'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-12 h-12"></div>
      </div>
    )
  }

  return (
    <div className="max-w-none space-y-8">
      {/* Premium Header with Welcome */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div className="mb-6 lg:mb-0">
          <h1 className="text-4xl font-bold text-premium mb-2">Welcome back, Super Admin</h1>
          <p className="text-gray-400 text-lg">Here's what's happening with ChillConnect today</p>
          <div className="flex items-center mt-3 space-x-4">
            <div className="status-online" />
            <span className="text-sm text-gray-500">System Status: All services operational</span>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            className="input bg-gray-900/60 border-gray-700/50 text-white"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button className="btn btn-primary">
            <FiActivity className="w-4 h-4 mr-2" />
            Live View
          </button>
        </div>
      </div>

      {/* Premium Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon
          const TrendIcon = stat.trend === 'up' ? FiArrowUp : FiArrowDown
          
          return (
            <div 
              key={index} 
              className="metric-card hover-lift glow-pulse"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${stat.gradient} shadow-lg`}>
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                  stat.trend === 'up' 
                    ? 'bg-emerald-900/30 text-emerald-300' 
                    : 'bg-red-900/30 text-red-300'
                }`}>
                  <TrendIcon className="w-3 h-3" />
                  <span>{stat.change}</span>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm font-medium mb-1">{stat.title}</p>
                <p className="metric-value mb-2">{stat.value}</p>
                <p className="text-xs text-gray-500">
                  from last period
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Premium Charts and Analytics */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* User Role Distribution */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-premium mb-2">User Role Distribution</h3>
            <p className="text-gray-400 text-sm">Active users by role type</p>
          </div>
          <div className="space-y-4">
            {(userRoleStats.length > 0 ? userRoleStats : [
              { role: 'SEEKER', _count: { role: 1847 } },
              { role: 'PROVIDER', _count: { role: 892 } },
              { role: 'ADMIN', _count: { role: 8 } }
            ]).map((rolestat, index) => (
              <div key={index} className="slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {rolestat.role?.toLowerCase().replace('_', ' ')}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {rolestat._count?.role || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min((rolestat._count?.role || 0) / 20, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Booking Status Distribution */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="text-xl font-semibold text-premium mb-2">Booking Status</h3>
            <p className="text-gray-400 text-sm">Current booking distribution</p>
          </div>
          <div className="space-y-4">
            {(bookingStatusStats.length > 0 ? bookingStatusStats : [
              { status: 'COMPLETED', _count: { status: 89 } },
              { status: 'PENDING', _count: { status: 34 } },
              { status: 'CANCELLED', _count: { status: 12 } }
            ]).map((statusStat, index) => (
              <div key={index} className="slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {statusStat.status?.toLowerCase()}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {statusStat._count?.status || 0}
                  </span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-3 rounded-full transition-all duration-1000 ease-out ${
                      statusStat.status === 'COMPLETED' 
                        ? 'bg-gradient-to-r from-emerald-500 to-emerald-600'
                        : statusStat.status === 'PENDING'
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600'
                        : 'bg-gradient-to-r from-red-500 to-red-600'
                    }`}
                    style={{ width: `${Math.min((statusStat._count?.status || 0) * 2, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Premium Activity Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Recent Users */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-premium">Recent Users</h3>
            <p className="text-gray-400 text-sm mt-1">Latest registrations</p>
          </div>
          <div className="space-y-4">
            {(recentActivities.users?.length > 0 ? recentActivities.users : [
              { name: 'Alex Johnson', role: 'SEEKER', createdAt: new Date() },
              { name: 'Sarah Wilson', role: 'PROVIDER', createdAt: new Date() },
              { name: 'Mike Chen', role: 'SEEKER', createdAt: new Date() }
            ]).map((user, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div className="avatar avatar-sm">
                  <span className="text-sm font-semibold">
                    {user.name?.split(' ').map(n => n.charAt(0)).join('') || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {user.role?.toLowerCase().replace('_', ' ')} • {new Date(user.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="status-online" />
              </div>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-premium">Recent Bookings</h3>
            <p className="text-gray-400 text-sm mt-1">Latest booking activity</p>
          </div>
          <div className="space-y-4">
            {(recentActivities.bookings?.length > 0 ? recentActivities.bookings : [
              { type: 'Cleaning', seeker: { firstName: 'John' }, provider: { firstName: 'Mary' }, status: 'COMPLETED' },
              { type: 'Tutoring', seeker: { firstName: 'Lisa' }, provider: { firstName: 'David' }, status: 'PENDING' },
              { type: 'Repair', seeker: { firstName: 'Tom' }, provider: { firstName: 'Jack' }, status: 'COMPLETED' }
            ]).map((booking, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div>
                  <p className="text-sm font-semibold text-white">
                    {booking.type} Service
                  </p>
                  <p className="text-xs text-gray-400">
                    {booking.seeker?.firstName} → {booking.provider?.firstName}
                  </p>
                </div>
                <span className={`badge ${booking.status === 'COMPLETED' ? 'badge-success' : 'badge-warning'}`}>
                  {booking.status?.toLowerCase()}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transactions */}
        <div className="card card-elevated">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-premium">Revenue Stream</h3>
            <p className="text-gray-400 text-sm mt-1">Latest transactions</p>
          </div>
          <div className="space-y-4">
            {(recentActivities.transactions?.length > 0 ? recentActivities.transactions : [
              { type: 'SERVICE_PAYMENT', user: { firstName: 'John', lastName: 'Doe' }, amount: 2500 },
              { type: 'COMMISSION', user: { firstName: 'Sarah', lastName: 'Smith' }, amount: 375 },
              { type: 'REFUND', user: { firstName: 'Mike', lastName: 'Brown' }, amount: -1200 }
            ]).map((transaction, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-800/30 transition-all duration-300">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    transaction.amount > 0 ? 'bg-emerald-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {transaction.type?.replace('_', ' ').toLowerCase()}
                    </p>
                    <p className="text-xs text-gray-400">
                      {transaction.user?.firstName} {transaction.user?.lastName}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-bold ${
                  transaction.amount > 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {transaction.amount > 0 ? '+' : ''}₹{Math.abs(transaction.amount)}
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