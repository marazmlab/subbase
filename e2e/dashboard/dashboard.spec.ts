import { test, expect } from "@playwright/test";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Dashboard", () => {
  let dashboardPage: DashboardPage;

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure test isolation
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    // Login first using E2E credentials
    await page.goto("/login");
    await page.getByTestId("login-email-input").fill(process.env.E2E_USERNAME!);
    await page.getByTestId("login-password-input").fill(process.env.E2E_PASSWORD!);
    await page.getByTestId("login-submit-button").click();

    // Wait for navigation to dashboard
    await page.waitForURL("/");

    dashboardPage = new DashboardPage(page);
    await dashboardPage.waitForDashboardLoad();
  });

  test("should display dashboard with summary section", async () => {
    await expect(dashboardPage.page.getByTestId("summary-section")).toBeVisible();
  });

  test("should show empty state when no subscriptions", async ({ page }) => {
    // Assuming new user with no subscriptions
    const emptyState = page.getByTestId("empty-state");

    if (await emptyState.isVisible()) {
      await expect(emptyState).toContainText(/no subscriptions/i);
      await expect(dashboardPage.addSubscriptionButton).toBeVisible();
    }
  });

  test("should open add subscription modal", async ({ page }) => {
    await dashboardPage.addSubscriptionButton.click();

    await expect(page.getByRole("dialog", { name: /add subscription/i })).toBeVisible();
  });

  test("should add new subscription", async ({ page }) => {
    const initialCount = await dashboardPage.getSubscriptionCount();

    await dashboardPage.addSubscription({
      name: "Test Service",
      price: "9.99",
      billingCycle: "monthly",
    });

    // Wait for subscription to be added
    await page.waitForTimeout(1000);

    const newCount = await dashboardPage.getSubscriptionCount();
    expect(newCount).toBe(initialCount + 1);

    // Verify the new subscription appears in the list
    await expect(page.getByText("Test Service")).toBeVisible();
  });

  test("should filter subscriptions by status", async ({ page }) => {
    // Add test subscriptions with different statuses if needed
    // Then test filtering
    const statusFilter = page.getByRole("combobox", { name: /status/i });
    await statusFilter.click();
    await page.getByRole("option", { name: /active/i }).click();

    // Verify only active subscriptions are shown
    const subscriptions = page.locator('[data-testid="subscription-item"]');
    const count = await subscriptions.count();

    for (let i = 0; i < count; i++) {
      const subscription = subscriptions.nth(i);
      await expect(subscription.getByText(/active/i)).toBeVisible();
    }
  });

  test("should display AI insights panel", async () => {
    await expect(dashboardPage.aiInsightsPanel).toBeVisible();
  });

  test("should generate AI insights", async ({ page }) => {
    const generateButton = page.getByRole("button", {
      name: /generate insights/i,
    });

    if (await generateButton.isVisible()) {
      await generateButton.click();

      // Wait for insights to load
      await expect(page.getByTestId("insight-item")).toBeVisible({
        timeout: 10000,
      });
    }
  });

  test("should edit subscription", async ({ page }) => {
    // Assuming there's at least one subscription
    const firstSubscription = page.locator('[data-testid="subscription-item"]').first();

    if (await firstSubscription.isVisible()) {
      await firstSubscription.getByRole("button", { name: /edit/i }).click();

      // Edit form should appear
      await expect(page.getByRole("dialog", { name: /edit subscription/i })).toBeVisible();

      // Change the name
      const nameInput = page.getByLabel(/name/i);
      await nameInput.clear();
      await nameInput.fill("Updated Name");

      await page.getByRole("button", { name: /save/i }).click();

      // Verify the change
      await expect(page.getByText("Updated Name")).toBeVisible();
    }
  });

  test("should delete subscription with confirmation", async ({ page }) => {
    const initialCount = await dashboardPage.getSubscriptionCount();

    if (initialCount > 0) {
      const firstSubscription = page.locator('[data-testid="subscription-item"]').first();

      await firstSubscription.getByRole("button", { name: /delete/i }).click();

      // Confirmation dialog should appear
      await expect(page.getByRole("dialog", { name: /confirm/i })).toBeVisible();

      await page.getByRole("button", { name: /confirm|yes|delete/i }).click();

      // Wait for deletion
      await page.waitForTimeout(1000);

      const newCount = await dashboardPage.getSubscriptionCount();
      expect(newCount).toBe(initialCount - 1);
    }
  });

  test("should display subscription summary statistics", async ({ page }) => {
    const summarySection = page.getByTestId("summary-section");

    await expect(summarySection.getByText(/total monthly/i)).toBeVisible();
    await expect(summarySection.getByText(/total yearly/i)).toBeVisible();
    await expect(summarySection.getByText(/active/i)).toBeVisible();
  });

  test("should paginate subscriptions list", async ({ page }) => {
    const subscriptionCount = await dashboardPage.getSubscriptionCount();

    // Only test pagination if there are enough subscriptions
    if (subscriptionCount > 10) {
      const nextButton = page.getByRole("button", { name: /next/i });
      await nextButton.click();

      // Verify we're on page 2
      await expect(page.getByText(/page 2/i)).toBeVisible();
    }
  });

  test("should logout successfully", async ({ page }) => {
    const logoutButton = page.getByRole("button", { name: /logout|sign out/i });
    await logoutButton.click();

    // Should redirect to login page
    await expect(page).toHaveURL(/.*login/);
  });
});
