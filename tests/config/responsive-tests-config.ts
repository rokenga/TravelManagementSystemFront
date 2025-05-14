import { Page } from '@playwright/test';

export interface ResponsiveTestConfig {
  name: string;
  url: string;
  minWidth: number;
  maxWidth: number;
  requiresAuth?: boolean;
  additionalAssertions?: (page: Page) => Promise<void>;
}

export const publicPageConfigs: ResponsiveTestConfig[] = [
  {
    name: 'Home',
    url: '/',
    minWidth: 320,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'Login',
    url: '/login',
    minWidth: 320,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'SpecialOffers',
    url: '/specialOffers',
    minWidth: 320,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'SpecialOfferDetails',
    url: '/specialOfferDetails/1',
    minWidth: 320,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'SpecialOfferReservation',
    url: '/reserve-special-offer/1',
    minWidth: 320,
    maxWidth: 1920,
    requiresAuth: false,
  }
];

export const adminPageConfigs: ResponsiveTestConfig[] = [
  {
    name: 'ForgotPassword',
    url: '/forgot-password',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'ResetPassword',
    url: '/reset-password',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'TwoFactorSetup',
    url: '/2fa-setup',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'TwoFactorAuth',
    url: '/2fa-verify',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: false,
  },
  {
    name: 'ProfilePage',
    url: '/profile-page',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminClientList',
    url: '/admin-client-list',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'ClientDetail',
    url: '/admin-client-list/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminTripList',
    url: '/admin-trip-list',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'ClientTrip',
    url: '/admin-trip-list/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'EditTripWizard',
    url: '/admin-trip-list/1/edit',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'CreateTripWizard',
    url: '/admin-trip-list/create',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'PartnerList',
    url: '/partner-list',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'PartnerDetails',
    url: '/partner-list/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminClientSpecialOffers',
    url: '/special-offers',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminPublicSpecialOffers',
    url: '/public-offers',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'ClientSpecialOfferCreation',
    url: '/special-offers/create',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'ClientSpecialOffer',
    url: '/special-offers/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'EditClientOfferWizard',
    url: '/special-offers/1/edit',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'PublicOfferCreationForm',
    url: '/public-offers/create',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminPublicSpecialOfferDetails',
    url: '/public-offers/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminPublicSpecialOfferReservations',
    url: '/public-offers/1/reservations',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'EditPublicOfferWizard',
    url: '/public-offers/1/edit',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AgentOnboarding',
    url: '/agent-onboarding',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AdminAgentList',
    url: '/agents',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'AgentDetail',
    url: '/agents/1',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  },
  {
    name: 'Workspace',
    url: '/',
    minWidth: 820,
    maxWidth: 1920,
    requiresAuth: true,
  }
];

export const viewportBreakpoints = {
  mobile: { width: 375, height: 812 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1920, height: 1080 }
};

export const testViewportRanges = {
  public: {
    min: 320,
    max: 1920,
    breakpoints: [320, 375, 768, 1024, 1440, 1920]
  },
  admin: {
    min: 820,
    max: 1920,
    breakpoints: [820, 1024, 1440, 1920]
  }
};