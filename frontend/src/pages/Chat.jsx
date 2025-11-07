import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { 
  FiSend, FiPaperclip, FiMoreVertical, FiArrowLeft, 
  FiPhone, FiVideo, FiInfo, FiAlertTriangle, 
} from 'react-icons/fi'
import { useSocket } from '../contexts/SocketContext'
import api from '../services/api'
import toast from 'react-hot-toast'

const Chat = () => {
  const { bookingId } = useParams()
  const navigate = useNavigate()
  const socket = useSocket()
  const { user } = useSelector((state) => state.auth)
  
  const [booking, setBooking] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [typing, setTyping] = useState(false)
  const [otherUserTyping, setOtherUserTyping] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  
  const messagesEndRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const inputRef = useRef(null)

  // Load booking and messages
  useEffect(() => {
    const loadBookingData = async () => {
      try {
        const response = await api.get(`/bookings/${bookingId}`)
        setBooking(response.data.booking)
        setMessages(response.data.booking.messages || [])
      } catch (error) {
        toast.error('Failed to load chat')
        navigate('/messages')
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      loadBookingData()
    }
  }, [bookingId, navigate])

  // Socket event listeners
  useEffect(() => {
    if (!socket) {return}

    const handleNewMessage = (message) => {
      setMessages(prev => [...prev, message])
      scrollToBottom()
    }

    const handleUserTyping = (data) => {
      if (data.userId !== user.id) {
        setOtherUserTyping(true)
        setTimeout(() => setOtherUserTyping(false), 3000)
      }
    }

    const handleUserStoppedTyping = (data) => {
      if (data.userId !== user.id) {
        setOtherUserTyping(false)
      }
    }

    const handleMessageSent = (data) => {
      // Update message with server-generated ID
      setMessages(prev => prev.map(msg => 
        msg.tempId === data.tempId 
          ? { ...msg, id: data.id, createdAt: data.createdAt }
          : msg,
      ))
      setSending(false)
    }

    const handleError = (error) => {
      toast.error(error.message)
      setSending(false)
    }

    socket.on('new_message', handleNewMessage)
    socket.on('user_typing', handleUserTyping)
    socket.on('user_stopped_typing', handleUserStoppedTyping)
    socket.on('message_sent', handleMessageSent)
    socket.on('error', handleError)

    return () => {
      socket.off('new_message', handleNewMessage)
      socket.off('user_typing', handleUserTyping)
      socket.off('user_stopped_typing', handleUserStoppedTyping)
      socket.off('message_sent', handleMessageSent)
      socket.off('error', handleError)
    }
  }, [socket, user.id])

  // Auto-scroll to bottom
  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Handle typing indicators
  const handleTypingStart = () => {
    if (!typing) {
      setTyping(true)
      socket?.emit('typing_start', { bookingId })
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false)
      socket?.emit('typing_stop', { bookingId })
    }, 1000)
  }

  const handleSendMessage = (e) => {
    e.preventDefault()
    
    if (!newMessage.trim() || sending) {return}

    const tempId = Date.now().toString()
    const messageData = {
      tempId,
      bookingId,
      content: newMessage.trim(),
      createdAt: new Date().toISOString(),
    }

    // Optimistically add message to UI
    const optimisticMessage = {
      ...messageData,
      id: tempId,
      senderId: user.id,
      sender: {
        id: user.id,
        profile: user.profile,
      },
      isSystemMessage: false,
      isFlagged: false,
    }

    setMessages(prev => [...prev, optimisticMessage])
    setNewMessage('')
    setSending(true)

    // Clear typing
    setTyping(false)
    socket?.emit('typing_stop', { bookingId })

    // Send message via socket
    socket?.emit('send_message', messageData)
  }

  const handleInputChange = (e) => {
    setNewMessage(e.target.value)
    handleTypingStart()
  }

  const getOtherUser = () => {
    if (!booking) {return null}
    return booking.seekerId === user.id ? booking.provider : booking.seeker
  }

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit', 
    })
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString()
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner w-8 h-8"></div>
      </div>
    )
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <FiAlertTriangle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Booking not found</p>
        </div>
      </div>
    )
  }

  const otherUser = getOtherUser()

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/messages')}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiArrowLeft className="w-5 h-5" />
          </button>
          <div className="avatar avatar-md">
            {otherUser?.profile?.profilePhoto ? (
              <img
                src={otherUser.profile.profilePhoto}
                alt={`${otherUser.profile.firstName} ${otherUser.profile.lastName}`}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <span className="text-lg">
                {otherUser?.profile?.firstName?.charAt(0) || 'U'}
                {otherUser?.profile?.lastName?.charAt(0) || ''}
              </span>
            )}
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              {otherUser?.profile?.firstName} {otherUser?.profile?.lastName}
            </h2>
            <p className="text-sm text-gray-500">
              {booking.type} • {booking.status}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiPhone className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiVideo className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiInfo className="w-5 h-5" />
          </button>
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <FiMoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => {
          const isOwnMessage = message.senderId === user.id
          const showDate = index === 0 || 
            formatDate(message.createdAt) !== formatDate(messages[index - 1].createdAt)
          
          return (
            <div key={message.id || message.tempId}>
              {showDate && (
                <div className="text-center my-4">
                  <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDate(message.createdAt)}
                  </span>
                </div>
              )}
              
              <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.isSystemMessage
                    ? 'bg-blue-100 text-blue-800 text-center text-sm'
                    : isOwnMessage
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                }`}>
                  {message.isFlagged && (
                    <div className="text-xs text-red-500 mb-1 flex items-center">
                      <FiAlertTriangle className="w-3 h-3 mr-1" />
                      Flagged content
                    </div>
                  )}
                  <p className="text-sm">{message.content}</p>
                  {message.mediaUrl && (
                    <img 
                      src={message.mediaUrl} 
                      alt="Attachment" 
                      className="mt-2 max-w-full rounded"
                    />
                  )}
                  <div className={`text-xs mt-1 ${
                    isOwnMessage ? 'text-primary-200' : 'text-gray-500'
                  }`}>
                    {formatTime(message.createdAt)}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
        
        {/* Typing indicator */}
        {otherUserTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-lg px-4 py-2 max-w-xs">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          <button
            type="button"
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <FiPaperclip className="w-5 h-5 text-gray-500" />
          </button>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={handleInputChange}
              placeholder="Type a message..."
              className="w-full px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={sending}
            />
          </div>
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-500 text-white rounded-full hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="spinner w-5 h-5"></div>
            ) : (
              <FiSend className="w-5 h-5" />
            )}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat