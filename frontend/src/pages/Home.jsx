import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'

const Home = () => {
  const { user } = useSelector((state) => state.auth)

  const getQuickActions = () => {
    if (user?.role === 'SEEKER') {
      return [
        { name: 'Search Providers', href: '/search', icon: '🔍' },
        { name: 'My Bookings', href: '/bookings', icon: '📅' },
        { name: 'Messages', href: '/messages', icon: '💬' },
        { name: 'Wallet', href: '/wallet', icon: '💰' },
      ]
    } else if (user?.role === 'PROVIDER') {
      return [
        { name: 'My Services', href: '/services', icon: '⭐' },
        { name: 'Messages', href: '/messages', icon: '💬' },
        { name: 'Earnings', href: '/earnings', icon: '💰' },
        { name: 'Profile', href: '/profile', icon: '👤' },
      ]
    } else {
      return [
        { name: 'Admin Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'User Management', href: '/admin/users', icon: '👥' },
        { name: 'Verification Queue', href: '/admin/verification-queue', icon: '✅' },
        { name: 'Booking Monitoring', href: '/admin/booking-monitoring', icon: '📅' },
      ]
    }
  }

  const quickActions = getQuickActions()

  const recentActivities = [
    {
      title: 'New booking request from Sarah',
      time: '2 hours ago',
      icon: '📅',
      type: 'booking'
    },
    {
      title: 'Message from Alex about cleaning service',
      time: '4 hours ago',
      icon: '💬',
      type: 'message'
    },
    {
      title: 'Payment of ₹500 received',
      time: '1 day ago',
      icon: '💰',
      type: 'payment'
    },
    {
      title: 'Profile verification completed',
      time: '2 days ago',
      icon: '✅',
      type: 'verification'
    }
  ]

  return (
    <div className="dashboard-content">
      {/* Premium Hero Section */}
      <div className="welcome-section">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-12">
          <div>
            <h1 className="welcome-title mb-4">
              Welcome to ChillConnect
            </h1>
            <p className="welcome-subtitle text-xl mb-6">
              {user?.role === 'SEEKER' && 'Discover premium services and connect with verified providers'}
              {user?.role === 'PROVIDER' && 'Manage your services and grow your business'}
              {['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role) && 'Monitor and manage the platform with powerful tools'}
            </p>
            <div className="flex items-center space-x-4">
              <div className="status-online" />
              <span className="text-gray-400">System Status: All services operational</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <div className="relative">
              <div className="w-32 h-32 bg-gradient-to-br from-red-600/20 to-red-800/20 rounded-full blur-xl absolute -inset-4"></div>
              <div className="w-24 h-24 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center relative">
                <span className="text-white text-4xl font-bold">C</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Premium Quick Actions Grid */}
      <div className="mb-12">
        <h2 className="section-title mb-8">
          <span>⚡</span>
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action, index) => (
            <Link
              key={action.name}
              to={action.href}
              className="action-item hover-lift"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="action-icon text-2xl">
                {action.icon}
              </div>
              <div className="action-text text-lg">
                {action.name}
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Premium Content Grid */}
      <div className="content-grid">
        {/* Recent Activity Section */}
        <div className="activity-section">
          <h2 className="section-title">
            <span>🔥</span>
            Recent Activity
          </h2>
          
          <div className="space-y-6">
            {recentActivities.map((activity, index) => (
              <div key={index} className="activity-item">
                <div className={`activity-icon ${activity.type}`}>
                  {activity.icon}
                </div>
                <div className="activity-content">
                  <div className="activity-title">{activity.title}</div>
                  <div className="activity-time">{activity.time}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <Link 
              to="/activity" 
              className="btn-secondary w-full flex items-center justify-center"
            >
              View All Activity
            </Link>
          </div>
        </div>

        {/* Premium Account Status */}
        <div className="actions-section">
          <h2 className="section-title">
            <span>👤</span>
            Account Status
          </h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <div className="action-icon">📧</div>
                <span className="text-white">Email Verified</span>
              </div>
              <span className={`badge ${user?.isEmailVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <div className="action-icon">📱</div>
                <span className="text-white">Phone Verified</span>
              </div>
              <span className={`badge ${user?.isPhoneVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isPhoneVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <div className="action-icon">🔞</div>
                <span className="text-white">Age Verified</span>
              </div>
              <span className={`badge ${user?.isAgeVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isAgeVerified ? 'Verified' : 'Pending'}
              </span>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-gray-800/30">
              <div className="flex items-center space-x-3">
                <div className="action-icon">🛡️</div>
                <span className="text-white">Account Status</span>
              </div>
              <span className={`badge ${user?.isVerified ? 'badge-success' : 'badge-warning'}`}>
                {user?.isVerified ? 'Active' : 'Pending'}
              </span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-800/50">
            <Link 
              to="/profile" 
              className="btn-primary w-full flex items-center justify-center"
            >
              Complete Profile
            </Link>
          </div>
        </div>
      </div>

      {/* Premium Stats Section */}
      <div className="mt-12">
        <h2 className="section-title mb-8">
          <span>📈</span>
          Your Statistics
        </h2>
        <div className="metrics-grid">
          <div className="metric-card fade-in">
            <div className="metric-header">
              <div className="metric-icon connections">👥</div>
            </div>
            <div className="metric-value">
              {user?.role === 'SEEKER' ? '8' : user?.role === 'PROVIDER' ? '24' : '156'}
            </div>
            <div className="metric-label">
              {user?.role === 'SEEKER' ? 'Connections' : user?.role === 'PROVIDER' ? 'Clients' : 'Total Users'}
            </div>
          </div>

          <div className="metric-card fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="metric-header">
              <div className="metric-icon bookings">📅</div>
            </div>
            <div className="metric-value">
              {user?.role === 'SEEKER' ? '3' : user?.role === 'PROVIDER' ? '12' : '89'}
            </div>
            <div className="metric-label">
              {user?.role === 'SEEKER' ? 'Bookings' : user?.role === 'PROVIDER' ? 'Services' : 'Active Bookings'}
            </div>
          </div>

          <div className="metric-card fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="metric-header">
              <div className="metric-icon messages">💬</div>
            </div>
            <div className="metric-value">42</div>
            <div className="metric-label">Messages</div>
          </div>

          <div className="metric-card fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="metric-header">
              <div className="metric-icon earnings">💰</div>
            </div>
            <div className="metric-value">
              ₹{user?.role === 'SEEKER' ? '1,240' : user?.role === 'PROVIDER' ? '8,450' : '2,45,000'}
            </div>
            <div className="metric-label">
              {user?.role === 'SEEKER' ? 'Spent' : user?.role === 'PROVIDER' ? 'Earned' : 'Revenue'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home