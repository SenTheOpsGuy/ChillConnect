// Test data for e2e tests
export const testUsers = {
  admin: {
    email: 'admin@chillconnect.com',
    password: 'SuperSecurePassword123!',
    role: 'SUPER_ADMIN'
  },
  seeker: {
    email: 'seeker.test@example.com',
    password: 'TestPassword123!',
    role: 'SEEKER',
    firstName: 'John',
    lastName: 'Seeker',
    dateOfBirth: '1990-01-01',
    phone: '+1234567890'
  },
  provider: {
    email: 'provider.test@example.com',
    password: 'TestPassword123!',
    role: 'PROVIDER',
    firstName: 'Jane',
    lastName: 'Provider',
    dateOfBirth: '1985-05-15',
    phone: '+1234567891',
    services: ['Massage', 'Companionship'],
    hourlyRate: 100
  },
  employee: {
    email: 'employee.test@example.com',
    password: 'TestPassword123!',
    role: 'EMPLOYEE',
    firstName: 'Mike',
    lastName: 'Employee',
    dateOfBirth: '1988-08-20',
    phone: '+1234567892'
  }
};

export const testBooking = {
  type: 'INCALL',
  duration: 60,
  tokenAmount: 100,
  notes: 'Test booking for e2e tests',
  location: 'Test Location'
};

export const testMessages = [
  'Hello, I would like to book your services',
  'What are your available times?',
  'I am available from 2 PM to 6 PM',
  'Perfect, let me book for 3 PM'
];

export const testFiles = {
  profilePhoto: {
    name: 'profile-photo.jpg',
    type: 'image/jpeg',
    size: 1024 * 1024 // 1MB
  },
  idDocument: {
    name: 'id-document.pdf',
    type: 'application/pdf',
    size: 2 * 1024 * 1024 // 2MB
  }
};

export const apiEndpoints = {
  auth: {
    register: '/api/auth/register',
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    me: '/api/auth/me',
    verifyEmail: '/api/auth/verify-email',
    verifyPhone: '/api/auth/verify-phone'
  },
  users: {
    profile: '/api/users/profile',
    updateProfile: '/api/users/profile'
  },
  bookings: {
    search: '/api/bookings/search',
    create: '/api/bookings/create',
    myBookings: '/api/bookings/my-bookings',
    updateStatus: '/api/bookings/:id/status'
  },
  tokens: {
    packages: '/api/tokens/packages',
    purchase: '/api/tokens/purchase',
    balance: '/api/tokens/balance',
    transactions: '/api/tokens/transactions'
  },
  admin: {
    dashboard: '/api/admin/dashboard',
    users: '/api/admin/users',
    verificationQueue: '/api/admin/verification-queue',
    bookingMonitoring: '/api/admin/booking-monitoring'
  },
  chat: {
    conversations: '/api/chat/conversations',
    messages: '/api/chat/:bookingId/messages',
    sendMessage: '/api/chat/:bookingId/messages'
  },
  upload: {
    profile: '/api/upload/profile',
    verification: '/api/upload/verification',
    chat: '/api/upload/chat'
  }
};