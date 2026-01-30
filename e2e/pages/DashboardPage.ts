import { type Page, type Locator } from "@playwright/test";

/**
 * Page Object Model for Dashboard Page
 * Encapsulates dashboard interactions for maintainable E2E tests
 */
export class DashboardPage {
  readonly page: Page;
  readonly addSubscriptionButton: Locator;
  readonly subscriptionsList: Locator;
  readonly aiInsightsPanel: Locator;

  constructor(page: Page) {
    this.page = page;
    this.addSubscriptionButton = page.getByRole("button", {
      name: /add subscription/i,
    });
    this.subscriptionsList = page.getByTestId("subscriptions-list");
    this.aiInsightsPanel = page.getByTestId("ai-insights-panel");
  }

  async goto() {
    await this.page.goto("/");
  }

  async addSubscription(data: { name: string; price: string; billingCycle: string }) {
    await this.addSubscriptionButton.click();

    await this.page.getByLabel(/name/i).fill(data.name);
    await this.page.getByLabel(/price/i).fill(data.price);
    await this.page.getByLabel(/billing cycle/i).selectOption(data.billingCycle);

    await this.page.getByRole("button", { name: /save|add/i }).click();
  }

  async getSubscriptionCount() {
    return await this.subscriptionsList.locator('[data-testid="subscription-item"]').count();
  }
}
