import { useDispatch, useSelector } from 'react-redux'
import { RootState } from '../../store/store'
import { logout } from '../../store/slices/authSlice'

const Header = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state: RootState) => state.auth)

  const handleLogout = () => {
    dispatch(logout())
  }

  return (
    <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
      <div className="flex-1 px-4 flex justify-between">
        <div className="flex-1 flex">
          <div className="w-full flex md:ml-0">
            <div className="relative w-full text-gray-400 focus-within:text-gray-600">
              {/* Mobile menu button would go here */}
            </div>
          </div>
        </div>
        
        <div className="ml-4 flex items-center md:ml-6">
          {/* Token balance */}
          <div className="flex items-center mr-4">
            <span className="text-sm text-gray-500 mr-2">Balance:</span>
            <span className="text-sm font-medium text-gray-900">
              {user?.tokenBalance || 0} tokens
            </span>
          </div>

          {/* Verification status */}
          {user && (
            <div className="mr-4">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                user.isVerified 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {user.isVerified ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          )}

          {/* Profile dropdown */}
          <div className="ml-3 relative">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.profile?.firstName?.[0] || user?.email[0].toUpperCase()}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Header