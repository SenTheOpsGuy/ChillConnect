export interface User {
  id: string
  email: string
  phone?: string
  role: 'SEEKER' | 'PROVIDER' | 'EMPLOYEE' | 'MANAGER' | 'ADMIN' | 'SUPER_ADMIN'
  isVerified: boolean
  verificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW'
  profile?: Profile
  tokenBalance?: number
  createdAt: string
}

export interface Profile {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  bio?: string
  location?: string
  profileImageUrl?: string
  services: string[]
  hourlyRate?: number
  rating?: number
  reviewCount: number
  isAgeVerified: boolean
  availability?: any
}

export interface TokenWallet {
  id: string
  balance: number
  escrowBalance: number
  totalPurchased: number
  totalSpent: number
}

export interface Transaction {
  id: string
  type: 'PURCHASE' | 'BOOKING_PAYMENT' | 'BOOKING_REFUND' | 'WITHDRAWAL' | 'ESCROW_HOLD' | 'ESCROW_RELEASE'
  amount: number
  description: string
  status: string
  createdAt: string
  booking?: Booking
}

export interface Booking {
  id: string
  type: 'INCALL' | 'OUTCALL'
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'DISPUTED'
  scheduledAt: string
  duration: number
  tokenAmount: number
  location?: string
  notes?: string
  createdAt: string
  isSeeker?: boolean
  counterpart?: {
    id: string
    name: string
    profileImage?: string
  }
}

export interface Message {
  id: string
  content: string
  messageType: 'text' | 'image' | 'system'
  mediaUrl?: string
  createdAt: string
  isRead: boolean
  isFlagged: boolean
  sender: {
    id: string
    name: string
    profileImage?: string
  }
}

export interface Conversation {
  bookingId: string
  counterpart: {
    id: string
    name: string
    profileImage?: string
  }
  lastMessage?: {
    content: string
    createdAt: string
    isFromMe: boolean
    messageType: string
  }
  unreadCount: number
  bookingStatus: string
  scheduledAt: string
}

export interface Provider {
  id: string
  profile: Profile
  isOnline: boolean
}

export interface Verification {
  id: string
  type: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'REQUIRES_REVIEW'
  notes?: string
  createdAt: string
  reviewedAt?: string
}