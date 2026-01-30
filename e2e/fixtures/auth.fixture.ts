import { test as base, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

/**
 * Extended test fixture with authenticated user context
 * This allows tests to skip the login flow and start directly on the dashboard
 */

interface AuthFixtures {
  authenticatedPage: DashboardPage;
  loginPage: LoginPage;
}

export const test = base.extend<AuthFixtures>({
  /**
   * Provides an authenticated page ready to use
   */

  authenticatedPage: async ({ page }, use) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login("test@example.com", "Test123!");

    // Wait for successful login
    await page.waitForURL("/");

    const dashboardPage = new DashboardPage(page);
    await use(dashboardPage);

    // Cleanup: logout after test
    try {
      await page.getByRole("button", { name: /logout|sign out/i }).click();
    } catch {
      // Ignore if logout button not found
    }
  },

  /**
   * Provides a login page instance
   */

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },
});

export { expect };
