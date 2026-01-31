import { test, expect } from "../fixtures/auth.fixture";

/**
 * Example of using custom fixture for authenticated tests
 * These tests automatically start with a logged-in user
 */

test.describe("Subscriptions (Authenticated)", () => {
  test("should display user subscriptions", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.subscriptionsList).toBeVisible();
  });

  test("should add subscription quickly", async ({ authenticatedPage, page }) => {
    await authenticatedPage.addSubscription({
      name: "Spotify",
      price: "9.99",
      billingCycle: "monthly",
    });

    await expect(page.getByText("Spotify")).toBeVisible();
  });

  test("should show AI insights", async ({ authenticatedPage }) => {
    await expect(authenticatedPage.aiInsightsPanel).toBeVisible();
  });

  test("multiple subscriptions can be added", async ({ authenticatedPage, page }) => {
    const subscriptions = [
      { name: "Netflix", price: "15.99", billingCycle: "monthly" },
      { name: "Disney+", price: "7.99", billingCycle: "monthly" },
      { name: "Adobe CC", price: "54.99", billingCycle: "monthly" },
    ];

    for (const sub of subscriptions) {
      await authenticatedPage.addSubscription(sub);
      await page.waitForTimeout(500); // Small delay between additions
    }

    // Verify all were added
    for (const sub of subscriptions) {
      await expect(page.getByText(sub.name)).toBeVisible();
    }
  });

  test("should calculate total monthly spending", async ({ page }) => {
    const summarySection = page.getByTestId("summary-section");
    const totalMonthly = summarySection.getByText(/total monthly/i);

    await expect(totalMonthly).toBeVisible();

    // Verify it shows a number
    const text = await totalMonthly.textContent();
    expect(text).toMatch(/\$?\d+(\.\d{2})?/);
  });
});
