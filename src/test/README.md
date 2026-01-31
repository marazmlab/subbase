# Unit Tests Directory

This directory contains test utilities, setup files, and mock data for unit tests.

## Structure

```
test/
├── setup.ts        # Global test setup and configuration
├── helpers/        # Custom test utilities and render functions
└── mockData/       # Factories for generating test data
```

## Test Setup

The `setup.ts` file configures the testing environment:

- Imports `@testing-library/jest-dom` for DOM matchers
- Cleans up after each test
- Mocks browser APIs (matchMedia, IntersectionObserver, etc.)

## Helpers

### Custom Render

Use `renderWithProviders` to render components with necessary context:

```typescript
import { render, screen } from '@/test/helpers';
import { MyComponent } from './MyComponent';

test('renders with theme', () => {
  render(<MyComponent />, { theme: 'dark' });
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

### Wait Utilities

```typescript
import { wait, waitForCondition } from '@/test/helpers';

// Wait for specific time
await wait(1000);

// Wait for condition
await waitForCondition(() => document.querySelector('.loaded'));
```

## Mock Data

Use Faker.js to generate realistic test data:

```typescript
import {
  generateMockSubscription,
  generateMockSubscriptions,
} from '@/test/mockData/subscriptions';

// Generate single subscription
const subscription = generateMockSubscription();

// Generate with overrides
const netflix = generateMockSubscription({
  name: 'Netflix',
  price: 15.99,
  status: 'active',
});

// Generate multiple
const subscriptions = generateMockSubscriptions(10);
```

## Best Practices

1. **Keep tests focused**: Test one thing at a time
2. **Use descriptive names**: Test names should clearly state what is being tested
3. **Follow AAA pattern**: Arrange, Act, Assert
4. **Mock external dependencies**: Keep tests isolated and fast
5. **Test behavior, not implementation**: Focus on what the code does
6. **Use semantic queries**: Prefer `getByRole`, `getByLabelText` over `getByTestId`

## Common Patterns

### Testing Components

```typescript
import { render, screen } from '@/test/helpers';
import userEvent from '@testing-library/user-event';

test('handles user interaction', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  await user.click(screen.getByRole('button'));
  expect(screen.getByText('Clicked')).toBeInTheDocument();
});
```

### Testing Hooks

```typescript
import { renderHook, waitFor } from '@testing-library/react';
import { useMyHook } from './useMyHook';

test('returns data', async () => {
  const { result } = renderHook(() => useMyHook());

  await waitFor(() => {
    expect(result.current.data).toBeDefined();
  });
});
```

### Mocking Modules

```typescript
import { vi } from 'vitest';

vi.mock('./module', () => ({
  myFunction: vi.fn().mockReturnValue('mocked'),
}));
```

### Spy on Methods

```typescript
import { vi } from 'vitest';

const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

// ... test code ...

expect(spy).toHaveBeenCalledWith('Error message');
spy.mockRestore();
```
