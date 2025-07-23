import { NavLink } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { RootState } from '../../store/store'

const Sidebar = () => {
  const { user } = useSelector((state: RootState) => state.auth)

  const navigation = [
    { name: 'Dashboard', href: '/app/dashboard', icon: '🏠' },
    { name: 'Search', href: '/app/search', icon: '🔍' },
    { name: 'My Bookings', href: '/app/booking', icon: '📅' },
    { name: 'Messages', href: '/app/chat', icon: '💬' },
    { name: 'Wallet', href: '/app/wallet', icon: '💰' },
    { name: 'Profile', href: '/app/profile', icon: '👤' },
  ]

  const adminNavigation = [
    { name: 'Admin Panel', href: '/app/admin', icon: '⚙️' },
  ]

  const isAdmin = user && ['EMPLOYEE', 'MANAGER', 'ADMIN', 'SUPER_ADMIN'].includes(user.role)

  return (
    <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center flex-shrink-0 px-4">
            <h1 className="text-xl font-bold text-primary-600">
              Booking Platform
            </h1>
          </div>
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => (
              <NavLink
                key={item.name}
                to={item.href}
                className={({ isActive }) =>
                  `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
            
            {isAdmin && (
              <>
                <div className="border-t border-gray-200 my-4"></div>
                {adminNavigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      }`
                    }
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </NavLink>
                ))}
              </>
            )}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.profile?.firstName?.[0] || user?.email[0].toUpperCase()}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.profile?.firstName} {user?.profile?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role.toLowerCase()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar