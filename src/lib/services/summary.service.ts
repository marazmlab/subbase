import type { TypedSupabaseClient } from "@/db/supabase.client";
import type { SubscriptionSummaryDTO, SubscriptionSummaryResponseDTO } from "@/types";

import { internalError } from "@/lib/errors";

// ============================================================================
// Summary Service
// ============================================================================

/**
 * Service for calculating subscription cost summaries
 *
 * Calculation logic:
 * - monthly_total: sum of active monthly costs + (yearly costs ÷ 12)
 * - yearly_total: (active monthly costs × 12) + yearly costs
 * - Only 'active' subscriptions are included in cost calculations
 * - Status counts include all subscriptions
 */
export const SummaryService = {
  /**
   * Calculate subscription summary for a user
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @returns Subscription summary with cost totals and status counts
   * @throws ApiError on database errors
   */
  async calculate(supabase: TypedSupabaseClient, userId: string): Promise<SubscriptionSummaryResponseDTO> {
    // Fetch all user subscriptions for calculations
    const { data: subscriptions, error } = await supabase
      .from("subscriptions")
      .select("cost, billing_cycle, status, currency")
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching subscriptions for summary:", error);
      throw internalError("Failed to calculate subscription summary");
    }

    const data = subscriptions ?? [];

    // Initialize counters
    let monthlyTotal = 0;
    let yearlyTotal = 0;
    let activeCount = 0;
    let pausedCount = 0;
    let cancelledCount = 0;

    // Default currency (use first subscription's currency or PLN)
    const defaultCurrency = data.length > 0 ? data[0].currency : "PLN";

    // Process each subscription
    for (const sub of data) {
      // Count by status
      switch (sub.status) {
        case "active":
          activeCount++;
          break;
        case "paused":
          pausedCount++;
          break;
        case "cancelled":
          cancelledCount++;
          break;
      }

      // Only include active subscriptions in cost calculations
      if (sub.status !== "active") {
        continue;
      }

      const cost = sub.cost;

      if (sub.billing_cycle === "monthly") {
        // Monthly subscription: add to monthly, multiply by 12 for yearly
        monthlyTotal += cost;
        yearlyTotal += cost * 12;
      } else if (sub.billing_cycle === "yearly") {
        // Yearly subscription: divide by 12 for monthly, add to yearly
        monthlyTotal += cost / 12;
        yearlyTotal += cost;
      }
    }

    // Round to 2 decimal places
    monthlyTotal = Math.round(monthlyTotal * 100) / 100;
    yearlyTotal = Math.round(yearlyTotal * 100) / 100;

    const summary: SubscriptionSummaryDTO = {
      monthly_total: monthlyTotal,
      yearly_total: yearlyTotal,
      currency: defaultCurrency,
      active_count: activeCount,
      paused_count: pausedCount,
      cancelled_count: cancelledCount,
    };

    return { data: summary };
  },
};
