import { test, expect } from "@playwright/test";

async function scrollToForm(page) {
  try {
    await page.evaluate(() => {
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
      const formHeading = headings.find(h => 
        h.textContent && h.textContent.includes('Susisieksime')
      );
      if (formHeading) {
        formHeading.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return true;
      }
      return false;
    });
    
    await page.waitForTimeout(500);
    
    const formVisible = await page.isVisible('form') || 
                         await page.isVisible('input[name="name"]') ||
                         await page.isVisible('input[placeholder*="Vardas"]');
    
    if (formVisible) return;
    
    await page.evaluate(() => {
      window.scrollTo(0, 1000);
    });
    
    await page.waitForTimeout(500);
    
  } catch (e) {
    console.log('Error scrolling to form:', e);
    try {
      await page.getByRole("button", { name: /gauti pasiūlymą/i }).click();
      await page.waitForTimeout(1000);
    } catch (e2) {
      console.log('Error clicking button:', e2);
    }
  }
}

test.describe("Trip Request Form Detailed Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/TripRequest", async (route) => {
      const requestBody = JSON.parse(route.request().postData() || "{}");

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

    await page.goto("/");
    await page.waitForLoadState('networkidle');
    
    await scrollToForm(page);
    
    const nameField = page.getByLabel("Vardas");
    await expect(nameField).toBeVisible({ timeout: 10000 });
  });

  test("shows character count for message field", async ({ page }) => {
    await page.getByLabel(/žinutė/i).fill("Hello world");

    await expect(page.getByText("11/1000")).toBeVisible();

    await page.getByLabel(/žinutė/i).fill("A".repeat(500));

    await expect(page.getByText("500/1000")).toBeVisible();
  });

  test("disables form during submission", async ({ page }) => {
    await page.route("**/TripRequest", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.fulfill({
        status: 201,
        body: JSON.stringify({ id: "request-123" }),
      });
    });

    await page.getByLabel("Vardas").fill("Test User");
    await page.getByLabel("El.pašto adresas").fill("test@example.com");
    await page.getByLabel("Telefono numeris").fill("12345678");

    await page.getByRole("button", { name: "Siųsti" }).click();

    await expect(page.getByRole("progressbar")).toBeVisible();

    await expect(page.getByLabel("Vardas")).toBeDisabled();

    await expect(page.getByText(/sėkmingai|success/i)).toBeVisible();

    await expect(page.getByLabel("Vardas")).toBeEnabled();
  });

  test("phone field only accepts digits", async ({ page }) => {
    await page.getByLabel("Telefono numeris").fill("abc123def456");

    await expect(page.getByLabel("Telefono numeris")).toHaveValue("123456");
  });

  test("form maintains state after failed submission", async ({ page }) => {
    await page.route("**/TripRequest", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    await page.getByLabel("Vardas").fill("Test User");
    await page.getByLabel("El.pašto adresas").fill("test@example.com");
    await page.getByLabel("Telefono numeris").fill("12345678");
    await page.getByLabel(/žinutė/i).fill("Test message");

    await page.getByRole("button", { name: "Siųsti" }).click();

    await expect(page.getByText(/nepavyko|error|failed/i)).toBeVisible();

    await expect(page.getByLabel("Vardas")).toHaveValue("Test User");
    await expect(page.getByLabel("El.pašto adresas")).toHaveValue("test@example.com");
    await expect(page.getByLabel("Telefono numeris")).toHaveValue("12345678");
    await expect(page.getByLabel(/žinutė/i)).toHaveValue("Test message");
  });
});