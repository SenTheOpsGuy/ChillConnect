import { test, expect } from '@playwright/test';
import { TestHelpers } from './utils/testHelpers.js';
import { testUsers, testMessages } from './fixtures/testData.js';

test.describe('Chat System Flow', () => {
  let helpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
  });

  test.describe('Chat Access', () => {
    test('should display chat interface for booking participants', async ({ page }) => {
      // Login as seeker
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      
      // Navigate to booking with chat
      await page.goto('/booking-details/booking-1');
      
      // Should show chat interface
      await helpers.expectElementToBeVisible('[data-testid="chat-interface"]');
      await helpers.expectElementToBeVisible('[data-testid="message-list"]');
      await helpers.expectElementToBeVisible('[data-testid="message-input"]');
      await helpers.expectElementToBeVisible('[data-testid="send-button"]');
    });

    test('should prevent non-participants from accessing chat', async ({ page }) => {
      // Login as unrelated user
      const unrelatedUser = {
        ...testUsers.seeker,
        email: `unrelated.${Date.now()}@example.com`
      };
      await helpers.register(unrelatedUser);
      await helpers.login(unrelatedUser.email, unrelatedUser.password);
      
      // Try to access chat for booking they're not part of
      await page.goto('/chat/booking-1');
      
      // Should show access denied
      await helpers.expectElementToBeVisible('[data-testid="access-denied"]');
    });

    test('should show chat history for existing conversation', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Should show existing messages
      await helpers.expectElementToBeVisible('[data-testid="message-list"]');
      await helpers.expectElementToBeVisible('[data-testid="message-bubble"]');
      
      // Check message content
      const messages = await page.locator('[data-testid="message-bubble"]');
      const messageCount = await messages.count();
      expect(messageCount).toBeGreaterThan(0);
    });
  });

  test.describe('Message Sending', () => {
    test('should send text message successfully', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      const testMessage = 'Hello, this is a test message';
      
      // Send message
      await helpers.fillForm({
        'message-input': testMessage
      });
      await helpers.submitForm('send-button');
      
      // Should see message in chat
      await helpers.expectElementToBeVisible(`[data-testid="message-bubble"]:has-text("${testMessage}")`);
    });

    test('should prevent sending empty messages', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Try to send empty message
      await helpers.submitForm('send-button');
      
      // Send button should be disabled or show validation
      await helpers.expectElementToBeDisabled('[data-testid="send-button"]');
    });

    test('should handle long messages appropriately', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      const longMessage = 'This is a very long message that exceeds the typical message length limit. '.repeat(10);
      
      // Send long message
      await helpers.fillForm({
        'message-input': longMessage
      });
      await helpers.submitForm('send-button');
      
      // Should handle long message (either truncate or allow)
      await helpers.expectElementToBeVisible('[data-testid="message-bubble"]');
    });

    test('should show message delivery status', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Send message
      await helpers.fillForm({
        'message-input': 'Test message delivery'
      });
      await helpers.submitForm('send-button');
      
      // Should show delivery status
      await helpers.expectElementToBeVisible('[data-testid="message-status"]');
      
      // Status should change from sending to delivered
      await helpers.expectElementToHaveText('[data-testid="message-status"]', 'Delivered');
    });
  });

  test.describe('Media Sharing', () => {
    test('should allow image upload in chat', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Click media upload button
      await page.click('[data-testid="media-upload-button"]');
      
      // Should show upload interface
      await helpers.expectElementToBeVisible('[data-testid="media-upload-modal"]');
      
      // Upload image
      const testImage = await helpers.createTestFile('test-image.jpg', 'image/jpeg', 1024 * 1024);
      await helpers.uploadFile('[data-testid="media-input"]', testImage);
      
      // Send media
      await helpers.submitForm('send-media-button');
      
      // Should show media message
      await helpers.expectElementToBeVisible('[data-testid="media-message"]');
      await helpers.expectElementToBeVisible('[data-testid="media-preview"]');
    });

    test('should validate media file size', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Try to upload oversized file
      await page.click('[data-testid="media-upload-button"]');
      
      const oversizedFile = await helpers.createTestFile('large-image.jpg', 'image/jpeg', 50 * 1024 * 1024); // 50MB
      await helpers.uploadFile('[data-testid="media-input"]', oversizedFile);
      
      // Should show size validation error
      await helpers.expectElementToBeVisible('[data-testid="file-size-error"]');
      await helpers.expectElementToHaveText(
        '[data-testid="file-size-error"]',
        'File size too large. Maximum size is 10MB.'
      );
    });

    test('should validate media file type', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Try to upload invalid file type
      await page.click('[data-testid="media-upload-button"]');
      
      const invalidFile = await helpers.createTestFile('document.exe', 'application/x-msdownload', 1024);
      await helpers.uploadFile('[data-testid="media-input"]', invalidFile);
      
      // Should show type validation error
      await helpers.expectElementToBeVisible('[data-testid="file-type-error"]');
      await helpers.expectElementToHaveText(
        '[data-testid="file-type-error"]',
        'Please select a valid image file (JPEG, PNG, GIF, or WebP)'
      );
    });
  });

  test.describe('Real-time Features', () => {
    test('should show typing indicator', async ({ page, context }) => {
      // Open two browser contexts for seeker and provider
      const seekerPage = page;
      const providerPage = await context.newPage();
      
      // Login as seeker
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await seekerPage.goto('/chat/booking-1');
      
      // Login as provider in second tab
      const providerHelpers = new TestHelpers(providerPage);
      await providerHelpers.login(testUsers.provider.email, testUsers.provider.password);
      await providerPage.goto('/chat/booking-1');
      
      // Start typing as seeker
      await seekerPage.fill('[data-testid="message-input"]', 'Test typing...');
      
      // Provider should see typing indicator
      await providerHelpers.expectElementToBeVisible('[data-testid="typing-indicator"]');
      await providerHelpers.expectElementToHaveText(
        '[data-testid="typing-indicator"]',
        `${testUsers.seeker.firstName} is typing...`
      );
      
      // Stop typing
      await seekerPage.fill('[data-testid="message-input"]', '');
      
      // Typing indicator should disappear
      await providerHelpers.expectElementToBeVisible('[data-testid="typing-indicator"]', { timeout: 5000 });
    });

    test('should show message read status', async ({ page, context }) => {
      const seekerPage = page;
      const providerPage = await context.newPage();
      
      // Setup both users
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await seekerPage.goto('/chat/booking-1');
      
      const providerHelpers = new TestHelpers(providerPage);
      await providerHelpers.login(testUsers.provider.email, testUsers.provider.password);
      await providerPage.goto('/chat/booking-1');
      
      // Send message as seeker
      await helpers.fillForm({
        'message-input': 'Test read status'
      });
      await helpers.submitForm('send-button');
      
      // Provider should see new message
      await providerHelpers.expectElementToBeVisible('[data-testid="message-bubble"]:has-text("Test read status")');
      
      // Message should show as read
      await helpers.expectElementToBeVisible('[data-testid="message-status"]:has-text("Read")');
    });

    test('should update message list in real-time', async ({ page, context }) => {
      const seekerPage = page;
      const providerPage = await context.newPage();
      
      // Setup both users
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await seekerPage.goto('/chat/booking-1');
      
      const providerHelpers = new TestHelpers(providerPage);
      await providerHelpers.login(testUsers.provider.email, testUsers.provider.password);
      await providerPage.goto('/chat/booking-1');
      
      // Get initial message count
      const initialCount = await seekerPage.locator('[data-testid="message-bubble"]').count();
      
      // Send message as provider
      await providerHelpers.fillForm({
        'message-input': 'Real-time test message'
      });
      await providerHelpers.submitForm('send-button');
      
      // Seeker should see new message without refresh
      await helpers.expectElementToBeVisible('[data-testid="message-bubble"]:has-text("Real-time test message")');
      
      // Message count should increase
      const newCount = await seekerPage.locator('[data-testid="message-bubble"]').count();
      expect(newCount).toBe(initialCount + 1);
    });
  });

  test.describe('Content Moderation', () => {
    test('should flag inappropriate content', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Send message with inappropriate content
      const inappropriateMessage = 'This message contains inappropriate content that should be flagged';
      await helpers.fillForm({
        'message-input': inappropriateMessage
      });
      await helpers.submitForm('send-button');
      
      // Message should be flagged or filtered
      await helpers.expectElementToBeVisible('[data-testid="message-flagged"]');
      await helpers.expectElementToHaveText(
        '[data-testid="message-flagged"]',
        'This message has been flagged for review'
      );
    });

    test('should allow reporting messages', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Right-click on message to report
      await page.click('[data-testid="message-bubble"]:first-child', { button: 'right' });
      
      // Should show context menu
      await helpers.expectElementToBeVisible('[data-testid="message-context-menu"]');
      
      // Click report
      await page.click('[data-testid="report-message-button"]');
      
      // Should show report form
      await helpers.expectElementToBeVisible('[data-testid="report-form"]');
      
      // Fill report form
      await helpers.fillForm({
        'report-reason': 'Inappropriate content',
        'report-details': 'This message contains inappropriate content'
      });
      await helpers.submitForm('submit-report-button');
      
      // Should show success message
      await helpers.expectElementToBeVisible('[data-testid="success-message"]');
      await helpers.expectElementToHaveText(
        '[data-testid="success-message"]',
        'Message reported successfully'
      );
    });

    test('should show warning for policy violations', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Send message that violates policy
      const violatingMessage = 'Let\'s exchange personal contact information';
      await helpers.fillForm({
        'message-input': violatingMessage
      });
      await helpers.submitForm('send-button');
      
      // Should show policy warning
      await helpers.expectElementToBeVisible('[data-testid="policy-warning"]');
      await helpers.expectElementToHaveText(
        '[data-testid="policy-warning"]',
        'Please keep all communication within the platform'
      );
    });
  });

  test.describe('Chat History', () => {
    test('should load chat history on scroll', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Get initial message count
      const initialCount = await page.locator('[data-testid="message-bubble"]').count();
      
      // Scroll to top to load more messages
      await page.evaluate(() => {
        document.querySelector('[data-testid="message-list"]').scrollTop = 0;
      });
      
      // Should load more messages
      await helpers.expectElementToBeVisible('[data-testid="loading-more-messages"]');
      await page.waitForTimeout(2000); // Wait for loading
      
      const newCount = await page.locator('[data-testid="message-bubble"]').count();
      expect(newCount).toBeGreaterThan(initialCount);
    });

    test('should search chat history', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Open search
      await page.click('[data-testid="search-chat-button"]');
      
      // Should show search interface
      await helpers.expectElementToBeVisible('[data-testid="chat-search"]');
      
      // Search for message
      await helpers.fillForm({
        'search-input': 'hello'
      });
      await helpers.submitForm('search-button');
      
      // Should show search results
      await helpers.expectElementToBeVisible('[data-testid="search-results"]');
      await helpers.expectElementToBeVisible('[data-testid="search-result"]');
    });

    test('should export chat history', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Click export button
      await page.click('[data-testid="export-chat-button"]');
      
      // Should show export options
      await helpers.expectElementToBeVisible('[data-testid="export-options"]');
      
      // Select export format
      await page.click('[data-testid="export-pdf-button"]');
      
      // Should trigger download
      const downloadPromise = page.waitForEvent('download');
      const download = await downloadPromise;
      
      expect(download.suggestedFilename()).toMatch(/chat-history.*\.pdf/);
    });
  });

  test.describe('Chat Notifications', () => {
    test('should show unread message count', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      
      // Navigate to messages page
      await helpers.navigateToMessages();
      
      // Should show unread count
      await helpers.expectElementToBeVisible('[data-testid="unread-count"]');
      
      const unreadCount = await page.textContent('[data-testid="unread-count"]');
      expect(parseInt(unreadCount)).toBeGreaterThan(0);
    });

    test('should mark messages as read when opened', async ({ page }) => {
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await helpers.navigateToMessages();
      
      // Get initial unread count
      const initialUnread = await page.textContent('[data-testid="unread-count"]');
      
      // Open conversation
      await page.click('[data-testid="conversation-item"]:first-child');
      
      // Go back to messages
      await helpers.navigateToMessages();
      
      // Unread count should decrease
      const newUnread = await page.textContent('[data-testid="unread-count"]');
      expect(parseInt(newUnread)).toBeLessThan(parseInt(initialUnread));
    });

    test('should show desktop notification for new messages', async ({ page, context }) => {
      // Grant notification permission
      await context.grantPermissions(['notifications']);
      
      await helpers.login(testUsers.seeker.email, testUsers.seeker.password);
      await page.goto('/chat/booking-1');
      
      // Mock notification
      await page.evaluate(() => {
        window.showNotification = (title, options) => {
          window.lastNotification = { title, options };
        };
      });
      
      // Send message from another context to trigger notification
      const providerPage = await context.newPage();
      const providerHelpers = new TestHelpers(providerPage);
      await providerHelpers.login(testUsers.provider.email, testUsers.provider.password);
      await providerPage.goto('/chat/booking-1');
      
      await providerHelpers.fillForm({
        'message-input': 'New message for notification test'
      });
      await providerHelpers.submitForm('send-button');
      
      // Should trigger notification
      const notification = await page.evaluate(() => window.lastNotification);
      expect(notification.title).toBe('New message');
    });
  });
});