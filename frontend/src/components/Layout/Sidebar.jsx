import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, FiSearch, FiMessageSquare, FiCalendar, FiCreditCard, 
  FiUser, FiSettings, FiUsers, FiShield, FiBarChart, FiX, FiStar 
} from 'react-icons/fi'

const Sidebar = ({ sidebarOpen, setSidebarOpen, user }) => {
  const location = useLocation()

  const getNavigationItems = () => {
    const commonItems = [
      { name: 'Dashboard', href: '/dashboard', icon: FiHome },
      { name: 'Messages', href: '/messages', icon: FiMessageSquare },
      { name: 'Wallet', href: '/wallet', icon: FiCreditCard },
      { name: 'Profile', href: '/profile', icon: FiUser },
      { name: 'Settings', href: '/settings', icon: FiSettings },
    ]

    const seekerItems = [
      { name: 'Search Services', href: '/search', icon: FiSearch },
      { name: 'My Bookings', href: '/bookings', icon: FiCalendar },
    ]

    const providerItems = [
      { name: 'My Services', href: '/services', icon: FiStar },
      { name: 'Earnings', href: '/earnings', icon: FiBarChart },
    ]

    const adminItems = [
      { name: 'Admin Dashboard', href: '/admin/dashboard', icon: FiBarChart },
      { name: 'User Management', href: '/admin/users', icon: FiUsers },
      { name: 'Verification Queue', href: '/admin/verification-queue', icon: FiShield },
      { name: 'Booking Monitoring', href: '/admin/booking-monitoring', icon: FiCalendar },
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
    <>
      {/* Premium Dark Sidebar */}
      <div className={`
        fixed top-16 left-0 z-40 w-72 h-full sidebar
        transform transition-all duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:z-auto lg:top-0
        mobile-sidebar ${sidebarOpen ? '' : 'closed'}
      `}>
        {/* Header - Premium branding */}
        <div className="flex items-center justify-between px-6 py-8 border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-2xl flex items-center justify-center shadow-lg shadow-red-900/30">
              <span className="text-white font-bold text-lg">C</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-premium">ChillConnect</h2>
              <p className="text-xs text-gray-400 mt-0.5">Premium Services</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-300 text-gray-400 hover:text-white"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation - Premium styling */}
        <nav className="px-4 py-6 flex-1 overflow-y-auto scrollbar-hide">
          <div className="space-y-2">
            {navigationItems.map((item, index) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <div key={item.name} className="slide-in" style={{ animationDelay: `${index * 0.1}s` }}>
                  <Link
                    to={item.href}
                    className={`sidebar-item ${active ? 'active' : ''}`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="w-5 h-5 mr-3 flex-shrink-0" />
                    <span className="truncate font-medium">{item.name}</span>
                    {active && (
                      <div className="ml-auto w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    )}
                  </Link>
                </div>
              )
            })}
          </div>
        </nav>

        {/* User profile - Premium card at bottom */}
        <div className="p-4 border-t border-gray-800/50">
          <div className="card p-4 hover-lift">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 relative">
                {user?.profile?.profilePhoto ? (
                  <img
                    src={user.profile.profilePhoto}
                    alt={`${user.profile.firstName} ${user.profile.lastName}`}
                    className="w-12 h-12 rounded-2xl object-cover border-2 border-gray-700/50"
                  />
                ) : (
                  <div className="avatar avatar-md">
                    <span className="text-white font-semibold">
                      {user?.profile?.firstName?.charAt(0) || 'U'}
                      {user?.profile?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 status-online" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-gray-400 capitalize truncate">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
                <div className="flex items-center mt-1">
                  <div className="flex space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <FiStar key={i} className="w-3 h-3 text-amber-400 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-xs text-gray-500">Pro</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar