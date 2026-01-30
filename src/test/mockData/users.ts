import { faker } from "@faker-js/faker";

/**
 * Generate mock user data for testing
 */
export interface MockUser {
  id: string;
  email: string;
  created_at: string;
}

export function generateMockUser(overrides?: Partial<MockUser>): MockUser {
  return {
    id: faker.string.uuid(),
    email: faker.internet.email(),
    created_at: faker.date.past().toISOString(),
    ...overrides,
  };
}

/**
 * Generate mock auth credentials
 */
export function generateMockCredentials() {
  return {
    email: faker.internet.email(),
    password: faker.internet.password({ length: 12 }),
  };
}

/**
 * Generate valid test user credentials
 */
export function generateValidCredentials() {
  return {
    email: "test@example.com",
    password: "Test123!@#",
  };
}
