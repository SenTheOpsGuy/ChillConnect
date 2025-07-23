import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'
import { Message, Conversation } from '../../types'

interface ChatState {
  conversations: Conversation[]
  messages: Message[]
  currentBookingId: string | null
  loading: boolean
  error: string | null
  typingUsers: string[]
}

const initialState: ChatState = {
  conversations: [],
  messages: [],
  currentBookingId: null,
  loading: false,
  error: null,
  typingUsers: []
}

export const getConversations = createAsyncThunk(
  'chat/getConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/chat/conversations')
      return response.data.conversations
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch conversations')
    }
  }
)

export const getMessages = createAsyncThunk(
  'chat/getMessages',
  async ({ bookingId, page = 1 }: { bookingId: string; page?: number }, { rejectWithValue }) => {
    try {
      const response = await api.get(`/chat/${bookingId}/messages`, { params: { page } })
      return response.data
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error || 'Failed to fetch messages')
    }
  }
)

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setCurrentBooking: (state, action) => {
      state.currentBookingId = action.payload
      state.messages = []
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload)
    },
    updateMessage: (state, action) => {
      const index = state.messages.findIndex(m => m.id === action.payload.id)
      if (index !== -1) {
        state.messages[index] = { ...state.messages[index], ...action.payload }
      }
    },
    markMessagesAsRead: (state, action) => {
      const messageIds = action.payload
      state.messages.forEach(message => {
        if (messageIds.includes(message.id)) {
          message.isRead = true
        }
      })
    },
    setTypingUsers: (state, action) => {
      state.typingUsers = action.payload
    },
    clearError: (state) => {
      state.error = null
    }
  },
  extraReducers: (builder) => {
    builder
      // Get Conversations
      .addCase(getConversations.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getConversations.fulfilled, (state, action) => {
        state.loading = false
        state.conversations = action.payload
      })
      .addCase(getConversations.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
      
      // Get Messages
      .addCase(getMessages.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(getMessages.fulfilled, (state, action) => {
        state.loading = false
        if (action.meta.arg.page === 1) {
          state.messages = action.payload.messages
        } else {
          state.messages = [...action.payload.messages, ...state.messages]
        }
      })
      .addCase(getMessages.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload as string
      })
  },
})

export const {
  setCurrentBooking,
  addMessage,
  updateMessage,
  markMessagesAsRead,
  setTypingUsers,
  clearError
} = chatSlice.actions

export default chatSlice.reducer