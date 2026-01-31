import { test, expect } from "@playwright/test";

// TODO: Fix authentication - endpoint /api/auth/login doesn't exist
// These tests need to use Supabase authentication or UI-based login
test.describe.skip("Subscriptions API", () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // Setup: Login to get auth token
    const response = await request.post("/api/auth/login", {
      data: {
        email: "test@example.com",
        password: "Test123!",
      },
    });

    if (response.ok()) {
      const data = await response.json();
      authToken = data.token;
    }
  });

  test("GET /api/subscriptions - should return user subscriptions", async ({ request }) => {
    const response = await request.get("/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(Array.isArray(data)).toBe(true);
    if (data.length > 0) {
      expect(data[0]).toHaveProperty("id");
      expect(data[0]).toHaveProperty("name");
      expect(data[0]).toHaveProperty("price");
    }
  });

  test("POST /api/subscriptions - should create new subscription", async ({ request }) => {
    const newSubscription = {
      name: "Test Subscription",
      price: 9.99,
      billing_cycle: "monthly",
      category: "software",
      status: "active",
    };

    const response = await request.post("/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: newSubscription,
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("id");
    expect(data.name).toBe(newSubscription.name);
    expect(data.price).toBe(newSubscription.price);
  });

  test("GET /api/subscriptions/[id] - should return specific subscription", async ({ request }) => {
    // First create a subscription
    const createResponse = await request.post("/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: "Test Sub",
        price: 5.99,
        billing_cycle: "monthly",
      },
    });

    const createdSub = await createResponse.json();

    // Then fetch it
    const getResponse = await request.get(`/api/subscriptions/${createdSub.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(getResponse.ok()).toBeTruthy();
    const data = await getResponse.json();

    expect(data.id).toBe(createdSub.id);
    expect(data.name).toBe("Test Sub");
  });

  test("PATCH /api/subscriptions/[id] - should update subscription", async ({ request }) => {
    // Create subscription first
    const createResponse = await request.post("/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: "Original Name",
        price: 10,
        billing_cycle: "monthly",
      },
    });

    const createdSub = await createResponse.json();

    // Update it
    const updateResponse = await request.patch(`/api/subscriptions/${createdSub.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: "Updated Name",
        price: 15,
      },
    });

    expect(updateResponse.ok()).toBeTruthy();
    const updated = await updateResponse.json();

    expect(updated.name).toBe("Updated Name");
    expect(updated.price).toBe(15);
  });

  test("DELETE /api/subscriptions/[id] - should delete subscription", async ({ request }) => {
    // Create subscription first
    const createResponse = await request.post("/api/subscriptions", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
      data: {
        name: "To Delete",
        price: 5,
        billing_cycle: "monthly",
      },
    });

    const createdSub = await createResponse.json();

    // Delete it
    const deleteResponse = await request.delete(`/api/subscriptions/${createdSub.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(deleteResponse.ok()).toBeTruthy();

    // Verify it's deleted
    const getResponse = await request.get(`/api/subscriptions/${createdSub.id}`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(getResponse.status()).toBe(404);
  });

  test("GET /api/subscriptions/summary - should return summary statistics", async ({ request }) => {
    const response = await request.get("/api/subscriptions/summary", {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();

    expect(data).toHaveProperty("totalMonthly");
    expect(data).toHaveProperty("totalYearly");
    expect(data).toHaveProperty("activeCount");
    expect(typeof data.totalMonthly).toBe("number");
  });
});
