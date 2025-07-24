import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchDashboard } from '../../store/slices/adminSlice'

const Dashboard = () => {
  const dispatch = useDispatch()
  const { dashboard, loading, user } = useSelector((state) => ({
    dashboard: state.admin?.dashboard || {},
    loading: state.admin?.loading || false,
    user: state.auth?.user || {}
  }))
  
  useEffect(() => {
    dispatch(fetchDashboard())
  }, [dispatch])

  const stats = dashboard.stats || {}
  const userRoleStats = dashboard.userRoleStats || []
  const bookingStatusStats = dashboard.bookingStatusStats || []
  const recentActivities = dashboard.recentActivities || {}

  // Mock data to match the HTML template design
  const metrics = [
    {
      title: 'Connections',
      value: stats.totalUsers || 12,
      icon: '👥',
      iconClass: 'connections'
    },
    {
      title: 'Active Bookings',
      value: stats.activeBookings || 3,
      icon: '📅',
      iconClass: 'bookings'
    },
    {
      title: 'Messages',
      value: stats.totalMessages || 28,
      icon: '💬',
      iconClass: 'messages'
    },
    {
      title: 'Spent',
      value: `₹${(stats.revenue || 2450).toLocaleString()}`,
      icon: '💰',
      iconClass: 'earnings'
    }
  ]

  const activities = [
    {
      title: 'New booking request from Sarah',
      time: '2 hours ago',
      icon: '📅',
      type: 'booking'
    },
    {
      title: 'Message from Alex',
      time: '4 hours ago',
      icon: '💬',
      type: 'message'
    },
    {
      title: 'Payment received: ₹500',
      time: '1 day ago',
      icon: '💰',
      type: 'payment'
    },
    {
      title: 'Booking completed with Mike',
      time: '2 days ago',
      icon: '📅',
      type: 'booking'
    }
  ]

  const quickActions = [
    { icon: '💬', text: 'Messages' },
    { icon: '🔍', text: 'Browse Services' },
    { icon: '📅', text: 'My Bookings' },
    { icon: '❤️', text: 'Favorites' },
    { icon: '💰', text: 'Wallet' }
  ]

  if (loading) {
    return (
      <div className="dashboard-content">
        <div className="flex items-center justify-center h-64">
          <div className="spinner w-12 h-12"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-content">
      <div className="welcome-section">
        <h1 className="welcome-title">
          Welcome back, {user?.profile?.firstName || 'Employee1'}!
        </h1>
        <p className="welcome-subtitle">Find and book services</p>
      </div>

      <div className="metrics-grid">
        {metrics.map((metric, index) => (
          <div 
            key={index} 
            className="metric-card fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="metric-header">
              <div className={`metric-icon ${metric.iconClass}`}>
                {metric.icon}
              </div>
            </div>
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.title}</div>
          </div>
        ))}
      </div>

      <div className="content-grid">
        <div className="activity-section">
          <h2 className="section-title">
            <span>🔥</span>
            Recent Activity
          </h2>
          
          {activities.map((activity, index) => (
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

        <div className="actions-section">
          <h2 className="section-title">
            <span>⚡</span>
            Quick Actions
          </h2>
          
          {quickActions.map((action, index) => (
            <div key={index} className="action-item">
              <div className="action-icon">{action.icon}</div>
              <div className="action-text">{action.text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Dashboard