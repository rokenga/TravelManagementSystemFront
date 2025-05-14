import { Page } from '@playwright/test';


export async function setupAuth(page: Page) {
  const isLoggedIn = await page.evaluate(() => {
    return !!localStorage.getItem('authToken') || !!sessionStorage.getItem('authToken');
  });

  if (isLoggedIn) {
    console.log('Already authenticated, skipping login');
    return;
  }

  await page.goto('/login');

  try {
    await page.waitForSelector('input[type="email"], input[name="email"]', { timeout: 5000 });

    await page.fill('input[type="email"], input[name="email"]', process.env.TEST_USER_EMAIL || 'test@example.com');
    await page.fill('input[type="password"], input[name="password"]', process.env.TEST_USER_PASSWORD || 'Password123!');

    await page.click('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")');

    await Promise.race([
      page.waitForNavigation({ timeout: 10000 }),
      page.waitForSelector('.dashboard, .admin-panel, .logged-in-indicator', { timeout: 10000 })
    ]);

    console.log('Authentication successful');
  } catch (error) {
    console.error('Authentication failed:', error);
    
    await page.screenshot({ path: 'auth-failure.png', fullPage: true });
    
    console.log('Continuing test without authentication');
  }
} 