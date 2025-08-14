const { test, expect } = require('@playwright/test')

test.describe('Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as seeker
    await page.goto('/login')
    await page.fill('[data-testid="email-input"]', 'seeker@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should complete full booking process', async ({ page }) => {
    // Navigate to search
    await page.click('[data-testid="search-providers-button"]')
    await expect(page).toHaveURL('/search')

    // Search for providers
    await page.fill('[data-testid="location-input"]', 'New York')
    await page.selectOption('[data-testid="service-type-select"]', 'INCALL')
    await page.click('[data-testid="search-button"]')

    // Wait for results
    await expect(page.locator('[data-testid="provider-card"]').first()).toBeVisible()

    // Select first provider
    await page.click('[data-testid="provider-card"] >> first')
    await expect(page.url()).toContain('/booking/')

    // Fill booking form
    await page.selectOption('[data-testid="service-type-select"]', 'INCALL')
    
    // Set date for tomorrow
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.fill('[data-testid="date-input"]', dateString)
    
    await page.fill('[data-testid="time-input"]', '14:00')
    await page.selectOption('[data-testid="duration-select"]', '60')

    // Confirm booking details
    await expect(page.locator('[data-testid="total-cost"]')).toContainText('500 tokens')

    // Submit booking
    await page.click('[data-testid="create-booking-button"]')

    // Should redirect to booking confirmation
    await expect(page.url()).toContain('/booking-details/')
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('PENDING')

    // Check success message
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking created successfully')
  })

  test('should handle insufficient tokens', async ({ page }) => {
    // First, check current token balance
    await page.click('[data-testid="wallet-link"]')
    await expect(page).toHaveURL('/wallet')
    
    const balanceText = await page.locator('[data-testid="token-balance"]').textContent()
    const currentBalance = parseInt(balanceText.match(/\d+/)[0])

    // Navigate to search and select expensive provider
    await page.click('[data-testid="search-providers-button"]')
    await page.click('[data-testid="provider-card"] >> first')

    // Try to book service more expensive than balance
    await page.selectOption('[data-testid="duration-select"]', '180') // 3 hours
    
    // Should show insufficient funds error
    await page.click('[data-testid="create-booking-button"]')
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Insufficient tokens')
  })

  test('should allow booking cancellation', async ({ page }) => {
    // Go to bookings page
    await page.click('[data-testid="bookings-link"]')
    await expect(page).toHaveURL('/bookings')

    // Find a pending booking
    const pendingBooking = page.locator('[data-testid="booking-item"][data-status="PENDING"]').first()
    await expect(pendingBooking).toBeVisible()

    // Click to view details
    await pendingBooking.click()
    
    // Cancel booking
    await page.click('[data-testid="cancel-booking-button"]')
    
    // Confirm cancellation
    await page.click('[data-testid="confirm-cancel-button"]')

    // Should show cancellation success
    await expect(page.locator('[data-testid="booking-status"]')).toContainText('CANCELLED')
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Booking cancelled')
  })

  test('should validate booking form inputs', async ({ page }) => {
    await page.click('[data-testid="search-providers-button"]')
    await page.click('[data-testid="provider-card"] >> first')

    // Try to submit without required fields
    await page.click('[data-testid="create-booking-button"]')

    // Check validation errors
    await expect(page.locator('[data-testid="date-error"]')).toContainText('Date is required')
    await expect(page.locator('[data-testid="time-error"]')).toContainText('Time is required')
  })

  test('should prevent booking in the past', async ({ page }) => {
    await page.click('[data-testid="search-providers-button"]')
    await page.click('[data-testid="provider-card"] >> first')

    // Try to set yesterday's date
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const dateString = yesterday.toISOString().split('T')[0]
    
    await page.fill('[data-testid="date-input"]', dateString)
    await page.fill('[data-testid="time-input"]', '14:00')
    await page.click('[data-testid="create-booking-button"]')

    await expect(page.locator('[data-testid="date-error"]')).toContainText('Date cannot be in the past')
  })

  test('should filter bookings by status', async ({ page }) => {
    await page.click('[data-testid="bookings-link"]')

    // Filter by confirmed bookings
    await page.selectOption('[data-testid="status-filter"]', 'CONFIRMED')
    
    // All visible bookings should be confirmed
    const bookingItems = page.locator('[data-testid="booking-item"]')
    const count = await bookingItems.count()
    
    for (let i = 0; i < count; i++) {
      const status = await bookingItems.nth(i).getAttribute('data-status')
      expect(status).toBe('CONFIRMED')
    }
  })

  test('should show booking history with pagination', async ({ page }) => {
    await page.click('[data-testid="bookings-link"]')

    // Check if pagination is present
    if (await page.locator('[data-testid="pagination"]').isVisible()) {
      // Test pagination
      const initialCount = await page.locator('[data-testid="booking-item"]').count()
      
      await page.click('[data-testid="next-page-button"]')
      
      // Wait for new content to load
      await page.waitForTimeout(1000)
      
      const newCount = await page.locator('[data-testid="booking-item"]').count()
      expect(newCount).toBeGreaterThan(0)
    }
  })

  test('should enable chat for confirmed bookings', async ({ page }) => {
    await page.click('[data-testid="bookings-link"]')
    
    // Find a confirmed booking
    const confirmedBooking = page.locator('[data-testid="booking-item"][data-status="CONFIRMED"]').first()
    
    if (await confirmedBooking.isVisible()) {
      await confirmedBooking.click()
      
      // Chat button should be available
      await expect(page.locator('[data-testid="open-chat-button"]')).toBeVisible()
      
      // Open chat
      await page.click('[data-testid="open-chat-button"]')
      await expect(page.url()).toContain('/chat/')
      
      // Send a message
      await page.fill('[data-testid="message-input"]', 'Hello, looking forward to our meeting!')
      await page.click('[data-testid="send-message-button"]')
      
      // Message should appear in chat
      await expect(page.locator('[data-testid="message-item"]').last()).toContainText('Hello, looking forward to our meeting!')
    }
  })

  test('should handle booking disputes', async ({ page }) => {
    await page.click('[data-testid="bookings-link"]')
    
    // Find an in-progress booking
    const inProgressBooking = page.locator('[data-testid="booking-item"][data-status="IN_PROGRESS"]').first()
    
    if (await inProgressBooking.isVisible()) {
      await inProgressBooking.click()
      
      // Report dispute
      await page.click('[data-testid="report-dispute-button"]')
      
      // Fill dispute form
      await page.selectOption('[data-testid="dispute-reason-select"]', 'Service not as described')
      await page.fill('[data-testid="dispute-description"]', 'The service provided was not what was agreed upon.')
      
      await page.click('[data-testid="submit-dispute-button"]')
      
      // Should show dispute submitted
      await expect(page.locator('[data-testid="booking-status"]')).toContainText('DISPUTED')
      await expect(page.locator('[data-testid="success-message"]')).toContainText('Dispute reported')
    }
  })
})