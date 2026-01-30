import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test("should display login form", async () => {
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show validation errors for empty fields", async () => {
    await loginPage.submitButton.click();

    // Wait for validation errors to appear
    await expect(loginPage.page.getByText(/email/i)).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for error message
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });

  test("should navigate to signup page", async ({ page }) => {
    await loginPage.goToSignup();

    await expect(page).toHaveURL(/.*signup/);
  });
});
