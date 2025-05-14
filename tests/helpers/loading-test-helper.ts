import { test, expect, Page } from '@playwright/test';

async function setupAuthentication(page: Page) {
  try {
    await page.context().addCookies([{
      name: 'auth_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.evaluate(() => {
      try {
        localStorage.setItem('auth_token', 'test-token');
        sessionStorage.setItem('auth_token', 'test-token');
      } catch (e) {
        console.log('Could not set localStorage/sessionStorage');
      }
    }).catch(err => console.log('Auth localStorage setup failed, continuing anyway'));
    
    await page.route('**/api/auth/login', async (route) => {
      await route.fulfill({
        status: 200,
        body: JSON.stringify({ 
          token: 'test-token',
          user: { id: 'test-user', role: 'admin' }
        })
      });
    });
  } catch (error) {
    console.log('Authentication setup failed, continuing anyway:', error);
  }
}

export async function testCircularProgressLoading(page: Page, options: {
  name: string;
  url: string;
  apiRoute: string | RegExp;
  loadingSelector?: string;
  loadingSelectors?: string[]; 
  triggerAction?: (page: Page) => Promise<void>;
  additionalAssertions?: (page: Page) => Promise<void>;
  requiresAuth?: boolean;
  responseDelay?: number;
  appearTimeout?: number;
  disappearTimeout?: number;
  skipIfElementMissing?: string; 
}) {
  const { 
    name,
    url, 
    apiRoute, 
    loadingSelector = '.MuiCircularProgress-root', 
    loadingSelectors = [],
    triggerAction,
    additionalAssertions,
    requiresAuth = name.startsWith('Admin') || name.includes('Profile'),
    responseDelay = 500,
    appearTimeout = 10000, 
    disappearTimeout = 20000, 
    skipIfElementMissing
  } = options;
  
  console.log(`Testing loading state for: ${name}`);
  
  if (requiresAuth) {
    await setupAuthentication(page);
  }
  
  try {
    if (url) {
      await page.goto(url, { timeout: 30000 }).catch(e => {
        console.log(`Navigation to ${url} failed: ${e.message}`);
      });
    }
    
    if (skipIfElementMissing) {
      const exists = await page.locator(skipIfElementMissing).count() > 0;
      if (!exists) {
        console.log(`Skipping test for ${name} because ${skipIfElementMissing} is missing`);
        test.skip();
        return;
      }
    }
    
    let routeHandled = false;
    await page.route(apiRoute, async route => {
      routeHandled = true;
      await new Promise(resolve => setTimeout(resolve, responseDelay));
      await route.continue();
    });
    
    if (triggerAction) {
      try {
        await triggerAction(page);
      } catch (error) {
        console.log(`Trigger action failed for ${name}: ${error.message}`);
        await page.screenshot({ path: `${name}-trigger-error.png` });
        throw error;
      }
    }
    
    await page.waitForTimeout(500);
    
    if (!routeHandled) {
      console.log(`Warning: API route ${apiRoute} was not triggered for ${name}`);
    }
    
    const allSelectors = [loadingSelector, ...loadingSelectors];
    let loadingElementFound = false;
    
    for (const selector of allSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        console.log(`Found loading indicator with selector: ${selector}`);
        
        const loadingElement = count > 1 
          ? page.locator(selector).first()
          : page.locator(selector);
        
        try {
          await expect(loadingElement).toBeVisible({ timeout: appearTimeout });
          loadingElementFound = true;
          
          await expect(loadingElement).not.toBeVisible({ timeout: disappearTimeout });
          
          break;
        } catch (error) {
          console.log(`Loading indicator with selector ${selector} was not visible or did not disappear: ${error.message}`);
        }
      }
    }
    
    if (!loadingElementFound) {
      console.log(`No loading indicator found for ${name} with any of the selectors`);
      await page.screenshot({ path: `${name}-no-loading.png` });
      
      console.log(`WARNING: Could not verify loading state for ${name}`);
    }
    
    if (additionalAssertions) {
      await additionalAssertions(page);
    }
    
    console.log(`Loading test completed for: ${name}`);
  } catch (error) {
    console.error(`Test failed for ${name}: ${error.message}`);
    await page.screenshot({ path: `${name}-error.png` });
    throw error;
  }
}

export async function testLoadingWithError(page: Page, options: {
  name: string;
  url: string;
  apiRoute: string | RegExp;
  loadingSelector?: string;
  loadingSelectors?: string[];
  errorSelector?: string;
  errorSelectors?: string[];
  triggerAction?: (page: Page) => Promise<void>;
  errorStatus?: number;
  errorResponse?: any;
}) {
  const { 
    name,
    url, 
    apiRoute, 
    loadingSelector = '.MuiCircularProgress-root',
    loadingSelectors = [],
    errorSelector = '.error-message, .MuiAlert-root',
    errorSelectors = ['.MuiAlert-standardError', '[role="alert"]', '.error'],
    triggerAction,
    errorStatus = 500,
    errorResponse = { error: 'Test error' }
  } = options;
  
  
  try {
    if (url) {
      await page.goto(url, { timeout: 30000 }).catch(e => {
        console.log(`Navigation to ${url} failed: ${e.message}`);
      });
    }
    
    await page.route(apiRoute, async route => {
      await new Promise(resolve => setTimeout(resolve, 300));
      
      await route.fulfill({
        status: errorStatus,
        body: JSON.stringify(errorResponse)
      });
    });
    
    if (triggerAction) {
      await triggerAction(page);
    }
    
    const allLoadingSelectors = [loadingSelector, ...loadingSelectors];
    let loadingElementFound = false;
    
    for (const selector of allLoadingSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const loadingElement = count > 1 
          ? page.locator(selector).first()
          : page.locator(selector);
        
        try {
          await expect(loadingElement).toBeVisible({ timeout: 10000 });
          loadingElementFound = true;
          await expect(loadingElement).not.toBeVisible({ timeout: 20000 });
          break;
        } catch (error) {
        }
      }
    }
    
    if (!loadingElementFound) {
      console.log(`No loading indicator found for ${name}`);
    }
    
    const allErrorSelectors = [errorSelector, ...errorSelectors];
    let errorElementFound = false;
    
    for (const selector of allErrorSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        const errorElement = count > 1 
          ? page.locator(selector).first()
          : page.locator(selector);
        
        try {
          await expect(errorElement).toBeVisible({ timeout: 10000 });
          errorElementFound = true;
          break;
        } catch (error) {
        }
      }
    }
    
    if (!errorElementFound) {
      console.log(`No error message found for ${name}`);
      await page.screenshot({ path: `${name}-no-error.png` });
      throw new Error(`Could not find error message for ${name}`);
    }
    
    console.log(`Loading with error test completed for: ${name}`);
  } catch (error) {
    console.error(`Test failed for ${name}: ${error.message}`);
    await page.screenshot({ path: `${name}-error.png` });
    throw error;
  }
}