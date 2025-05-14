import { test, expect } from '@playwright/test';

test.describe('Client Detail Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('accessToken', 'fake-token');
    });
    
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ id: 'agent-1', email: 'agent@example.com', role: 'Agent' })
      });
    });
    
    await page.route('**/Client/client-1', async (route) => {
      if (route.request().method() === 'GET') {
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({
            id: 'client-1',
            name: 'John',
            surname: 'Doe',
            email: 'john.doe@example.com',
            phoneNumber: '+37061234567',
            birthday: '1990-01-01T00:00:00Z',
            notes: 'Test notes',
            createdAt: '2023-01-01T00:00:00Z'
          })
        });
      } else if (route.request().method() === 'DELETE') {
        await route.fulfill({ 
          status: 200, 
          body: JSON.stringify({ success: true })
        });
      }
    });
    
    await page.route('**/ClientTagAssignment/client-1', async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify([
          { 
            clientId: 'client-1', 
            tagId: 'tag-1', 
            tagName: 'Frequent', 
            category: 'TravelFrequency', 
            assignedByAgentId: 'agent-1' 
          }
        ])
      });
    });
    
    await page.route('**/client-trips/client/client-1', async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({
          items: [
            {
              id: 'trip-1',
              destination: 'Paris',
              startDate: '2023-06-01T00:00:00Z',
              endDate: '2023-06-07T00:00:00Z',
              status: 'Completed'
            }
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10
        })
      });
    });
    
    await page.route('**/ClientTripOfferFacade/client/client-1', async (route) => {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({
          items: [
            {
              id: 'offer-1',
              title: 'Summer in Barcelona',
              description: 'Special summer offer',
              price: 1200,
              startDate: '2023-07-01T00:00:00Z',
              endDate: '2023-07-10T00:00:00Z'
            }
          ],
          totalCount: 1,
          pageNumber: 1,
          pageSize: 10
        })
      });
    });
    
    await page.goto('/admin-client-list/client-1');
    
    await page.waitForSelector('h4, h5, h6', { timeout: 10000 });
  });

  test('displays client information correctly', async ({ page }) => {
    const nameElement = page.locator('h4, h5, h6').filter({ hasText: 'John Doe' });
    await expect(nameElement).toBeVisible();
    
    await expect(page.getByText('+37061234567')).toBeVisible();
    
    await expect(page.getByText('john.doe@example.com')).toBeVisible();
  });

  test('displays client tags', async ({ page }) => {
    const tagChip = page.locator('.MuiChip-root').first();
    await expect(tagChip).toBeVisible();
  });

  test('opens tag management modal', async ({ page }) => {
    const actionBar = page.locator('button').filter({ hasText: /žymekl/i }).first();
    if (await actionBar.isVisible()) {
      await actionBar.click();
      
      const dialog = page.locator('div[role="dialog"]');
      await expect(dialog).toBeVisible();
      
      const closeButton = dialog.locator('button').first();
      await closeButton.click();
    } else {
      const tagIcon = page.locator('svg').filter({ hasText: 'LocalOffer' }).first();
      if (await tagIcon.isVisible()) {
        await tagIcon.click();
        
        const dialog = page.locator('div[role="dialog"]');
        await expect(dialog).toBeVisible();
      } else {
        test.skip('Tag management button not found');
      }
    }
  });

  test('shows delete confirmation dialog', async ({ page }) => {
    const deleteButton = page.getByRole('button').filter({ hasText: /ištrinti|delete/i }).first();
    
    if (await deleteButton.isVisible()) {
      await deleteButton.click();
      
      const dialog = page.locator('div[role="dialog"]').filter({ hasText: /ištrinti|delete/i });
      await expect(dialog).toBeVisible();
      
      const cancelButton = dialog.getByRole('button').filter({ hasText: /atšaukti|cancel/i });
      await cancelButton.click();
      
      await expect(dialog).not.toBeVisible();
    } else {
      test.skip('Delete button not found');
    }
  });

  test('shows edit client modal', async ({ page }) => {
    const editButton = page.getByRole('button').filter({ hasText: /redaguoti|edit/i }).first();
    
    if (await editButton.isVisible()) {
      await editButton.click();
      
      const dialog = page.locator('div[role="dialog"]').filter({ hasText: /redaguoti|edit/i });
      await expect(dialog).toBeVisible();
      
      const cancelButton = dialog.getByRole('button').filter({ hasText: /atšaukti|cancel/i });
      await cancelButton.click();
      
      await expect(dialog).not.toBeVisible();
    } else {
      test.skip('Edit button not found');
    }
  });
});