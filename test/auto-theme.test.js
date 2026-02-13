/**
 * Tests for auto theme functionality
 */

import { expect } from '@playwright/test';
import { test } from '@playwright/test';

test.describe('Auto Theme', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/examples/auto-theme.html');
  });

  test('should initialize with auto theme', async ({ page }) => {
    // Check that the editor has auto theme attribute
    const themeAttr = await page.locator('.overtype-container').getAttribute('data-theme');
    expect(themeAttr).toBe('auto');
  });

  test('should have resolved theme attribute', async ({ page }) => {
    // Check that the editor has a resolved theme
    const resolvedTheme = await page.locator('.overtype-container').getAttribute('data-resolved-theme');
    expect(['solar', 'cave']).toContain(resolvedTheme);
  });

  test('should respond to system theme preference', async ({ page, context }) => {
    // Set system to dark mode
    await context.emulateMedia({ colorScheme: 'dark' });
    await page.reload();
    
    // Wait for the theme to be applied
    await page.waitForTimeout(100);
    
    const resolvedTheme = await page.locator('.overtype-container').getAttribute('data-resolved-theme');
    expect(resolvedTheme).toBe('cave');
    
    // Set system to light mode
    await context.emulateMedia({ colorScheme: 'light' });
    await page.reload();
    
    // Wait for the theme to be applied
    await page.waitForTimeout(100);
    
    const resolvedThemeLight = await page.locator('.overtype-container').getAttribute('data-resolved-theme');
    expect(resolvedThemeLight).toBe('solar');
  });

  test('should switch theme when dropdown changed', async ({ page }) => {
    const select = page.locator('#theme-select');
    
    // Change to cave
    await select.selectOption('cave');
    const themeAttr = await page.locator('.overtype-container').getAttribute('data-theme');
    expect(themeAttr).toBe('cave');
    
    // Change back to auto
    await select.selectOption('auto');
    const autoTheme = await page.locator('.overtype-container').getAttribute('data-theme');
    expect(autoTheme).toBe('auto');
  });

  test('should show system theme info when button clicked', async ({ page }) => {
    // Mock the alert dialog
    page.on('dialog', async dialog => {
      const message = dialog.message();
      expect(message).toContain('System Theme:');
      expect(message).toContain('Editor Theme:');
      await dialog.accept();
    });
    
    // Click the info button
    await page.click('#get-info-btn');
  });
});

test.describe('Auto Theme - Instance Level', () => {
  test('should work with instance-level theme setting', async ({ page, browser }) => {
    // Create a test page
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div id="editor"></div>
        <script type="module">
          import OverType from '/src/overtype.js';
          
          const [editor] = new OverType('#editor', {
            theme: 'auto',
            value: '# Test'
          });
          
          window.editor = editor;
        </script>
      </body>
      </html>
    `);
    
    // Wait for the editor to initialize
    await page.waitForTimeout(500);
    
    // Check theme attribute
    const themeAttr = await page.locator('.overtype-container').getAttribute('data-theme');
    expect(themeAttr).toBe('auto');
    
    // Test switching to a different theme
    await page.evaluate(() => {
      window.editor.setTheme('solar');
    });
    
    const newTheme = await page.locator('.overtype-container').getAttribute('data-theme');
    expect(newTheme).toBe('solar');
  });
});

test.describe('Auto Theme - Global Level', () => {
  test('should work with global theme setting', async ({ page }) => {
    await page.setContent(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
      </head>
      <body>
        <div id="editor1"></div>
        <div id="editor2"></div>
        <script type="module">
          import OverType from '/src/overtype.js';
          
          // Set global auto theme
          OverType.setTheme('auto');
          
          const [editor1] = new OverType('#editor1', { value: '# Editor 1' });
          const [editor2] = new OverType('#editor2', { value: '# Editor 2' });
          
          window.editors = [editor1, editor2];
        </script>
      </body>
      </html>
    `);
    
    await page.waitForTimeout(500);
    
    // Check both editors have auto theme
    const containers = await page.locator('.overtype-container').all();
    
    for (const container of containers) {
      const theme = await container.getAttribute('data-theme');
      expect(theme).toBe('auto');
      
      const resolved = await container.getAttribute('data-resolved-theme');
      expect(['solar', 'cave']).toContain(resolved);
    }
  });
});
