import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiMessageCircle, FiUser, FiSearch, FiCalendar } from 'react-icons/fi'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Messages = () => {
  const navigate = useNavigate()
  const { socket } = useSocket()
  const { user } = useSelector((state) => state.auth)
  
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all') // all, unread, active

  // Load conversations
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        console.log('Loading conversations...')
        
        // Try to get conversations from bookings instead
        const response = await api.get('/bookings')
        console.log('Bookings response:', response.data)
        
        // Transform bookings into conversations
        const bookings = response.data.bookings || response.data || []
        const conversations = bookings.map(booking => ({
          id: booking.id,
          bookingId: booking.id,
          seekerId: booking.seekerId,
          providerId: booking.providerId,
          seeker: booking.seeker,
          provider: booking.provider,
          status: booking.status,
          lastMessage: booking.lastMessage || null,
          unreadCount: booking.unreadCount || 0,
        }))
        
        console.log('Transformed conversations:', conversations)
        setConversations(conversations)
      } catch (error) {
        console.error('Failed to load conversations:', error)
        
        // Fallback to mock data if API fails
        const mockConversations = [
          {
            id: 'mock-1',
            bookingId: 'mock-1',
            seekerId: user?.id === 'seeker-1' ? 'seeker-1' : 'provider-1',
            providerId: user?.id === 'provider-1' ? 'provider-1' : 'seeker-1',
            seeker: {
              id: 'seeker-1',
              profile: {
                firstName: 'John',
                lastName: 'Doe',
                profilePhoto: null,
              },
            },
            provider: {
              id: 'provider-1',
              profile: {
                firstName: 'Sarah',
                lastName: 'Johnson',
                profilePhoto: null,
              },
            },
            status: 'CONFIRMED',
            lastMessage: {
              content: 'Hello! Looking forward to our session.',
              createdAt: new Date().toISOString(),
              senderId: user?.id === 'seeker-1' ? 'provider-1' : 'seeker-1',
            },
            unreadCount: 1,
          },
        ]
        
        setConversations(mockConversations)
        toast.error('Using mock data - API connection failed')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadConversations()
    } else {
      setLoading(false)
    }
  }, [user])

  // Socket event listeners
  useEffect(() => {
    if (!socket) {return}

    const handleNewMessage = (message) => {
      // Update conversation with new message
      setConversations(prev => prev.map(conv => 
        conv.bookingId === message.bookingId 
          ? {
            ...conv,
            lastMessage: {
              content: message.content,
              createdAt: message.createdAt,
              senderId: message.senderId,
            },
            unreadCount: message.senderId !== user.id ? conv.unreadCount + 1 : conv.unreadCount,
          }
          : conv,
      ))
    }

    socket.on('new_message', handleNewMessage)

    return () => {
      socket.off('new_message', handleNewMessage)
    }
  }, [socket, user.id])

  const formatTime = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }


  const getOtherUser = (conversation) => {
    return conversation.seekerId === user.id ? conversation.provider : conversation.seeker
  }

  const filteredConversations = conversations.filter(conv => {
    const otherUser = getOtherUser(conv)
    if (!otherUser || !otherUser.profile) {return false}
    
    const matchesSearch = searchTerm === '' || 
      `${otherUser.profile.firstName || ''} ${otherUser.profile.lastName || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && conv.unreadCount > 0) ||
      (filter === 'active' && ['CONFIRMED', 'IN_PROGRESS'].includes(conv.status))
    
    return matchesSearch && matchesFilter
  })

  const getStatusColor = (status) => {
    const colors = {
      'PENDING': 'warning',
      'CONFIRMED': 'success',
      'IN_PROGRESS': 'info',
      'COMPLETED': 'success',
      'CANCELLED': 'error',
    }
    return colors[status] || 'secondary'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiUser className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Please log in to view messages</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Messages</h1>
        <p className="text-gray-600">Chat with your bookings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Conversations List */}
        <div className="lg:col-span-1">
          <div className="card h-full flex flex-col">
            <div className="card-header">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Conversations</h3>
              
              {/* Search */}
              <div className="relative mb-4">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Filters */}
              <div className="flex space-x-2 mb-4">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === 'all' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilter('unread')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === 'unread' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Unread
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-3 py-1 text-sm rounded-full ${
                    filter === 'active' 
                      ? 'bg-primary-500 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Active
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-2">
              {filteredConversations.map((conversation) => {
                const otherUser = getOtherUser(conversation)
                return (
                  <div
                    key={conversation.id}
                    onClick={() => navigate(`/chat/${conversation.bookingId || conversation.id}`)}
                    className="p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-50 border border-gray-100"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="avatar avatar-sm">
                        {otherUser.profile?.profilePhoto ? (
                          <img
                            src={otherUser.profile.profilePhoto}
                            alt={`${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <span className="text-sm">
                            {otherUser.profile?.firstName?.charAt(0) || 'U'}
                            {otherUser.profile?.lastName?.charAt(0) || ''}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {otherUser.profile?.firstName} {otherUser.profile?.lastName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {conversation.lastMessage ? formatTime(conversation.lastMessage.createdAt) : ''}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 truncate">
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                        <div className="flex items-center justify-between mt-1">
                          <span className={`badge badge-${getStatusColor(conversation.status)} text-xs`}>
                            {conversation.status?.toLowerCase()}
                          </span>
                          {conversation.unreadCount > 0 && (
                            <span className="bg-primary-500 text-white text-xs rounded-full px-2 py-1">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )})}
              
              {filteredConversations.length === 0 && (
                <div className="text-center py-8">
                  <FiMessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No conversations found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Welcome Area */}
        <div className="lg:col-span-2">
          <div className="card h-full flex items-center justify-center">
            <div className="text-center">
              <FiMessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Welcome to Messages
              </h3>
              <p className="text-gray-500 mb-6">
                Click on a conversation to start chatting with your bookings
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/search" className="btn btn-primary">
                  <FiUser className="w-4 h-4 mr-2" />
                  Find Providers
                </Link>
                <Link to="/dashboard" className="btn btn-secondary">
                  <FiCalendar className="w-4 h-4 mr-2" />
                  View Bookings
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Messages