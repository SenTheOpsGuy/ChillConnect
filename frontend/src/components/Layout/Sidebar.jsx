import { Link, useLocation } from 'react-router-dom'

const Sidebar = ({ sidebarOpen, setSidebarOpen, user }) => {
  const location = useLocation()

  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: '📊' },
      { name: 'Messages', href: '/messages', icon: '💬' },
      { name: 'Wallet', href: '/wallet', icon: '💰' },
      { name: 'Profile', href: '/profile', icon: '👤' },
      { name: 'Settings', href: '/settings', icon: '⚙️' },
    ]

    const seekerItems = [
      { name: 'Search Services', href: '/search', icon: '🔍' },
      { name: 'My Bookings', href: '/bookings', icon: '📅' },
    ]

    const providerItems = [
      { name: 'My Services', href: '/services', icon: '⭐' },
      { name: 'Earnings', href: '/earnings', icon: '📊' },
    ]

    const adminItems = [
      { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
      { name: 'User Management', href: '/admin/users', icon: '👥' },
      { name: 'Verification Queue', href: '/admin/verification-queue', icon: '✅' },
      { name: 'Booking Monitoring', href: '/admin/booking-monitoring', icon: '📅' },
    ]

    let items = [...commonItems]

    if (user?.role === 'SEEKER') {
      items = [...seekerItems, ...items]
    } else if (user?.role === 'PROVIDER') {
      items = [...providerItems, ...items]
    } else if (['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user?.role)) {
      items = [...adminItems, ...items]
    }

    return items
  }

  const navigationItems = getNavigationItems()

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/')
  }

  return (
    <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="logo-section">
        <div className="logo">
          <div className="logo-icon">C</div>
          <div className="logo-text">ChillConnect</div>
        </div>
      </div>
      
      <div className="nav-menu">
        {navigationItems.map((item, index) => {
          const active = isActive(item.href)
          return (
            <div key={item.name} className={`nav-item ${active ? 'active' : ''}`}>
              <Link
                to={item.href}
                className="nav-link"
                onClick={() => setSidebarOpen(false)}
              >
                <div className="nav-icon">{item.icon}</div>
                <span>{item.name}</span>
              </Link>
            </div>
          )
        })}
      </div>
      
      <div className="user-profile">
        <div className="profile-info">
          <div className="profile-avatar">
            {user?.profile?.firstName?.charAt(0) || 'EU'}
            {user?.profile?.lastName?.charAt(0) || ''}
          </div>
          <div className="profile-details">
            <h4>{user?.profile?.firstName || 'Employee1'} {user?.profile?.lastName || 'User'}</h4>
            <span>{user?.role?.toLowerCase().replace('_', ' ') || 'Employee'}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Sidebar