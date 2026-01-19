import type { APIContext } from "astro";

import {
  handleApiError,
  jsonResponse,
  noContentResponse,
  mapZodErrors,
  validationError,
  unauthorizedError,
  invalidUuidError,
} from "@/lib/errors";
import { uuidSchema, updateSubscriptionSchema, patchSubscriptionSchema } from "@/lib/schemas/subscription.schema";
import { SubscriptionService } from "@/lib/services/subscription.service";

export const prerender = false;

/**
 * Validate and extract subscription ID from path parameters
 */
function validateSubscriptionId(params: APIContext["params"]): string {
  const id = params.id;

  if (!id) {
    throw invalidUuidError("id");
  }

  const parseResult = uuidSchema.safeParse(id);

  if (!parseResult.success) {
    throw invalidUuidError("id");
  }

  return parseResult.data;
}

/**
 * GET /api/subscriptions/:id
 *
 * Get a single subscription by ID
 *
 * Path Parameters:
 * - id (UUID, required) - Subscription identifier
 *
 * Returns: SubscriptionResponseDTO
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Validate subscription ID
    const id = validateSubscriptionId(context.params);

    // Fetch subscription
    const result = await SubscriptionService.getById(supabase, user.id, id);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/subscriptions/:id
 *
 * Full update of a subscription (all fields required)
 *
 * Path Parameters:
 * - id (UUID, required) - Subscription identifier
 *
 * Request Body: All fields from CreateSubscriptionCommand (required)
 *
 * Returns: SubscriptionResponseDTO
 */
export async function PUT(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Validate subscription ID
    const id = validateSubscriptionId(context.params);

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      throw validationError("Invalid JSON in request body");
    }

    // Validate request body
    const parseResult = updateSubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      throw validationError("Invalid input data", mapZodErrors(parseResult.error));
    }

    // Update subscription
    const result = await SubscriptionService.update(supabase, user.id, id, parseResult.data);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PATCH /api/subscriptions/:id
 *
 * Partial update of a subscription (only provided fields updated)
 *
 * Path Parameters:
 * - id (UUID, required) - Subscription identifier
 *
 * Request Body: Any fields from UpdateSubscriptionCommand (all optional)
 *
 * Returns: SubscriptionResponseDTO
 */
export async function PATCH(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Validate subscription ID
    const id = validateSubscriptionId(context.params);

    // Parse request body
    let body: unknown;
    try {
      body = await context.request.json();
    } catch {
      throw validationError("Invalid JSON in request body");
    }

    // Validate request body
    const parseResult = patchSubscriptionSchema.safeParse(body);

    if (!parseResult.success) {
      throw validationError("Invalid input data", mapZodErrors(parseResult.error));
    }

    // Check if any fields provided
    if (Object.keys(parseResult.data).length === 0) {
      throw validationError("At least one field must be provided for update");
    }

    // Patch subscription
    const result = await SubscriptionService.patch(supabase, user.id, id, parseResult.data);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/subscriptions/:id
 *
 * Delete a subscription
 *
 * Path Parameters:
 * - id (UUID, required) - Subscription identifier
 *
 * Returns: 204 No Content
 */
export async function DELETE(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Validate subscription ID
    const id = validateSubscriptionId(context.params);

    // Delete subscription
    await SubscriptionService.delete(supabase, user.id, id);

    return noContentResponse();
  } catch (error) {
    return handleApiError(error);
  }
}
