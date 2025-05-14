import { Page } from '@playwright/test';

export const mockClients = {
  items: [
    {
      id: 'client-1',
      name: 'John',
      surname: 'Doe',
      email: 'john.doe@example.com',
      phoneNumber: '+37061234567',
      notes: 'Regular customer',
      createdAt: '2023-01-01T00:00:00Z'
    },
    {
      id: 'client-2',
      name: 'Jane',
      surname: 'Smith',
      email: 'jane.smith@example.com',
      phoneNumber: '+37062345678',
      notes: 'VIP customer',
      createdAt: '2023-02-01T00:00:00Z'
    }
  ],
  totalCount: 25,
  pageNumber: 1,
  pageSize: 10
};

export const mockTags = {
  TravelFrequency: [
    { id: 'tag-1', name: 'Frequent', category: 'TravelFrequency', createdByAgentId: 'agent-1' },
    { id: 'tag-2', name: 'Occasional', category: 'TravelFrequency', createdByAgentId: 'agent-1' }
  ],
  TravelPreference: [
    { id: 'tag-3', name: 'Luxury', category: 'TravelPreference', createdByAgentId: 'agent-1' },
    { id: 'tag-4', name: 'Budget', category: 'TravelPreference', createdByAgentId: 'agent-1' }
  ]
};

export const mockClientTags = [
  { clientId: 'client-1', tagId: 'tag-1', tagName: 'Frequent', category: 'TravelFrequency', assignedByAgentId: 'agent-1' },
  { clientId: 'client-1', tagId: 'tag-3', tagName: 'Luxury', category: 'TravelPreference', assignedByAgentId: 'agent-1' }
];

export const mockClientTrips = {
  items: [
    {
      id: 'trip-1',
      destination: 'Paris',
      startDate: '2023-06-01T00:00:00Z',
      endDate: '2023-06-07T00:00:00Z',
      status: 'Completed'
    },
    {
      id: 'trip-2',
      destination: 'Rome',
      startDate: '2023-08-15T00:00:00Z',
      endDate: '2023-08-22T00:00:00Z',
      status: 'Upcoming'
    }
  ],
  totalCount: 2,
  pageNumber: 1,
  pageSize: 10
};

export const mockClientOffers = {
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
};

export async function setupClientListMocks(page: Page) {
  await page.route('**/Client/search', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockClients)
    });
  });

  await page.route('**/ClientTag/grouped', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify([
        { category: 'TravelFrequency', tags: mockTags.TravelFrequency },
        { category: 'TravelPreference', tags: mockTags.TravelPreference }
      ])
    });
  });

  await page.route('**/Auth/getUser', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify({ id: 'agent-1', email: 'agent@example.com', role: 'Agent' })
    });
  });

  await page.addInitScript(() => {
    localStorage.setItem('accessToken', 'fake-token');
  });
}

export async function setupClientFormMocks(page: Page) {
  await setupClientListMocks(page);

  await page.route('**/Client', async (route) => {
    if (route.request().method() === 'POST') {
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ id: 'new-client', success: true })
      });
    }
  });

  await page.route('**/Client/*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify(mockClients.items[0])
      });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ ...mockClients.items[0], name: 'Updated' })
      });
    }
  });
}

export async function setupClientDetailMocks(page: Page) {
  await setupClientListMocks(page);

  await page.route('**/Client/client-1', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockClients.items[0])
    });
  });

  await page.route('**/ClientTagAssignment/client-1', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockClientTags)
    });
  });

  await page.route('**/client-trips/client/client-1', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockClientTrips)
    });
  });

  await page.route('**/ClientTripOfferFacade/client/client-1', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockClientOffers)
    });
  });

  await page.route('**/Client/client-1', async (route) => {
    if (route.request().method() === 'DELETE') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ success: true })
      });
    }
  });
}

export async function setupTagManagementMocks(page: Page) {
  await setupClientListMocks(page);

  await page.route('**/ClientTag', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify(mockTags)
      });
    } else if (route.request().method() === 'POST') {
      await route.fulfill({ 
        status: 201, 
        body: JSON.stringify({ id: 'new-tag', success: true })
      });
    }
  });

  await page.route('**/ClientTag/*', async (route) => {
    if (route.request().method() === 'PUT') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ success: true })
      });
    } else if (route.request().method() === 'DELETE') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ success: true })
      });
    }
  });
}

export async function setupClientTagAssignmentMocks(page: Page) {
  await setupClientListMocks(page);

  await page.route('**/ClientTag', async (route) => {
    await route.fulfill({ 
      status: 200, 
      body: JSON.stringify(mockTags)
    });
  });

  await page.route('**/ClientTagAssignment/*', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify(mockClientTags)
      });
    } else if (route.request().method() === 'PUT') {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({ success: true })
      });
    }
  });
}

export async function setupClientFilterMocks(page: Page) {
  await setupClientListMocks(page);
  
  await page.route('**/Client/search', async (route) => {
    const body = await route.request().postDataJSON();
    
    if (body.categoryFilters && body.categoryFilters.length > 0) {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify({
          items: [mockClients.items[0], mockClients.items[1]],
          totalCount: 2,
          pageNumber: 1,
          pageSize: 10
        })
      });
    } else {
      await route.fulfill({ 
        status: 200, 
        body: JSON.stringify(mockClients)
      });
    }
  });
}