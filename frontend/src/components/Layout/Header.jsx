import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { FiBell, FiMenu, FiSearch, FiUser, FiLogOut, FiStar, FiSettings } from 'react-icons/fi'

const Header = ({ sidebarOpen, setSidebarOpen, user }) => {
  const dispatch = useDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header className="bg-gradient-to-r from-black via-gray-900 to-black backdrop-blur-xl border-b border-gray-800/50 fixed w-full top-0 z-50 lg:ml-72 transition-all duration-300 shadow-2xl">
      <div className="flex items-center justify-between h-16 px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="lg:hidden p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-300 text-gray-400 hover:text-white"
        >
          <FiMenu className="w-5 h-5" />
        </button>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center shadow-lg shadow-red-900/30">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-lg font-bold text-premium">ChillConnect</h1>
        </div>

        {/* Center - Premium search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search services, providers..."
              className="input pl-12 text-sm bg-gray-900/60 border-gray-700/50 focus:border-red-500/50 hover:bg-gray-900/80 transition-all duration-300"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <kbd className="px-2 py-1 text-xs text-gray-500 bg-gray-800/50 rounded border border-gray-700">⌘K</kbd>
            </div>
          </div>
        </div>

        {/* Right side - Premium actions */}
        <div className="flex items-center space-x-3">
          {/* Notifications - Premium design */}
          <button className="p-3 rounded-xl hover:bg-gray-800/50 relative transition-all duration-300 text-gray-400 hover:text-white focus-ring group">
            <FiBell className="w-5 h-5" />
            <div className="notification-dot" />
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold animate-pulse">3</span>
          </button>

          {/* User menu - Premium */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-2 rounded-xl hover:bg-gray-800/50 transition-all duration-300 focus-ring group"
            >
              <div className="relative">
                {user?.profile?.profilePhoto ? (
                  <img
                    src={user.profile.profilePhoto}
                    alt={`${user.profile.firstName} ${user.profile.lastName}`}
                    className="w-10 h-10 rounded-xl object-cover border-2 border-gray-700/50 group-hover:border-red-500/50 transition-all duration-300"
                  />
                ) : (
                  <div className="avatar avatar-sm border-2 border-gray-700/50 group-hover:border-red-500/50 transition-all duration-300">
                    <span className="text-white font-semibold text-sm">
                      {user?.profile?.firstName?.charAt(0) || 'U'}
                      {user?.profile?.lastName?.charAt(0) || ''}
                    </span>
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 status-online" />
              </div>
              <div className="hidden xl:block text-left">
                <p className="text-sm font-semibold text-white truncate max-w-32">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <div className="flex items-center space-x-1">
                  <p className="text-xs text-gray-400 capitalize">
                    {user?.role?.toLowerCase().replace('_', ' ')}
                  </p>
                  <div className="flex items-center">
                    <FiStar className="w-3 h-3 text-amber-400 fill-current" />
                    <span className="text-xs text-amber-400 ml-1">Pro</span>
                  </div>
                </div>
              </div>
            </button>

            {/* Premium dropdown menu */}
            {dropdownOpen && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-3 w-64 card border border-gray-700/50 py-2 z-50 slide-in">
                  <div className="px-4 py-3 border-b border-gray-800/50">
                    <div className="flex items-center space-x-3">
                      <div className="avatar avatar-sm">
                        <span className="text-white font-semibold text-sm">
                          {user?.profile?.firstName?.charAt(0) || 'U'}
                          {user?.profile?.lastName?.charAt(0) || ''}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {user?.profile?.firstName} {user?.profile?.lastName}
                        </p>
                        <p className="text-xs text-gray-400">{user?.email}</p>
                        <div className="flex items-center mt-1">
                          <div className="flex space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <FiStar key={i} className="w-3 h-3 text-amber-400 fill-current" />
                            ))}
                          </div>
                          <span className="ml-2 text-xs text-amber-400 font-medium">Premium</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <a
                    href="/profile"
                    className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300 group"
                  >
                    <FiUser className="w-4 h-4 mr-3 text-gray-500 group-hover:text-red-400 transition-colors" />
                    View Profile
                  </a>
                  
                  <a
                    href="/settings"
                    className="flex items-center px-4 py-3 text-sm text-gray-300 hover:text-white hover:bg-gray-800/50 transition-all duration-300 group"
                  >
                    <FiSettings className="w-4 h-4 mr-3 text-gray-500 group-hover:text-red-400 transition-colors" />
                    Settings
                  </a>
                  
                  <div className="border-t border-gray-800/50 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-4 py-3 text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 transition-all duration-300 group"
                    >
                      <FiLogOut className="w-4 h-4 mr-3 group-hover:scale-110 transition-transform" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header