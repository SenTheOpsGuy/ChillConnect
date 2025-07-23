import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateUser } from '../store/slices/authSlice';

const Settings = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    bio: ''
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    bookingUpdates: true,
    messageNotifications: true,
    marketingEmails: false
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    showLocation: true,
    showOnlineStatus: true,
    allowDirectMessages: true
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        location: user.location || '',
        bio: user.bio || ''
      });
    }
  }, [user]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(profileData)
      });

      if (response.ok) {
        const updatedUser = await response.json();
        dispatch(updateUser(updatedUser.user));
        setMessage('Profile updated successfully!');
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/users/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(notificationSettings)
      });

      if (response.ok) {
        setMessage('Notification settings updated successfully!');
      } else {
        setMessage('Failed to update notification settings');
      }
    } catch (error) {
      console.error('Notification settings error:', error);
      setMessage('Failed to update notification settings');
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'profile', name: 'Profile', icon: '👤' },
    { id: 'notifications', name: 'Notifications', icon: '🔔' },
    { id: 'privacy', name: 'Privacy', icon: '🔒' },
    { id: 'security', name: 'Security', icon: '🛡️' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="bg-pink-600 text-white p-6">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="text-pink-100 mt-2">Manage your account preferences and settings</p>
          </div>

          <div className="flex flex-col md:flex-row">
            {/* Sidebar */}
            <div className="w-full md:w-64 border-r border-gray-200">
              <nav className="p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-4 py-3 text-left rounded-lg mb-2 transition-colors ${
                      activeTab === tab.id
                        ? 'bg-pink-100 text-pink-700 border-l-4 border-pink-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1 p-6">
              {message && (
                <div className={`mb-6 p-4 rounded-lg ${
                  message.includes('successfully') 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-red-100 text-red-700 border border-red-200'
                }`}>
                  {message}
                </div>
              )}

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <form onSubmit={handleProfileSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          First Name
                        </label>
                        <input
                          type="text"
                          value={profileData.firstName}
                          onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Last Name
                        </label>
                        <input
                          type="text"
                          value={profileData.lastName}
                          onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        value={profileData.location}
                        onChange={(e) => setProfileData({...profileData, location: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="City, State"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        value={profileData.bio}
                        onChange={(e) => setProfileData({...profileData, bio: e.target.value})}
                        rows="4"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                  <form onSubmit={handleNotificationSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {Object.entries(notificationSettings).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                            <p className="text-sm text-gray-600">
                              {key === 'emailNotifications' && 'Receive notifications via email'}
                              {key === 'smsNotifications' && 'Receive notifications via SMS'}
                              {key === 'pushNotifications' && 'Receive push notifications'}
                              {key === 'bookingUpdates' && 'Get notified about booking status changes'}
                              {key === 'messageNotifications' && 'Get notified about new messages'}
                              {key === 'marketingEmails' && 'Receive promotional emails and updates'}
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setNotificationSettings({
                                ...notificationSettings,
                                [key]: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-pink-600 text-white px-6 py-2 rounded-md hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save Preferences'}
                    </button>
                  </form>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Privacy Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Privacy Controls</h3>
                      <p className="text-sm text-blue-700">
                        Manage who can see your information and how you appear to others on the platform.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block font-medium text-gray-900 mb-2">Profile Visibility</label>
                        <select
                          value={privacySettings.profileVisibility}
                          onChange={(e) => setPrivacySettings({
                            ...privacySettings,
                            profileVisibility: e.target.value
                          })}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                          <option value="public">Public</option>
                          <option value="verified">Verified Users Only</option>
                          <option value="private">Private</option>
                        </select>
                      </div>
                      
                      {Object.entries(privacySettings).filter(([key]) => key !== 'profileVisibility').map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                          <div>
                            <label className="font-medium text-gray-900">
                              {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                            </label>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={value}
                              onChange={(e) => setPrivacySettings({
                                ...privacySettings,
                                [key]: e.target.checked
                              })}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-pink-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                  <div className="space-y-6">
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <h3 className="font-medium text-red-900 mb-2">Account Security</h3>
                      <p className="text-sm text-red-700">
                        Keep your account secure by regularly updating your password and enabling two-factor authentication.
                      </p>
                    </div>
                    
                    <div className="space-y-4">
                      <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Change Password</h3>
                            <p className="text-sm text-gray-600">Update your account password</p>
                          </div>
                          <span>→</span>
                        </div>
                      </button>
                      
                      <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-600">Add an extra layer of security</p>
                          </div>
                          <span>→</span>
                        </div>
                      </button>
                      
                      <button className="w-full bg-white border border-gray-300 text-gray-700 px-4 py-3 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-pink-500 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Login History</h3>
                            <p className="text-sm text-gray-600">Review recent account activity</p>
                          </div>
                          <span>→</span>
                        </div>
                      </button>
                      
                      <button className="w-full bg-red-600 text-white px-4 py-3 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 text-left">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-medium">Delete Account</h3>
                            <p className="text-sm text-red-100">Permanently delete your account</p>
                          </div>
                          <span>⚠️</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;