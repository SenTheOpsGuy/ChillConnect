import { expect } from '@playwright/test';

export class TestHelpers {
  constructor(page) {
    this.page = page;
  }

  // Authentication helpers
  async login(email, password) {
    await this.page.goto('/login');
    await this.page.fill('[data-testid="email-input"]', email);
    await this.page.fill('[data-testid="password-input"]', password);
    await this.page.click('[data-testid="login-button"]');
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('/dashboard');
    await expect(this.page).toHaveURL('/dashboard');
  }

  async logout() {
    await this.page.click('[data-testid="user-menu"]');
    await this.page.click('[data-testid="logout-button"]');
    await this.page.waitForURL('/login');
  }

  async register(userData) {
    await this.page.goto('/register');
    
    // Fill registration form
    await this.page.fill('[data-testid="email-input"]', userData.email);
    await this.page.fill('[data-testid="password-input"]', userData.password);
    await this.page.fill('[data-testid="confirm-password-input"]', userData.password);
    await this.page.fill('[data-testid="first-name-input"]', userData.firstName);
    await this.page.fill('[data-testid="last-name-input"]', userData.lastName);
    await this.page.fill('[data-testid="date-of-birth-input"]', userData.dateOfBirth);
    await this.page.fill('[data-testid="phone-input"]', userData.phone);
    
    // Select role
    await this.page.click(`[data-testid="role-select"][value="${userData.role}"]`);
    
    // Accept terms and age verification
    await this.page.check('[data-testid="age-verification-checkbox"]');
    await this.page.check('[data-testid="terms-checkbox"]');
    
    // Submit form
    await this.page.click('[data-testid="register-button"]');
    
    // Wait for success message or redirect
    await this.page.waitForSelector('[data-testid="registration-success"]', { timeout: 10000 });
  }

  // Navigation helpers
  async navigateToProfile() {
    await this.page.click('[data-testid="profile-link"]');
    await this.page.waitForURL('/profile');
  }

  async navigateToWallet() {
    await this.page.click('[data-testid="wallet-link"]');
    await this.page.waitForURL('/wallet');
  }

  async navigateToMessages() {
    await this.page.click('[data-testid="messages-link"]');
    await this.page.waitForURL('/messages');
  }

  async navigateToSearch() {
    await this.page.click('[data-testid="search-link"]');
    await this.page.waitForURL('/search');
  }

  async navigateToAdmin() {
    await this.page.click('[data-testid="admin-link"]');
    await this.page.waitForURL('/admin/dashboard');
  }

  // Form helpers
  async fillForm(formData) {
    for (const [field, value] of Object.entries(formData)) {
      const selector = `[data-testid="${field}-input"]`;
      await this.page.fill(selector, value);
    }
  }

  async submitForm(buttonTestId = 'submit-button') {
    await this.page.click(`[data-testid="${buttonTestId}"]`);
  }

  // File upload helpers
  async uploadFile(inputSelector, filePath) {
    await this.page.setInputFiles(inputSelector, filePath);
  }

  async createTestFile(name, type, size) {
    // Create a temporary file for testing
    const buffer = Buffer.alloc(size);
    return {
      name,
      mimeType: type,
      buffer
    };
  }

  // Wait helpers
  async waitForSuccessMessage(timeout = 5000) {
    await this.page.waitForSelector('[data-testid="success-message"]', { timeout });
  }

  async waitForErrorMessage(timeout = 5000) {
    await this.page.waitForSelector('[data-testid="error-message"]', { timeout });
  }

  async waitForLoading(timeout = 10000) {
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { timeout });
    await this.page.waitForSelector('[data-testid="loading-spinner"]', { state: 'hidden', timeout });
  }

  // Assertion helpers
  async expectToBeOnPage(url) {
    await expect(this.page).toHaveURL(url);
  }

  async expectElementToBeVisible(selector) {
    await expect(this.page.locator(selector)).toBeVisible();
  }

  async expectElementToHaveText(selector, text) {
    await expect(this.page.locator(selector)).toHaveText(text);
  }

  async expectElementToBeDisabled(selector) {
    await expect(this.page.locator(selector)).toBeDisabled();
  }

  async expectElementToBeEnabled(selector) {
    await expect(this.page.locator(selector)).toBeEnabled();
  }

  // API helpers
  async makeAPIRequest(method, url, data = null) {
    const response = await this.page.request[method.toLowerCase()](url, {
      data: data ? JSON.stringify(data) : undefined,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    return response;
  }

  async getAuthToken() {
    return await this.page.evaluate(() => localStorage.getItem('token'));
  }

  async setAuthToken(token) {
    await this.page.evaluate((token) => localStorage.setItem('token', token), token);
  }

  // Database helpers (for test setup/teardown)
  async cleanupTestData() {
    // This would typically connect to your test database
    // and clean up any test data created during tests
    console.log('Cleaning up test data...');
  }

  async seedTestData() {
    // This would typically seed your test database
    // with required test data
    console.log('Seeding test data...');
  }

  // Screenshot helpers
  async takeScreenshot(name) {
    await this.page.screenshot({ path: `test-results/${name}.png` });
  }

  // Mock helpers
  async mockAPIResponse(url, response) {
    await this.page.route(url, route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }

  async mockFileUpload(selector, mockResponse) {
    await this.page.route('**/upload/**', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockResponse)
      });
    });
  }

  // Socket.IO helpers
  async waitForSocketConnection() {
    await this.page.waitForFunction(() => {
      return window.socket && window.socket.connected;
    });
  }

  async emitSocketEvent(event, data) {
    await this.page.evaluate(({ event, data }) => {
      window.socket.emit(event, data);
    }, { event, data });
  }

  async waitForSocketEvent(event, timeout = 5000) {
    return await this.page.waitForFunction(
      (event) => window.socketEvents && window.socketEvents[event],
      event,
      { timeout }
    );
  }
}