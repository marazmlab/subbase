import type { APIRoute } from "astro";
import { z } from "zod";

import {
  handleApiError,
  jsonResponse,
  unauthorizedError,
  validationError,
  mapZodErrors,
} from "@/lib/errors";
import { generateInsights } from "@/lib/openrouter.service";
import { SubscriptionService } from "@/lib/services/subscription.service";
import type { AIInsightsResponseDTO } from "@/types";

export const prerender = false;

// Validation schema for request body
const aiInsightsSchema = z.object({
  subscription_ids: z.array(z.string().uuid()).optional(),
});

/**
 * POST /api/ai/insights
 *
 * Generates AI-powered insights for user subscriptions.
 *
 * Request body:
 * - subscription_ids (optional): Array of specific subscription UUIDs to analyze
 *   If omitted, all active subscriptions are analyzed
 *
 * Response:
 * - 200: AIInsightsResponseDTO with generated insights
 * - 400: Validation error (invalid UUIDs)
 * - 401: Unauthorized (not authenticated)
 * - 503: AI service unavailable
 * - 500: Internal server error
 */
export const POST: APIRoute = async (context) => {
  try {
    // Get authenticated user
    const user = context.locals.user;
    if (!user) {
      throw unauthorizedError();
    }

    const supabase = context.locals.supabase;

    // Parse and validate request body
    let body: unknown = {};
    try {
      const text = await context.request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      throw validationError("Invalid JSON in request body");
    }

    const parseResult = aiInsightsSchema.safeParse(body);
    if (!parseResult.success) {
      throw validationError("Invalid request data", mapZodErrors(parseResult.error));
    }

    const { subscription_ids } = parseResult.data;

    let subscriptions;

    if (subscription_ids && subscription_ids.length > 0) {
      // Fetch specific subscriptions
      // Note: This validates ownership through RLS policies
      const results = await Promise.all(
        subscription_ids.map((id) => SubscriptionService.getById(supabase, user.id, id))
      );
      subscriptions = results.map((r) => r.data);
    } else {
      // Fetch all active subscriptions
      const response = await SubscriptionService.list(supabase, user.id, {
        status: "active",
        limit: 100,
      });
      subscriptions = response.data;
    }

    // Generate insights
    const insights = await generateInsights(subscriptions);

    // Build response
    const response: AIInsightsResponseDTO = {
      data: {
        insights,
        generated_at: new Date().toISOString(),
        subscription_count: subscriptions.length,
      },
    };

    return jsonResponse(response);
  } catch (error) {
    return handleApiError(error);
  }
};
