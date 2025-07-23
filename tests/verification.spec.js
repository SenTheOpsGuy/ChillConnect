import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers, testFiles } from './fixtures/testData.js';

test.describe('Verification System Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Email Verification', () => {
    test('should display email verification prompt for unverified users', async ({ page }) => {
      // Register new user
      const newUser = {
        ...testUsers.seeker,
        email: `unverified.${Date.now()}@example.com`
      };
      await helpers.register(newUser);
      
      // Login and check for verification prompt
      await helpers.login(newUser.email, newUser.password);
      await page.goto('/verify');
      
      // Should show email verification section
      await helpers.expectElementToBeVisible('[data-testid="email-verification-section"]');
      await helpers.expectElementToHaveText(
        '[data-testid="verification-status"]',
        'Email not verified'
      );
    });

    test('should send verification email', async ({ page }) => {
      const newUser = {
        ...testUsers.seeker,
        email: `verify.${Date.now()}@example.com`
      };
      await helpers.register(newUser);
      await helpers.login(newUser.email, newUser.password);
      await page.goto('/verify');
      
      // Send verification email
      await page.click('[data-testid="send-verification-email-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Verification email sent! Please check your inbox.'
      );
    });

    test('should prevent resending email too frequently', async ({ page }) => {
      const newUser = {
        ...testUsers.seeker,
        email: `ratelimit.${Date.now()}@example.com`
      };
      await helpers.register(newUser);
      await helpers.login(newUser.email, newUser.password);
      await page.goto('/verify');
      
      // Send first email
      await page.click('[data-testid="send-verification-email-button"]');
      await helpers.waitForSuccessMessage();
      
      // Try to send again immediately
      await page.click('[data-testid="send-verification-email-button"]');
      
      // Should show rate limit message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Please wait before requesting another verification email'
      );
    });
  });

  test.describe('Phone Verification', () => {
    test('should display phone verification section', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show phone verification section
      await helpers.expectElementToBeVisible('[data-testid="phone-verification-section"]');
      await helpers.expectElementToBeVisible('[data-testid="phone-number-display"]');
      await helpers.expectElementToBeVisible('[data-testid="send-phone-otp-button"]');
    });

    test('should send phone OTP', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Send OTP
      await page.click('[data-testid="send-phone-otp-button"]');
      
      // Should show OTP input
      await helpers.expectElementToBeVisible('[data-testid="otp-input"]');
      await helpers.expectElementToBeVisible('[data-testid="verify-otp-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Verification code sent to your phone'
      );
    });

    test('should verify phone OTP', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Send OTP
      await page.click('[data-testid="send-phone-otp-button"]');
      await helpers.waitForSuccessMessage();
      
      // Enter valid OTP (mock)
      await helpers.fillForm({
        'otp-input': '123456'
      });
      await page.click('[data-testid="verify-otp-button"]');
      
      // Should show verification success
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Phone verified successfully!'
      );
    });

    test('should handle invalid OTP', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Send OTP
      await page.click('[data-testid="send-phone-otp-button"]');
      await helpers.waitForSuccessMessage();
      
      // Enter invalid OTP
      await helpers.fillForm({
        'otp-input': '000000'
      });
      await page.click('[data-testid="verify-otp-button"]');
      
      // Should show error message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Invalid verification code'
      );
    });

    test('should require phone number update if missing', async ({ page }) => {
      // Login with user without phone number
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show phone update prompt
      await helpers.expectElementToBeVisible('[data-testid="phone-update-prompt"]');
      await helpers.expectElementToHaveText(
        '[data-testid="phone-update-prompt"]',
        'Please update your phone number in your profile first'
      );
    });
  });

  test.describe('Profile Photo Upload', () => {
    test('should display profile photo upload section', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show profile photo section
      await helpers.expectElementToBeVisible('[data-testid="profile-photo-section"]');
      await helpers.expectElementToBeVisible('[data-testid="profile-photo-upload"]');
    });

    test('should upload profile photo successfully', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Mock file upload
      await helpers.mockFileUpload('[data-testid="photo-input"]', {
        success: true,
        data: { url: 'https://example.com/photo.jpg' }
      });
      
      // Upload photo
      const testPhoto = await helpers.createTestFile('profile.jpg', 'image/jpeg', 1024 * 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', testPhoto);
      
      // Should show upload success
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Profile photo updated!'
      );
    });

    test('should validate photo file size', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Try to upload oversized photo
      const oversizedPhoto = await helpers.createTestFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', oversizedPhoto);
      
      // Should show size error
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'File size too large. Maximum size is 10MB.'
      );
    });

    test('should validate photo file type', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Try to upload invalid file type
      const invalidFile = await helpers.createTestFile('document.pdf', 'application/pdf', 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', invalidFile);
      
      // Should show type error
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Please select a valid image file'
      );
    });
  });

  test.describe('Document Upload', () => {
    test('should display document upload section', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Should show document upload section
      await helpers.expectElementToBeVisible('[data-testid="document-upload-section"]');
      await helpers.expectElementToBeVisible('[data-testid="document-type-select"]');
      await helpers.expectElementToBeVisible('[data-testid="document-upload-area"]');
    });

    test('should select document type', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Select document type
      await page.selectOption('[data-testid="document-type-select"]', 'Passport');
      
      // Should update upload area
      await helpers.expectElementToHaveText(
        '[data-testid="document-type-label"]',
        'Upload Passport Document'
      );
    });

    test('should upload document successfully', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Select document type
      await page.selectOption('[data-testid="document-type-select"]', 'ID');
      
      // Mock file upload
      await helpers.mockFileUpload('[data-testid="document-input"]', {
        success: true,
        data: { documents: [{ url: 'https://example.com/id.pdf', type: 'ID' }] }
      });
      
      // Upload document
      const testDocument = await helpers.createTestFile('id.pdf', 'application/pdf', 2 * 1024 * 1024);
      await helpers.uploadFile('[data-testid="document-input"]', testDocument);
      
      // Submit upload
      await page.click('[data-testid="upload-documents-button"]');
      
      // Should show upload success
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Documents uploaded successfully!'
      );
    });

    test('should display upload requirements', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Should show requirements
      await helpers.expectElementToBeVisible('[data-testid="upload-requirements"]');
      await helpers.expectElementToHaveText(
        '[data-testid="upload-requirements"]',
        'Document must be clear and readable'
      );
    });

    test('should support multiple file upload', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Upload multiple files
      const file1 = await helpers.createTestFile('id-front.jpg', 'image/jpeg', 1024 * 1024);
      const file2 = await helpers.createTestFile('id-back.jpg', 'image/jpeg', 1024 * 1024);
      
      await helpers.uploadFile('[data-testid="document-input"]', [file1, file2]);
      
      // Should show both files in preview
      await helpers.expectElementToBeVisible('[data-testid="selected-files"]');
      const fileCount = await page.locator('[data-testid="file-preview"]').count();
      expect(fileCount).toBe(2);
    });

    test('should remove selected files', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Upload file
      const testFile = await helpers.createTestFile('test.pdf', 'application/pdf', 1024);
      await helpers.uploadFile('[data-testid="document-input"]', testFile);
      
      // Remove file
      await page.click('[data-testid="remove-file-button"]:first-child');
      
      // File should be removed
      const fileCount = await page.locator('[data-testid="file-preview"]').count();
      expect(fileCount).toBe(0);
    });
  });

  test.describe('Verification Status', () => {
    test('should display overall verification progress', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show progress steps
      await helpers.expectElementToBeVisible('[data-testid="verification-progress"]');
      await helpers.expectElementToBeVisible('[data-testid="progress-step"]');
      
      // Should show completion percentage
      await helpers.expectElementToBeVisible('[data-testid="completion-percentage"]');
    });

    test('should show verification completion message', async ({ page }) => {
      // Login with fully verified user
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/verify');
      
      // Should show completion message
      await helpers.expectElementToBeVisible('[data-testid="verification-complete"]');
      await helpers.expectElementToHaveText(
        '[data-testid="verification-complete"]',
        'Verification Complete!'
      );
    });

    test('should show pending verification status', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Should show pending status
      await helpers.expectElementToBeVisible('[data-testid="verification-pending"]');
      await helpers.expectElementToHaveText(
        '[data-testid="verification-pending"]',
        'Documents uploaded for verification!'
      );
    });

    test('should display verification timeline', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show verification steps with status
      const steps = [
        'Email Verification',
        'Phone Verification', 
        'Profile Photo',
        'Identity Verification'
      ];
      
      for (const step of steps) {
        await helpers.expectElementToBeVisible(`[data-testid="step-${step.toLowerCase().replace(/\s+/g, '-')}"]`);
      }
    });

    test('should redirect to dashboard when verification complete', async ({ page }) => {
      // Login with fully verified user
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      await page.goto('/verify');
      
      // Click go to dashboard button
      await page.click('[data-testid="go-to-dashboard-button"]');
      
      // Should redirect to dashboard
      await helpers.expectToBeOnPage('/dashboard');
    });
  });

  test.describe('Verification Requirements', () => {
    test('should display age verification requirement', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show age verification info
      await helpers.expectElementToBeVisible('[data-testid="age-verification-info"]');
      await helpers.expectElementToHaveText(
        '[data-testid="age-verification-info"]',
        '18+ age verification required'
      );
    });

    test('should show different requirements for providers', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Providers should have additional requirements
      await helpers.expectElementToBeVisible('[data-testid="provider-requirements"]');
      await helpers.expectElementToHaveText(
        '[data-testid="provider-requirements"]',
        'Additional verification required for service providers'
      );
    });

    test('should display verification guidelines', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Should show guidelines
      await helpers.expectElementToBeVisible('[data-testid="verification-guidelines"]');
      await helpers.expectElementToHaveText(
        '[data-testid="verification-guidelines"]',
        'All corners must be visible'
      );
    });

    test('should show estimated verification time', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await page.goto('/verify');
      
      // Should show time estimate
      await helpers.expectElementToBeVisible('[data-testid="verification-time-estimate"]');
      await helpers.expectElementToHaveText(
        '[data-testid="verification-time-estimate"]',
        'Verification typically takes 24-48 hours'
      );
    });
  });

  test.describe('Verification Error Handling', () => {
    test('should handle upload failures gracefully', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Mock upload failure
      await helpers.mockFileUpload('[data-testid="photo-input"]', {
        success: false,
        error: 'Upload failed'
      });
      
      // Try to upload
      const testPhoto = await helpers.createTestFile('photo.jpg', 'image/jpeg', 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', testPhoto);
      
      // Should show error message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Failed to upload file'
      );
    });

    test('should handle network errors', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Mock network error
      await page.route('**/api/auth/send-phone-otp', route => {
        route.abort();
      });
      
      // Try to send OTP
      await page.click('[data-testid="send-phone-otp-button"]');
      
      // Should show network error
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Network error. Please try again.'
      );
    });

    test('should show retry options on failure', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/verify');
      
      // Mock upload failure
      await helpers.mockFileUpload('[data-testid="photo-input"]', {
        success: false,
        error: 'Upload failed'
      });
      
      // Try to upload
      const testPhoto = await helpers.createTestFile('photo.jpg', 'image/jpeg', 1024);
      await helpers.uploadFile('[data-testid="photo-input"]', testPhoto);
      
      // Should show retry button
      await helpers.expectElementToBeVisible('[data-testid="retry-upload-button"]');
    });
  });
});