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

test.describe("Trip Request Form", () => {
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
    
    await page.screenshot({ path: 'before-scroll.png', fullPage: true });
    
    await scrollToForm(page);
    
    await page.screenshot({ path: 'after-scroll.png', fullPage: true });
  });

  test("validates required fields", async ({ page }) => {
    const submitButton = page.getByRole("button", { name: "Siųsti" });
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    
    await submitButton.click();

    await expect(page.getByText(/vardas.*privalomas|name.*required/i)).toBeVisible();
    await expect(page.getByText(/neteisingas.*pašto|invalid.*email/i)).toBeVisible();
  });

  test("validates email format", async ({ page }) => {
    const nameField = page.getByLabel("Vardas");
    const phoneField = page.getByLabel("Telefono numeris");
    const emailField = page.getByLabel("El.pašto adresas");
    const submitButton = page.getByRole("button", { name: "Siųsti" });
    
    await expect(nameField).toBeVisible({ timeout: 10000 });
    
    await nameField.fill("Test User");
    await phoneField.fill("12345678");
    await emailField.fill("invalid-email");

    await submitButton.click();

    await expect(page.getByText(/neteisingas.*pašto|invalid.*email/i)).toBeVisible();
  });

  test("validates phone number format", async ({ page }) => {
    const nameField = page.getByLabel("Vardas");
    const phoneField = page.getByLabel("Telefono numeris");
    const emailField = page.getByLabel("El.pašto adresas");
    const submitButton = page.getByRole("button", { name: "Siųsti" });
    
    await expect(nameField).toBeVisible({ timeout: 10000 });
    
    await nameField.fill("Test User");
    await phoneField.fill("123");
    await emailField.fill("test@example.com");

    await submitButton.click();

    await expect(page.getByText(/telefono.*skaitmenų|phone.*digits/i)).toBeVisible();
  });

  test("shows success message on successful submission", async ({ page }) => {
    const nameField = page.getByLabel("Vardas");
    const phoneField = page.getByLabel("Telefono numeris");
    const emailField = page.getByLabel("El.pašto adresas");
    const messageField = page.getByLabel(/žinutė/i);
    const submitButton = page.getByRole("button", { name: "Siųsti" });
    
    await expect(nameField).toBeVisible({ timeout: 10000 });
    
    await nameField.fill("Jonas Jonaitis");
    await phoneField.fill("61234567");
    await emailField.fill("jonas@example.com");
    await messageField.fill("Norėčiau sužinoti apie keliones į Italiją");

    await submitButton.click();

    await expect(page.getByText(/sėkmingai|success/i)).toBeVisible();

    await expect(nameField).toHaveValue("");
  });

  test("shows error message on failed submission", async ({ page }) => {
    await page.route("**/TripRequest", async (route) => {
      await route.fulfill({
        status: 500,
        body: JSON.stringify({ error: "Server error" }),
      });
    });

    const nameField = page.getByLabel("Vardas");
    const phoneField = page.getByLabel("Telefono numeris");
    const emailField = page.getByLabel("El.pašto adresas");
    const submitButton = page.getByRole("button", { name: "Siųsti" });
    
    await expect(nameField).toBeVisible({ timeout: 10000 });
    
    await nameField.fill("Jonas Jonaitis");
    await phoneField.fill("61234567");
    await emailField.fill("jonas@example.com");

    await submitButton.click();

    await expect(page.getByText(/nepavyko|error|failed/i)).toBeVisible();
  });
});