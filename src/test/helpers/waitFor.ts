/**
 * Helper functions for waiting in tests
 */

/**
 * Wait for a specified amount of time
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Wait for a condition to be true
 */
export async function waitForCondition(
  condition: () => boolean | Promise<boolean>,
  options: {
    timeout?: number;
    interval?: number;
  } = {}
): Promise<void> {
  const { timeout = 5000, interval = 100 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    if (await condition()) {
      return;
    }
    await wait(interval);
  }

  throw new Error("Timeout waiting for condition");
}

/**
 * Wait for an element to exist in the DOM (useful for non-React elements)
 */
export async function waitForElement(
  selector: string,
  options: { timeout?: number } = {}
): Promise<Element> {
  const { timeout = 5000 } = options;
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) {
      return element;
    }
    await wait(100);
  }

  throw new Error(`Timeout waiting for element: ${selector}`);
}
