import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Login Page
 * Encapsulates login page interactions for maintainable E2E tests
 */
export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;
  readonly signupLink: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.getByLabel(/email/i);
    this.passwordInput = page.getByLabel(/password/i);
    this.submitButton = page.getByRole("button", { name: /sign in|login/i });
    this.signupLink = page.getByRole("link", { name: /sign up|register/i });
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async goToSignup() {
    await this.signupLink.click();
  }
}
