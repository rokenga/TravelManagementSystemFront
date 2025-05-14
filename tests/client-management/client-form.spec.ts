import { test, expect } from '@playwright/test';
import { setupClientFormMocks } from '../helpers/client-mocks';

test.describe('Client Form Modal', () => {
  test.beforeEach(async ({ page }) => {
    await setupClientFormMocks(page);
    await page.goto('/admin-client-list');
    await page.getByRole('button', { name: 'Sukurti naują klientą' }).click();
  });

  test('creates a new client successfully', async ({ page }) => {
    await page.getByLabel('Vardas').fill('Test');
    await page.getByLabel('Pavardė').fill('Client');
    await page.getByLabel('Telefono numeris').fill('+37061234567');
    await page.getByLabel('El. paštas').fill('test@example.com');
    await page.getByLabel('Pastabos').fill('Test notes');
    
    await page.getByRole('button', { name: 'Sukurti klientą' }).click();
    
    await expect(page.getByText('Klientas sėkmingai sukurtas!')).toBeVisible();
    await expect(page.getByRole('dialog')).not.toBeVisible({ timeout: 2000 });
  });

  test('cancels client creation', async ({ page }) => {
    await page.getByRole('button', { name: 'Atšaukti' }).click();
    
    await expect(page.getByRole('dialog')).not.toBeVisible();
  });
});