import { http, HttpResponse } from 'msw'

const API_BASE_URL = 'http://localhost:5001'

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE_URL}/auth/login`, () => {
    return HttpResponse.json({
      success: true,
      user: global.testUser,
      token: 'mock-jwt-token',
    })
  }),

  http.post(`${API_BASE_URL}/auth/register`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Registration successful',
      user: global.testUser,
    })
  }),

  http.post(`${API_BASE_URL}/auth/logout`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Logged out successfully',
    })
  }),

  http.get(`${API_BASE_URL}/auth/me`, () => {
    return HttpResponse.json({
      success: true,
      user: global.testUser,
    })
  }),

  http.post(`${API_BASE_URL}/auth/forgot-password`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Password reset email sent',
    })
  }),

  http.post(`${API_BASE_URL}/auth/reset-password`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Password reset successful',
    })
  }),

  // OTP endpoints
  http.post(`${API_BASE_URL}/auth/request-otp`, () => {
    return HttpResponse.json({
      success: true,
      message: 'OTP sent successfully',
    })
  }),

  http.post(`${API_BASE_URL}/auth/verify-otp`, () => {
    return HttpResponse.json({
      success: true,
      user: global.testUser,
      token: 'mock-jwt-token',
    })
  }),

  // User endpoints
  http.get(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      profile: global.testUser.profile,
    })
  }),

  http.put(`${API_BASE_URL}/users/profile`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: global.testUser.profile,
    })
  }),

  http.get(`${API_BASE_URL}/users/providers`, () => {
    return HttpResponse.json({
      success: true,
      providers: [global.testProvider],
      total: 1,
      page: 1,
      limit: 10,
    })
  }),

  // Booking endpoints
  http.get(`${API_BASE_URL}/bookings`, () => {
    return HttpResponse.json({
      success: true,
      bookings: [
        {
          id: 'booking-1',
          serviceType: 'INCALL',
          status: 'CONFIRMED',
          scheduledAt: new Date().toISOString(),
          duration: 60,
          tokenAmount: 500,
          provider: global.testProvider,
          seeker: global.testUser,
        },
      ],
      total: 1,
    })
  }),

  http.post(`${API_BASE_URL}/bookings`, () => {
    return HttpResponse.json({
      success: true,
      message: 'Booking created successfully',
      booking: {
        id: 'new-booking-id',
        serviceType: 'INCALL',
        status: 'PENDING',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        tokenAmount: 500,
      },
    })
  }),

  http.get(`${API_BASE_URL}/bookings/:id`, ({ params }) => {
    return HttpResponse.json({
      success: true,
      booking: {
        id: params.id,
        serviceType: 'INCALL',
        status: 'CONFIRMED',
        scheduledAt: new Date().toISOString(),
        duration: 60,
        tokenAmount: 500,
        provider: global.testProvider,
        seeker: global.testUser,
      },
    })
  }),

  // Chat endpoints
  http.get(`${API_BASE_URL}/chat/messages/:bookingId`, () => {
    return HttpResponse.json({
      success: true,
      messages: [
        {
          id: 'message-1',
          content: 'Hello, how are you?',
          senderId: global.testUser.id,
          receiverId: global.testProvider.id,
          createdAt: new Date().toISOString(),
          isRead: false,
        },
      ],
    })
  }),

  http.post(`${API_BASE_URL}/chat/messages`, () => {
    return HttpResponse.json({
      success: true,
      message: {
        id: 'new-message-id',
        content: 'New message',
        senderId: global.testUser.id,
        createdAt: new Date().toISOString(),
        isRead: false,
      },
    })
  }),

  // Token/Wallet endpoints
  http.get(`${API_BASE_URL}/tokens/wallet`, () => {
    return HttpResponse.json({
      success: true,
      wallet: {
        id: 'wallet-1',
        balance: 1000,
        totalEarned: 2000,
        totalSpent: 1000,
      },
    })
  }),

  http.post(`${API_BASE_URL}/tokens/purchase`, () => {
    return HttpResponse.json({
      success: true,
      transaction: {
        id: 'transaction-1',
        amount: 1000,
        type: 'PURCHASE',
        status: 'COMPLETED',
      },
    })
  }),

  // Admin endpoints
  http.get(`${API_BASE_URL}/admin/users`, () => {
    return HttpResponse.json({
      success: true,
      users: [global.testUser, global.testProvider],
      total: 2,
      page: 1,
      limit: 10,
    })
  }),

  http.get(`${API_BASE_URL}/admin/verification-queue`, () => {
    return HttpResponse.json({
      success: true,
      queue: [
        {
          id: 'verification-1',
          userId: global.testProvider.id,
          user: global.testProvider,
          status: 'PENDING',
          submittedAt: new Date().toISOString(),
        },
      ],
      total: 1,
    })
  }),

  // Upload endpoints
  http.post(`${API_BASE_URL}/upload/profile-photo`, () => {
    return HttpResponse.json({
      success: true,
      url: 'https://example.com/photo.jpg',
    })
  }),

  http.post(`${API_BASE_URL}/upload/verification-document`, () => {
    return HttpResponse.json({
      success: true,
      url: 'https://example.com/document.pdf',
    })
  }),

  // Error handlers for testing
  http.get(`${API_BASE_URL}/test/404`, () => {
    return new HttpResponse(null, { status: 404 })
  }),

  http.get(`${API_BASE_URL}/test/500`, () => {
    return new HttpResponse(null, { status: 500 })
  }),

  http.get(`${API_BASE_URL}/test/unauthorized`, () => {
    return HttpResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    )
  }),
]