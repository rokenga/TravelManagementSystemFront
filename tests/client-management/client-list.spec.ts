import { test, expect } from '@playwright/test';
import { mockClients, mockTags, setupClientListMocks } from '../helpers/client-mocks';

test.describe('Client List Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupClientListMocks(page);
    await page.goto('/admin-client-list');
  });


  test('opens client creation modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Sukurti naują klientą' }).click();
    
    await expect(page.getByRole('dialog').filter({ hasText: 'Sukurti naują klientą' })).toBeVisible();
    await expect(page.getByLabel('Vardas')).toBeVisible();
    await expect(page.getByLabel('Pavardė')).toBeVisible();
    await expect(page.getByLabel('Telefono numeris')).toBeVisible();
    await expect(page.getByLabel('El. paštas')).toBeVisible();
  });

  test('opens tag management modal', async ({ page }) => {
    await page.getByRole('button', { name: 'Tvarkyti žymeklius' }).click();
    
    await expect(page.getByRole('dialog').filter({ hasText: 'Tvarkyti žymeklius' })).toBeVisible();
    await expect(page.getByLabel('Žymeklio pavadinimas')).toBeVisible();
    await expect(page.getByLabel('Kategorija')).toBeVisible();
  });

  test('navigates to client detail page when clicking on client card', async ({ page }) => {
    const firstClientCard = page.getByRole('button')
      .filter({ has: page.getByRole('heading').filter({ hasText: /John|Jane/ }) })
      .first();
    
    await expect(firstClientCard).toBeVisible({ timeout: 10000 });
    
    await firstClientCard.click({ timeout: 10000, force: true });
    
    await expect(page).toHaveURL(/\/admin-client-list\/[a-zA-Z0-9-]+/);
  });
});