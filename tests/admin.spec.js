import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers } from './fixtures/testData.js';

test.describe('Admin Panel Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Admin Dashboard', () => {
    test('should display admin dashboard for admin users', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await helpers.navigateToAdmin();
      
      // Should show admin dashboard
      await helpers.expectElementToBeVisible('[data-testid="admin-dashboard"]');
      await helpers.expectElementToBeVisible('[data-testid="stats-overview"]');
      await helpers.expectElementToBeVisible('[data-testid="recent-activity"]');
      await helpers.expectElementToBeVisible('[data-testid="quick-actions"]');
    });

    test('should display key metrics on dashboard', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await helpers.navigateToAdmin();
      
      // Should show key metrics
      await helpers.expectElementToBeVisible('[data-testid="total-users-metric"]');
      await helpers.expectElementToBeVisible('[data-testid="active-bookings-metric"]');
      await helpers.expectElementToBeVisible('[data-testid="pending-verifications-metric"]');
      await helpers.expectElementToBeVisible('[data-testid="revenue-metric"]');
    });

    test('should prevent non-admin users from accessing admin panel', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      
      // Try to access admin panel
      await page.goto('/admin/dashboard');
      
      // Should redirect to unauthorized page or dashboard
      await expect(page).not.toHaveURL('/admin/dashboard');
      await helpers.expectElementToBeVisible('[data-testid="unauthorized-message"]');
    });
  });

  test.describe('User Management', () => {
    test('should display user management page', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Should show user management interface
      await helpers.expectElementToBeVisible('[data-testid="user-management"]');
      await helpers.expectElementToBeVisible('[data-testid="user-search"]');
      await helpers.expectElementToBeVisible('[data-testid="user-filters"]');
      await helpers.expectElementToBeVisible('[data-testid="users-table"]');
    });

    test('should search users by email', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Search for user
      await helpers.fillForm({
        'user-search': testUsers.seeker.email
      });
      await helpers.submitForm('search-button');
      
      // Should show filtered results
      await helpers.expectElementToBeVisible('[data-testid="user-row"]');
      const userEmail = await page.textContent('[data-testid="user-row"]:first-child [data-testid="user-email"]');
      expect(userEmail).toBe(testUsers.seeker.email);
    });

    test('should filter users by role', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Filter by role
      await page.selectOption('[data-testid="role-filter"]', 'PROVIDER');
      
      // Should show only providers
      const userRows = await page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const role = await userRows.nth(i).locator('[data-testid="user-role"]').textContent();
        expect(role).toBe('PROVIDER');
      }
    });

    test('should filter users by verification status', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Filter by verification status
      await page.selectOption('[data-testid="verification-filter"]', 'VERIFIED');
      
      // Should show only verified users
      const userRows = await page.locator('[data-testid="user-row"]');
      const count = await userRows.count();
      
      for (let i = 0; i < count; i++) {
        const status = await userRows.nth(i).locator('[data-testid="verification-status"]').textContent();
        expect(status).toBe('VERIFIED');
      }
    });

    test('should view user details', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Click on user to view details
      await page.click('[data-testid="user-row"]:first-child [data-testid="view-user-button"]');
      
      // Should show user details modal
      await helpers.expectElementToBeVisible('[data-testid="user-details-modal"]');
      await helpers.expectElementToBeVisible('[data-testid="user-profile"]');
      await helpers.expectElementToBeVisible('[data-testid="user-bookings"]');
      await helpers.expectElementToBeVisible('[data-testid="user-transactions"]');
    });

    test('should suspend user account', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Click suspend button
      await page.click('[data-testid="user-row"]:first-child [data-testid="suspend-user-button"]');
      
      // Confirm suspension
      await helpers.fillForm({
        'suspension-reason': 'Violation of terms of service'
      });
      await helpers.submitForm('confirm-suspend-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'User suspended successfully'
      );
    });

    test('should unsuspend user account', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/users');
      
      // Click unsuspend button for suspended user
      await page.click('[data-testid="user-row"][data-status="SUSPENDED"]:first-child [data-testid="unsuspend-user-button"]');
      
      // Confirm unsuspension
      await helpers.submitForm('confirm-unsuspend-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });
  });

  test.describe('Verification Queue', () => {
    test('should display verification queue', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/verification-queue');
      
      // Should show verification queue
      await helpers.expectElementToBeVisible('[data-testid="verification-queue"]');
      await helpers.expectElementToBeVisible('[data-testid="verification-filters"]');
      await helpers.expectElementToBeVisible('[data-testid="verification-list"]');
    });

    test('should filter verifications by status', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/verification-queue');
      
      // Filter by pending status
      await page.selectOption('[data-testid="status-filter"]', 'PENDING');
      
      // Should show only pending verifications
      const verificationItems = await page.locator('[data-testid="verification-item"]');
      const count = await verificationItems.count();
      
      for (let i = 0; i < count; i++) {
        const status = await verificationItems.nth(i).locator('[data-testid="verification-status"]').textContent();
        expect(status).toBe('PENDING');
      }
    });

    test('should approve verification', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/verification-queue');
      
      // Click on pending verification
      await page.click('[data-testid="verification-item"][data-status="PENDING"]:first-child');
      
      // Should show verification details
      await helpers.expectElementToBeVisible('[data-testid="verification-details"]');
      await helpers.expectElementToBeVisible('[data-testid="document-preview"]');
      
      // Approve verification
      await page.click('[data-testid="approve-verification-button"]');
      
      // Add approval notes
      await helpers.fillForm({
        'approval-notes': 'Document verified successfully'
      });
      await helpers.submitForm('confirm-approve-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });

    test('should reject verification', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/verification-queue');
      
      // Click on pending verification
      await page.click('[data-testid="verification-item"][data-status="PENDING"]:first-child');
      
      // Reject verification
      await page.click('[data-testid="reject-verification-button"]');
      
      // Add rejection reason
      await helpers.fillForm({
        'rejection-reason': 'Document not clear enough'
      });
      await helpers.submitForm('confirm-reject-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });

    test('should assign verification to employee', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/verification-queue');
      
      // Click assign button
      await page.click('[data-testid="verification-item"]:first-child [data-testid="assign-verification-button"]');
      
      // Select employee
      await page.selectOption('[data-testid="employee-select"]', testUsers.employee.email);
      await helpers.submitForm('confirm-assign-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });
  });

  test.describe('Booking Monitoring', () => {
    test('should display booking monitoring page', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/booking-monitoring');
      
      // Should show booking monitoring interface
      await helpers.expectElementToBeVisible('[data-testid="booking-monitoring"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-filters"]');
      await helpers.expectElementToBeVisible('[data-testid="bookings-table"]');
      await helpers.expectElementToBeVisible('[data-testid="alerts-panel"]');
    });

    test('should filter bookings by status', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/booking-monitoring');
      
      // Filter by active bookings
      await page.selectOption('[data-testid="status-filter"]', 'IN_PROGRESS');
      
      // Should show only in-progress bookings
      const bookingRows = await page.locator('[data-testid="booking-row"]');
      const count = await bookingRows.count();
      
      for (let i = 0; i < count; i++) {
        const status = await bookingRows.nth(i).locator('[data-testid="booking-status"]').textContent();
        expect(status).toBe('IN_PROGRESS');
      }
    });

    test('should view booking details', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/booking-monitoring');
      
      // Click on booking
      await page.click('[data-testid="booking-row"]:first-child');
      
      // Should show booking details
      await helpers.expectElementToBeVisible('[data-testid="booking-details-modal"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-info"]');
      await helpers.expectElementToBeVisible('[data-testid="chat-history"]');
      await helpers.expectElementToBeVisible('[data-testid="booking-timeline"]');
    });

    test('should intervene in booking', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/booking-monitoring');
      
      // Click on booking
      await page.click('[data-testid="booking-row"]:first-child');
      
      // Intervene in booking
      await page.click('[data-testid="intervene-booking-button"]');
      
      // Add intervention reason
      await helpers.fillForm({
        'intervention-reason': 'Policy violation detected',
        'intervention-action': 'Cancel booking and refund'
      });
      await helpers.submitForm('confirm-intervention-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });

    test('should view and resolve alerts', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/booking-monitoring');
      
      // Click on alert
      await page.click('[data-testid="alert-item"]:first-child');
      
      // Should show alert details
      await helpers.expectElementToBeVisible('[data-testid="alert-details"]');
      await helpers.expectElementToBeVisible('[data-testid="alert-context"]');
      
      // Resolve alert
      await page.click('[data-testid="resolve-alert-button"]');
      
      // Add resolution notes
      await helpers.fillForm({
        'resolution-notes': 'False positive - no action required'
      });
      await helpers.submitForm('confirm-resolve-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });
  });

  test.describe('Reports and Analytics', () => {
    test('should display reports page', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/reports');
      
      // Should show reports interface
      await helpers.expectElementToBeVisible('[data-testid="reports-dashboard"]');
      await helpers.expectElementToBeVisible('[data-testid="report-filters"]');
      await helpers.expectElementToBeVisible('[data-testid="charts-section"]');
    });

    test('should generate user activity report', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/reports');
      
      // Select report type
      await page.selectOption('[data-testid="report-type-select"]', 'USER_ACTIVITY');
      
      // Set date range
      await helpers.fillForm({
        'start-date': '2024-01-01',
        'end-date': '2024-01-31'
      });
      
      // Generate report
      await helpers.submitForm('generate-report-button');
      
      // Should show report results
      await helpers.expectElementToBeVisible('[data-testid="report-results"]');
      await helpers.expectElementToBeVisible('[data-testid="activity-chart"]');
    });

    test('should export report data', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/reports');
      
      // Generate report first
      await page.selectOption('[data-testid="report-type-select"]', 'BOOKING_REVENUE');
      await helpers.submitForm('generate-report-button');
      
      // Export report
      await page.click('[data-testid="export-report-button"]');
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-button"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/booking-revenue-report.*\.csv/);
    });
  });

  test.describe('System Settings', () => {
    test('should display system settings page', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/settings');
      
      // Should show settings interface
      await helpers.expectElementToBeVisible('[data-testid="system-settings"]');
      await helpers.expectElementToBeVisible('[data-testid="general-settings"]');
      await helpers.expectElementToBeVisible('[data-testid="token-settings"]');
      await helpers.expectElementToBeVisible('[data-testid="security-settings"]');
    });

    test('should update token exchange rate', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/settings');
      
      // Update token rate
      await helpers.fillForm({
        'token-rate': '110' // 1 token = 110 INR
      });
      
      // Save settings
      await helpers.submitForm('save-settings-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });

    test('should update minimum token purchase', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/admin/settings');
      
      // Update minimum purchase
      await helpers.fillForm({
        'min-token-purchase': '20'
      });
      
      // Save settings
      await helpers.submitForm('save-settings-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
    });
  });
});