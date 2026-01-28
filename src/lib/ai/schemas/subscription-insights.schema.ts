import { z } from "zod";

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
