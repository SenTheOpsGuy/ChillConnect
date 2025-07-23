import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers, testBooking } from './fixtures/testData.js';

test.describe('Booking System Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Provider Search', () => {
    test('should display provider search page for seekers', async ({ page }) => {
      // Register and login as seeker
      const seeker = {
        ...testUsers.seeker,
        email: `seeker.${Date.now()}@example.com`
      };
      await helpers.register(seeker);
      await helpers.login(seeker.email, seeker.password);
      
      // Navigate to search
      await helpers.navigateToSearch();
      
      // Should see search form
      await helpers.expectElementToBeVisible('[data-testid="provider-search-form"]');
      await helpers.expectElementToBeVisible('[data-testid="location-input"]');
      await helpers.expectElementToBeVisible('[data-testid="service-filter"]');
      await helpers.expectElementToBeVisible('[data-testid="price-range-filter"]');
    });

    test('should filter providers by location', async ({ page }) => {
      // Login as seeker
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Search by location
      await helpers.fillForm({
        location: 'New York'
      });
      await helpers.submitForm('search-button');
      
      // Should show filtered results
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');
      await helpers.expectElementToBeVisible('[data-testid="provider-card"]');
    });

    test('should filter providers by service type', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Filter by service
      await page.selectOption('[data-testid="service-filter"]', 'Massage');
      await helpers.submitForm('search-button');
      
      // Should show filtered results
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');
    });

    test('should filter providers by price range', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Set price range
      await page.fill('[data-testid="min-price-input"]', '50');
      await page.fill('[data-testid="max-price-input"]', '200');
      await helpers.submitForm('search-button');
      
      // Should show filtered results
      await helpers.expectElementToBeVisible('[data-testid="provider-results"]');
    });

    test('should show provider details when clicked', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Click on first provider
      await page.click('[data-testid="provider-card"]:first-child');
      
      // Should show provider details
      await helpers.expectElementToBeVisible('[data-testid="provider-details"]');
      await helpers.expectElementToBeVisible('[data-testid="provider-name"]');
      await helpers.expectElementToBeVisible('[data-testid="provider-services"]');
      await helpers.expectElementToBeVisible('[data-testid="provider-rate"]');
      await helpers.expectElementToBeVisible('[data-testid="book-now-button"]');
    });
  });

  test.describe('Booking Creation', () => {
    test('should create a new booking successfully', async ({ page }) => {
      // Login as seeker
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Select provider and create booking
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      
      // Fill booking form
      await helpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T15:00',
        'booking-type': 'INCALL',
        notes: testBooking.notes
      });
      
      // Submit booking
      await helpers.submitForm('create-booking-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Booking created successfully!'
      );
    });

    test('should validate booking form fields', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Select provider and try to create booking without filling form
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      await helpers.submitForm('create-booking-button');
      
      // Should show validation errors
      await helpers.expectElementToBeVisible('[data-testid="start-time-error"]');
      await helpers.expectElementToBeVisible('[data-testid="end-time-error"]');
    });

    test('should calculate correct token amount', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Select provider and create booking
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      
      // Fill start and end time
      await helpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T16:00' // 2 hours
      });
      
      // Should calculate correct amount (2 hours * hourly rate)
      await helpers.expectElementToBeVisible('[data-testid="calculated-amount"]');
      const amount = await page.textContent('[data-testid="calculated-amount"]');
      expect(amount).toContain('200 tokens'); // Assuming 100 tokens/hour
    });

    test('should prevent booking with insufficient tokens', async ({ page }) => {
      // Login as seeker with no tokens
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToSearch();
      
      // Try to create expensive booking
      await page.click('[data-testid="provider-card"]:first-child');
      await page.click('[data-testid="book-now-button"]');
      
      await helpers.fillForm({
        'start-time': '2024-01-15T14:00',
        'end-time': '2024-01-15T20:00' // 6 hours (expensive)
      });
      
      await helpers.submitForm('create-booking-button');
      
      // Should show insufficient tokens error
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Insufficient tokens for this booking'
      );
    });
  });

  test.describe('Booking Management', () => {
    test('should display user bookings', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      
      // Navigate to bookings
      await page.click('[data-testid="bookings-link"]');
      
      // Should show bookings list
      await helpers.expectElementToBeVisible('[data-testid="bookings-list"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-card"]');
    });

    test('should allow seeker to cancel pending booking', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Cancel first pending booking
      await page.click('[data-testid="booking-card"]:first-child [data-testid="cancel-booking-button"]');
      
      // Confirm cancellation
      await page.click('[data-testid="confirm-cancel-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Booking cancelled successfully'
      );
    });

    test('should allow provider to accept booking', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Accept first pending booking
      await page.click('[data-testid="booking-card"]:first-child [data-testid="accept-booking-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Booking accepted successfully'
      );
    });

    test('should allow provider to reject booking', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Reject first pending booking
      await page.click('[data-testid="booking-card"]:first-child [data-testid="reject-booking-button"]');
      
      // Fill rejection reason
      await helpers.fillForm({
        'rejection-reason': 'Not available at this time'
      });
      await helpers.submitForm('confirm-reject-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });

    test('should show booking details', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Click on booking to view details
      await page.click('[data-testid="booking-card"]:first-child');
      
      // Should show booking details
      await helpers.expectElementToBeVisible('[data-testid="booking-details"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-status"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-time"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="provider-info"]');
    });

    test('should filter bookings by status', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Filter by status
      await page.selectOption('[data-testid="status-filter"]', 'CONFIRMED');
      
      // Should show only confirmed bookings
      const bookingCards = await page.locator('[data-testid="booking-card"]');
      const count = await bookingCards.count();
      
      for (let i = 0; i < count; i++) {
        const status = await bookingCards.nth(i).locator('[data-testid="booking-status"]').textContent();
        expect(status).toContain('CONFIRMED');
      }
    });
  });

  test.describe('Booking Completion', () => {
    test('should allow provider to mark booking as completed', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Mark first confirmed booking as completed
      await page.click('[data-testid="booking-card"]:first-child [data-testid="complete-booking-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Booking marked as completed'
      );
    });

    test('should release escrow tokens on completion', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      
      // Check wallet balance before
      await helpers.navigateToWallet();
      const balanceBefore = await page.textContent('[data-testid="token-balance"]');
      
      // Complete booking
      await page.click('[data-testid="bookings-link"]');
      await page.click('[data-testid="booking-card"]:first-child [data-testid="complete-booking-button"]');
      
      // Check wallet balance after
      await helpers.navigateToWallet();
      const balanceAfter = await page.textContent('[data-testid="token-balance"]');
      
      // Balance should have increased
      expect(parseInt(balanceAfter)).toBeGreaterThan(parseInt(balanceBefore));
    });

    test('should allow rating and review after completion', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Click on completed booking
      await page.click('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
      
      // Should show rating form
      await helpers.expectElementToBeVisible('[data-testid="rating-form"]');
      await helpers.expectElementToBeVisible('[data-testid="star-rating"]');
      await helpers.expectElementToBeVisible('[data-testid="review-textarea"]');
      
      // Submit rating
      await page.click('[data-testid="star-rating"] [data-rating="5"]');
      await helpers.fillForm({
        review: 'Great service!'
      });
      await helpers.submitForm('submit-rating-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });
  });

  test.describe('Booking Disputes', () => {
    test('should allow raising dispute for completed booking', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Click on completed booking
      await page.click('[data-testid="booking-card"][data-status="COMPLETED"]:first-child');
      
      // Raise dispute
      await page.click('[data-testid="raise-dispute-button"]');
      
      // Fill dispute form
      await helpers.fillForm({
        'dispute-reason': 'Service not as described',
        'dispute-details': 'The service provided was not what was agreed upon'
      });
      await helpers.submitForm('submit-dispute-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Dispute raised successfully'
      );
    });

    test('should prevent multiple disputes for same booking', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.click('[data-testid="bookings-link"]');
      
      // Click on booking with existing dispute
      await page.click('[data-testid="booking-card"][data-status="DISPUTED"]:first-child');
      
      // Dispute button should be disabled
      await helpers.expectElementToBeDisabled('[data-testid="raise-dispute-button"]');
    });
  });
});