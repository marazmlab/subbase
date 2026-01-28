import { aiServiceUnavailableError, internalError } from "@/lib/errors";
import type { SubscriptionDTO, AIInsightDTO } from "@/types";
import { SYSTEM_PROMPT, buildUserPrompt } from "@/lib/ai/prompts/subscription-insights.prompt";
import {
  InsightsResponseSchema,
  INSIGHTS_JSON_SCHEMA,
} from "@/lib/ai/schemas/subscription-insights.schema";

// ============================================================================
// Configuration
// ============================================================================

interface OpenRouterConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeout: number;
  maxRetries: number;
}

/**
 * Get OpenRouter configuration from environment
 * @throws ApiError with INTERNAL_ERROR if API key is not configured
 */
function getConfig(): OpenRouterConfig {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const model = import.meta.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

  if (!apiKey) {
    throw internalError("OpenRouter API key not configured");
  }

  return {
    apiKey,
    baseUrl: "https://openrouter.ai/api/v1",
    model,
    timeout: 30000, // 30 seconds
    maxRetries: 3,
  };
}

// ============================================================================
// OpenRouter API Types (Private)
// ============================================================================

interface OpenRouterMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenRouterRequest {
  model: string;
  messages: OpenRouterMessage[];
  response_format?: {
    type: "json_schema";
    json_schema: {
      name: string;
      schema: Record<string, unknown>;
      strict: boolean;
    };
  };
  temperature?: number;
  max_tokens?: number;
}

interface OpenRouterChoice {
  message: {
    role: "assistant";
    content: string;
  };
  finish_reason: "stop" | "length" | "content_filter" | "function_call";
  index: number;
}

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: OpenRouterChoice[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ============================================================================
// HTTP Client (Private)
// ============================================================================

/**
 * Makes HTTP request to OpenRouter API with retry logic
 *
 * Handles:
 * - Rate limiting (429) with Retry-After header
 * - Server errors (5xx) with exponential backoff
 * - Timeouts with abort controller
 *
 * @param request - OpenRouter API request payload
 * @param config - OpenRouter configuration
 * @param attempt - Current retry attempt (1-indexed)
 * @returns OpenRouter API response
 * @throws ApiError with AI_SERVICE_UNAVAILABLE on failure after retries
 */
async function makeOpenRouterRequest(
  request: OpenRouterRequest,
  config: OpenRouterConfig,
  attempt = 1
): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(`${config.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
        "HTTP-Referer": "https://subbase.app",
        "X-Title": "Subbase",
      },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle rate limiting with retry
    if (response.status === 429 && attempt < config.maxRetries) {
      const retryAfter = response.headers.get("Retry-After");
      const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : 1000 * attempt;
      console.warn(`OpenRouter rate limited, retrying after ${waitTime}ms (attempt ${attempt})`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return makeOpenRouterRequest(request, config, attempt + 1);
    }

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", {
        status: response.status,
        error: errorData,
      });

      // Retry on server errors
      if (response.status >= 500 && attempt < config.maxRetries) {
        console.warn(`OpenRouter server error, retry attempt ${attempt}`);
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        return makeOpenRouterRequest(request, config, attempt + 1);
      }

      throw aiServiceUnavailableError();
    }

    return await response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Handle timeout with retry
    if (error instanceof Error && error.name === "AbortError") {
      console.error("OpenRouter request timeout");
      if (attempt < config.maxRetries) {
        console.warn(`OpenRouter timeout, retry attempt ${attempt}`);
        return makeOpenRouterRequest(request, config, attempt + 1);
      }
    }

    // Re-throw ApiError instances
    if (error instanceof Error && error.name === "ApiError") {
      throw error;
    }

    console.error("OpenRouter request failed:", error);
    throw aiServiceUnavailableError();
  }
}

// ============================================================================
// Response Processing (Private)
// ============================================================================

/**
 * Validates and parses AI response using Zod schema
 *
 * @param content - Raw JSON string from AI response
 * @returns Array of validated AIInsightDTO objects
 * @throws ApiError with INTERNAL_ERROR if validation fails
 */
function validateAndParseResponse(content: string): AIInsightDTO[] {
  try {
    // Parse JSON
    const parsed = JSON.parse(content);

    // Validate with Zod schema (runtime type checking)
    const validated = InsightsResponseSchema.parse(parsed);

    return validated.insights;
  } catch (error) {
    console.error("Failed to validate AI response:", error);
    throw internalError("Invalid response format from AI service");
  }
}

/**
 * Handles different finish_reason values from OpenRouter
 *
 * @param finishReason - The finish_reason from API response
 * @throws ApiError with AI_SERVICE_UNAVAILABLE for abnormal completion
 */
function handleFinishReason(finishReason: string): void {
  switch (finishReason) {
    case "stop":
      // Normal completion - no action needed
      return;

    case "length":
      console.warn("AI response truncated due to token limit");
      throw aiServiceUnavailableError();

    case "content_filter":
      console.error("AI response blocked by content filter");
      throw aiServiceUnavailableError();

    default:
      console.error(`Unexpected finish_reason: ${finishReason}`);
      throw aiServiceUnavailableError();
  }
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Generates AI-powered insights for user subscriptions
 *
 * This is the main public function implementing the AI feature from PRD.
 * Takes subscription data and returns 2-4 financial observations.
 *
 * @param subscriptions - Array of user subscriptions to analyze
 * @returns Promise resolving to array of AI-generated insights
 * @throws ApiError with code AI_SERVICE_UNAVAILABLE if service fails
 * @throws ApiError with code INTERNAL_ERROR if response validation fails
 *
 * @example
 * ```typescript
 * const subscriptions = await SubscriptionService.list(supabase, userId, {
 *   status: "active",
 *   limit: 100
 * });
 *
 * const insights = await generateInsights(subscriptions.data);
 * // Returns: [
 * //   { type: "observation", message: "Masz 3 usługi streamingowe..." },
 * //   { type: "observation", message: "Twoje roczne subskrypcje..." }
 * // ]
 * ```
 */
export async function generateInsights(subscriptions: SubscriptionDTO[]): Promise<AIInsightDTO[]> {
  // Validate input - return empty array for empty input
  if (!subscriptions || subscriptions.length === 0) {
    console.warn("generateInsights called with empty subscriptions array");
    return [];
  }

  const config = getConfig();

  // Build prompts
  const systemMessage: OpenRouterMessage = {
    role: "system",
    content: SYSTEM_PROMPT,
  };

  const userMessage: OpenRouterMessage = {
    role: "user",
    content: buildUserPrompt(subscriptions),
  };

  // Build request with structured output
  const request: OpenRouterRequest = {
    model: config.model,
    messages: [systemMessage, userMessage],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "subscription_insights",
        schema: INSIGHTS_JSON_SCHEMA,
        strict: true,
      },
    },
    temperature: 0.7,
    max_tokens: 1000,
  };

  // Make API request
  const response = await makeOpenRouterRequest(request, config);

  // Extract first choice
  const choice = response.choices[0];
  if (!choice) {
    throw internalError("Empty response from AI service");
  }

  // Handle finish reason
  handleFinishReason(choice.finish_reason);

  // Extract content
  const content = choice.message?.content;
  if (!content) {
    throw internalError("Empty content from AI service");
  }

  // Validate and parse response
  const insights = validateAndParseResponse(content);

  // Log token usage for monitoring
  console.log("AI Insights generated:", {
    subscription_count: subscriptions.length,
    insights_count: insights.length,
    tokens_used: response.usage.total_tokens,
    model: response.model,
  });

  return insights;
}
