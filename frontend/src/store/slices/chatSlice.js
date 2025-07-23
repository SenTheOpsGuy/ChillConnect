import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

const initialState = {
  conversations: [],
  messages: [],
  currentConversation: null,
  loading: false,
  error: null,
  typing: {},
  onlineUsers: []
}

// Async thunks
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/conversations')
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch conversations')
    }
  }
)

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ bookingId, page = 1, limit = 50 }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/${bookingId}/messages`, { 
        params: { page, limit } 
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages')
    }
  }
)

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ bookingId, content, mediaUrl }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/chat/${bookingId}/messages`, { 
        content, 
        mediaUrl 
      })
      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to send message')
    }
  }
)

export const flagMessage = createAsyncThunk(
  'chat/flagMessage',
  async ({ messageId, reason }, { rejectWithValue }) => {
    try {
      const response = await api.put(`/chat/messages/${messageId}/flag`, { reason })
      return { messageId, reason }
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'Failed to flag message')
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload
    },
    addMessage: (state, action) => {
      const message = action.payload
      if (!state.messages.find(m => m.id === message.id)) {
        state.messages.push(message)
      }
    },
    updateMessage: (state, action) => {
      const { messageId, updates } = action.payload
      const message = state.messages.find(m => m.id === messageId)
      if (message) {
        Object.assign(message, updates)
      }
    },
    setTyping: (state, action) => {
      const { userId, bookingId, isTyping } = action.payload
      if (isTyping) {
        state.typing[bookingId] = state.typing[bookingId] || []
        if (!state.typing[bookingId].includes(userId)) {
          state.typing[bookingId].push(userId)
        }
      } else {
        if (state.typing[bookingId]) {
          state.typing[bookingId] = state.typing[bookingId].filter(id => id !== userId)
        }
      }
    },
    setOnlineUsers: (state, action) => {
      state.onlineUsers = action.payload
    },
    clearMessages: (state) => {
      state.messages = []
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false
        state.conversations = action.payload.conversations
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.loading = false
        state.messages = action.payload.messages
        state.currentConversation = action.payload.booking
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        state.error = null
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        // Message will be added via socket, no need to add here
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload
      })
      
      // Flag Message
      .addCase(flagMessage.pending, (state) => {
        state.error = null
      })
      .addCase(flagMessage.fulfilled, (state, action) => {
        const message = state.messages.find(m => m.id === action.payload.messageId)
        if (message) {
          message.isFlagged = true
          message.flaggedReason = action.payload.reason
        }
      })
      .addCase(flagMessage.rejected, (state, action) => {
        state.error = action.payload
      })
  }
})

export const { 
  clearError, 
  setCurrentConversation, 
  addMessage, 
  updateMessage, 
  setTyping, 
  setOnlineUsers, 
  clearMessages 
} = chatSlice.actions

export default chatSlice.reducer