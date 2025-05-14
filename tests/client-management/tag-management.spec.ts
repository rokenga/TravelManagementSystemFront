import { test, expect } from '@playwright/test';
import { setupTagManagementMocks } from '../helpers/client-mocks';

test.describe('Tag Management', () => {
  test.beforeEach(async ({ page }) => {
    await setupTagManagementMocks(page);
    await page.goto('/admin-client-list');
    await page.getByRole('button', { name: 'Tvarkyti žymeklius' }).click();
  });


  test('deletes a tag with confirmation', async ({ page }) => {
    const deleteIcon = page.locator('.MuiChip-deleteIcon').first();
    await deleteIcon.click();
    
    await expect(page.getByRole('dialog').filter({ hasText: 'Patvirtinti ištrynimą' })).toBeVisible();
    
    await page.getByRole('button', { name: 'Patvirtinti' }).click();
    
    await expect(page.getByText('Žymeklis sėkmingai ištrintas!')).toBeVisible();
  });
});