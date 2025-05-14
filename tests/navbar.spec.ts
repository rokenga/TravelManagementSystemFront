import { test, expect } from '@playwright/test';
import { chromium } from '@playwright/test';

const mockUsers = {
  guest: { id: "", email: "", role: null },
  admin: { id: "admin-id", email: "admin@example.com", role: "Admin" },
  agent: { id: "agent-id", email: "agent@example.com", role: "Agent" }
};

test.describe('Navbar Component', () => {
  test('should display correct menu items for Guest user', async ({ page }) => {
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ status: 401 });
    });
    
    await page.goto('/');
    
    await expect(page.locator('div[role="button"][aria-label="Go to home page"]')).toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Pagrindinis' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Karšti kelionių pasiūlymai' })).toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Agentai' })).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Klientai' })).not.toBeVisible();
  });

  test('should display correct menu items for Admin user', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-admin-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify(mockUsers.admin)
      });
    });
    
    await page.goto('/');
    
    await expect(page.getByRole('button', { name: 'Pagrindinis' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agentai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Klientai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kelionės' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Klientų pasiūlymai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vieši pasiūlymai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Partneriai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Paskyra' })).toBeVisible();
  });

  test('should display correct menu items for Agent user', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-agent-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify(mockUsers.agent)
      });
    });
    
    await page.goto('/');
    
    await expect(page.getByRole('button', { name: 'Pagrindinis' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Klientai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Kelionės' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Klientų pasiūlymai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Vieši pasiūlymai' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Partneriai' })).toBeVisible();
    
    await expect(page.getByRole('button', { name: 'Agentai' })).not.toBeVisible();
  });

  test('should navigate to correct pages when menu items are clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-admin-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify(mockUsers.admin)
      });
    });
    
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Klientai' }).click();
    await expect(page).toHaveURL('/admin-client-list');
    
    await page.getByRole('button', { name: 'Kelionės' }).click();
    await expect(page).toHaveURL('/admin-trip-list');
    
    await page.getByRole('button', { name: 'Pagrindinis' }).click();
    await expect(page).toHaveURL('/');
  });

  test('should open profile dropdown menu and navigate correctly', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-admin-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify(mockUsers.admin)
      });
    });
    
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Paskyra' }).click();
    
    await expect(page.getByText('Peržiūrėti paskyrą', { exact: true })).toBeVisible();
    await expect(page.getByText('Atsijungti', { exact: true })).toBeVisible();
    
    await page.getByText('Peržiūrėti paskyrą').click();
    await expect(page).toHaveURL('/profile-page');
  });

  test('should log out when logout button is clicked', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-admin-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200,
        body: JSON.stringify(mockUsers.admin)
      });
    });
    
    await page.goto('/');
    
    await page.getByRole('button', { name: 'Paskyra' }).click();
    
    await page.getByText('Atsijungti', { exact: true }).click();
    
    await expect(page).toHaveURL('/login');
    
    const accessToken = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(accessToken).toBeNull();
  });
});