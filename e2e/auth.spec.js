const { test, expect } = require('@playwright/test')

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should register a new user successfully', async ({ page }) => {
    // Navigate to registration
    await page.click('text=Register')
    await expect(page).toHaveURL('/register')

    // Fill registration form
    await page.fill('[data-testid="email-input"]', 'e2e-test@example.com')
    await page.fill('[data-testid="password-input"]', 'TestPassword123!')
    await page.fill('[data-testid="confirm-password-input"]', 'TestPassword123!')
    await page.fill('[data-testid="first-name-input"]', 'E2E')
    await page.fill('[data-testid="last-name-input"]', 'Test')
    await page.fill('[data-testid="age-input"]', '25')
    await page.check('[data-testid="consent-checkbox"]')

    // Submit form
    await page.click('[data-testid="register-button"]')

    // Should redirect to email verification
    await expect(page).toHaveURL('/verify-email')
    await expect(page.locator('h1')).toContainText('Verify Your Email')
  })

  test('should login with valid credentials', async ({ page }) => {
    // Navigate to login
    await page.click('text=Login')
    await expect(page).toHaveURL('/login')

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')

    // Submit form
    await page.click('[data-testid="login-button"]')

    // Should redirect to dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.click('text=Login')
    
    await page.fill('[data-testid="email-input"]', 'wrong@example.com')
    await page.fill('[data-testid="password-input"]', 'wrongpassword')
    await page.click('[data-testid="login-button"]')

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials')
  })

  test('should validate registration form', async ({ page }) => {
    await page.click('text=Register')
    
    // Try to submit empty form
    await page.click('[data-testid="register-button"]')

    // Check validation errors
    await expect(page.locator('[data-testid="email-error"]')).toContainText('Email is required')
    await expect(page.locator('[data-testid="password-error"]')).toContainText('Password is required')
    await expect(page.locator('[data-testid="first-name-error"]')).toContainText('First name is required')
  })

  test('should handle OTP login flow', async ({ page }) => {
    await page.click('text=Login with OTP')
    await expect(page).toHaveURL('/login-otp')

    // Request OTP
    await page.fill('[data-testid="phone-input"]', '+1234567890')
    await page.click('[data-testid="request-otp-button"]')

    // Should show OTP input
    await expect(page.locator('[data-testid="otp-input"]')).toBeVisible()
    
    // Fill OTP (mock)
    await page.fill('[data-testid="otp-input"]', '123456')
    await page.click('[data-testid="verify-otp-button"]')

    // Should redirect to dashboard (assuming OTP is valid in test)
    await expect(page).toHaveURL('/dashboard')
  })

  test('should handle password reset flow', async ({ page }) => {
    await page.click('text=Login')
    await page.click('text=Forgot Password?')
    await expect(page).toHaveURL('/forgot-password')

    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.click('[data-testid="reset-button"]')

    await expect(page.locator('[data-testid="success-message"]')).toContainText('Password reset email sent')
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await page.click('text=Login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Then logout
    await page.click('[data-testid="user-menu"]')
    await page.click('[data-testid="logout-button"]')

    // Should redirect to landing page
    await expect(page).toHaveURL('/')
  })

  test('should redirect to login when accessing protected routes', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL('/login')
  })

  test('should maintain login state after page refresh', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    await expect(page).toHaveURL('/dashboard')

    // Refresh page
    await page.reload()

    // Should still be on dashboard
    await expect(page).toHaveURL('/dashboard')
    await expect(page.locator('h1')).toContainText('Dashboard')
  })

  test('should handle session expiration', async ({ page }) => {
    // Login
    await page.click('text=Login')
    await page.fill('[data-testid="email-input"]', 'test@example.com')
    await page.fill('[data-testid="password-input"]', 'password123')
    await page.click('[data-testid="login-button"]')

    // Mock expired token by clearing localStorage
    await page.evaluate(() => {
      localStorage.setItem('token', 'expired-token')
    })

    // Try to navigate to protected route
    await page.goto('/profile')

    // Should redirect to login
    await expect(page).toHaveURL('/login')
  })
})