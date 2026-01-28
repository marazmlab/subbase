# AI Insights Service Implementation Plan

## 1. Service Description

The AI Insights Service is responsible for generating intelligent observations about user subscriptions using Large Language Models through OpenRouter API. This service implements the core AI functionality described in PRD section "AI Feature" and lesson 2x6 "Implementacja logiki biznesowej opartej o LLM".

**Key responsibilities:**
1. Generating AI-powered insights based on subscription data
2. Managing communication with OpenRouter API
3. Constructing properly formatted prompts and JSON schemas
4. Validating AI responses with runtime type checking
5. Implementing robust error handling and retry logic

**Architecture decision:** For MVP, OpenRouter integration is implemented directly within this service rather than as a separate abstraction layer. This follows the YAGNI principle - we'll extract a reusable OpenRouter client only when a second AI feature emerges.

## 2. Service Architecture

### 2.1 Service Location
- **File Path**: `src/lib/services/ai-insights.service.ts`
- **Prompt Definitions**: `src/lib/ai/prompts/subscription-insights.prompt.ts`
- **Schema Definitions**: `src/lib/ai/schemas/subscription-insights.schema.ts`
- **Type Definitions**: Use existing types from `src/types.ts`

### 2.2 Core Components

1. **generateInsights()** - Main public function that takes subscriptions and returns insights
2. **Prompt Builder** - Constructs system and user prompts from subscription data
3. **OpenRouter HTTP Client** - Handles API communication (private implementation detail)
4. **Response Validator** - Uses Zod to validate AI responses at runtime
5. **Error Handler** - Maps OpenRouter errors to application error codes

### 2.3 Integration Points

- **Input**: `SubscriptionDTO[]` from `subscription.service.ts`
- **Output**: `AIInsightDTO[]` as defined in `src/types.ts`
- **API Endpoint**: Used by `POST /api/ai/insights`
- **Error Handling**: Uses existing `@/lib/errors` utilities

## 3. Prompt and Schema Definitions

### 3.1 System Prompt

Create file `src/lib/ai/prompts/subscription-insights.prompt.ts`:

```typescript
import type { SubscriptionDTO } from "@/types";

/**
 * System prompt defining AI behavior for subscription analysis
 * 
 * Guidelines enforced:
 * - Focus on cost optimization
 * - Identify overlapping services
 * - Highlight unused subscriptions
 * - Suggest better billing cycles
 * - Keep insights concise (max 100 words each)
 * - Generate 2-4 insights per analysis
 */
export const SYSTEM_PROMPT = `Jesteś doradcą finansowym specjalizującym się w zarządzaniu subskrypcjami.
Twoim zadaniem jest analiza subskrypcji użytkownika i dostarczenie praktycznych spostrzeżeń.

Wytyczne:
- Skup się na możliwościach optymalizacji kosztów
- Identyfikuj nakładające się lub zduplikowane usługi
- Zwróć uwagę na potencjalnie niewykorzystywane subskrypcje
- Sugeruj lepsze cykle rozliczeniowe, gdy to właściwe
- Zachowaj zwięzłość spostrzeżeń (maksymalnie 100 słów każde)
- Wygeneruj 2-4 spostrzeżenia na analizę
- Wszystkie spostrzeżenia muszą mieć typ "observation"
- Używaj języka polskiego`;

/**
 * Builds user prompt with subscription data
 */
export function buildUserPrompt(subscriptions: SubscriptionDTO[]): string {
  const subscriptionsList = subscriptions
    .map((sub, idx) => {
      const parts = [
        `${idx + 1}. ${sub.name}`,
        `   - Koszt: ${sub.cost} ${sub.currency} / ${sub.billing_cycle === "monthly" ? "miesięcznie" : "rocznie"}`,
        `   - Status: ${sub.status}`,
        `   - Data rozpoczęcia: ${sub.start_date}`,
      ];
      
      if (sub.description) {
        parts.push(`   - Opis: ${sub.description}`);
      }
      
      return parts.join("\n");
    })
    .join("\n\n");

  const activeCount = subscriptions.filter((s) => s.status === "active").length;

  return `Przeanalizuj następujące subskrypcje i dostarcz spostrzeżenia:

${subscriptionsList}

Łączna liczba subskrypcji: ${subscriptions.length}
Aktywne subskrypcje: ${activeCount}`;
}
```

### 3.2 JSON Schema Definitions

Create file `src/lib/ai/schemas/subscription-insights.schema.ts`:

```typescript
import { z } from "zod";
import type { AIInsightDTO } from "@/types";

/**
 * Zod schema for runtime validation of AI responses
 * Ensures LLM returns data in expected format
 */
export const InsightsResponseSchema = z.object({
  insights: z
    .array(
      z.object({
        type: z.literal("observation"),
        message: z.string().min(1).max(200),
      })
    )
    .min(2, "AI musi wygenerować co najmniej 2 spostrzeżenia")
    .max(4, "AI nie może wygenerować więcej niż 4 spostrzeżenia"),
});

/**
 * Type inferred from Zod schema
 */
export type InsightsResponse = z.infer<typeof InsightsResponseSchema>;

/**
 * JSON Schema for OpenRouter structured outputs
 * This is sent to the LLM to enforce response structure
 */
export const INSIGHTS_JSON_SCHEMA = {
  type: "object",
  properties: {
    insights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: {
            type: "string",
            enum: ["observation"],
          },
          message: {
            type: "string",
            maxLength: 200,
          },
        },
        required: ["type", "message"],
        additionalProperties: false,
      },
      minItems: 2,
      maxItems: 4,
    },
  },
  required: ["insights"],
  additionalProperties: false,
} as const;
```

## 4. Service Implementation

### 4.1 Main Service File

Create file `src/lib/services/ai-insights.service.ts`:

```typescript
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
 */
function getConfig(): OpenRouterConfig {
  const apiKey = import.meta.env.OPENROUTER_API_KEY;
  const model =
    import.meta.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";

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

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: Array<{
    message: {
      role: "assistant";
      content: string;
    };
    finish_reason: "stop" | "length" | "content_filter" | "function_call";
    index: number;
  }>;
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
      console.warn(`Rate limited, retrying after ${waitTime}ms`);
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      return makeOpenRouterRequest(request, config, attempt + 1);
    }

    // Handle error responses
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);

      // Retry on server errors
      if (response.status >= 500 && attempt < config.maxRetries) {
        console.warn(`Server error, retry attempt ${attempt}`);
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
        console.warn(`Timeout, retry attempt ${attempt}`);
        return makeOpenRouterRequest(request, config, attempt + 1);
      }
    }

    console.error("OpenRouter request failed:", error);
    throw aiServiceUnavailableError();
  }
}

/**
 * Validates and parses AI response using Zod
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
export async function generateInsights(
  subscriptions: SubscriptionDTO[]
): Promise<AIInsightDTO[]> {
  // Validate input
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

  // Build request
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
```

## 5. API Endpoint Integration

### 5.1 Implementation in `src/pages/api/ai/insights.ts`

The endpoint should implement the contract defined in `api-plan.md`, including support for optional `subscription_ids` filter:

```typescript
import type { APIRoute } from "astro";
import { handleApiError, jsonResponse, unauthorizedError } from "@/lib/errors";
import { generateInsights } from "@/lib/services/ai-insights.service";
import { SubscriptionService } from "@/lib/services/subscription.service";
import type { AIInsightsResponseDTO, AIInsightsCommand } from "@/types";
import { z } from "zod";

// Validation schema for request body
const aiInsightsSchema = z.object({
  subscription_ids: z.array(z.string().uuid()).optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    // Get authenticated user
    const userId = context.locals.userId;
    if (!userId) {
      throw unauthorizedError();
    }

    const supabase = context.locals.supabase;

    // Parse and validate request body
    const body = await context.request.json();
    const { subscription_ids } = aiInsightsSchema.parse(body);

    let subscriptions;

    if (subscription_ids && subscription_ids.length > 0) {
      // Fetch specific subscriptions
      // Note: This validates ownership through RLS policies
      subscriptions = await Promise.all(
        subscription_ids.map((id) =>
          SubscriptionService.getById(supabase, userId, id)
        )
      );
    } else {
      // Fetch all active subscriptions
      const response = await SubscriptionService.list(supabase, userId, {
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
```

## 6. Configuration

### 6.1 Environment Variables

Add to `.env.example`:

```bash
# OpenRouter API Configuration
OPENROUTER_API_KEY=###
OPENROUTER_MODEL=openai/gpt-4o-mini
```

**Notes:**
- `gpt-4o-mini` is the default - fast, cheap (~$0.003 per request), good quality
- Alternative models: `google/gemini-2.0-flash-exp:free` (free but rate limited) or `anthropic/claude-3.5-sonnet` (highest quality, more expensive)
- Set credit limit on OpenRouter API key to prevent unexpected costs

### 6.2 Environment Type Definitions

Update `src/env.d.ts`:

```typescript
interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  readonly OPENROUTER_MODEL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

## 7. Error Handling

### 7.1 Error Scenarios

The service handles the following error scenarios:

| Scenario | Handling | Error Code | HTTP Status |
|----------|----------|------------|-------------|
| Missing API key | Throw at initialization | `INTERNAL_ERROR` | 500 |
| Network timeout | Retry up to 3 times | `AI_SERVICE_UNAVAILABLE` | 503 |
| Rate limiting (429) | Respect `Retry-After`, retry | `AI_SERVICE_UNAVAILABLE` | 503 |
| Server errors (5xx) | Retry up to 3 times | `AI_SERVICE_UNAVAILABLE` | 503 |
| Client errors (4xx) | No retry | `AI_SERVICE_UNAVAILABLE` | 503 |
| Invalid JSON response | Log and throw | `INTERNAL_ERROR` | 500 |
| Zod validation failure | Log and throw | `INTERNAL_ERROR` | 500 |
| Empty response | Log and throw | `INTERNAL_ERROR` | 500 |
| finish_reason: length | Log warning | `AI_SERVICE_UNAVAILABLE` | 503 |
| finish_reason: content_filter | Log error | `AI_SERVICE_UNAVAILABLE` | 503 |

### 7.2 Graceful Degradation

As per PRD requirements, AI service unavailability (503) must not block core functionality:

- Frontend should display: "Usługa AI jest tymczasowo niedostępna"
- Dashboard and CRUD operations continue working normally
- User can retry insight generation later

## 8. Testing Strategy

### 8.1 Manual Testing Checklist

- [ ] Test with 0 subscriptions (should return empty array)
- [ ] Test with 1 subscription (verify prompt formatting)
- [ ] Test with 10+ subscriptions (verify all included in prompt)
- [ ] Test with only monthly subscriptions
- [ ] Test with only yearly subscriptions
- [ ] Test with mixed billing cycles
- [ ] Test with different statuses (active, paused, cancelled)
- [ ] Test with API key missing (should throw INTERNAL_ERROR)
- [ ] Test with invalid API key (should throw AI_SERVICE_UNAVAILABLE)
- [ ] Monitor token usage in logs

### 8.2 Prompt Quality Testing

Iterate on prompt to ensure:
- Insights are in Polish language
- Insights are concise (max 100 words each)
- Insights focus on cost optimization
- Insights identify overlapping services
- Insights avoid prescriptive advice (only observations)
- Always generates 2-4 insights

### 8.3 Integration Testing

Test complete flow from API endpoint:

```bash
# Test with all active subscriptions
curl -X POST http://localhost:4321/api/ai/insights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'

# Test with specific subscriptions
curl -X POST http://localhost:4321/api/ai/insights \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"subscription_ids": ["uuid1", "uuid2"]}'
```

## 9. Performance Considerations

### 9.1 Cost Optimization

**Default model (GPT-4o Mini)**:
- Cost: ~$0.003 per request (based on typical prompt size)
- Speed: 2-3 seconds response time
- Quality: Excellent for financial observations
- Suitable for: MVP and production

**Alternative models**:
- `google/gemini-2.0-flash-exp:free`: Free but limited to 15 req/min
- `anthropic/claude-3.5-sonnet`: ~$0.015 per request (highest quality)

**Cost estimate for MVP**: 100 requests/day = ~$0.30/day = ~$9/month

### 9.2 Response Time

Expected latency:
- Network latency: 100-300ms
- LLM processing: 2-5 seconds
- Total: 2-6 seconds

Timeout set at 30 seconds to handle slower responses.

### 9.3 Token Usage Estimation

Typical prompt:
- System prompt: ~100 tokens
- User prompt per subscription: ~50 tokens
- Response: ~200 tokens

Example: 10 subscriptions = ~100 + 500 + 200 = 800 tokens ≈ $0.002 with gpt-4o-mini

## 10. Security Considerations

### 10.1 API Key Security

- ✅ API key stored in environment variables
- ✅ Never exposed to client-side code
- ✅ Validated at service initialization
- ✅ Used only in server-side functions

**Best practice**: Set credit limit on OpenRouter dashboard ($1-5 for MVP).

### 10.2 Data Privacy

- ✅ Subscription data sent to OpenRouter is minimal (name, cost, dates)
- ✅ No personally identifiable information (PII) sent
- ✅ User IDs never sent to external services
- ⚠️  Consider OpenRouter privacy settings (can opt out of data sharing for 1% discount)

### 10.3 Input Validation

- ✅ `subscription_ids` validated with Zod (UUID format)
- ✅ Ownership verified through RLS policies
- ✅ Empty subscription arrays handled gracefully

## 11. Step-by-Step Implementation

### Phase 1: Setup (15 minutes)

**Step 1.1**: Create directory structure
```bash
mkdir -p src/lib/ai/prompts
mkdir -p src/lib/ai/schemas
```

**Step 1.2**: Add environment variables
- Copy `.env.example` to `.env`
- Add `OPENROUTER_API_KEY=your_key_here`
- Add `OPENROUTER_MODEL=openai/gpt-4o-mini` (optional, this is the default)

**Step 1.3**: Update `src/env.d.ts`
- Add OpenRouter types to `ImportMetaEnv`

### Phase 2: Core Implementation (45 minutes)

**Step 2.1**: Create prompt file
- File: `src/lib/ai/prompts/subscription-insights.prompt.ts`
- Implement `SYSTEM_PROMPT` constant
- Implement `buildUserPrompt()` function

**Step 2.2**: Create schema file
- File: `src/lib/ai/schemas/subscription-insights.schema.ts`
- Implement `InsightsResponseSchema` (Zod)
- Implement `INSIGHTS_JSON_SCHEMA` (for OpenRouter)

**Step 2.3**: Create service file
- File: `src/lib/services/ai-insights.service.ts`
- Copy complete implementation from section 4.1
- Verify all imports resolve correctly

### Phase 3: API Integration (20 minutes)

**Step 3.1**: Create API endpoint
- File: `src/pages/api/ai/insights.ts`
- Implement POST handler with `subscription_ids` support
- Add `export const prerender = false`

**Step 3.2**: Test endpoint
- Start dev server: `npm run dev`
- Test with curl or Postman
- Verify response format matches `AIInsightsResponseDTO`

### Phase 4: Testing & Polish (30 minutes)

**Step 4.1**: Manual testing
- Test all scenarios from section 8.1
- Monitor console logs for errors
- Check token usage in logs

**Step 4.2**: Prompt iteration
- Test with real subscription data
- Refine `SYSTEM_PROMPT` if insights are off-topic
- Ensure Polish language quality

**Step 4.3**: Error handling verification
- Test with missing API key
- Test with invalid API key
- Verify 503 error returns correctly

### Phase 5: Documentation (10 minutes)

**Step 5.1**: Update project README
- Document AI insights feature
- Add OpenRouter setup instructions

**Step 5.2**: Code review
- Ensure no API keys in code
- Verify all TODOs are resolved
- Check TypeScript errors: `npm run lint`

---

## 12. Design Notes

### 12.1 Decisions and Rationale

**Why not a separate OpenRouter service?**
- YAGNI principle - MVP has only one AI feature
- Easier to understand and debug single-file implementation
- Can be extracted later when second AI feature emerges

**Why Zod validation for AI responses?**
- Runtime type safety (TypeScript only checks compile-time)
- LLMs can occasionally produce invalid JSON
- Explicit error messages when validation fails
- Consistent with project's existing validation approach

**Why Polish language in prompts?**
- Target audience is Polish-speaking users (PLN currency, local market)
- Better quality insights in native language
- Consistent with UI language

**Why GPT-4o Mini as default?**
- Excellent quality-to-cost ratio (~$0.003 per request)
- Fast response times (2-3 seconds)
- No rate limiting concerns for MVP
- Proven reliability for production use
- Easy to switch to other models via environment variable

**Why store prompts in separate files?**
- Easier to iterate on prompt engineering
- Clear separation: code vs. content
- Prompts can be version-controlled separately
- Future: could be moved to database/CMS

### 12.2 Alignment with Lesson 2x6

This implementation follows the lesson's core principles:

✅ **LLM as part of business logic** - AI is integrated into subscription management domain
✅ **Not "magical heart of application"** - AI is one feature among many (CRUD is core)
✅ **Spec-driven approach** - Follows PRD requirements exactly
✅ **OpenRouter as universal interface** - Uses OpenRouter proxy as taught
✅ **Free/cheap models for development** - Uses Gemini Flash as recommended
✅ **Structured outputs** - Uses JSON schema for predictable responses

### 12.3 What's Intentionally NOT Included

The following are deliberately excluded from MVP (can be added in future iterations):

- ❌ Generic `createChatCompletion()` wrapper - only `generateInsights()` exists
- ❌ `testConnection()` method - unnecessary for MVP
- ❌ Multiple AI features - only insights for now
- ❌ Streaming responses - adds complexity, not required for MVP
- ❌ Multi-turn conversations - insights are stateless
- ❌ Function calling - not needed for observations
- ❌ A/B testing infrastructure - premature optimization
- ❌ Cost tracking dashboard - can monitor via OpenRouter dashboard
- ❌ Custom model parameters API - hardcoded in service is sufficient

---

## 13. Implementation Checklist

**Infrastructure:**
- [ ] Create `src/lib/ai/prompts/subscription-insights.prompt.ts`
- [ ] Create `src/lib/ai/schemas/subscription-insights.schema.ts`
- [ ] Create `src/lib/services/ai-insights.service.ts`
- [ ] Update `src/env.d.ts` with OpenRouter types
- [ ] Add environment variables to `.env`

**API Endpoint:**
- [ ] Create `src/pages/api/ai/insights.ts`
- [ ] Implement POST handler with `subscription_ids` support
- [ ] Add `export const prerender = false`

**Testing:**
- [ ] Test with various subscription counts
- [ ] Test error scenarios (missing key, timeouts)
- [ ] Verify response format matches `AIInsightsResponseDTO`
- [ ] Check Polish language quality in insights
- [ ] Monitor token usage and costs

**Documentation:**
- [ ] Update project README with AI feature
- [ ] Document environment variables
- [ ] Add code comments for complex logic

**Quality:**
- [ ] Run `npm run lint` - no TypeScript errors
- [ ] No API keys committed to git
- [ ] All console.logs have meaningful context
- [ ] Error handling covers all scenarios

---

**Estimated Implementation Time:** 2 hours for experienced developer

**Dependencies:** None (uses native Fetch API)

**Breaking Changes:** None (new feature)
