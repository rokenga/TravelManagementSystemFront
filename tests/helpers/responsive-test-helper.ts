import { test, expect, Page } from '@playwright/test';

export async function testResponsiveLayout(page: Page, options: {
  name: string;
  url: string;
  isAdminPage: boolean;
  selectors: {
    alwaysVisible: string[];
    hiddenOnMobile?: string[];
    responsiveElements?: Array<{
      selector: string;
      assertions: (page: Page, isMobile: boolean) => Promise<void>;
    }>;
  };
  customAssertions?: (page: Page, viewport: { width: number, height: number }) => Promise<void>;
}) {
  const { name, url, isAdminPage, selectors, customAssertions } = options;
  
  const viewports = isAdminPage 
    ? [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 1280, height: 800, name: 'laptop' },
        { width: 820, height: 1180, name: 'tablet' }
      ]
    : [
        { width: 1920, height: 1080, name: 'desktop' },
        { width: 768, height: 1024, name: 'tablet' },
        { width: 428, height: 926, name: 'mobile-large' },
        { width: 320, height: 568, name: 'mobile-small' }
      ];
  
  for (const viewport of viewports) {
    console.log(`Testing ${name} at ${viewport.name} (${viewport.width}x${viewport.height})`);
    
    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height
    });
    
    await page.goto(url, { timeout: 30000 }).catch(e => {
      console.log(`Navigation to ${url} failed: ${e.message}`);
    });
    
    await page.screenshot({ 
      path: `screenshots/${name}-${viewport.name}.png`,
      fullPage: true
    });
    
    for (const selector of selectors.alwaysVisible) {
      await expect(page.locator(selector)).toBeVisible();
    }
    
    if (selectors.hiddenOnMobile && viewport.width <= 428) {
      for (const selector of selectors.hiddenOnMobile) {
        await expect(page.locator(selector)).not.toBeVisible();
      }
    }
    
    if (selectors.responsiveElements) {
      const isMobile = viewport.width <= 428;
      
      for (const element of selectors.responsiveElements) {
        await element.assertions(page, isMobile);
      }
    }
    
    if (customAssertions) {
      await customAssertions(page, viewport);
    }
  }
}

export async function testResponsiveNavigation(page: Page, options: {
  name: string;
  url: string;
  menuSelector: string;
  hamburgerSelector: string;
  menuItemsSelector: string;
}) {
  const { name, url, menuSelector, hamburgerSelector, menuItemsSelector } = options;
  
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto(url);
  
  await expect(page.locator(menuSelector)).toBeVisible();
  await expect(page.locator(hamburgerSelector)).not.toBeVisible();
  
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(url);
  
  await expect(page.locator(hamburgerSelector)).toBeVisible();
  await expect(page.locator(menuItemsSelector)).not.toBeVisible();
  
  await page.locator(hamburgerSelector).click();
  await expect(page.locator(menuItemsSelector)).toBeVisible();
}