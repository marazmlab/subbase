import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Login Flow", () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure test isolation
    await page.context().clearCookies();
    await page.context().clearPermissions();
    
    loginPage = new LoginPage(page);
    await loginPage.goto();
    
    // Wait for form to be fully loaded and ready
    await loginPage.authCard.waitFor({ state: "visible" });
  });

  test("should display login form", async () => {
    // Sprawdź czy karta autentykacji jest widoczna
    await expect(loginPage.authCard).toBeVisible();
    
    // Sprawdź czy zakładka logowania jest aktywna
    await expect(loginPage.loginTab).toBeVisible();
    
    // Sprawdź elementy formularza
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test("should show validation errors for empty fields", async () => {
    // Ensure fields are empty
    await loginPage.emailInput.clear();
    await loginPage.passwordInput.clear();
    
    await loginPage.submitButton.click();

    // Wait for validation errors to appear
    await expect(loginPage.page.getByText(/wymagane/i).first()).toBeVisible();
  });

  test("should show error for invalid credentials", async ({ page }) => {
    await loginPage.login("invalid@example.com", "wrongpassword");

    // Wait for error message
    await expect(page.getByText(/nieprawidłowy|invalid/i)).toBeVisible();
  });

  test("should switch to register tab", async () => {
    // Przełącz na zakładkę rejestracji
    await loginPage.switchToRegisterTab();

    // Sprawdź czy formularz logowania jest ukryty
    await expect(loginPage.loginForm).not.toBeVisible();
    
    // Sprawdź czy formularz rejestracji jest widoczny
    await expect(loginPage.page.getByTestId("register-form")).toBeVisible();
  });

  test("should successfully login with valid credentials", async ({ page }) => {
    // Using E2E test user from .env.test
    const testEmail = process.env.E2E_USERNAME!;
    const testPassword = process.env.E2E_PASSWORD!;
    
    await loginPage.login(testEmail, testPassword);
    
    // Weryfikuj przekierowanie na dashboard
    await page.waitForURL("/");
    
    // Sprawdź czy użytkownik jest zalogowany
    const dashboardPage = new DashboardPage(page);
    await expect(dashboardPage.topBar).toBeVisible();
    await expect(dashboardPage.logoutButton).toBeVisible();
  });

  test("should preserve email when switching tabs", async () => {
    const testEmail = "test@example.com";
    
    // Wypełnij email w formularzu logowania
    await loginPage.emailInput.fill(testEmail);
    
    // Przełącz na zakładkę rejestracji
    await loginPage.switchToRegisterTab();
    
    // Przełącz z powrotem na logowanie
    await loginPage.switchToLoginTab();
    
    // Sprawdź czy email został zachowany
    await expect(loginPage.emailInput).toHaveValue(testEmail);
  });

  test("should disable submit button while logging in", async () => {
    const testEmail = "test@example.com";
    const testPassword = "password123";
    
    await loginPage.emailInput.fill(testEmail);
    await loginPage.passwordInput.fill(testPassword);
    
    // Sprawdź że przycisk jest aktywny
    await expect(loginPage.submitButton).toBeEnabled();
    
    // Kliknij przycisk
    await loginPage.submitButton.click();
    
    // Podczas ładowania przycisk powinien być wyłączony
    await expect(loginPage.submitButton).toBeDisabled();
  });
});
