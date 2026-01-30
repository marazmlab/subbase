# E2E Tests Directory

This directory contains end-to-end tests using Playwright.

## Structure

```
e2e/
├── auth/           # Authentication flow tests
├── dashboard/      # Dashboard feature tests
├── api/            # API endpoint tests
└── pages/          # Page Object Models
```

## Page Object Model (POM)

We use the Page Object Model pattern to encapsulate page interactions. Each page or major component has its own POM class that provides:

- Locators for all interactive elements
- Methods for common actions
- Reusable test logic

Example:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(page: Page) {
    this.emailInput = page.getByLabel(/email/i);
    // ... other locators
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }
}

// auth/login.spec.ts
test('should login', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('test@example.com', 'password');
});
```

## Best Practices

1. **Use semantic locators**: Prefer `getByRole`, `getByLabel`, `getByText` over CSS selectors
2. **Leverage auto-waiting**: Playwright waits automatically for elements to be actionable
3. **Keep tests independent**: Each test should be able to run in isolation
4. **Use fixtures**: Share common setup logic across tests
5. **Test user journeys**: E2E tests should validate complete user workflows

## Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test e2e/auth/login.spec.ts

# Run in UI mode
npm run test:e2e:ui

# Debug mode
npm run test:e2e:debug

# Generate tests with codegen
npm run test:e2e:codegen
```

## Debugging

When tests fail:

1. Check the HTML report: `npx playwright show-report`
2. View traces: `npx playwright show-trace test-results/.../trace.zip`
3. Run in headed mode: `npx playwright test --headed`
4. Use debug mode: `npm run test:e2e:debug`

## Adding New Tests

1. Create a new spec file in the appropriate directory
2. Create or reuse Page Object Models from `pages/`
3. Follow the existing test structure and naming conventions
4. Ensure tests are independent and can run in parallel
