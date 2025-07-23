import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers, testBooking, testMessages } from './fixtures/testData.js';

test.describe('End-to-End Complete User Flows', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Complete Seeker Journey', () => {
    test('should complete full seeker journey from registration to booking completion', async ({ page }) => {
      const seeker = {
        ...testUsers.seeker,
        email: `e2e.seeker.${Date.now()}@example.com`
      };

      // 1. Registration
      await helpers.register(seeker);
      await helpers.expectElementToBeVisible('[data-testid="registration-success"]');

      // 2. Login
      await helpers.login(seeker.email, seeker.password);
      await helpers.expectToBeOnPage('/dashboard');

      // 3. Complete verification
      await page.goto('/verify');
      
      // Email verification (mock)
      await page.click('[data-testid="send-verification-email-button"]');
      await helpers.waitForSuccessMessage();
      
      // Phone verification (mock)
      await page.click('[data-testid="send-phone-otp-button"]');
      await helpers.fillForm({ 'otp-input': '123456' });
      await page.click('[data-testid="verify-otp-button"]');
      await helpers.waitForSuccessMessage();
      
      // Profile photo upload (mock)
      await helpers.mockFileUpload('[data-testid="photo-input"]', {
        success: true,
        data: { url: 'https://example.com/photo.jpg' }
      });
      const testPhoto = await helpers.createTestFile('profile.jpg', 'image/jpeg', 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', testPhoto);

      // 4. Purchase tokens
      await helpers.navigateToWallet();
      await page.click('[data-testid="purchase-tokens-button"]');
      await page.click('[data-testid="token-package"]:first-child [data-testid="buy-package-button"]');
      
      // Mock PayPal payment
      await helpers.mockAPIResponse('**/api/tokens/purchase', {
        success: true,
        data: { balance: 250, transaction_id: 'txn_123' }
      });
      await page.click('[data-testid="confirm-purchase-button"]');
      await helpers.waitForSuccessMessage();

      // 5. Search for providers
      await helpers.navigateToSearch();
      await helpers.fillForm({ location: 'New York' });
      await helpers.submitForm('search-button');
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');

      // 6. Create booking
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      
      await helpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T16:00',
        'booking-type': 'INCALL',
        notes: 'Test booking from e2e test'
      });
      
      await helpers.submitForm('create-booking-button');
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');

      // 7. Chat with provider
      await page.click('[data-testid="chat-with-provider-button"]');
      await helpers.fillForm({ 'message-input': 'Hello, looking forward to our appointment' });
      await helpers.submitForm('send-button');
      await helpers.expectElementToBeVisible('[data-testid="message-bubble"]');

      // 8. Complete booking flow
      await page.goto('/bookings');
      await page.click('[data-testid="booking-card"]:first-child');
      
      // Mock booking completion
      await helpers.mockAPIResponse('**/api/bookings/*/complete', {
        success: true,
        data: { status: 'COMPLETED' }
      });

      // 9. Rate and review
      await page.click('[data-testid="rate-booking-button"]');
      await page.click('[data-testid="star-rating"] [data-rating="5"]');
      await helpers.fillForm({ review: 'Excellent service!' });
      await helpers.submitForm('submit-rating-button');
      await helpers.waitForSuccessMessage();

      // Verify final state
      await helpers.expectElementToHaveText('[data-testid="booking-status"]', 'COMPLETED');
    });
  });

  test.describe('Complete Provider Journey', () => {
    test('should complete full provider journey from registration to earnings withdrawal', async ({ page }) => {
      const provider = {
        ...testUsers.provider,
        email: `e2e.provider.${Date.now()}@example.com`
      };

      // 1. Registration
      await helpers.register(provider);
      await helpers.expectElementToBeVisible('[data-testid="registration-success"]');

      // 2. Login
      await helpers.login(provider.email, provider.password);
      await helpers.expectToBeOnPage('/dashboard');

      // 3. Complete verification
      await page.goto('/verify');
      
      // Complete all verification steps (mocked)
      await page.click('[data-testid="send-verification-email-button"]');
      await helpers.waitForSuccessMessage();
      
      await page.click('[data-testid="send-phone-otp-button"]');
      await helpers.fillForm({ 'otp-input': '123456' });
      await page.click('[data-testid="verify-otp-button"]');
      
      // Upload documents
      await page.selectOption('[data-testid="document-type-select"]', 'ID');
      await helpers.mockFileUpload('[data-testid="document-input"]', {
        success: true,
        data: { documents: [{ url: 'https://example.com/id.pdf' }] }
      });
      const testDoc = await helpers.createTestFile('id.pdf', 'application/pdf', 1024);
      await helpers.uploadFile('[data-testid="document-input"]', testDoc);
      await page.click('[data-testid="upload-documents-button"]');

      // 4. Set up profile and services
      await helpers.navigateToProfile();
      await helpers.fillForm({
        bio: 'Professional service provider',
        'hourly-rate': '150',
        services: 'Massage, Companionship'
      });
      await helpers.submitForm('update-profile-button');

      // 5. Set availability
      await page.click('[data-testid="availability-tab"]');
      await page.click('[data-testid="add-availability-button"]');
      await helpers.fillForm({
        'available-date': '2024-01-15',
        'start-time': '10:00',
        'end-time': '18:00'
      });
      await helpers.submitForm('save-availability-button');

      // 6. Receive and accept booking
      await page.goto('/bookings');
      
      // Mock incoming booking
      await helpers.mockAPIResponse('**/api/bookings/my-bookings', {
        success: true,
        data: [{
          id: 'booking-123',
          status: 'PENDING',
          seeker: { name: 'John Doe' },
          startTime: '2024-01-15T14:00',
          endTime: '2024-01-15T16:00',
          tokenAmount: 300
        }]
      });
      
      await page.reload();
      await helpers.expectElementToBeVisible('[data-testid="booking-card"]');
      
      // Accept booking
      await page.click('[data-testid="accept-booking-button"]');
      await helpers.waitForSuccessMessage();

      // 7. Chat with seeker
      await page.click('[data-testid="chat-button"]');
      await helpers.fillForm({ 'message-input': 'Thank you for booking. See you at 2 PM!' });
      await helpers.submitForm('send-button');

      // 8. Complete service
      await page.goto('/bookings');
      await page.click('[data-testid="booking-card"]:first-child [data-testid="complete-booking-button"]');
      await helpers.waitForSuccessMessage();

      // 9. Check earnings
      await helpers.navigateToWallet();
      await helpers.expectElementToBeVisible('[data-testid="earnings-balance"]');
      
      // 10. Withdraw earnings
      await page.click('[data-testid="withdraw-button"]');
      await helpers.fillForm({
        'withdrawal-amount-input': '200',
        'withdrawal-method-select': 'BANK_TRANSFER'
      });
      await helpers.submitForm('submit-withdrawal-button');
      await helpers.waitForSuccessMessage();

      // Verify final state
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-pending"]');
    });
  });

  test.describe('Complete Admin Workflow', () => {
    test('should complete admin verification and monitoring workflow', async ({ page }) => {
      // 1. Login as admin
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await helpers.navigateToAdmin();

      // 2. Process verification queue
      await page.goto('/admin/verification-queue');
      await helpers.expectElementToBeVisible('[data-testid="verification-queue"]');
      
      // Filter pending verifications
      await page.selectOption('[data-testid="status-filter"]', 'PENDING');
      
      // Process first verification
      await page.click('[data-testid="verification-item"]:first-child');
      await helpers.expectElementToBeVisible('[data-testid="verification-details"]');
      
      // Approve verification
      await page.click('[data-testid="approve-verification-button"]');
      await helpers.fillForm({
        'approval-notes': 'Document verified successfully'
      });
      await helpers.submitForm('confirm-approve-button');
      await helpers.waitForSuccessMessage();

      // 3. Monitor active bookings
      await page.goto('/admin/booking-monitoring');
      await helpers.expectElementToBeVisible('[data-testid="booking-monitoring"]');
      
      // Filter active bookings
      await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
      
      // Review booking details
      await page.click('[data-testid="booking-row"]:first-child');
      await helpers.expectElementToBeVisible('[data-testid="booking-details-modal"]');
      await helpers.expectElementToBeVisible('[data-testid="chat-history"]');

      // 4. Handle alerts
      await helpers.expectElementToBeVisible('[data-testid="alerts-panel"]');
      await page.click('[data-testid="alert-item"]:first-child');
      
      // Resolve alert
      await page.click('[data-testid="resolve-alert-button"]');
      await helpers.fillForm({
        'resolution-notes': 'False positive - no action required'
      });
      await helpers.submitForm('confirm-resolve-button');
      await helpers.waitForSuccessMessage();

      // 5. User management
      await page.goto('/admin/users');
      
      // Search for user
      await helpers.fillForm({ 'user-search': 'test@example.com' });
      await helpers.submitForm('search-button');
      
      // View user details
      await page.click('[data-testid="view-user-button"]:first-child');
      await helpers.expectElementToBeVisible('[data-testid="user-details-modal"]');

      // 6. Generate reports
      await page.goto('/admin/reports');
      await page.selectOption('[data-testid="report-type-select"]', 'USER_ACTIVITY');
      await helpers.fillForm({
        'start-date': '2024-01-01',
        'end-date': '2024-01-31'
      });
      await helpers.submitForm('generate-report-button');
      await helpers.expectElementToBeVisible('[data-testid="report-results"]');

      // Verify admin workflow completion
      await helpers.expectElementToBeVisible('[data-testid="activity-chart"]');
    });
  });

  test.describe('Cross-Role Integration', () => {
    test('should handle booking flow between seeker and provider with admin monitoring', async ({ page, context }) => {
      // Create multiple browser contexts for different users
      const seekerPage = page;
      const providerPage = await context.newPage();
      const adminPage = await context.newPage();

      const seekerHelpers = new TestHelpers(seekerPage);
      const providerHelpers = new TestHelpers(providerPage);
      const adminHelpers = new TestHelpers(adminPage);

      // 1. Seeker creates booking
      await seekerHelpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await seekerPage.goto('/search');
      
      await seekerPage.click('[data-testid="provider-card"]:first-child');
      await seekerPage.click('[data-testid="book-now-button"]');
      
      await seekerHelpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T16:00',
        'booking-type': 'INCALL'
      });
      await seekerHelpers.submitForm('create-booking-button');
      
      const bookingId = await seekerPage.getAttribute('[data-testid="booking-id"]', 'data-booking-id');

      // 2. Provider receives and accepts booking
      await providerHelpers.login(testUsers.provider.email, testUsers.provider.password);
      await providerPage.goto('/bookings');
      
      await providerPage.click(`[data-testid="booking-card"][data-booking-id="${bookingId}"] [data-testid="accept-booking-button"]`);
      await providerHelpers.waitForSuccessMessage();

      // 3. Admin monitors the booking
      await adminHelpers.login(testUsers.admin.email, testUsers.admin.password);
      await adminPage.goto('/admin/booking-monitoring');
      
      await adminPage.click(`[data-testid="booking-row"][data-booking-id="${bookingId}"]`);
      await adminHelpers.expectElementToBeVisible('[data-testid="booking-details-modal"]');

      // 4. Seeker and provider chat (monitored by admin)
      await seekerPage.goto(`/chat/${bookingId}`);
      await seekerHelpers.fillForm({
        'message-input': 'Looking forward to our appointment'
      });
      await seekerHelpers.submitForm('send-button');

      // Provider responds
      await providerPage.goto(`/chat/${bookingId}`);
      await providerHelpers.fillForm({
        'message-input': 'Me too! See you at 2 PM'
      });
      await providerHelpers.submitForm('send-button');

      // Admin sees the chat
      await adminHelpers.expectElementToBeVisible('[data-testid="chat-history"]');
      const messages = await adminPage.locator('[data-testid="chat-message"]').count();
      expect(messages).toBeGreaterThan(0);

      // 5. Complete booking flow
      await providerPage.goto('/bookings');
      await providerPage.click(`[data-testid="booking-card"][data-booking-id="${bookingId}"] [data-testid="complete-booking-button"]`);
      
      // 6. Verify completion across all contexts
      await seekerPage.goto('/bookings');
      await seekerHelpers.expectElementToHaveText(
        `[data-testid="booking-card"][data-booking-id="${bookingId}"] [data-testid="booking-status"]`,
        'COMPLETED'
      );

      await adminHelpers.expectElementToHaveText(
        `[data-testid="booking-row"][data-booking-id="${bookingId}"] [data-testid="booking-status"]`,
        'COMPLETED'
      );
    });
  });

  test.describe('Error Recovery Flows', () => {
    test('should handle and recover from payment failures', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();

      // Mock payment failure
      await helpers.mockAPIResponse('**/api/tokens/purchase', {
        success: false,
        error: 'Payment processing failed'
      });

      // Attempt token purchase
      await page.click('[data-testid="purchase-tokens-button"]');
      await page.click('[data-testid="token-package"]:first-child [data-testid="buy-package-button"]');
      
      // Should show error message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      
      // Should offer retry option
      await helpers.expectElementToBeVisible('[data-testid="retry-payment-button"]');
      
      // Mock successful retry
      await helpers.mockAPIResponse('**/api/tokens/purchase', {
        success: true,
        data: { balance: 250, transaction_id: 'txn_retry_123' }
      });
      
      // Retry payment
      await page.click('[data-testid="retry-payment-button"]');
      await helpers.waitForSuccessMessage();
      
      // Verify successful recovery
      await helpers.expectElementToBeVisible('[data-testid="purchase-success"]');
    });

    test('should handle booking conflicts gracefully', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();

      // Select provider and time slot
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      
      // Mock booking conflict
      await helpers.mockAPIResponse('**/api/bookings/create', {
        success: false,
        error: 'Time slot no longer available'
      });

      await helpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T16:00'
      });
      await helpers.submitForm('create-booking-button');
      
      // Should show conflict message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Time slot no longer available'
      );
      
      // Should suggest alternative times
      await helpers.expectElementToBeVisible('[data-testid="alternative-times"]');
      
      // Select alternative time
      await page.click('[data-testid="alternative-time"]:first-child');
      await helpers.submitForm('create-booking-button');
      
      // Should succeed with alternative time
      await helpers.waitForSuccessMessage();
    });
  });

  test.describe('Performance and Load Testing', () => {
    test('should handle multiple concurrent users', async ({ page, context }) => {
      const userContexts = [];
      const userPages = [];

      // Create multiple user contexts
      for (let i = 0; i < 5; i++) {
        const newContext = await context.newPage();
        userContexts.push(newContext);
        userPages.push(new TestHelpers(newContext));
      }

      // Simulate concurrent logins
      const loginPromises = userPages.map(async (userHelper, index) => {
        const user = {
          ...testUsers.seeker,
          email: `concurrent.user.${index}@example.com`
        };
        await userHelper.register(user);
        await userHelper.login(user.email, user.password);
        return userHelper.expectToBeOnPage('/dashboard');
      });

      // Wait for all logins to complete
      await Promise.all(loginPromises);

      // Simulate concurrent booking searches
      const searchPromises = userPages.map(async (userHelper) => {
        await userHelper.navigateToSearch();
        await userHelper.fillForm({ location: 'New York' });
        await userHelper.submitForm('search-button');
        return userHelper.expectElementToBeVisible('[data-testid="provider-results"]');
      });

      // Verify all searches complete successfully
      await Promise.all(searchPromises);

      // Cleanup
      await Promise.all(userContexts.map(ctx => ctx.close()));
    });

    test('should maintain performance under load', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);

      // Measure page load times
      const startTime = Date.now();
      await helpers.navigateToSearch();
      const searchLoadTime = Date.now() - startTime;

      // Search should load within 3 seconds
      expect(searchLoadTime).toBeLessThan(3000);

      // Measure search response time
      const searchStartTime = Date.now();
      await helpers.fillForm({ location: 'New York' });
      await helpers.submitForm('search-button');
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');
      const searchResponseTime = Date.now() - searchStartTime;

      // Search should respond within 2 seconds
      expect(searchResponseTime).toBeLessThan(2000);
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work correctly on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);

      // Test mobile navigation
      await helpers.expectElementToBeVisible('[data-testid="mobile-menu-button"]');
      await page.click('[data-testid="mobile-menu-button"]');
      await helpers.expectElementToBeVisible('[data-testid="mobile-menu"]');

      // Test mobile booking flow
      await helpers.navigateToSearch();
      await helpers.expectElementToBeVisible('[data-testid="mobile-search-form"]');
      
      // Search should work on mobile
      await helpers.fillForm({ location: 'New York' });
      await helpers.submitForm('search-button');
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');

      // Provider cards should be mobile-optimized
      await helpers.expectElementToBeVisible('[data-testid="mobile-provider-card"]');
    });

    test('should handle touch interactions correctly', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);

      await helpers.navigateToWallet();

      // Test touch interactions
      await page.tap('[data-testid="purchase-tokens-button"]');
      await helpers.expectElementToBeVisible('[data-testid="token-packages"]');

      // Test swipe gestures for token packages
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.tap(300, 300);
      
      await helpers.expectElementToBeVisible('[data-testid="token-package"]');
    });
  });
});