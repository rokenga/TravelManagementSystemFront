import { test, expect } from "@playwright/test";

test.describe("Recent Offers Section", () => {
  test.beforeEach(async ({ page }) => {
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

    await page.goto("/");
    await page.waitForLoadState('networkidle');
  });

  test("displays loading state and then offers", async ({ page }) => {
    await page.route("**/PublicTripOfferFacade", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 500));
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
        ]),
      });
    });

    await page.reload();

    await expect(page.getByRole("progressbar")).toBeVisible();

    await expect(page.getByText("Pabėkite nuo kasdienybės į tropinį rojų")).toBeVisible();
  });

  test("navigates to offer details when clicked", async ({ page }) => {
    await page.getByText("Pabėkite nuo kasdienybės į tropinį rojų").click();

    await expect(page).toHaveURL(/\/specialOfferDetails\/offer-1/);
  });

  test('navigates to all offers when "Visi pasiūlymai" button is clicked', async ({ page }) => {
    await page.getByRole("button", { name: /visi pasiūlymai/i }).click();

    await expect(page).toHaveURL(/\/specialOffers/);
  });
});