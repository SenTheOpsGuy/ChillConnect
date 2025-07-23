import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers } from './fixtures/testData.js';

test.describe('Wallet and Token System Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Wallet Dashboard', () => {
    test('should display wallet dashboard', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show wallet interface
      await helpers.expectElementToBeVisible('[data-testid="wallet-dashboard"]');
      await helpers.expectElementToBeVisible('[data-testid="token-balance"]');
      await helpers.expectElementToBeVisible('[data-testid="escrow-balance"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-history"]');
      await helpers.expectElementToBeVisible('[data-testid="purchase-tokens-button"]');
    });

    test('should display correct token balance', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show token balance
      await helpers.expectElementToBeVisible('[data-testid="token-balance"]');
      
      const balance = await page.textContent('[data-testid="token-balance"]');
      expect(balance).toMatch(/\d+/); // Should contain numbers
    });

    test('should display escrow balance for providers', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Should show escrow balance
      await helpers.expectElementToBeVisible('[data-testid="escrow-balance"]');
      
      const escrowBalance = await page.textContent('[data-testid="escrow-balance"]');
      expect(escrowBalance).toMatch(/\d+/);
    });

    test('should show wallet statistics', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show wallet stats
      await helpers.expectElementToBeVisible('[data-testid="total-spent"]');
      await helpers.expectElementToBeVisible('[data-testid="total-earned"]');
      await helpers.expectElementToBeVisible('[data-testid="total-transactions"]');
    });
  });

  test.describe('Token Purchase', () => {
    test('should display token packages', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Click purchase tokens
      await page.click('[data-testid="purchase-tokens-button"]');
      
      // Should show token packages
      await helpers.expectElementToBeVisible('[data-testid="token-packages"]');
      await helpers.expectElementToBeVisible('[data-testid="token-package"]');
      
      // Should show package details
      await helpers.expectElementToBeVisible('[data-testid="package-tokens"]');
      await helpers.expectElementToBeVisible('[data-testid="package-price"]');
      await helpers.expectElementToBeVisible('[data-testid="package-discount"]');
    });

    test('should calculate correct pricing', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="purchase-tokens-button"]');
      
      // Check first package pricing
      const tokens = await page.textContent('[data-testid="token-package"]:first-child [data-testid="package-tokens"]');
      const price = await page.textContent('[data-testid="token-package"]:first-child [data-testid="package-price"]');
      
      // Should show correct price calculation (assuming 1 token = 100 INR)
      const tokenCount = parseInt(tokens.replace(/\D/g, ''));
      const priceAmount = parseInt(price.replace(/\D/g, ''));
      const expectedPrice = tokenCount * 100;
      
      expect(priceAmount).toBeLessThanOrEqual(expectedPrice); // Account for discounts
    });

    test('should initiate PayPal payment', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="purchase-tokens-button"]');
      
      // Select token package
      await page.click('[data-testid="token-package"]:first-child [data-testid="buy-package-button"]');
      
      // Should show PayPal payment interface
      await helpers.expectElementToBeVisible('[data-testid="paypal-payment"]');
      await helpers.expectElementToBeVisible('[data-testid="paypal-buttons"]');
    });

    test('should show custom token amount option', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="purchase-tokens-button"]');
      
      // Should show custom amount option
      await helpers.expectElementToBeVisible('[data-testid="custom-amount-option"]');
      
      // Click custom amount
      await page.click('[data-testid="custom-amount-option"]');
      
      // Should show custom amount form
      await helpers.expectElementToBeVisible('[data-testid="custom-amount-form"]');
      await helpers.expectElementToBeVisible('[data-testid="custom-token-input"]');
    });

    test('should validate minimum purchase amount', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="purchase-tokens-button"]');
      await page.click('[data-testid="custom-amount-option"]');
      
      // Try to purchase below minimum
      await helpers.fillForm({
        'custom-token-input': '5' // Below minimum of 10
      });
      await helpers.submitForm('purchase-custom-button');
      
      // Should show validation error
      await helpers.expectElementToBeVisible('[data-testid="minimum-amount-error"]');
      await helpers.expectElementToHaveText(
        '[data-testid="minimum-amount-error"]',
        'Minimum purchase amount is 10 tokens'
      );
    });
  });

  test.describe('Transaction History', () => {
    test('should display transaction history', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show transaction history
      await helpers.expectElementToBeVisible('[data-testid="transaction-history"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-item"]');
      
      // Should show transaction details
      await helpers.expectElementToBeVisible('[data-testid="transaction-type"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-date"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-status"]');
    });

    test('should filter transactions by type', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Filter by purchase transactions
      await page.selectOption('[data-testid="transaction-type-filter"]', 'PURCHASE');
      
      // Should show only purchase transactions
      const transactionItems = await page.locator('[data-testid="transaction-item"]');
      const count = await transactionItems.count();
      
      for (let i = 0; i < count; i++) {
        const type = await transactionItems.nth(i).locator('[data-testid="transaction-type"]').textContent();
        expect(type).toBe('PURCHASE');
      }
    });

    test('should filter transactions by date range', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Set date range filter
      await helpers.fillForm({
        'date-from': '2024-01-01',
        'date-to': '2024-01-31'
      });
      await helpers.submitForm('filter-transactions-button');
      
      // Should show filtered transactions
      await helpers.expectElementToBeVisible('[data-testid="transaction-item"]');
      
      // Check if transactions are within date range
      const dates = await page.locator('[data-testid="transaction-date"]').allTextContents();
      dates.forEach(date => {
        const transactionDate = new Date(date);
        const fromDate = new Date('2024-01-01');
        const toDate = new Date('2024-01-31');
        
        expect(transactionDate).toBeGreaterThanOrEqual(fromDate);
        expect(transactionDate).toBeLessThanOrEqual(toDate);
      });
    });

    test('should export transaction history', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Click export button
      await page.click('[data-testid="export-transactions-button"]');
      
      // Should show export options
      await helpers.expectElementToBeVisible('[data-testid="export-options"]');
      
      // Export as CSV
      const downloadPromise = page.waitForEvent('download');
      await page.click('[data-testid="export-csv-button"]');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/transactions.*\.csv/);
    });

    test('should show transaction details', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Click on transaction to view details
      await page.click('[data-testid="transaction-item"]:first-child');
      
      // Should show transaction details modal
      await helpers.expectElementToBeVisible('[data-testid="transaction-details-modal"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-id"]');
      await helpers.expectElementToBeVisible('[data-testid="transaction-description"]');
      await helpers.expectElementToBeVisible('[data-testid="previous-balance"]');
      await helpers.expectElementToBeVisible('[data-testid="new-balance"]');
    });
  });

  test.describe('Escrow System', () => {
    test('should show escrow balance for providers', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Should show escrow section
      await helpers.expectElementToBeVisible('[data-testid="escrow-section"]');
      await helpers.expectElementToBeVisible('[data-testid="escrow-balance"]');
      await helpers.expectElementToBeVisible('[data-testid="pending-releases"]');
    });

    test('should display pending escrow releases', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Should show pending releases
      await helpers.expectElementToBeVisible('[data-testid="pending-releases"]');
      await helpers.expectElementToBeVisible('[data-testid="pending-release-item"]');
      
      // Should show release details
      await helpers.expectElementToBeVisible('[data-testid="release-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="release-booking"]');
      await helpers.expectElementToBeVisible('[data-testid="release-date"]');
    });

    test('should show escrow history', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Click escrow history tab
      await page.click('[data-testid="escrow-history-tab"]');
      
      // Should show escrow history
      await helpers.expectElementToBeVisible('[data-testid="escrow-history"]');
      await helpers.expectElementToBeVisible('[data-testid="escrow-transaction"]');
      
      // Should show escrow transaction details
      await helpers.expectElementToBeVisible('[data-testid="escrow-type"]');
      await helpers.expectElementToBeVisible('[data-testid="escrow-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="escrow-booking-ref"]');
    });

    test('should handle escrow disputes', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Should show disputed escrow items
      await helpers.expectElementToBeVisible('[data-testid="disputed-escrow"]');
      
      // Click on disputed item
      await page.click('[data-testid="disputed-escrow-item"]:first-child');
      
      // Should show dispute details
      await helpers.expectElementToBeVisible('[data-testid="dispute-details"]');
      await helpers.expectElementToBeVisible('[data-testid="dispute-reason"]');
      await helpers.expectElementToBeVisible('[data-testid="dispute-status"]');
    });
  });

  test.describe('Withdrawal System', () => {
    test('should show withdrawal option for providers', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Should show withdrawal section
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-section"]');
      await helpers.expectElementToBeVisible('[data-testid="withdraw-button"]');
      await helpers.expectElementToBeVisible('[data-testid="minimum-withdrawal"]');
    });

    test('should initiate withdrawal request', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Click withdraw button
      await page.click('[data-testid="withdraw-button"]');
      
      // Should show withdrawal form
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-form"]');
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-amount-input"]');
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-method-select"]');
      
      // Fill withdrawal form
      await helpers.fillForm({
        'withdrawal-amount-input': '100',
        'withdrawal-method-select': 'BANK_TRANSFER'
      });
      
      // Submit withdrawal request
      await helpers.submitForm('submit-withdrawal-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Withdrawal request submitted successfully'
      );
    });

    test('should validate minimum withdrawal amount', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="withdraw-button"]');
      
      // Try to withdraw below minimum
      await helpers.fillForm({
        'withdrawal-amount-input': '5' // Below minimum
      });
      await helpers.submitForm('submit-withdrawal-button');
      
      // Should show validation error
      await helpers.expectElementToBeVisible('[data-testid="minimum-withdrawal-error"]');
    });

    test('should validate sufficient balance', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      await page.click('[data-testid="withdraw-button"]');
      
      // Try to withdraw more than available balance
      await helpers.fillForm({
        'withdrawal-amount-input': '99999'
      });
      await helpers.submitForm('submit-withdrawal-button');
      
      // Should show insufficient balance error
      await helpers.expectElementToBeVisible('[data-testid="insufficient-balance-error"]');
    });

    test('should show withdrawal history', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Click withdrawal history tab
      await page.click('[data-testid="withdrawal-history-tab"]');
      
      // Should show withdrawal history
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-history"]');
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-item"]');
      
      // Should show withdrawal details
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-status"]');
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="withdrawal-date"]');
    });
  });

  test.describe('Token Conversion', () => {
    test('should display current token rate', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show current token rate
      await helpers.expectElementToBeVisible('[data-testid="current-token-rate"]');
      
      const rate = await page.textContent('[data-testid="current-token-rate"]');
      expect(rate).toMatch(/1 token = ₹\d+/);
    });

    test('should show token value calculator', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show calculator
      await helpers.expectElementToBeVisible('[data-testid="token-calculator"]');
      
      // Enter token amount
      await helpers.fillForm({
        'calculator-tokens': '50'
      });
      
      // Should show calculated value
      await helpers.expectElementToBeVisible('[data-testid="calculated-value"]');
      
      const calculatedValue = await page.textContent('[data-testid="calculated-value"]');
      expect(calculatedValue).toMatch(/₹\d+/);
    });

    test('should show token purchase history', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Filter by purchase transactions
      await page.selectOption('[data-testid="transaction-type-filter"]', 'PURCHASE');
      
      // Should show purchase history
      await helpers.expectElementToBeVisible('[data-testid="transaction-item"]');
      
      // Should show purchase details
      await helpers.expectElementToBeVisible('[data-testid="purchase-amount"]');
      await helpers.expectElementToBeVisible('[data-testid="purchase-rate"]');
      await helpers.expectElementToBeVisible('[data-testid="payment-method"]');
    });
  });

  test.describe('Wallet Security', () => {
    test('should require authentication for sensitive operations', async ({ page }) => {
      await helpers.login(testUsers.provider.email, testUsers.provider.password);
      await helpers.navigateToWallet();
      
      // Try to withdraw (sensitive operation)
      await page.click('[data-testid="withdraw-button"]');
      
      // Should require password confirmation
      await helpers.expectElementToBeVisible('[data-testid="password-confirmation"]');
      
      // Fill form without password
      await helpers.fillForm({
        'withdrawal-amount-input': '100'
      });
      await helpers.submitForm('submit-withdrawal-button');
      
      // Should show password required error
      await helpers.expectElementToBeVisible('[data-testid="password-required-error"]');
    });

    test('should show wallet activity log', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Click activity log tab
      await page.click('[data-testid="activity-log-tab"]');
      
      // Should show activity log
      await helpers.expectElementToBeVisible('[data-testid="activity-log"]');
      await helpers.expectElementToBeVisible('[data-testid="activity-item"]');
      
      // Should show activity details
      await helpers.expectElementToBeVisible('[data-testid="activity-type"]');
      await helpers.expectElementToBeVisible('[data-testid="activity-timestamp"]');
      await helpers.expectElementToBeVisible('[data-testid="activity-ip"]');
    });

    test('should handle wallet freezing', async ({ page }) => {
      // Login with account that has frozen wallet
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToWallet();
      
      // Should show frozen wallet message
      await helpers.expectElementToBeVisible('[data-testid="wallet-frozen-message"]');
      
      // Should disable wallet operations
      await helpers.expectElementToBeDisabled('[data-testid="purchase-tokens-button"]');
      await helpers.expectElementToBeDisabled('[data-testid="withdraw-button"]');
    });
  });
});