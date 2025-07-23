import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers } from './fixtures/testData.js';

test.describe('Authentication Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Registration', () => {
    test('should register a new seeker successfully', async ({ page }) => {
      const newSeeker = {
        ...testUsers.seeker,
        email: `seeker.${Date.now()}@example.com`
      };

      await helpers.register(newSeeker);
      
      // Verify registration success
      await helpers.expectElementToBeVisible('[data-testid="registration-success"]');
      await helpers.expectElementToHaveText(
        '[data-testid="registration-success"]',
        'Registration successful! Please check your email to verify your account.'
      );
    });

    test('should register a new provider successfully', async ({ page }) => {
      const newProvider = {
        ...testUsers.provider,
        email: `provider.${Date.now()}@example.com`
      };

      await helpers.register(newProvider);
      
      // Verify registration success
      await helpers.expectElementToBeVisible('[data-testid="registration-success"]');
    });

    test('should show validation errors for invalid registration data', async ({ page }) => {
      await page.goto('/register');
      
      // Try to submit empty form
      await helpers.submitForm('register-button');
      
      // Check for validation errors
      await helpers.expectElementToBeVisible('[data-testid="email-error"]');
      await helpers.expectElementToBeVisible('[data-testid="password-error"]');
      await helpers.expectElementToBeVisible('[data-testid="first-name-error"]');
      await helpers.expectElementToBeVisible('[data-testid="last-name-error"]');
    });

    test('should prevent registration with existing email', async ({ page }) => {
      await helpers.register(testUsers.seeker);
      
      // Try to register with same email again
      await helpers.register(testUsers.seeker);
      
      // Should show error message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Email already exists'
      );
    });

    test('should require age verification checkbox', async ({ page }) => {
      await page.goto('/register');
      
      // Fill form but don't check age verification
      await helpers.fillForm({
        email: 'test@example.com',
        password: 'TestPassword123!',
        'confirm-password': 'TestPassword123!',
        'first-name': 'Test',
        'last-name': 'User',
        'date-of-birth': '1990-01-01',
        phone: '+1234567890'
      });
      
      await page.selectOption('[data-testid="role-select"]', 'SEEKER');
      await page.check('[data-testid="terms-checkbox"]');
      await page.check('[data-testid="privacy-checkbox"]');
      
      // Try to submit without age verification
      await helpers.submitForm('register-button');
      
      // Should show validation error
      await helpers.expectElementToBeVisible('[data-testid="age-verification-error"]');
    });
  });

  test.describe('Login', () => {
    test('should login with valid admin credentials', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      
      // Should be on dashboard
      await helpers.expectToBeOnPage('/dashboard');
      await helpers.expectElementToBeVisible('[data-testid="dashboard-header"]');
    });

    test('should login with valid seeker credentials', async ({ page }) => {
      // First register a seeker
      const seeker = {
        ...testUsers.seeker,
        email: `seeker.${Date.now()}@example.com`
      };
      await helpers.register(seeker);
      
      // Then login
      await helpers.login(seeker.email, seeker.password);
      
      // Should be on dashboard
      await helpers.expectToBeOnPage('/dashboard');
    });

    test('should show error for invalid credentials', async ({ page }) => {
      await page.goto('/login');
      await helpers.fillForm({
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      await helpers.submitForm('login-button');
      
      // Should show error message
      await helpers.expectElementToBeVisible('[data-testid="error-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="error-message"]',
        'Invalid credentials'
      );
    });

    test('should show validation errors for empty fields', async ({ page }) => {
      await page.goto('/login');
      await helpers.submitForm('login-button');
      
      // Should show validation errors
      await helpers.expectElementToBeVisible('[data-testid="email-error"]');
      await helpers.expectElementToBeVisible('[data-testid="password-error"]');
    });

    test('should redirect to login when accessing protected routes', async ({ page }) => {
      await page.goto('/dashboard');
      
      // Should redirect to login
      await helpers.expectToBeOnPage('/login');
    });
  });

  test.describe('Logout', () => {
    test('should logout successfully', async ({ page }) => {
      // Login first
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      
      // Then logout
      await helpers.logout();
      
      // Should be on login page
      await helpers.expectToBeOnPage('/login');
      
      // Should not be able to access protected routes
      await page.goto('/dashboard');
      await helpers.expectToBeOnPage('/login');
    });
  });

  test.describe('Email Verification', () => {
    test('should show email verification prompt for unverified users', async ({ page }) => {
      // Register new user
      const newUser = {
        ...testUsers.seeker,
        email: `unverified.${Date.now()}@example.com`
      };
      await helpers.register(newUser);
      
      // Login
      await helpers.login(newUser.email, newUser.password);
      
      // Should show email verification prompt
      await helpers.expectElementToBeVisible('[data-testid="email-verification-prompt"]');
    });

    test('should allow resending verification email', async ({ page }) => {
      // Register and login
      const newUser = {
        ...testUsers.seeker,
        email: `resend.${Date.now()}@example.com`
      };
      await helpers.register(newUser);
      await helpers.login(newUser.email, newUser.password);
      
      // Click resend verification email
      await page.click('[data-testid="resend-verification-button"]');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Verification email sent! Please check your inbox.'
      );
    });
  });

  test.describe('Password Reset', () => {
    test('should show forgot password form', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="forgot-password-link"]');
      
      // Should show forgot password form
      await helpers.expectElementToBeVisible('[data-testid="forgot-password-form"]');
    });

    test('should send password reset email', async ({ page }) => {
      await page.goto('/login');
      await page.click('[data-testid="forgot-password-link"]');
      
      // Fill email and submit
      await helpers.fillForm({
        email: testUsers.admin.email
      });
      await helpers.submitForm('send-reset-email-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Password reset email sent! Please check your inbox.'
      );
    });
  });

  test.describe('Session Management', () => {
    test('should maintain session across page reloads', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      
      // Reload page
      await page.reload();
      
      // Should still be logged in
      await helpers.expectToBeOnPage('/dashboard');
    });

    test('should handle expired sessions gracefully', async ({ page }) => {
      await helpers.login(testUsers.admin.email, testUsers.admin.password);
      
      // Simulate expired token
      await page.evaluate(() => {
        localStorage.setItem('token', 'expired.token.here');
      });
      
      // Navigate to protected route
      await page.goto('/profile');
      
      // Should redirect to login
      await helpers.expectToBeOnPage('/login');
    });
  });
});