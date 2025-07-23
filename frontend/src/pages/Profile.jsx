import { useState } from 'react'
import { useSelector } from 'react-redux'
import { FiEdit, FiCamera, FiShield, FiMail, FiPhone, FiUser } from 'react-icons/fi'
import LoadingSpinner from '../components/UI/LoadingSpinner'

const Profile = () => {
  const { user, loading } = useSelector((state) => state.auth)
  const [editing, setEditing] = useState(false)

  // Show loading spinner while user data is being fetched
  if (loading || !user) {
    return <LoadingSpinner />
  }
  

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="card">
        <div className="card-header">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">Profile</h2>
            <button
              onClick={() => setEditing(!editing)}
              className="btn btn-primary btn-sm"
            >
              <FiEdit className="w-4 h-4 mr-2" />
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Photo */}
          <div className="text-center md:text-left">
            <div className="relative inline-block">
              <div className="avatar avatar-lg mx-auto md:mx-0">
                {user?.profile?.profilePhoto ? (
                  <img
                    src={user.profile.profilePhoto}
                    alt={`${user.profile.firstName} ${user.profile.lastName}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-medium">
                    {user?.profile?.firstName?.charAt(0) || 'U'}
                    {user?.profile?.lastName?.charAt(0) || ''}
                  </span>
                )}
              </div>
              {editing && (
                <button className="absolute bottom-0 right-0 p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 shadow-sm">
                  <FiCamera className="w-4 h-4" />
                </button>
              )}
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              {user?.profile?.firstName} {user?.profile?.lastName}
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {user?.role?.toLowerCase()}
            </p>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={user?.profile?.firstName || ''}
                  disabled={!editing}
                  className={`input ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={user?.profile?.lastName || ''}
                  disabled={!editing}
                  className={`input ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled={!editing}
                  className={`input ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={user?.phone || ''}
                  disabled={!editing}
                  className={`input ${!editing ? 'bg-gray-50' : ''}`}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bio
                </label>
                <textarea
                  value={user?.profile?.bio || ''}
                  disabled={!editing}
                  rows={3}
                  className={`input resize-none ${!editing ? 'bg-gray-50' : ''}`}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification Status */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-medium text-gray-900">Verification Status</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
            <div className={`p-2 rounded-full flex-shrink-0 ${user?.isEmailVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <FiMail className={`w-5 h-5 ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Email Verification</p>
              <p className={`text-xs ${user?.isEmailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.isEmailVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
            <div className={`p-2 rounded-full flex-shrink-0 ${user?.isPhoneVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <FiPhone className={`w-5 h-5 ${user?.isPhoneVerified ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Phone Verification</p>
              <p className={`text-xs ${user?.isPhoneVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.isPhoneVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
            <div className={`p-2 rounded-full flex-shrink-0 ${user?.isAgeVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <FiUser className={`w-5 h-5 ${user?.isAgeVerified ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Age Verification</p>
              <p className={`text-xs ${user?.isAgeVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.isAgeVerified ? 'Verified' : 'Pending'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3 p-3 rounded-lg border border-gray-100">
            <div className={`p-2 rounded-full flex-shrink-0 ${user?.isVerified ? 'bg-green-100' : 'bg-yellow-100'}`}>
              <FiShield className={`w-5 h-5 ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900">Account Status</p>
              <p className={`text-xs ${user?.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                {user?.isVerified ? 'Active' : 'Pending Review'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      {editing && (
        <div className="card">
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => setEditing(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button className="btn btn-primary">
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile