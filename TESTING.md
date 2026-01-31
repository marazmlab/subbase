# Testing Guide

This project uses **Vitest** for unit testing and **Playwright** for E2E testing.

## Environment Setup

Before running tests, create a `.env.test` file from the example:

```bash
cp .env.example .env.test
```

The `.env.test` file should contain test-specific values (mock keys, localhost URLs). Never commit this file to the repository.

## Quick Start

```bash
# Run unit tests
npm run test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with UI
npm run test:ui

# Run unit tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug

# Generate E2E tests with codegen
npm run test:e2e:codegen
```

## Unit Testing with Vitest

### File Structure

- Tests should be placed next to the files they test with `.test.ts` or `.spec.ts` suffix
- Setup files are in `src/test/setup.ts`

### Example Test

**IMPORTANT**: This project uses Vitest with `globals: true`. Do NOT import `describe`, `it`, `expect`, `vi`, `beforeEach`, etc. from 'vitest'. These are available globally.

```typescript
// ❌ WRONG - Do not import test functions
import { describe, it, expect } from 'vitest';

// ✅ CORRECT - Use global functions directly
import { myFunction } from './myFunction';

describe('myFunction', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Testing React Components

```typescript
// No imports from 'vitest' needed - use globals
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

### Mocking

```typescript
// No need to import vi - it's available globally
// But you CAN import it if you need TypeScript types

// Mock a function
const mockFn = vi.fn();
mockFn.mockReturnValue('mocked value');

// Spy on existing function
const spy = vi.spyOn(object, 'method');

// Mock module
vi.mock('./module', () => ({
  namedExport: vi.fn(),
}));
```

### Coverage Thresholds

Current thresholds are set to 70% for:
- Lines
- Functions
- Branches
- Statements

## E2E Testing with Playwright

### File Structure

- E2E tests are in the `e2e/` directory
- Page Object Models are in `e2e/pages/`
- Tests follow the pattern `*.spec.ts`

### Page Object Model

```typescript
import { type Page, type Locator } from '@playwright/test';

export class MyPage {
  readonly page: Page;
  readonly button: Locator;

  constructor(page: Page) {
    this.page = page;
    this.button = page.getByRole('button', { name: /click me/i });
  }

  async goto() {
    await this.page.goto('/my-page');
  }

  async clickButton() {
    await this.button.click();
  }
}
```

### Example E2E Test

```typescript
import { test, expect } from '@playwright/test';
import { MyPage } from '../pages/MyPage';

test.describe('My Feature', () => {
  let myPage: MyPage;

  test.beforeEach(async ({ page }) => {
    myPage = new MyPage(page);
    await myPage.goto();
  });

  test('should perform action', async () => {
    await myPage.clickButton();
    await expect(myPage.page).toHaveURL(/success/);
  });
});
```

### API Testing

```typescript
test('should fetch data from API', async ({ request }) => {
  const response = await request.get('/api/subscriptions');
  expect(response.ok()).toBeTruthy();
  
  const data = await response.json();
  expect(data).toHaveLength(10);
});
```

### Visual Testing

```typescript
test('should match screenshot', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveScreenshot('homepage.png');
});
```

## Best Practices

### Unit Tests

1. **Use descriptive test names** - Clearly state what is being tested and expected outcome
2. **Follow AAA pattern** - Arrange, Act, Assert
3. **Test behavior, not implementation** - Focus on what the code does, not how
4. **Mock external dependencies** - Keep tests isolated and fast
5. **Use inline snapshots** - For readable assertions when appropriate
6. **Test edge cases** - Include error conditions, empty states, etc.

### E2E Tests

1. **Use Page Object Model** - Encapsulate page interactions for maintainability
2. **Use resilient locators** - Prefer role-based selectors over CSS/XPath
3. **Leverage parallel execution** - Tests should be independent
4. **Use API testing** - Validate backend directly when possible
5. **Implement proper waits** - Use Playwright's built-in waiting mechanisms
6. **Keep tests focused** - One scenario per test
7. **Use test hooks** - Setup and teardown in beforeEach/afterEach

## CI/CD Integration

Tests run automatically in the CI pipeline:

- Unit tests run on every push
- E2E tests run on pull requests to main
- Coverage reports are generated and uploaded

## Debugging

### Vitest UI Mode

```bash
npm run test:ui
```

Visual interface for exploring tests, inspecting results, and debugging failures.

### Playwright Debug Mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for step-by-step debugging.

### Playwright Trace Viewer

When tests fail, traces are automatically collected. View them with:

```bash
npx playwright show-trace trace.zip
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Faker.js Documentation](https://fakerjs.dev/)
