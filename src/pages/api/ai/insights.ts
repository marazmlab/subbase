import type { APIContext } from "astro";

import {
  handleApiError,
  jsonResponse,
  mapZodErrors,
  validationError,
  unauthorizedError,
} from "@/lib/errors";
import { aiInsightsSchema } from "@/lib/schemas/subscription.schema";
import { AIInsightsService } from "@/lib/services/ai-insights.service";

export const prerender = false;

/**
 * POST /api/ai/insights
 *
 * Generate AI-powered insights for user subscriptions
 *
 * Request Body:
 * - subscription_ids (UUID[], optional) - Specific subscriptions to analyze
 *   If omitted, all active subscriptions are analyzed
 *
 * Returns: AIInsightsResponseDTO
 *
 * Error Responses:
 * - 401 Unauthorized - Authentication required
 * - 400 Validation Error - Invalid subscription IDs
 * - 404 Not Found - One or more subscriptions not found
 * - 503 Service Unavailable - AI service temporarily unavailable
 */
export async function POST(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Parse request body (empty body is valid)
    let body: unknown = {};
    const contentType = context.request.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      try {
        const text = await context.request.text();
        if (text.trim()) {
          body = JSON.parse(text);
        }
      } catch {
        throw validationError("Invalid JSON in request body");
      }
    }

    // Validate request body
    const parseResult = aiInsightsSchema.safeParse(body);

    if (!parseResult.success) {
      throw validationError("Invalid input data", mapZodErrors(parseResult.error));
    }

    // Generate insights
    const result = await AIInsightsService.generateInsights(
      supabase,
      user.id,
      parseResult.data.subscription_ids
    );

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
