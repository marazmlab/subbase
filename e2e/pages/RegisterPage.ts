import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Register Page
 * Encapsulates registration page interactions for maintainable E2E tests
 */
export class RegisterPage {
  readonly page: Page;
  
  // Elementy karty autentykacji
  readonly authCard: Locator;
  readonly loginTab: Locator;
  readonly registerTab: Locator;
  
  // Elementy formularza rejestracji
  readonly registerForm: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly confirmPasswordInput: Locator;
  readonly submitButton: Locator;
  
  // Elementy widoku sukcesu
  readonly successMessage: Locator;
  readonly goToLoginButton: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Karta autentykacji i zakładki
    this.authCard = page.getByTestId("auth-card");
    this.loginTab = page.getByTestId("auth-tab-login");
    this.registerTab = page.getByTestId("auth-tab-register");
    
    // Formularz rejestracji
    this.registerForm = page.getByTestId("register-form");
    this.emailInput = page.getByTestId("register-email-input");
    this.passwordInput = page.getByTestId("register-password-input");
    this.confirmPasswordInput = page.getByTestId("register-confirm-password-input");
    this.submitButton = page.getByTestId("register-submit-button");
    
    // Widok sukcesu
    this.successMessage = page.getByTestId("register-success-message");
    this.goToLoginButton = page.getByTestId("register-success-go-to-login-button");
  }

  /**
   * Przechodzi do strony rejestracji (login page z zakładką register)
   */
  async goto() {
    await this.page.goto("/login", { waitUntil: "networkidle" });
    
    // Wait for auth card to be fully loaded
    await this.authCard.waitFor({ state: "visible" });
    
    // Wait for tabs to be interactive (React hydration)
    await this.registerTab.waitFor({ state: "visible" });
    await this.page.waitForLoadState("domcontentloaded");
    
    // Small delay to ensure React is fully hydrated
    await this.page.waitForTimeout(300);
    
    await this.switchToRegisterTab();
  }

  /**
   * Przełącza na zakładkę rejestracji
   */
  async switchToRegisterTab() {
    // Ensure tab is clickable and click it
    await this.registerTab.waitFor({ state: "visible" });
    await this.registerTab.click({ force: false });
    
    // Wait for the form to become visible with longer timeout
    await this.registerForm.waitFor({ state: "visible", timeout: 10000 });
  }

  /**
   * Przełącza na zakładkę logowania
   */
  async switchToLoginTab() {
    await this.loginTab.click();
    await this.page.waitForTimeout(500); // Small delay for tab animation
  }

  /**
   * Wypełnia pole email
   */
  async fillEmail(email: string) {
    await this.emailInput.fill(email);
  }

  /**
   * Wypełnia pole hasło
   */
  async fillPassword(password: string) {
    await this.passwordInput.fill(password);
  }

  /**
   * Wypełnia pole potwierdzenia hasła
   */
  async fillConfirmPassword(password: string) {
    await this.confirmPasswordInput.fill(password);
  }

  /**
   * Wypełnia cały formularz rejestracji
   * @param email - Adres email
   * @param password - Hasło
   * @param confirmPassword - Potwierdzenie hasła (domyślnie takie samo jak password)
   */
  async fillRegistrationForm(email: string, password: string, confirmPassword?: string) {
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.fillConfirmPassword(confirmPassword ?? password);
  }

  /**
   * Klika przycisk rejestracji
   */
  async submit() {
    await this.submitButton.click();
  }

  /**
   * Kompletny flow rejestracji
   * @param email - Adres email
   * @param password - Hasło
   * @param confirmPassword - Potwierdzenie hasła (domyślnie takie samo jak password)
   */
  async register(email: string, password: string, confirmPassword?: string) {
    await this.fillRegistrationForm(email, password, confirmPassword);
    await this.submit();
  }

  /**
   * Kompletny flow rejestracji od początku do końca
   * Przechodzi na stronę, przełącza zakładkę i wypełnia formularz
   */
  async performRegistration(email: string, password: string, confirmPassword?: string) {
    await this.goto();
    await this.register(email, password, confirmPassword);
  }

  /**
   * Generuje losowy email dla testów
   * @param prefix - Prefix emaila (domyślnie: 'test')
   * @returns Losowy email z większą entropią
   */
  static generateRandomEmail(prefix: string = "test"): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000); // Zwiększona losowość
    const uuid = Math.random().toString(36).substring(2, 8); // Dodatkowa losowość
    return `${prefix}-${timestamp}-${random}-${uuid}@example.com`;
  }

  /**
   * Sprawdza czy formularz rejestracji jest widoczny
   */
  async isRegisterFormVisible(): Promise<boolean> {
    return await this.registerForm.isVisible();
  }

  /**
   * Sprawdza czy widok sukcesu jest wyświetlony
   */
  async isSuccessMessageVisible(): Promise<boolean> {
    return await this.successMessage.isVisible();
  }

  /**
   * Klika przycisk "Przejdź do logowania" w widoku sukcesu
   */
  async goToLoginFromSuccess() {
    await this.goToLoginButton.click();
  }

  /**
   * Pobiera komunikat błędu dla konkretnego pola
   * @param fieldId - ID pola (np. 'register-email-input')
   */
  async getFieldError(fieldId: string): Promise<string | null> {
    const field = this.page.getByTestId(fieldId);
    const errorId = await field.getAttribute("aria-describedby");
    
    if (!errorId) {
      return null;
    }
    
    const errorElement = this.page.locator(`#${errorId}`);
    return await errorElement.textContent();
  }

  /**
   * Sprawdza czy przycisk submit jest wyłączony (podczas ładowania)
   */
  async isSubmitButtonDisabled(): Promise<boolean> {
    return await this.submitButton.isDisabled();
  }
}
