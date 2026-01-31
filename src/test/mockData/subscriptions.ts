import { faker } from "@faker-js/faker";
import type { Subscription } from "@/types";

/**
 * Generate mock subscription data for testing
 */
export function generateMockSubscription(overrides?: Partial<Subscription>): Subscription {
  return {
    id: faker.string.uuid(),
    user_id: faker.string.uuid(),
    name: faker.company.name(),
    price: parseFloat(faker.commerce.price({ min: 5, max: 100 })),
    billing_cycle: faker.helpers.arrayElement(["monthly", "yearly", "quarterly"]),
    next_billing_date: faker.date.future().toISOString(),
    category: faker.helpers.arrayElement([
      "streaming",
      "software",
      "gaming",
      "education",
      "productivity",
      "other",
    ]),
    status: faker.helpers.arrayElement(["active", "cancelled", "paused"]),
    notes: faker.lorem.sentence(),
    created_at: faker.date.past().toISOString(),
    updated_at: faker.date.recent().toISOString(),
    ...overrides,
  };
}

/**
 * Generate multiple mock subscriptions
 */
export function generateMockSubscriptions(
  count: number,
  overrides?: Partial<Subscription>
): Subscription[] {
  return Array.from({ length: count }, () => generateMockSubscription(overrides));
}

/**
 * Generate subscription with specific status
 */
export function generateActiveSubscription(overrides?: Partial<Subscription>): Subscription {
  return generateMockSubscription({
    status: "active",
    ...overrides,
  });
}

export function generateCancelledSubscription(overrides?: Partial<Subscription>): Subscription {
  return generateMockSubscription({
    status: "cancelled",
    ...overrides,
  });
}

export function generatePausedSubscription(overrides?: Partial<Subscription>): Subscription {
  return generateMockSubscription({
    status: "paused",
    ...overrides,
  });
}
