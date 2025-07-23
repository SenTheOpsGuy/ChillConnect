import { useState } from 'react'
import { useDispatch } from 'react-redux'
import { logout } from '../../store/slices/authSlice'
import { FiBell, FiMenu, FiSearch, FiUser, FiLogOut } from 'react-icons/fi'

const Header = ({ sidebarOpen, setSidebarOpen, user }) => {
  const dispatch = useDispatch()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <header className="bg-white/95 backdrop-blur-xl border-b border-gray-100 fixed w-full top-0 z-40 md:ml-72 transition-all duration-300">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Mobile menu button */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <FiMenu className="w-5 h-5 text-gray-600" />
        </button>

        {/* Desktop logo (hidden on mobile due to sidebar) */}
        <div className="hidden md:block">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-sm">C</span>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">ChillConnect</h1>
          </div>
        </div>

        {/* Center - Clean search */}
        <div className="hidden lg:flex flex-1 max-w-sm mx-8">
          <div className="relative w-full">
            <FiSearch className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="input pl-10 text-sm"
            />
          </div>
        </div>

        {/* Right side - Minimalist actions */}
        <div className="flex items-center space-x-2">
          {/* Notifications - Clean design */}
          <button className="p-2 rounded-xl hover:bg-gray-100 relative transition-colors focus-ring">
            <FiBell className="w-5 h-5 text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu - Minimalist */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center space-x-3 p-1 rounded-xl hover:bg-gray-100 transition-colors focus-ring"
            >
              {user?.profile?.profilePhoto ? (
                <img
                  src={user.profile.profilePhoto}
                  alt={`${user.profile.firstName} ${user.profile.lastName}`}
                  className="w-8 h-8 rounded-xl object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {user?.profile?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-gray-900 truncate max-w-32">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </p>
                <p className="text-xs text-muted capitalize">
                  {user?.role?.toLowerCase().replace('_', ' ')}
                </p>
              </div>
            </button>

            {/* Clean dropdown menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-56 card border border-gray-200 py-2 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {user?.profile?.firstName} {user?.profile?.lastName}
                  </p>
                  <p className="text-xs text-muted">{user?.email}</p>
                </div>
                <a
                  href="/profile"
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <FiUser className="w-4 h-4 mr-3 text-gray-400" />
                  View Profile
                </a>
                <button
                  onClick={handleLogout}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <FiLogOut className="w-4 h-4 mr-3" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header