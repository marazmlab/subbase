import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Dashboard Page
 * Encapsulates dashboard interactions for maintainable E2E tests
 */
export class DashboardPage {
  readonly page: Page;
  
  // Elementy TopBar
  readonly topBar: Locator;
  readonly logoutButton: Locator;
  readonly appLogo: Locator;
  readonly themeToggle: Locator;
  
  // Elementy Dashboard
  readonly addSubscriptionButton: Locator;
  readonly subscriptionsList: Locator;
  readonly aiInsightsPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // TopBar
    this.topBar = page.getByTestId("dashboard-topbar");
    this.logoutButton = page.getByTestId("logout-button");
    this.appLogo = page.locator('a[href="/"]').filter({ hasText: "Subbase" });
    this.themeToggle = page.getByRole("button", { name: /toggle theme/i });
    
    // Dashboard elements
    this.addSubscriptionButton = page.getByRole("button", {
      name: /add subscription/i,
    });
    this.subscriptionsList = page.getByTestId("subscriptions-list");
    this.aiInsightsPanel = page.getByTestId("ai-insights-panel");
  }

  /**
   * Przechodzi do strony dashboardu
   */
  async goto() {
    await this.page.goto("/");
    await this.topBar.waitFor({ state: "visible" });
  }

  /**
   * Wylogowuje użytkownika
   * Klika przycisk wylogowania i czeka na przekierowanie na /login
   */
  async logout() {
    await this.logoutButton.click();
    await this.page.waitForURL("/login");
  }

  /**
   * Sprawdza czy użytkownik jest zalogowany
   * Weryfikuje obecność TopBar i przycisku wylogowania
   */
  async isUserAuthenticated(): Promise<boolean> {
    const isTopBarVisible = await this.topBar.isVisible();
    const isLogoutButtonVisible = await this.logoutButton.isVisible();
    return isTopBarVisible && isLogoutButtonVisible;
  }

  /**
   * Sprawdza czy TopBar jest widoczny
   */
  async isTopBarVisible(): Promise<boolean> {
    return await this.topBar.isVisible();
  }

  /**
   * Sprawdza czy przycisk wylogowania jest widoczny
   */
  async isLogoutButtonVisible(): Promise<boolean> {
    return await this.logoutButton.isVisible();
  }

  /**
   * Klika logo aplikacji (przekierowanie na stronę główną)
   */
  async clickLogo() {
    await this.appLogo.click();
  }

  /**
   * Dodaje nową subskrypcję
   */
  async addSubscription(data: { name: string; price: string; billingCycle: string }) {
    await this.addSubscriptionButton.click();

    await this.page.getByLabel(/name/i).fill(data.name);
    await this.page.getByLabel(/price/i).fill(data.price);
    await this.page.getByLabel(/billing cycle/i).selectOption(data.billingCycle);

    await this.page.getByRole("button", { name: /save|add/i }).click();
  }

  /**
   * Pobiera liczbę subskrypcji
   */
  async getSubscriptionCount() {
    return await this.subscriptionsList.locator('[data-testid="subscription-item"]').count();
  }

  /**
   * Czeka na załadowanie dashboardu
   * Weryfikuje obecność kluczowych elementów
   */
  async waitForDashboardLoad() {
    await this.topBar.waitFor({ state: "visible" });
    await this.page.waitForLoadState("networkidle");
  }
}

