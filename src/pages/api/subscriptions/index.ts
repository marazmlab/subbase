import type { APIContext } from "astro";

import {
  handleApiError,
  jsonResponse,
  mapZodErrors,
  validationError,
  unauthorizedError,
} from "@/lib/errors";
import {
  subscriptionQuerySchema,
  createSubscriptionSchema,
} from "@/lib/schemas/subscription.schema";
import { SubscriptionService } from "@/lib/services/subscription.service";

export const prerender = false;

/**
 * GET /api/subscriptions
 *
 * List subscriptions with pagination and optional filtering
 *
 * Query Parameters:
 * - page (integer, optional, default: 1) - Page number
 * - limit (integer, optional, default: 10) - Items per page (1-100)
 * - status (string, optional) - Filter by status: active, paused, cancelled
 *
 * Returns: SubscriptionListResponseDTO
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Parse and validate query parameters
    const url = new URL(context.request.url);
    const queryParams = {
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      status: url.searchParams.get("status") ?? undefined,
    };

    const parseResult = subscriptionQuerySchema.safeParse(queryParams);

    if (!parseResult.success) {
      throw validationError("Invalid query parameters", mapZodErrors(parseResult.error));
    }

    // Fetch subscriptions
    const result = await SubscriptionService.list(supabase, user.id, parseResult.data);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/subscriptions
 *
 * Create a new subscription
 *
 * Request Body:
 * - name (string, required) - Subscription name
 * - cost (number, required) - Cost amount (> 0, ≤ 100000)
 * - currency (string, optional, default: PLN) - ISO currency code
 * - billing_cycle (string, required) - monthly or yearly
 * - status (string, optional, default: active) - active, paused, cancelled
 * - start_date (string, required) - YYYY-MM-DD format
 * - next_billing_date (string, optional) - YYYY-MM-DD format
 * - description (string, optional) - Additional notes
 *
 * Returns: SubscriptionResponseDTO (201 Created)
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      throw validationError("Invalid JSON in request body");
    }

    // Validate request body
    const parseResult = createSubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      throw validationError("Invalid input data", mapZodErrors(parseResult.error));
    }

    // Create subscription
    const result = await SubscriptionService.create(supabase, user.id, parseResult.data);

    return jsonResponse(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
