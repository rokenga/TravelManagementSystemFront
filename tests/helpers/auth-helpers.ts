import { Page } from '@playwright/test';

export type UserRole = 'guest' | 'admin' | 'agent';

export const mockUsers = {
  guest: { id: "", email: "", role: null },
  admin: { id: "admin-id", email: "admin@example.com", role: "Admin" },
  agent: { id: "agent-id", email: "agent@example.com", role: "Agent" }
};

export async function setupAuth(page: Page, role: UserRole): Promise<void> {
  if (role === 'guest') {
    await page.route('**/Auth/getUser', async (route) => {
      await route.fulfill({ status: 401 });
    });
    return;
  }
  
  await page.addInitScript(() => {
    localStorage.setItem('accessToken', `fake-${role}-token`);
  });
  
  await page.route('**/Auth/getUser', async (route) => {
    await route.fulfill({ 
      status: 200,
      body: JSON.stringify(mockUsers[role])
    });
  });
}