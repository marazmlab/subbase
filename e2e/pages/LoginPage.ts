import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Encapsulates login page interactions for maintainable E2E tests
 */
export class LoginPage {
  readonly page: Page;
  
  // Elementy karty autentykacji
  readonly authCard: Locator;
  readonly loginTab: Locator;
  readonly registerTab: Locator;
  
  // Elementy formularza logowania
  readonly loginForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Karta autentykacji i zakładki
    this.authCard = page.getByTestId("auth-card");
    this.loginTab = page.getByTestId("auth-tab-login");
    this.registerTab = page.getByTestId("auth-tab-register");
    
    // Formularz logowania
    this.loginForm = page.getByTestId("login-form");
    this.emailInput = page.getByTestId("login-email-input");
    this.passwordInput = page.getByTestId("login-password-input");
    this.submitButton = page.getByTestId("login-submit-button");
  }

  /**
   * Przechodzi do strony logowania
   */
  async goto() {
    await this.page.goto("/login");
    await this.authCard.waitFor({ state: "visible" });
  }

  /**
   * Przełącza na zakładkę logowania
   */
  async switchToLoginTab() {
    await this.loginTab.click();
    await this.loginForm.waitFor({ state: "visible" });
  }

  /**
   * Przełącza na zakładkę rejestracji
   */
  async switchToRegisterTab() {
    await this.registerTab.click();
  }

  /**
   * Loguje użytkownika
   * @param email - Adres email użytkownika
   * @param password - Hasło użytkownika
   */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Wypełnia formularz logowania i wysyła
   * Kompletny flow logowania
   */
  async performLogin(email: string, password: string) {
    await this.goto();
    await this.switchToLoginTab();
    await this.login(email, password);
  }

  /**
   * Sprawdza czy formularz logowania jest widoczny
   */
  async isLoginFormVisible(): Promise<boolean> {
    return await this.loginForm.isVisible();
  }
}
