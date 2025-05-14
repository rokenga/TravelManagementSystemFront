import { test, expect, devices } from "@playwright/test";

async function mockApiResponses(page) {
  await page.route("**/PublicTripOfferFacade", async (route) => {
    await route.fulfill({
      status: 200,
      body: JSON.stringify([
        {
          id: "offer-1",
          title: "Egzotiška kelionė į Balį",
          description: "Pabėkite nuo kasdienybės į tropinį rojų",
          price: 1299,
          destination: "Balis",
          imageUrl: "/placeholder.jpg",
          startDate: "2025-06-15T00:00:00Z",
          endDate: "2025-06-25T00:00:00Z",
          createdAt: "2025-05-01T00:00:00Z",
        },
        {
          id: "offer-2",
          title: "Savaitgalis Romoje",
          description: "Atraskite amžinąjį miestą",
          price: 599,
          destination: "Roma",
          imageUrl: "/placeholder.jpg",
          startDate: "2025-07-10T00:00:00Z",
          endDate: "2025-07-13T00:00:00Z",
          createdAt: "2025-05-02T00:00:00Z",
        },
        {
          id: "offer-3",
          title: "Šiaurės pašvaistė Islandijoje",
          description: "Stebuklingas gamtos reginys",
          price: 899,
          destination: "Islandija",
          imageUrl: "/placeholder.jpg",
          startDate: "2025-09-20T00:00:00Z",
          endDate: "2025-09-27T00:00:00Z",
          createdAt: "2025-05-03T00:00:00Z",
        },
      ]),
    });
  });

  await page.route("**/TripRequest", async (route) => {
    const requestBody = JSON.parse(route.request().postData() || "{}");

    if (!requestBody.email || !requestBody.email.includes("@")) {
      await route.fulfill({
        status: 400,
        body: JSON.stringify({ error: "Invalid email format" }),
      });
      return;
    }

    await route.fulfill({
      status: 201,
      body: JSON.stringify({
        id: "request-123",
        fullName: requestBody.fullName,
        phoneNumber: requestBody.phoneNumber,
        email: requestBody.email,
        message: requestBody.message,
        createdAt: new Date().toISOString(),
      }),
    });
  });
}

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await mockApiResponses(page);
    await page.goto("/");
    await page.waitForLoadState('networkidle');
  });

  test("displays all main sections on desktop", async ({ page }) => {
    await expect(page.getByRole("heading", { name: /svajonių kelionė/i })).toBeVisible();

    await expect(page.getByRole("heading", { name: /naujausi kelionių pasiūlymai/i })).toBeVisible();
    await expect(page.getByText("Pabėkite nuo kasdienybės į tropinį rojų")).toBeVisible();

    await expect(page.getByRole("heading", { name: /susisieksime su jumis/i })).toBeVisible();
    await expect(page.getByLabel("Vardas")).toBeVisible();

    await expect(page.getByRole("heading", { name: /ką sako mūsų klientai/i })).toBeVisible();
    await expect(page.getByText("Jonas Jonaitis")).toBeVisible();
  });

  test("hero section scrolls to trip request form when button is clicked", async ({ page }) => {
    await page.getByRole("button", { name: /gauti pasiūlymą/i }).click();
    
    await page.waitForTimeout(1000);
    
    const isInViewport = await page.evaluate(() => {
      const element = document.querySelector('h5');
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= window.innerHeight &&
        rect.right <= window.innerWidth
      );
    });
    
    expect(isInViewport).toBeTruthy();
  });
});

test.describe("Responsive Design", () => {
  test("adapts to mobile viewport", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPhone 12"],
    });
    const page = await context.newPage();

    await mockApiResponses(page);
    await page.goto("/");
    await page.waitForLoadState('networkidle');

    const heroHeading = page.getByRole("heading", { name: /svajonių kelionė/i });
    await expect(heroHeading).toBeVisible();

    const iconSection = page.locator("text=Poroms").first();
    await expect(iconSection).toBeVisible();

    await page.screenshot({ path: "mobile-home.png" });

    await context.close();
  });

  test("adapts to tablet viewport", async ({ browser }) => {
    const context = await browser.newContext({
      ...devices["iPad (gen 7)"],
    });
    const page = await context.newPage();

    await mockApiResponses(page);
    await page.goto("/");
    await page.waitForLoadState('networkidle');

    await page.screenshot({ path: "tablet-home.png" });

    await context.close();
  });
});