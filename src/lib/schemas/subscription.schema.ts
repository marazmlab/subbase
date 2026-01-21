import { z } from "zod";

// ============================================================================
// Base Validation Schemas
// ============================================================================

/**
 * UUID validation schema
 * Used for validating subscription IDs in path parameters
 */
export const uuidSchema = z.string().uuid("Invalid UUID format");

/**
 * Date string validation schema (ISO 8601 format: YYYY-MM-DD)
 */
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// ============================================================================
// Query Parameters Schema
// ============================================================================

/**
 * Query params schema for GET /api/subscriptions
 * - page: Page number (1-indexed, default: 1)
 * - limit: Items per page (1-100, default: 10)
 * - status: Optional filter by subscription status
 */
export const subscriptionQuerySchema = z.object({
  page: z.coerce
    .number()
    .int("Page must be an integer")
    .min(1, "Page must be at least 1")
    .default(1),
  limit: z.coerce
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(10),
  status: z
    .enum(["active", "paused", "cancelled"], {
      message: "Status must be active, paused, or cancelled",
    })
    .optional(),
});

export type SubscriptionQuerySchema = z.infer<typeof subscriptionQuerySchema>;

// ============================================================================
// Create Subscription Schema
// ============================================================================

/**
 * Schema for creating a new subscription (POST /api/subscriptions)
 *
 * Required fields: name, cost, billing_cycle, start_date
 * Optional fields: currency (default: PLN), status (default: active),
 *                  next_billing_date, description
 */
export const createSubscriptionSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(255, "Name cannot exceed 255 characters"),
    cost: z
      .number({ required_error: "Cost is required" })
      .positive("Cost must be greater than 0")
      .max(100000, "Cost cannot exceed 100000")
      .multipleOf(0.01, "Cost can have at most 2 decimal places"),
    currency: z.string().length(3, "Currency must be a 3-character ISO code").default("PLN"),
    billing_cycle: z.enum(["monthly", "yearly"], {
      required_error: "Billing cycle is required",
      message: "Billing cycle must be monthly or yearly",
    }),
    status: z
      .enum(["active", "paused", "cancelled"], {
        message: "Status must be active, paused, or cancelled",
      })
      .default("active"),
    start_date: dateStringSchema,
    next_billing_date: dateStringSchema.nullable().optional(),
    description: z
      .string()
      .max(1000, "Description cannot exceed 1000 characters")
      .nullable()
      .optional(),
  })
  .refine((data) => !data.next_billing_date || data.next_billing_date >= data.start_date, {
    message: "Next billing date must be on or after start date",
    path: ["next_billing_date"],
  });

export type CreateSubscriptionSchema = z.infer<typeof createSubscriptionSchema>;

// ============================================================================
// Update Subscription Schema (PUT - Full Update)
// ============================================================================

/**
 * Schema for full subscription update (PUT /api/subscriptions/:id)
 * All fields are required for complete replacement
 */
export const updateSubscriptionSchema = z
  .object({
    name: z
      .string({ required_error: "Name is required" })
      .min(1, "Name cannot be empty")
      .max(255, "Name cannot exceed 255 characters"),
    cost: z
      .number({ required_error: "Cost is required" })
      .positive("Cost must be greater than 0")
      .max(100000, "Cost cannot exceed 100000")
      .multipleOf(0.01, "Cost can have at most 2 decimal places"),
    currency: z
      .string({ required_error: "Currency is required" })
      .length(3, "Currency must be a 3-character ISO code"),
    billing_cycle: z.enum(["monthly", "yearly"], {
      required_error: "Billing cycle is required",
      message: "Billing cycle must be monthly or yearly",
    }),
    status: z.enum(["active", "paused", "cancelled"], {
      required_error: "Status is required",
      message: "Status must be active, paused, or cancelled",
    }),
    start_date: dateStringSchema,
    next_billing_date: dateStringSchema.nullable(),
    description: z.string().max(1000, "Description cannot exceed 1000 characters").nullable(),
  })
  .refine((data) => !data.next_billing_date || data.next_billing_date >= data.start_date, {
    message: "Next billing date must be on or after start date",
    path: ["next_billing_date"],
  });

export type UpdateSubscriptionSchema = z.infer<typeof updateSubscriptionSchema>;

// ============================================================================
// Patch Subscription Schema (PATCH - Partial Update)
// ============================================================================

/**
 * Schema for partial subscription update (PATCH /api/subscriptions/:id)
 * All fields are optional - only provided fields will be updated
 *
 * Note: Refinement for date validation is applied separately in the service
 * layer when both start_date and next_billing_date are provided
 */
export const patchSubscriptionSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(255, "Name cannot exceed 255 characters")
    .optional(),
  cost: z
    .number()
    .positive("Cost must be greater than 0")
    .max(100000, "Cost cannot exceed 100000")
    .multipleOf(0.01, "Cost can have at most 2 decimal places")
    .optional(),
  currency: z.string().length(3, "Currency must be a 3-character ISO code").optional(),
  billing_cycle: z
    .enum(["monthly", "yearly"], { message: "Billing cycle must be monthly or yearly" })
    .optional(),
  status: z
    .enum(["active", "paused", "cancelled"], {
      message: "Status must be active, paused, or cancelled",
    })
    .optional(),
  start_date: dateStringSchema.optional(),
  next_billing_date: dateStringSchema.nullable().optional(),
  description: z
    .string()
    .max(1000, "Description cannot exceed 1000 characters")
    .nullable()
    .optional(),
});

export type PatchSubscriptionSchema = z.infer<typeof patchSubscriptionSchema>;

// ============================================================================
// AI Insights Schema
// ============================================================================

/**
 * Schema for AI insights request (POST /api/ai/insights)
 * subscription_ids is optional - if omitted, all active subscriptions are analyzed
 */
export const aiInsightsSchema = z.object({
  subscription_ids: z
    .array(z.string().uuid("Each subscription ID must be a valid UUID"))
    .optional(),
});

export type AIInsightsSchema = z.infer<typeof aiInsightsSchema>;
