import { generateMockSubscription, generateMockSubscriptions } from "@/test/mockData/subscriptions";

// Example test showing how to use mock data and mocking patterns
describe("Subscription Service", () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();
  });

  describe("Mock Data Usage", () => {
    it("generates single subscription with default values", () => {
      const subscription = generateMockSubscription();

      expect(subscription).toHaveProperty("id");
      expect(subscription).toHaveProperty("name");
      expect(subscription).toHaveProperty("price");
      expect(subscription.status).toMatch(/active|cancelled|paused/);
    });

    it("generates subscription with custom overrides", () => {
      const subscription = generateMockSubscription({
        name: "Netflix",
        price: 15.99,
        status: "active",
      });

      expect(subscription.name).toBe("Netflix");
      expect(subscription.price).toBe(15.99);
      expect(subscription.status).toBe("active");
    });

    it("generates multiple subscriptions", () => {
      const subscriptions = generateMockSubscriptions(5);

      expect(subscriptions).toHaveLength(5);
      subscriptions.forEach((sub) => {
        expect(sub).toHaveProperty("id");
        expect(sub).toHaveProperty("name");
      });
    });
  });

  describe("Mocking Patterns", () => {
    it("mocks function with vi.fn()", () => {
      const mockCallback = vi.fn();
      mockCallback.mockReturnValue("mocked value");

      const result = mockCallback();

      expect(mockCallback).toHaveBeenCalledTimes(1);
      expect(result).toBe("mocked value");
    });

    it("spies on object method", () => {
      const obj = {
        method: () => "original",
      };

      const spy = vi.spyOn(obj, "method");
      spy.mockReturnValue("spied");

      const result = obj.method();

      expect(spy).toHaveBeenCalled();
      expect(result).toBe("spied");

      spy.mockRestore();
    });
  });
});
