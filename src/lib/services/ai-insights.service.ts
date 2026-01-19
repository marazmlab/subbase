import type { TypedSupabaseClient } from "@/db/supabase.client";
import type { AIInsightsResponseDTO, AIInsightDTO, SubscriptionEntity } from "@/types";

import { internalError, aiServiceUnavailableError, notFoundError } from "@/lib/errors";

// ============================================================================
// Types
// ============================================================================

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message: string;
  };
}

// ============================================================================
// AI Insights Service
// ============================================================================

/**
 * Service for generating AI-powered subscription insights
 *
 * Uses OpenRouter.ai API to analyze user subscriptions and provide
 * observations about spending patterns, potential savings, etc.
 */
export const AIInsightsService = {
  /**
   * Generate AI insights for user subscriptions
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param subscriptionIds - Optional array of specific subscription IDs to analyze
   * @returns AI-generated insights
   * @throws ApiError if subscriptions not found, AI service unavailable, or other errors
   */
  async generateInsights(
    supabase: TypedSupabaseClient,
    userId: string,
    subscriptionIds?: string[]
  ): Promise<AIInsightsResponseDTO> {
    // Fetch subscriptions to analyze
    let query = supabase.from("subscriptions").select("*").eq("user_id", userId);

    if (subscriptionIds && subscriptionIds.length > 0) {
      // Analyze specific subscriptions
      query = query.in("id", subscriptionIds);
    } else {
      // Analyze all active subscriptions
      query = query.eq("status", "active");
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error("Error fetching subscriptions for AI insights:", error);
      throw internalError("Failed to fetch subscriptions for analysis");
    }

    // Validate that requested subscriptions exist
    if (subscriptionIds && subscriptionIds.length > 0) {
      if (!subscriptions || subscriptions.length !== subscriptionIds.length) {
        throw notFoundError("One or more subscriptions");
      }
    }

    const subscriptionList = subscriptions ?? [];

    // If no subscriptions to analyze, return empty insights
    if (subscriptionList.length === 0) {
      return {
        data: {
          insights: [],
          generated_at: new Date().toISOString(),
          subscription_count: 0,
        },
      };
    }

    // Generate insights using AI
    const insights = await this.callAIService(subscriptionList);

    return {
      data: {
        insights,
        generated_at: new Date().toISOString(),
        subscription_count: subscriptionList.length,
      },
    };
  },

  /**
   * Call OpenRouter.ai API to generate insights
   *
   * @param subscriptions - List of subscriptions to analyze
   * @returns Array of AI-generated insights
   * @throws ApiError if AI service is unavailable
   */
  async callAIService(subscriptions: SubscriptionEntity[]): Promise<AIInsightDTO[]> {
    const apiKey = import.meta.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      console.error("OPENROUTER_API_KEY is not configured");
      throw aiServiceUnavailableError();
    }

    // Prepare subscription data for AI (remove sensitive user_id)
    const subscriptionData = subscriptions.map((sub) => ({
      name: sub.name,
      cost: sub.cost,
      currency: sub.currency,
      billing_cycle: sub.billing_cycle,
      status: sub.status,
      start_date: sub.start_date,
      description: sub.description,
    }));

    const systemPrompt = `You are a financial advisor assistant that analyzes subscription spending. 
Provide concise, actionable observations about the user's subscriptions. 
Focus on:
- Total spending patterns
- Potential duplicate or overlapping services
- Unusual costs or pricing
- Suggestions for optimization

Respond in JSON format with an array of observations:
[{"type": "observation", "message": "Your observation here"}]

Keep observations brief (1-2 sentences each). Provide 2-5 observations maximum.
Respond in the same language as subscription names if they're not in English.`;

    const userPrompt = `Analyze these subscriptions:\n${JSON.stringify(subscriptionData, null, 2)}`;

    const messages: OpenRouterMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": import.meta.env.SITE_URL || "http://localhost:4321",
          "X-Title": "Subbase Subscription Manager",
        },
        body: JSON.stringify({
          model: "openai/gpt-4o-mini",
          messages,
          temperature: 0.7,
          max_tokens: 1000,
        }),
        signal: AbortSignal.timeout(30000), // 30 second timeout
      });

      if (!response.ok) {
        console.error("OpenRouter API error:", response.status, response.statusText);
        throw aiServiceUnavailableError();
      }

      const result: OpenRouterResponse = await response.json();

      if (result.error) {
        console.error("OpenRouter API error:", result.error.message);
        throw aiServiceUnavailableError();
      }

      const content = result.choices?.[0]?.message?.content;

      if (!content) {
        console.error("No content in AI response");
        throw aiServiceUnavailableError();
      }

      // Parse AI response
      return this.parseAIResponse(content);
    } catch (error) {
      if (error instanceof Error && error.name === "TimeoutError") {
        console.error("AI service timeout");
        throw aiServiceUnavailableError();
      }

      // Re-throw ApiError instances
      if (error && typeof error === "object" && "statusCode" in error) {
        throw error;
      }

      console.error("AI service error:", error);
      throw aiServiceUnavailableError();
    }
  },

  /**
   * Parse AI response content into structured insights
   *
   * @param content - Raw AI response content
   * @returns Parsed array of insights
   */
  parseAIResponse(content: string): AIInsightDTO[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\[[\s\S]*\]/);

      if (!jsonMatch) {
        console.error("Could not find JSON array in AI response");
        return [{ type: "observation", message: content.trim() }];
      }

      const parsed = JSON.parse(jsonMatch[0]) as Array<{ type?: string; message?: string }>;

      if (!Array.isArray(parsed)) {
        return [{ type: "observation", message: content.trim() }];
      }

      // Validate and transform insights
      return parsed
        .filter((item) => item && typeof item.message === "string")
        .map((item) => ({
          type: "observation" as const,
          message: item.message!,
        }))
        .slice(0, 5); // Limit to 5 insights
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Return the raw content as a single observation
      return [{ type: "observation", message: content.trim() }];
    }
  },
};
