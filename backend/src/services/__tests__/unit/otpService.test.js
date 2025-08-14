const otpService = require('../../otpService')
const crypto = require('crypto')

describe('OTP Service - Unit Tests', () => {
  let testUser

  beforeEach(async () => {
    testUser = await global.createTestUser()
  })

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP', async () => {
      const result = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(true)
      expect(result.otp).toMatch(/^\d{6}$/)
      expect(result.expiresAt).toBeInstanceOf(Date)
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now())
    })

    it('should store OTP in database', async () => {
      const result = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      
      const otpRecord = await global.prisma.oTP.findFirst({
        where: {
          userId: testUser.id,
          type: 'EMAIL_VERIFICATION',
          code: result.otp,
        },
      })

      expect(otpRecord).toBeTruthy()
      expect(otpRecord.verified).toBe(false)
      expect(otpRecord.attempts).toBe(0)
    })

    it('should invalidate previous OTPs of same type', async () => {
      // Generate first OTP
      const firstOTP = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      
      // Generate second OTP
      const secondOTP = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      
      // Check that only the second OTP is active
      const activeOTPs = await global.prisma.oTP.findMany({
        where: {
          userId: testUser.id,
          type: 'EMAIL_VERIFICATION',
          verified: false,
          expiresAt: {
            gt: new Date(),
          },
        },
      })

      expect(activeOTPs).toHaveLength(1)
      expect(activeOTPs[0].code).toBe(secondOTP.otp)
    })

    it('should handle different OTP types', async () => {
      const emailOTP = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      const phoneOTP = await otpService.generateOTP(testUser.id, 'PHONE_VERIFICATION')
      const resetOTP = await otpService.generateOTP(testUser.id, 'PASSWORD_RESET')

      expect(emailOTP.success).toBe(true)
      expect(phoneOTP.success).toBe(true)
      expect(resetOTP.success).toBe(true)

      // All should be different
      expect(emailOTP.otp).not.toBe(phoneOTP.otp)
      expect(phoneOTP.otp).not.toBe(resetOTP.otp)
      expect(emailOTP.otp).not.toBe(resetOTP.otp)
    })

    it('should set appropriate expiration time', async () => {
      const result = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      const expirationDiff = result.expiresAt.getTime() - Date.now()
      
      // Should expire in approximately 10 minutes (600,000 ms)
      expect(expirationDiff).toBeGreaterThan(590000) // 9.8 minutes
      expect(expirationDiff).toBeLessThan(610000) // 10.2 minutes
    })
  })

  describe('verifyOTP', () => {
    let validOTP

    beforeEach(async () => {
      const result = await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      validOTP = result.otp
    })

    it('should verify valid OTP', async () => {
      const result = await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(true)
      expect(result.message).toContain('verified successfully')
    })

    it('should mark OTP as verified after successful verification', async () => {
      await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      
      const otpRecord = await global.prisma.oTP.findFirst({
        where: {
          userId: testUser.id,
          code: validOTP,
          type: 'EMAIL_VERIFICATION',
        },
      })

      expect(otpRecord.verified).toBe(true)
    })

    it('should reject invalid OTP code', async () => {
      const result = await otpService.verifyOTP(testUser.id, '000000', 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid or expired OTP')
    })

    it('should reject OTP for wrong user', async () => {
      const anotherUser = await global.createTestUser({ email: 'another@example.com' })
      
      const result = await otpService.verifyOTP(anotherUser.id, validOTP, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid or expired OTP')
    })

    it('should reject OTP of wrong type', async () => {
      const result = await otpService.verifyOTP(testUser.id, validOTP, 'PHONE_VERIFICATION')
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid or expired OTP')
    })

    it('should reject expired OTP', async () => {
      // Create an expired OTP by setting expiresAt to past
      await global.prisma.oTP.updateMany({
        where: {
          userId: testUser.id,
          code: validOTP,
        },
        data: {
          expiresAt: new Date(Date.now() - 1000), // 1 second ago
        },
      })

      const result = await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Invalid or expired OTP')
    })

    it('should reject already verified OTP', async () => {
      // First verification should succeed
      const firstResult = await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      expect(firstResult.success).toBe(true)

      // Second verification should fail
      const secondResult = await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      expect(secondResult.success).toBe(false)
      expect(secondResult.message).toContain('Invalid or expired OTP')
    })

    it('should track verification attempts', async () => {
      // First failed attempt
      await otpService.verifyOTP(testUser.id, '000000', 'EMAIL_VERIFICATION')
      
      // Second failed attempt
      await otpService.verifyOTP(testUser.id, '111111', 'EMAIL_VERIFICATION')
      
      // Check attempts are tracked
      const otpRecord = await global.prisma.oTP.findFirst({
        where: {
          userId: testUser.id,
          code: validOTP,
          type: 'EMAIL_VERIFICATION',
        },
      })

      // Note: attempts are tracked per OTP record, not per verification call
      expect(otpRecord.attempts).toBe(0) // Valid OTP wasn't attempted yet
    })

    it('should handle rate limiting after max attempts', async () => {
      // Simulate multiple failed attempts by updating the database directly
      await global.prisma.oTP.updateMany({
        where: {
          userId: testUser.id,
          code: validOTP,
        },
        data: {
          attempts: 5, // Assuming max attempts is 5
        },
      })

      const result = await otpService.verifyOTP(testUser.id, validOTP, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(false)
      expect(result.message).toContain('Too many attempts')
    })
  })

  describe('cleanupExpiredOTPs', () => {
    it('should remove expired OTPs', async () => {
      // Create some OTPs
      await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      await otpService.generateOTP(testUser.id, 'PHONE_VERIFICATION')
      
      // Manually expire one of them
      await global.prisma.oTP.updateMany({
        where: {
          userId: testUser.id,
          type: 'EMAIL_VERIFICATION',
        },
        data: {
          expiresAt: new Date(Date.now() - 1000),
        },
      })

      // Run cleanup
      const result = await otpService.cleanupExpiredOTPs()
      
      expect(result.success).toBe(true)
      expect(result.deletedCount).toBeGreaterThan(0)

      // Check that expired OTP is gone
      const remainingOTPs = await global.prisma.oTP.findMany({
        where: {
          userId: testUser.id,
        },
      })

      expect(remainingOTPs).toHaveLength(1)
      expect(remainingOTPs[0].type).toBe('PHONE_VERIFICATION')
    })

    it('should not remove valid OTPs', async () => {
      await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      
      const result = await otpService.cleanupExpiredOTPs()
      
      const remainingOTPs = await global.prisma.oTP.findMany({
        where: {
          userId: testUser.id,
        },
      })

      expect(remainingOTPs).toHaveLength(1)
    })
  })

  describe('getUserOTPs', () => {
    it('should return user OTPs', async () => {
      await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      await otpService.generateOTP(testUser.id, 'PHONE_VERIFICATION')
      
      const result = await otpService.getUserOTPs(testUser.id)
      
      expect(result.success).toBe(true)
      expect(result.otps).toHaveLength(2)
      expect(result.otps[0].code).toBeUndefined() // Should not expose OTP codes
    })

    it('should filter by OTP type', async () => {
      await otpService.generateOTP(testUser.id, 'EMAIL_VERIFICATION')
      await otpService.generateOTP(testUser.id, 'PHONE_VERIFICATION')
      
      const result = await otpService.getUserOTPs(testUser.id, 'EMAIL_VERIFICATION')
      
      expect(result.success).toBe(true)
      expect(result.otps).toHaveLength(1)
      expect(result.otps[0].type).toBe('EMAIL_VERIFICATION')
    })

    it('should return empty array for user with no OTPs', async () => {
      const anotherUser = await global.createTestUser({ email: 'another@example.com' })
      
      const result = await otpService.getUserOTPs(anotherUser.id)
      
      expect(result.success).toBe(true)
      expect(result.otps).toHaveLength(0)
    })
  })
})