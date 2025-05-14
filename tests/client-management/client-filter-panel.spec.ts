import { test, expect } from '@playwright/test';
import { setupClientFilterMocks } from '../helpers/client-mocks';

test.describe('Client Filter Panel', () => {
  test.beforeEach(async ({ page }) => {
    await setupClientFilterMocks(page);
    await page.goto('/admin-client-list');
  });

  test('displays filter panel on desktop', async ({ page }) => {
    await expect(page.getByText('Filtrai')).toBeVisible();
    await expect(page.getByText('Kelionių dažnumas')).toBeVisible();
    await expect(page.getByText('Kelionių pomėgiai')).toBeVisible();
  });

  test('opens filter drawer on mobile', async ({ page, browser }) => {
    const context = await browser.newContext({
      viewport: { width: 375, height: 667 }
    });
    
    const mobilePage = await context.newPage();
    await setupClientFilterMocks(mobilePage);
    await mobilePage.goto('/admin-client-list');
    
    await mobilePage.getByRole('button', { name: 'Filtrai' }).click();
    
    await expect(mobilePage.getByRole('heading', { name: 'Filtrai' })).toBeVisible();
    await expect(mobilePage.getByText('Kelionių dažnumas')).toBeVisible();
    
    await context.close();
  });

  test('resets filters', async ({ page }) => {
    const firstCheckbox = page.getByRole('checkbox').first();
    await firstCheckbox.check();
    
    await page.getByRole('button', { name: 'Išvalyti' }).click();
    
    await expect(firstCheckbox).not.toBeChecked();
  });
});