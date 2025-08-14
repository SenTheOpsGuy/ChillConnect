const request = require('supertest')
const { app } = require('../../index')

describe('Booking Flow - Integration Tests', () => {
  let seeker, provider, authTokenSeeker, authTokenProvider

  beforeEach(async () => {
    // Create test users
    seeker = await global.createTestUser({
      email: 'seeker@example.com',
      role: 'SEEKER',
    })
    
    provider = await global.createTestProvider({
      email: 'provider@example.com',
      role: 'PROVIDER',
    })

    // Generate auth tokens
    authTokenSeeker = global.generateJWT(seeker.id, 'SEEKER')
    authTokenProvider = global.generateJWT(provider.id, 'PROVIDER')
  })

  describe('Complete Booking Flow', () => {
    it('should complete full booking lifecycle', async () => {
      // Step 1: Seeker searches for providers
      const searchResponse = await request(app)
        .get('/api/users/providers')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .query({ 
          location: 'New York',
          serviceType: 'INCALL' 
        })
        .expect(200)

      expect(searchResponse.body.success).toBe(true)
      expect(searchResponse.body.providers).toContainEqual(
        expect.objectContaining({
          id: provider.id,
          email: provider.email,
        })
      )

      // Step 2: Seeker creates a booking
      const bookingData = {
        providerId: provider.id,
        serviceType: 'INCALL',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        tokenAmount: 500,
      }

      const createBookingResponse = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send(bookingData)
        .expect(201)

      expect(createBookingResponse.body.success).toBe(true)
      expect(createBookingResponse.body.booking.status).toBe('PENDING')
      
      const bookingId = createBookingResponse.body.booking.id

      // Step 3: Check tokens are held in escrow
      const walletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(walletResponse.body.wallet.balance).toBe(500) // 1000 - 500 in escrow

      // Step 4: Provider confirms the booking
      const confirmResponse = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({ status: 'CONFIRMED' })
        .expect(200)

      expect(confirmResponse.body.success).toBe(true)
      expect(confirmResponse.body.booking.status).toBe('CONFIRMED')

      // Step 5: Provider marks service as started
      const startResponse = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200)

      expect(startResponse.body.booking.status).toBe('IN_PROGRESS')

      // Step 6: Provider completes the service
      const completeResponse = await request(app)
        .put(`/api/bookings/${bookingId}/status`)
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({ status: 'COMPLETED' })
        .expect(200)

      expect(completeResponse.body.booking.status).toBe('COMPLETED')

      // Step 7: Check tokens are released from escrow to provider
      const providerWalletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .expect(200)

      expect(providerWalletResponse.body.wallet.balance).toBe(1000) // 500 + 500 earned

      // Step 8: Verify booking history
      const seekerBookingsResponse = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(seekerBookingsResponse.body.bookings).toHaveLength(1)
      expect(seekerBookingsResponse.body.bookings[0].status).toBe('COMPLETED')

      const providerBookingsResponse = await request(app)
        .get('/api/bookings')
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .expect(200)

      expect(providerBookingsResponse.body.bookings).toHaveLength(1)
      expect(providerBookingsResponse.body.bookings[0].status).toBe('COMPLETED')
    })

    it('should handle booking cancellation', async () => {
      // Create a booking
      const booking = await global.createTestBooking(seeker.id, provider.id)

      // Seeker cancels the booking
      const cancelResponse = await request(app)
        .put(`/api/bookings/${booking.id}/status`)
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send({ status: 'CANCELLED' })
        .expect(200)

      expect(cancelResponse.body.booking.status).toBe('CANCELLED')

      // Check tokens are returned to seeker
      const walletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(walletResponse.body.wallet.balance).toBe(1000) // Full balance restored
    })

    it('should handle booking disputes', async () => {
      const booking = await global.createTestBooking(seeker.id, provider.id, {
        status: 'IN_PROGRESS'
      })

      // Seeker reports a dispute
      const disputeResponse = await request(app)
        .post(`/api/bookings/${booking.id}/dispute`)
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send({
          reason: 'Service not as described',
          description: 'Provider did not provide agreed service'
        })
        .expect(200)

      expect(disputeResponse.body.success).toBe(true)

      // Check booking status is updated
      const bookingResponse = await request(app)
        .get(`/api/bookings/${booking.id}`)
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(bookingResponse.body.booking.status).toBe('DISPUTED')
    })
  })

  describe('Chat Integration', () => {
    let booking

    beforeEach(async () => {
      booking = await global.createTestBooking(seeker.id, provider.id, {
        status: 'CONFIRMED'
      })
    })

    it('should enable chat after booking confirmation', async () => {
      // Create chat for the booking
      const chatResponse = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send({
          bookingId: booking.id,
          content: 'Hello, looking forward to our meeting!',
          receiverId: provider.id,
        })
        .expect(201)

      expect(chatResponse.body.success).toBe(true)
      expect(chatResponse.body.message.content).toBe('Hello, looking forward to our meeting!')

      // Provider responds
      const providerResponse = await request(app)
        .post('/api/chat/messages')
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({
          bookingId: booking.id,
          content: 'Hi! Yes, see you tomorrow.',
          receiverId: seeker.id,
        })
        .expect(201)

      expect(providerResponse.body.success).toBe(true)

      // Get chat history
      const messagesResponse = await request(app)
        .get(`/api/chat/messages/${booking.id}`)
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(messagesResponse.body.messages).toHaveLength(2)
    })

    it('should prevent chat access for unauthorized users', async () => {
      const unauthorizedUser = await global.createTestUser({
        email: 'unauthorized@example.com'
      })
      const unauthorizedToken = global.generateJWT(unauthorizedUser.id)

      const response = await request(app)
        .get(`/api/chat/messages/${booking.id}`)
        .set('Authorization', `Bearer ${unauthorizedToken}`)
        .expect(403)

      expect(response.body.success).toBe(false)
    })
  })

  describe('Token Transaction Flow', () => {
    it('should handle token purchase and booking payment', async () => {
      // First, purchase tokens
      const purchaseResponse = await request(app)
        .post('/api/tokens/purchase')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send({
          amount: 1000, // tokens
          paymentMethod: 'paypal',
          paymentDetails: {
            paymentId: 'mock-paypal-payment-id'
          }
        })
        .expect(200)

      expect(purchaseResponse.body.success).toBe(true)

      // Check wallet balance
      let walletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(walletResponse.body.wallet.balance).toBe(2000) // 1000 + 1000 purchased

      // Create booking that requires payment
      const booking = await global.createTestBooking(seeker.id, provider.id, {
        tokenAmount: 1500
      })

      // Payment should be automatically deducted
      walletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(walletResponse.body.wallet.balance).toBe(500) // 2000 - 1500 in escrow

      // Complete booking
      await request(app)
        .put(`/api/bookings/${booking.id}/status`)
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({ status: 'CONFIRMED' })
        .expect(200)

      await request(app)
        .put(`/api/bookings/${booking.id}/status`)
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .send({ status: 'COMPLETED' })
        .expect(200)

      // Check provider received tokens
      const providerWalletResponse = await request(app)
        .get('/api/tokens/wallet')
        .set('Authorization', `Bearer ${authTokenProvider}`)
        .expect(200)

      expect(providerWalletResponse.body.wallet.balance).toBe(2000) // 500 + 1500 earned
    })

    it('should handle insufficient tokens gracefully', async () => {
      // Try to create booking with insufficient tokens
      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .send({
          providerId: provider.id,
          serviceType: 'INCALL',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          tokenAmount: 2000, // More than available balance
        })
        .expect(400)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('Insufficient tokens')
    })
  })

  describe('Age Verification Integration', () => {
    it('should prevent booking without age verification', async () => {
      // Create unverified seeker
      const unverifiedSeeker = await global.createTestUser({
        email: 'unverified@example.com',
        isAgeVerified: false,
      })
      const unverifiedToken = global.generateJWT(unverifiedSeeker.id)

      const response = await request(app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${unverifiedToken}`)
        .send({
          providerId: provider.id,
          serviceType: 'INCALL',
          scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          duration: 60,
          tokenAmount: 500,
        })
        .expect(403)

      expect(response.body.success).toBe(false)
      expect(response.body.message).toContain('age verification')
    })

    it('should prevent providing services without verification', async () => {
      const unverifiedProvider = await global.createTestProvider({
        email: 'unverified-provider@example.com',
        profile: {
          verificationStatus: 'PENDING'
        }
      })

      const response = await request(app)
        .get('/api/users/providers')
        .set('Authorization', `Bearer ${authTokenSeeker}`)
        .expect(200)

      expect(response.body.providers).not.toContainEqual(
        expect.objectContaining({
          id: unverifiedProvider.id
        })
      )
    })
  })
})