import { Link, useLocation } from 'react-router-dom'
import { 
  FiHome, FiSearch, FiMessageSquare, FiCalendar, FiCreditCard, 
  FiUser, FiSettings, FiUsers, FiShield, FiBarChart, FiX 
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
      { name: 'Search', href: '/search', icon: FiSearch },
      { name: 'My Bookings', href: '/bookings', icon: FiCalendar },
    ]

    const providerItems = [
      { name: 'My Services', href: '/services', icon: FiCalendar },
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
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Minimalist Sidebar */}
      <div className={`
        fixed top-0 left-0 z-50 w-72 h-full bg-white/95 backdrop-blur-xl border-r border-gray-100 
        transform transition-all duration-300 ease-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:z-auto
      `}>
        {/* Header - Clean and minimal */}
        <div className="flex items-center justify-between px-6 py-6">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">ChillConnect</h2>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <FiX className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Navigation - Spacious and clear */}
        <nav className="px-4 pb-20">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)
              return (
                <li key={item.name}>
                  <Link
                    to={item.href}
                    className={`
                      group flex items-center px-4 py-3 text-sm font-medium rounded-xl 
                      transition-all duration-200 relative
                      ${active
                        ? 'bg-indigo-50 text-indigo-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }
                    `}
                    onClick={() => setSidebarOpen(false)}
                  >
                    {active && (
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-600 rounded-r-full" />
                    )}
                    <Icon className={`w-5 h-5 mr-4 transition-colors ${
                      active ? 'text-indigo-600' : 'text-gray-400 group-hover:text-gray-600'
                    }`} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* User profile - Clean card at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <div className="card p-4 border border-gray-100">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {user?.profile?.profilePhoto ? (
                  <img
                    src={user.profile.profilePhoto}
                    alt={`${user.profile.firstName} ${user.profile.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-medium text-sm">
                      {user?.profile?.firstName?.charAt(0) || 'U'}
                      {user?.profile?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted capitalize truncate">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar