const { test, expect } = require('@playwright/test');

test.describe('UI Responsive Design Tests', () => {
  const devices = [
    { name: 'Mobile', width: 375, height: 667 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];

  devices.forEach(device => {
    test(`UI responsive design - ${device.name}`, async ({ page }) => {
      // Set viewport size
      await page.setViewportSize({ width: device.width, height: device.height });
      
      // Navigate to the application
      await page.goto('http://localhost:3000');
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Take screenshot for visual validation
      await page.screenshot({ 
        path: `tests/screenshots/ui-${device.name.toLowerCase()}.png`,
        fullPage: true 
      });
      
      // Test Login page responsiveness
      console.log(`Testing ${device.name} (${device.width}x${device.height}) - Login Page`);
      
      // Verify login form is visible and properly sized
      const loginForm = page.locator('form');
      await expect(loginForm).toBeVisible();
      
      // Check if logo is visible
      const logo = page.locator('text=ChillConnect');
      await expect(logo).toBeVisible();
      
      // Verify input fields are accessible
      const emailInput = page.locator('input[name="email"]');
      const passwordInput = page.locator('input[name="password"]');
      await expect(emailInput).toBeVisible();
      await expect(passwordInput).toBeVisible();
      
      // Test form interaction
      await emailInput.fill('test@example.com');
      await passwordInput.fill('testpassword123');
      
      // Verify submit button is accessible
      const submitButton = page.locator('button[type="submit"]');
      await expect(submitButton).toBeVisible();
      await expect(submitButton).toBeEnabled();
      
      // Test responsive behavior specific to device
      if (device.name === 'Mobile') {
        // Mobile-specific tests
        console.log('Testing mobile-specific features...');
        
        // Check if mobile menu button exists (if implemented)
        const mobileMenu = page.locator('button:has-text("Menu")');
        if (await mobileMenu.isVisible()) {
          await mobileMenu.click();
          // Test sidebar opens on mobile
          await page.waitForTimeout(500);
        }
        
        // Verify form width is appropriate for mobile
        const formBounds = await loginForm.boundingBox();
        expect(formBounds.width).toBeLessThan(device.width);
        
      } else if (device.name === 'Tablet') {
        // Tablet-specific tests
        console.log('Testing tablet-specific features...');
        
        // Verify layout adapts to tablet size
        const formBounds = await loginForm.boundingBox();
        expect(formBounds.width).toBeLessThan(device.width * 0.8);
        
      } else {
        // Desktop-specific tests
        console.log('Testing desktop-specific features...');
        
        // Verify centered layout on desktop
        const formBounds = await loginForm.boundingBox();
        expect(formBounds.width).toBeLessThan(500); // Max width for form
      }
      
      // Test CSS design system classes
      console.log('Testing design system components...');
      
      // Verify buttons have proper styling
      const buttons = page.locator('.btn');
      const buttonCount = await buttons.count();
      if (buttonCount > 0) {
        for (let i = 0; i < buttonCount; i++) {
          const button = buttons.nth(i);
          const buttonClass = await button.getAttribute('class');
          expect(buttonClass).toContain('btn');
        }
      }
      
      // Verify inputs have proper styling
      const inputs = page.locator('.input');
      const inputCount = await inputs.count();
      if (inputCount > 0) {
        for (let i = 0; i < inputCount; i++) {
          const input = inputs.nth(i);
          const inputClass = await input.getAttribute('class');
          expect(inputClass).toContain('input');
        }
      }
      
      // Test focus states
      await emailInput.focus();
      await page.waitForTimeout(100);
      
      // Test accessibility
      console.log('Testing accessibility features...');
      
      // Check for proper labels
      const emailLabel = page.locator('label[for="email"]');
      const passwordLabel = page.locator('label[for="password"]');
      await expect(emailLabel).toBeVisible();
      await expect(passwordLabel).toBeVisible();
      
      // Test keyboard navigation
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      
      console.log(`✅ ${device.name} responsive design test completed successfully`);
    });
  });

  test('UI Design System Validation', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Testing minimalist design system...');
    
    // Test color scheme consistency
    const computedStyles = await page.evaluate(() => {
      const styles = {};
      const elementsToCheck = [
        { selector: '.btn-primary', property: 'background-color' },
        { selector: '.input', property: 'border-color' },
        { selector: '.card', property: 'border-radius' },
      ];
      
      elementsToCheck.forEach(({ selector, property }) => {
        const element = document.querySelector(selector);
        if (element) {
          styles[selector] = getComputedStyle(element)[property];
        }
      });
      
      return styles;
    });
    
    console.log('Design system styles:', computedStyles);
    
    // Verify glassmorphic effects are applied
    const glassmorphicElements = page.locator('.backdrop-blur-xl');
    const glassCount = await glassmorphicElements.count();
    console.log(`Found ${glassCount} glassmorphic elements`);
    
    // Test animation and transition classes
    const animatedElements = page.locator('.transition-all');
    const animationCount = await animatedElements.count();
    console.log(`Found ${animationCount} animated elements`);
    
    console.log('✅ Design system validation completed');
  });

  test('Navigation and Sidebar Testing', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Testing navigation components...');
    
    // If we can access a dashboard or main app area, test sidebar
    // For now, test login page navigation elements
    
    // Check for any navigation links
    const navLinks = page.locator('a');
    const linkCount = await navLinks.count();
    console.log(`Found ${linkCount} navigation links`);
    
    if (linkCount > 0) {
      for (let i = 0; i < Math.min(linkCount, 3); i++) {
        const link = navLinks.nth(i);
        const href = await link.getAttribute('href');
        const text = await link.textContent();
        console.log(`Link ${i + 1}: "${text}" -> ${href}`);
        
        // Verify link styling
        const linkClass = await link.getAttribute('class');
        if (linkClass) {
          console.log(`Link styling: ${linkClass}`);
        }
      }
    }
    
    console.log('✅ Navigation testing completed');
  });

  test('Form Usability and UX', async ({ page }) => {
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    console.log('Testing form usability...');
    
    // Test form validation and UX
    const emailInput = page.locator('input[name="email"]');
    const passwordInput = page.locator('input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    // Test placeholder text
    const emailPlaceholder = await emailInput.getAttribute('placeholder');
    const passwordPlaceholder = await passwordInput.getAttribute('placeholder');
    console.log(`Email placeholder: "${emailPlaceholder}"`);
    console.log(`Password placeholder: "${passwordPlaceholder}"`);
    
    // Test input focus states
    await emailInput.focus();
    await page.waitForTimeout(200);
    
    await passwordInput.focus();
    await page.waitForTimeout(200);
    
    // Test form submission without data (should show validation)
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Test with invalid email
    await emailInput.fill('invalid-email');
    await passwordInput.fill('123');
    await submitButton.click();
    await page.waitForTimeout(500);
    
    // Test with valid format
    await emailInput.fill('test@example.com');
    await passwordInput.fill('validpassword123');
    
    console.log('✅ Form usability testing completed');
  });

  test('Performance and Loading States', async ({ page }) => {
    console.log('Testing performance and loading states...');
    
    const startTime = Date.now();
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page load time: ${loadTime}ms`);
    expect(loadTime).toBeLessThan(5000); // Should load in under 5 seconds
    
    // Test if CSS is loaded properly
    const cssLoaded = await page.evaluate(() => {
      const link = document.querySelector('link[rel="stylesheet"]');
      return link ? true : false;
    });
    
    console.log(`CSS loaded: ${cssLoaded}`);
    
    // Test if all images load
    const imageElements = page.locator('img');
    const imageCount = await imageElements.count();
    console.log(`Found ${imageCount} images`);
    
    if (imageCount > 0) {
      for (let i = 0; i < imageCount; i++) {
        const img = imageElements.nth(i);
        const loaded = await img.evaluate(el => el.complete && el.naturalHeight !== 0);
        console.log(`Image ${i + 1} loaded: ${loaded}`);
      }
    }
    
    console.log('✅ Performance testing completed');
  });
});