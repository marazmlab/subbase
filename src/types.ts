import type { Tables } from "./db/database.types";

// ============================================================================
// Literal Types / Enums
// ============================================================================

/** Subscription status - controls whether subscription is active in calculations */
export type SubscriptionStatus = "active" | "paused" | "cancelled";

/** Billing cycle - determines cost calculation frequency */
export type BillingCycle = "monthly" | "yearly";

/** Error codes returned by API */
export type ErrorCode =
  | "VALIDATION_ERROR"
  | "INVALID_UUID"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "AI_SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

/** AI insight type - currently only observations are supported */
export type AIInsightType = "observation";

// ============================================================================
// Entity Types (Database Row Types)
// ============================================================================

/**
 * Subscription entity - full database row type
 * Used internally for database operations
 */
export type SubscriptionEntity = Tables<"subscriptions">;

/**
 * Profile entity - full database row type
 * Note: Profiles are auto-created via database trigger, not exposed via API
 */
export type ProfileEntity = Tables<"profiles">;

// ============================================================================
// Subscription DTOs (API Response Types)
// ============================================================================

/**
 * Subscription DTO - data exposed via API
 * Derived from SubscriptionEntity but excludes user_id for security
 * user_id is never exposed to clients
 */
export type SubscriptionDTO = Omit<SubscriptionEntity, "user_id">;

/**
 * Wrapper for single subscription response
 * Used by: GET /api/subscriptions/:id, POST, PUT, PATCH
 */
export interface SubscriptionResponseDTO {
  data: SubscriptionDTO;
}

/**
 * Paginated list of subscriptions
 * Used by: GET /api/subscriptions
 */
export interface SubscriptionListResponseDTO {
  data: SubscriptionDTO[];
  pagination: PaginationDTO;
}

// ============================================================================
// Subscription Commands (API Request Types)
// ============================================================================

/**
 * Command for creating a new subscription (POST /api/subscriptions)
 *
 * Required fields: name, cost, billing_cycle, start_date
 * Optional fields: currency (default: PLN), status (default: active),
 *                  next_billing_date, description
 *
 * Note: user_id is never accepted from client - always set server-side
 */
export interface CreateSubscriptionCommand {
  /** Subscription name (required, non-empty, max 255 chars) */
  name: string;
  /** Cost amount (required, > 0 and ≤ 100000, max 2 decimal places) */
  cost: number;
  /** ISO currency code, 3 characters (optional, default: PLN) */
  currency?: string;
  /** Billing frequency (required) */
  billing_cycle: BillingCycle;
  /** Subscription status (optional, default: active) */
  status?: SubscriptionStatus;
  /** Start date in ISO 8601 format YYYY-MM-DD (required) */
  start_date: string;
  /** Next billing date in ISO 8601 format, must be ≥ start_date (optional) */
  next_billing_date?: string | null;
  /** Additional notes (optional, max 1000 chars) */
  description?: string | null;
}

/**
 * Command for full subscription update (PUT /api/subscriptions/:id)
 * All fields are required for full replacement
 */
export interface UpdateSubscriptionCommand {
  /** Subscription name (required, non-empty, max 255 chars) */
  name: string;
  /** Cost amount (required, > 0 and ≤ 100000, max 2 decimal places) */
  cost: number;
  /** ISO currency code, 3 characters (required) */
  currency: string;
  /** Billing frequency (required) */
  billing_cycle: BillingCycle;
  /** Subscription status (required) */
  status: SubscriptionStatus;
  /** Start date in ISO 8601 format YYYY-MM-DD (required) */
  start_date: string;
  /** Next billing date in ISO 8601 format, must be ≥ start_date */
  next_billing_date: string | null;
  /** Additional notes */
  description: string | null;
}

/**
 * Command for partial subscription update (PATCH /api/subscriptions/:id)
 * All fields are optional - only provided fields will be updated
 */
export type PatchSubscriptionCommand = Partial<UpdateSubscriptionCommand>;

/**
 * Query parameters for listing subscriptions (GET /api/subscriptions)
 */
export interface SubscriptionQueryParams {
  /** Page number, 1-indexed (default: 1) */
  page?: number;
  /** Items per page, 1-100 (default: 10) */
  limit?: number;
  /** Filter by subscription status */
  status?: SubscriptionStatus;
}

// ============================================================================
// Subscription Summary DTOs
// ============================================================================

/**
 * Subscription summary data with cost calculations
 *
 * Calculation logic:
 * - monthly_total: sum of active monthly costs + (yearly costs ÷ 12)
 * - yearly_total: (active monthly costs × 12) + yearly costs
 * - Only 'active' subscriptions are included in cost calculations
 * - Counts include all subscriptions regardless of status
 */
export interface SubscriptionSummaryDTO {
  /** Total monthly cost (active subscriptions only) */
  monthly_total: number;
  /** Total yearly cost (active subscriptions only) */
  yearly_total: number;
  /** Currency used for calculations */
  currency: string;
  /** Number of active subscriptions */
  active_count: number;
  /** Number of paused subscriptions */
  paused_count: number;
  /** Number of cancelled subscriptions */
  cancelled_count: number;
}

/**
 * Wrapper for subscription summary response
 * Used by: GET /api/subscriptions/summary
 */
export interface SubscriptionSummaryResponseDTO {
  data: SubscriptionSummaryDTO;
}

// ============================================================================
// AI Insights Types
// ============================================================================

/**
 * Command for requesting AI insights (POST /api/ai/insights)
 */
export interface AIInsightsCommand {
  /**
   * Specific subscription IDs to analyze
   * If omitted, all active subscriptions are analyzed
   */
  subscription_ids?: string[];
}

/**
 * Single AI-generated insight
 */
export interface AIInsightDTO {
  /** Insight category - currently only 'observation' */
  type: AIInsightType;
  /** Human-readable insight message */
  message: string;
}

/**
 * AI insights response data
 */
export interface AIInsightsDataDTO {
  /** Array of generated insights */
  insights: AIInsightDTO[];
  /** ISO 8601 timestamp when insights were generated */
  generated_at: string;
  /** Number of subscriptions analyzed */
  subscription_count: number;
}

/**
 * Wrapper for AI insights response
 * Used by: POST /api/ai/insights
 */
export interface AIInsightsResponseDTO {
  data: AIInsightsDataDTO;
}

// ============================================================================
// Pagination Types
// ============================================================================

/**
 * Pagination metadata included in list responses
 */
export interface PaginationDTO {
  /** Current page number (1-indexed) */
  page: number;
  /** Items per page */
  limit: number;
  /** Total number of items */
  total: number;
  /** Total number of pages */
  total_pages: number;
}

// ============================================================================
// Error Handling Types
// ============================================================================

/**
 * Field-level validation error detail
 */
export interface FieldErrorDTO {
  /** Name of the field that failed validation */
  field: string;
  /** Human-readable error message */
  message: string;
}

/**
 * Error detail containing code, message, and optional field errors
 */
export interface ErrorDetailDTO {
  /** Machine-readable error code */
  code: ErrorCode;
  /** Human-readable error message */
  message: string;
  /** Field-level validation errors (for VALIDATION_ERROR) */
  details?: FieldErrorDTO[];
}

/**
 * Standard error response wrapper
 * All API errors follow this format
 */
export interface ErrorResponseDTO {
  error: ErrorDetailDTO;
}
