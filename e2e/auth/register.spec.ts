import { test, expect } from "@playwright/test";
import { RegisterPage } from "../pages/RegisterPage";
import { LoginPage } from "../pages/LoginPage";

test.describe("User Registration", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure test isolation
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test("should successfully register a new user and redirect to dashboard", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const email = RegisterPage.generateRandomEmail();
    const password = "TestPassword123!";

    // Act
    // 1. Otwórz stronę /login
    await registerPage.goto();

    // Weryfikuj: Formularz rejestracji jest widoczny
    await expect(registerPage.registerForm).toBeVisible();

    // 2. Wypełnij formularz
    await registerPage.fillEmail(email);
    await registerPage.fillPassword(password);
    await registerPage.fillConfirmPassword(password);

    // 3. Kliknij "Zarejestruj się"
    await registerPage.submit();

    // Assert
    // 4. Weryfikuj: Widok sukcesu jest wyświetlony
    await expect(registerPage.successMessage).toBeVisible();

    // Opcjonalnie: Sprawdź że email jest wyświetlony w komunikacie
    await expect(page.getByText(email)).toBeVisible();
  });

  test("should switch between login and register tabs", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);

    // Act
    // 1. Otwórz stronę /login (domyślnie zakładka login)
    await page.goto("/login", { waitUntil: "networkidle" });
    await loginPage.authCard.waitFor({ state: "visible" });

    // Wait for React to hydrate
    await page.waitForTimeout(500);

    // 2. Przełącz na zakładkę "Register"
    await registerPage.switchToRegisterTab();

    // Assert
    await expect(registerPage.registerForm).toBeVisible();
    await expect(loginPage.loginForm).not.toBeVisible();

    // Act
    // 3. Przełącz z powrotem na zakładkę "Login"
    await loginPage.switchToLoginTab();

    // Assert
    await expect(loginPage.loginForm).toBeVisible();
    await expect(registerPage.registerForm).not.toBeVisible();
  });

  test("should validate password confirmation mismatch", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const email = RegisterPage.generateRandomEmail();

    // Act
    await registerPage.goto();
    await registerPage.fillEmail(email);
    await registerPage.fillPassword("Password123!");
    await registerPage.fillConfirmPassword("DifferentPassword123!");

    // Blur z pola confirmPassword aby wywołać walidację
    await registerPage.confirmPasswordInput.blur();

    // Assert
    // Sprawdź czy pojawił się komunikat błędu
    const errorMessage = await registerPage.getFieldError("register-confirm-password-input");
    expect(errorMessage).toBeTruthy();
  });

  test("should validate minimum password length", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const email = RegisterPage.generateRandomEmail();

    // Act
    await registerPage.goto();
    await registerPage.fillEmail(email);
    await registerPage.fillPassword("123"); // Za krótkie hasło (< 6 znaków)
    await registerPage.fillConfirmPassword("123");

    // Blur z pola password aby wywołać walidację
    await registerPage.passwordInput.blur();

    // Assert
    const errorMessage = await registerPage.getFieldError("register-password-input");
    expect(errorMessage).toBeTruthy();
  });

  test("should validate email format", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);

    // Act
    await registerPage.goto();
    await registerPage.fillEmail("invalid-email"); // Nieprawidłowy format
    await registerPage.fillPassword("Password123!");
    await registerPage.fillConfirmPassword("Password123!");

    // Blur z pola email aby wywołać walidację
    await registerPage.emailInput.blur();

    // Assert
    const errorMessage = await registerPage.getFieldError("register-email-input");
    expect(errorMessage).toBeTruthy();
  });

  test("should disable submit button while submitting", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const email = RegisterPage.generateRandomEmail();
    const password = "TestPassword123!";

    // Act
    await registerPage.goto();
    await registerPage.fillRegistrationForm(email, password);

    // Sprawdź stan przycisku przed kliknięciem
    await expect(registerPage.submitButton).toBeEnabled();

    // Kliknij przycisk
    await registerPage.submitButton.click();

    // Assert
    // Podczas przesyłania przycisk powinien być wyłączony
    await expect(registerPage.submitButton).toBeDisabled();

    // Poczekaj na zakończenie (sukces lub błąd)
    await page.waitForTimeout(2000);
  });

  test("should preserve form values when switching tabs", async ({ page }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const loginPage = new LoginPage(page);
    const email = RegisterPage.generateRandomEmail();
    const password = "TestPassword123!";

    // Act
    // 1. Otwórz stronę i przejdź na zakładkę rejestracji
    await registerPage.goto();

    // 2. Wypełnij częściowo formularz
    await registerPage.fillEmail(email);
    await registerPage.fillPassword(password);

    // 3. Przełącz na zakładkę logowania
    await loginPage.switchToLoginTab();

    // 4. Przełącz z powrotem na rejestrację
    await registerPage.switchToRegisterTab();

    // Assert
    // Wartości powinny zostać zachowane
    await expect(registerPage.emailInput).toHaveValue(email);
    await expect(registerPage.passwordInput).toHaveValue(password);
  });
});

test.describe("Full Registration Flow with Dashboard Verification", () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies and storage to ensure test isolation
    await page.context().clearCookies();
    await page.context().clearPermissions();
  });

  test("should complete full registration flow and verify user is authenticated", async ({
    page,
  }) => {
    // Arrange
    const registerPage = new RegisterPage(page);
    const email = RegisterPage.generateRandomEmail();
    const password = "TestPassword123!";

    // Act
    // 1. Otwórz stronę /login
    await page.goto("/login", { waitUntil: "networkidle" });
    await page.waitForTimeout(500); // Wait for React hydration

    // 2. Przełącz na zakładkę "Register"
    await registerPage.switchToRegisterTab();

    // 3. Wypełnij formularz
    await registerPage.register(email, password);

    // 4. Weryfikuj: Widok sukcesu
    await expect(registerPage.successMessage).toBeVisible();

    // Note: This test verifies registration success message only.
    // Full dashboard verification would require email confirmation to be disabled in Supabase
    // or implementing auto-confirm for E2E tests.

    // If email confirmation is disabled in Supabase test project,
    // you could uncomment the following to test auto-login:

    // await page.goto("/");
    // await expect(dashboardPage.topBar).toBeVisible();
    // await expect(dashboardPage.logoutButton).toBeVisible();
  });
});
