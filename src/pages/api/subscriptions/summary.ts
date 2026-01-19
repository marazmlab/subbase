import type { APIContext } from "astro";

import { handleApiError, jsonResponse, unauthorizedError } from "@/lib/errors";
import { SummaryService } from "@/lib/services/summary.service";

export const prerender = false;

/**
 * GET /api/subscriptions/summary
 *
 * Get subscription cost summary for the authenticated user
 *
 * Calculation logic:
 * - monthly_total: sum of active monthly costs + (yearly costs ÷ 12)
 * - yearly_total: (active monthly costs × 12) + yearly costs
 * - Only 'active' subscriptions are included in cost calculations
 * - Status counts include all subscriptions
 *
 * Returns: SubscriptionSummaryResponseDTO
 */
export async function GET(context: APIContext): Promise<Response> {
  try {
    const { supabase, user } = context.locals;

    // Check authentication
    if (!user) {
      throw unauthorizedError();
    }

    // Calculate summary
    const result = await SummaryService.calculate(supabase, user.id);

    return jsonResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
