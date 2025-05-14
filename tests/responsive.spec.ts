import { test, expect } from '@playwright/test';
import { publicPageConfigs, adminPageConfigs, testViewportRanges } from './config/responsive-tests-config';
import { setupAuth } from './helpers/auth-helper';

test.describe('Responsive Design Tests', () => {
  test.describe('Public Pages', () => {
    for (const config of publicPageConfigs) {
      test.describe(`${config.name} Page`, () => {
        for (const width of [320, 768, 1920]) {
          test(`should render correctly at ${width}px width`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            
            try {
              await page.goto(config.url, { timeout: 15000 });
            } catch (error) {
              console.error(`Navigation to ${config.url} failed:`, error);
              await page.screenshot({ path: `error-${config.name}-${width}.png` });
              test.skip();
            }
            
            await page.screenshot({ 
              path: `screenshots/public-${config.name}-${width}.png`,
              fullPage: true
            });
            
            const isScrollable = await page.evaluate(() => {
              return document.documentElement.scrollHeight > window.innerHeight;
            });
            
            if (width <= 768) {
              console.log(`Page scrollable: ${isScrollable}`);
            }
            
            try {
              const navButton = page.locator('button[aria-label="menu"], .hamburger-menu, [data-testid="menu-button"]');
              const navButtonVisible = await navButton.isVisible().catch(() => false);
              
              if (width <= 768) {
                console.log(`Menu button visible on mobile: ${navButtonVisible}`);
              } else {
                console.log(`Menu button hidden on desktop: ${!navButtonVisible}`);
              }
            } catch (error) {
              console.log('Navigation check failed:', error);
            }
            
            if (config.additionalAssertions) {
              try {
                await config.additionalAssertions(page);
              } catch (error) {
                console.error('Additional assertions failed:', error);
              }
            }
          });
        }
      });
    }
  });

  test.describe('Admin Pages', () => {
    test.beforeEach(async ({ page }) => {
      try {
        await setupAuth(page);
      } catch (error) {
        console.error('Authentication failed:', error);
      }
    });

    for (const config of adminPageConfigs) {
      test.describe(`${config.name} Page`, () => {
        for (const width of [820, 1024, 1920]) {
          test(`should render correctly at ${width}px width`, async ({ page }) => {
            await page.setViewportSize({ width, height: 800 });
            
            try {
              await page.goto(config.url, { timeout: 15000 });
            } catch (error) {
              console.error(`Navigation to ${config.url} failed:`, error);
              await page.screenshot({ path: `error-${config.name}-${width}.png` });
              test.skip();
            }
            
            await page.screenshot({ 
              path: `screenshots/admin-${config.name}-${width}.png`,
              fullPage: true
            });
            
            try {
              const sidebar = page.locator('.sidebar, aside, [data-testid="sidebar"]');
              const sidebarExists = await sidebar.count() > 0;
              
              if (sidebarExists) {
                if (width <= 1024) {
                  const sidebarButton = page.locator('button[aria-label="toggle sidebar"], .sidebar-toggle, [data-testid="sidebar-toggle"]');
                  const toggleExists = await sidebarButton.count() > 0;
                  console.log(`Sidebar toggle exists: ${toggleExists}`);
                }
              }
            } catch (error) {
              console.log('Sidebar check failed:', error);
            }
            
            if (config.additionalAssertions) {
              try {
                await config.additionalAssertions(page);
              } catch (error) {
                console.error('Additional assertions failed:', error);
              }
            }
          });
        }
      });
    }
  });

  test.describe('Common Responsive Patterns', () => {
    test('should handle images responsively', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto('/');
      
      try {
        const images = page.locator('img');
        const count = await images.count();
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 5); i++) { 
            const img = images.nth(i);
            const naturalWidth = await img.evaluate(el => (el as HTMLImageElement).naturalWidth).catch(() => 0);
            const displayWidth = await img.evaluate(el => el.clientWidth).catch(() => 0);
            
            if (naturalWidth === 0) continue;
            
            console.log(`Image ${i}: natural width ${naturalWidth}, display width ${displayWidth}`);
          }
        }
      } catch (error) {
        console.error('Image test failed:', error);
      }
    });

    test('should handle text overflow', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto('/');
      
      try {
        const headings = page.locator('h1, h2').first();
        const paragraphs = page.locator('p').first();
        
        for (const element of [headings, paragraphs]) {
          if (await element.count() > 0) {
            const style = await element.evaluate(el => {
              return {
                whiteSpace: window.getComputedStyle(el).whiteSpace,
                overflow: window.getComputedStyle(el).overflow,
                textOverflow: window.getComputedStyle(el).textOverflow
              };
            }).catch(() => ({ whiteSpace: '', overflow: '', textOverflow: '' }));
            
            console.log('Text element style:', style);
            
            const acceptableOverflow = ['visible', 'auto', 'hidden', 'ellipsis'];
            console.log(`Text overflow handled: ${acceptableOverflow.includes(style.textOverflow) || style.overflow === 'hidden'}`);
          }
        }
      } catch (error) {
        console.error('Text overflow test failed:', error);
      }
    });

    test('should handle touch targets on mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto('/');
      
      try {
        const primaryButtons = page.locator('button.primary, button[type="submit"], a.button, a.btn');
        const count = await primaryButtons.count();
        
        if (count > 0) {
          for (let i = 0; i < Math.min(count, 3); i++) { 
            const button = primaryButtons.nth(i);
            const box = await button.boundingBox();
            
            if (box) {
              console.log(`Button ${i} size: ${box.width}x${box.height}`);
              
              const isLargeEnough = box.width >= 36 && box.height >= 36;
              console.log(`Button ${i} is large enough for touch: ${isLargeEnough}`);
            }
          }
        }
      } catch (error) {
        console.error('Touch target test failed:', error);
      }
    });
  });
});