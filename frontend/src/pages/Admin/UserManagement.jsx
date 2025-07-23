import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { 
  FiSearch, FiFilter, FiMoreVertical, FiUser, FiShield, 
  FiMail, FiPhone, FiCalendar, FiEdit, FiTrash2 
} from 'react-icons/fi'
import { fetchUsers, updateUserRole, suspendUser } from '../../store/slices/adminSlice'

const UserManagement = () => {
  const dispatch = useDispatch()
  const { users, loading } = useSelector((state) => state.admin)
  const { user: currentUser } = useSelector((state) => state.auth)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [filters, setFilters] = useState({
    role: '',
    verified: '',
    page: 1,
    limit: 20
  })
  const [selectedUser, setSelectedUser] = useState(null)
  const [showRoleModal, setShowRoleModal] = useState(false)
  const [showSuspendModal, setShowSuspendModal] = useState(false)

  useEffect(() => {
    dispatch(fetchUsers({ ...filters, search: searchTerm }))
  }, [dispatch, filters, searchTerm])

  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setFilters(prev => ({ ...prev, page: 1 }))
  }

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await dispatch(updateUserRole({ userId, role: newRole })).unwrap()
      setShowRoleModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to update user role:', error)
    }
  }

  const handleSuspend = async (userId, suspended, reason) => {
    try {
      await dispatch(suspendUser({ userId, suspended, reason })).unwrap()
      setShowSuspendModal(false)
      setSelectedUser(null)
    } catch (error) {
      console.error('Failed to suspend user:', error)
    }
  }

  const getRoleColor = (role) => {
    const colors = {
      'SEEKER': 'bg-blue-100 text-blue-800',
      'PROVIDER': 'bg-green-100 text-green-800',
      'EMPLOYEE': 'bg-purple-100 text-purple-800',
      'MANAGER': 'bg-orange-100 text-orange-800',
      'ADMIN': 'bg-red-100 text-red-800',
      'SUPER_ADMIN': 'bg-gray-100 text-gray-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  const getStatusColor = (isVerified) => {
    return isVerified ? 'text-green-600' : 'text-yellow-600'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">Manage platform users and their roles</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <select
            value={filters.role}
            onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            <option value="SEEKER">Seeker</option>
            <option value="PROVIDER">Provider</option>
            <option value="EMPLOYEE">Employee</option>
            <option value="MANAGER">Manager</option>
            <option value="ADMIN">Admin</option>
            <option value="SUPER_ADMIN">Super Admin</option>
          </select>

          {/* Verification Status Filter */}
          <select
            value={filters.verified}
            onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.value, page: 1 }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Verification
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="avatar avatar-sm mr-3">
                        {user.profile?.profilePhoto ? (
                          <img
                            src={user.profile.profilePhoto}
                            alt={`${user.profile.firstName} ${user.profile.lastName}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-sm">
                            {user.profile?.firstName?.charAt(0) || 'U'}
                            {user.profile?.lastName?.charAt(0) || ''}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {user.profile?.firstName} {user.profile?.lastName}
                        </p>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${getStatusColor(user.isVerified)}`}>
                      {user.isVerified ? 'Active' : 'Pending'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      <FiMail className={`w-4 h-4 ${user.isEmailVerified ? 'text-green-500' : 'text-gray-400'}`} />
                      <FiPhone className={`w-4 h-4 ${user.isPhoneVerified ? 'text-green-500' : 'text-gray-400'}`} />
                      <FiShield className={`w-4 h-4 ${user.isAgeVerified ? 'text-green-500' : 'text-gray-400'}`} />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      {currentUser?.role === 'SUPER_ADMIN' && (
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowRoleModal(true)
                          }}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                      )}
                      {['ADMIN', 'SUPER_ADMIN'].includes(currentUser?.role) && (
                        <button
                          onClick={() => {
                            setSelectedUser(user)
                            setShowSuspendModal(true)
                          }}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role Update Modal */}
      {showRoleModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Update User Role
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Change role for {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}
            </p>
            <div className="space-y-3">
              {['SEEKER', 'PROVIDER', 'EMPLOYEE', 'MANAGER', 'ADMIN'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleUpdate(selectedUser.id, role)}
                  className={`w-full text-left px-4 py-2 rounded-lg border transition-colors ${
                    selectedUser.role === role
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {role.replace('_', ' ')}
                </button>
              ))}
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Suspend User Modal */}
      {showSuspendModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedUser.isVerified ? 'Suspend User' : 'Activate User'}
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              {selectedUser.isVerified ? 'Suspend' : 'Activate'} {selectedUser.profile?.firstName} {selectedUser.profile?.lastName}?
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowSuspendModal(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSuspend(selectedUser.id, selectedUser.isVerified, 'Admin action')}
                className={`btn ${selectedUser.isVerified ? 'btn-error' : 'btn-success'}`}
              >
                {selectedUser.isVerified ? 'Suspend' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement