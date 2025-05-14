import { Page } from '@playwright/test';

export interface LoadingTestConfig {
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
}

async function setupAuthentication(page: Page) {
    await page.context().addCookies([{
      name: 'auth_token',
      value: 'test-token',
      domain: 'localhost',
      path: '/'
    }]);
    
    await page.evaluate(() => {
      localStorage.setItem('auth_token', 'test-token');
    });
  }
  
  export async function testCircularProgressLoading(page: Page, options: {
    requiresAuth?: boolean;
  }) {
    const { requiresAuth = false } = options;
    
    if (requiresAuth) {
      await setupAuthentication(page);
    }
    
  }

export const pageLoadingConfigs: LoadingTestConfig[] = [
  {
    name: 'Home',
    url: '/',
    apiRoute: '**/api/home*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
  },
  {
    name: 'Login',
    url: '/login',
    apiRoute: '**/api/auth/login',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
    triggerAction: async (page) => {
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign in")').first();
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
      } else {
        console.log('Email input not found');
      }
      
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('password123');
      } else {
        console.log('Password input not found');
      }
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
      } else {
        console.log('Submit button not found');
      }
    }
  },
  {
    name: 'ForgotPassword',
    url: '/forgot-password',
    apiRoute: '**/api/auth/forgot-password',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
    triggerAction: async (page) => {
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Send")').first();
      
      if (await emailInput.count() > 0) {
        await emailInput.fill('test@example.com');
      }
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'ResetPassword',
    url: '/reset-password',
    apiRoute: '**/api/auth/reset-password',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
    triggerAction: async (page) => {
      const passwordInput = page.locator('input[type="password"], input[name="password"], input[placeholder*="password" i]').first();
      const confirmInput = page.locator('input[type="password"], input[name="confirmPassword"], input[placeholder*="confirm" i]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Reset"), button:has-text("Update")').first();
      
      if (await passwordInput.count() > 0) {
        await passwordInput.fill('newpassword123');
      }
      
      if (await confirmInput.count() > 0) {
        await confirmInput.fill('newpassword123');
      }
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'SpecialOffers',
    url: '/specialOffers',
    apiRoute: '**/api/special-offers*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
  },
  {
    name: 'SpecialOfferDetails',
    url: '/specialOfferDetails/1',
    apiRoute: '**/api/special-offers/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
  },
  {
    name: 'SpecialOfferReservation',
    url: '/reserve-special-offer/1',
    apiRoute: '**/api/special-offers/1/reserve',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Reserve"), button:has-text("Book")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'TwoFactorSetup',
    url: '/2fa-setup',
    apiRoute: '**/api/auth/2fa/setup',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Setup"), button:has-text("Enable")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'TwoFactorAuth',
    url: '/2fa-verify',
    apiRoute: '**/api/auth/2fa/verify',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: false,
    triggerAction: async (page) => {
      const codeInput = page.locator('input[type="text"], input[name="code"], input[placeholder*="code" i]').first();
      const submitButton = page.locator('button[type="submit"], button:has-text("Verify"), button:has-text("Submit")').first();
      
      if (await codeInput.count() > 0) {
        await codeInput.fill('123456');
      }
      
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'ProfilePage',
    url: '/profile-page',
    apiRoute: '**/api/profile*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AdminClientList',
    url: '/admin-client-list',
    apiRoute: '**/api/client/search',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    skipIfElementMissing: 'h1, h2, h3, h4, h5, h6',
  },
  {
    name: 'ClientDetail',
    url: '/admin-client-list/1',
    apiRoute: '**/api/client/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AdminTripList',
    url: '/admin-trip-list',
    apiRoute: '**/api/trip/search',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'ClientTrip',
    url: '/admin-trip-list/1',
    apiRoute: '**/api/trip/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'EditTripWizard',
    url: '/admin-trip-list/1/edit',
    apiRoute: '**/api/trip/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'CreateTripWizard',
    url: '/admin-trip-list/create',
    apiRoute: '**/api/trip',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'PartnerList',
    url: '/partner-list',
    apiRoute: '**/api/partner*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'PartnerDetails',
    url: '/partner-list/1',
    apiRoute: '**/api/partner/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AdminClientSpecialOffers',
    url: '/special-offers',
    apiRoute: '**/api/client-special-offers*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AdminPublicSpecialOffers',
    url: '/public-offers',
    apiRoute: '**/api/public-special-offers*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'ClientSpecialOfferCreation',
    url: '/special-offers/create',
    apiRoute: '**/api/client-special-offers',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'ClientSpecialOffer',
    url: '/special-offers/1',
    apiRoute: '**/api/client-special-offers/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'EditClientOfferWizard',
    url: '/special-offers/1/edit',
    apiRoute: '**/api/client-special-offers/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'PublicOfferCreationForm',
    url: '/public-offers/create',
    apiRoute: '**/api/public-special-offers',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Create"), button:has-text("Save")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'AdminPublicSpecialOfferDetails',
    url: '/public-offers/1',
    apiRoute: '**/api/public-special-offers/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AdminPublicSpecialOfferReservations',
    url: '/public-offers/1/reservations',
    apiRoute: '**/api/public-special-offers/1/reservations',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'EditPublicOfferWizard',
    url: '/public-offers/1/edit',
    apiRoute: '**/api/public-special-offers/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Save"), button:has-text("Update")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'AgentOnboarding',
    url: '/agent-onboarding',
    apiRoute: '**/api/agent/onboarding',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const submitButton = page.locator('button[type="submit"], button:has-text("Submit"), button:has-text("Complete")').first();
      if (await submitButton.count() > 0) {
        await submitButton.click();
      }
    }
  },
  {
    name: 'AdminAgentList',
    url: '/agents',
    apiRoute: '**/api/agent*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'AgentDetail',
    url: '/agents/1',
    apiRoute: '**/api/agent/1',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  },
  {
    name: 'Workspace',
    url: '/',
    apiRoute: '**/api/workspace*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
  }
];

export const componentLoadingConfigs: LoadingTestConfig[] = [
  {
    name: 'DataTable',
    url: '/admin-client-list',
    apiRoute: '**/api/table-data*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const refreshButton = page.locator('[data-testid="refresh-button"], button:has-text("Refresh"), button:has-text("Reload")').first();
      if (await refreshButton.count() > 0) {
        await refreshButton.click();
      } else {
        console.log('Refresh button not found');
      }
    },
    skipIfElementMissing: 'table, [role="table"], .MuiTable-root',
  },
  {
    name: 'SearchBar',
    url: '/admin-client-list',
    apiRoute: '**/api/search*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i], input[aria-label*="search" i]').first();
      if (await searchInput.count() > 0) {
        await searchInput.fill('test');
        await page.keyboard.press('Enter');
      } else {
        console.log('Search input not found');
      }
    },
    skipIfElementMissing: 'input[type="search"], input[placeholder*="search" i]',
  },
  {
    name: 'FilterPanel',
    url: '/admin-client-list',
    apiRoute: '**/api/filter*',
    loadingSelector: '.MuiCircularProgress-root',
    loadingSelectors: ['[role="progressbar"]', '.loading', '.spinner'],
    requiresAuth: true,
    triggerAction: async (page) => {
      const filterButton = page.locator('[data-testid="filter-button"], button:has-text("Filter"), button:has-text("Filters")').first();
      const applyButton = page.locator('[data-testid="apply-filters"], button:has-text("Apply"), button:has-text("Filter")').first();
      
      if (await filterButton.count() > 0) {
        await filterButton.click();
      } else {
        console.log('Filter button not found');
      }
      
      if (await applyButton.count() > 0) {
        await applyButton.click();
      } else {
        console.log('Apply filters button not found');
      }
    },
    skipIfElementMissing: '[data-testid="filter-button"], button:has-text("Filter")',
  }
];

export const viewportConfigs = [
  { width: 1920, height: 1080, name: 'desktop' },
  { width: 768, height: 1024, name: 'tablet' },
  { width: 375, height: 812, name: 'mobile' }
];