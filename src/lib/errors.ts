import type { ZodError } from "zod";

import type { ErrorCode, ErrorResponseDTO, FieldErrorDTO } from "@/types";

// ============================================================================
// Custom API Error Class
// ============================================================================

/**
 * Custom error class for API errors with structured response data
 *
 * Usage:
 * ```typescript
 * throw new ApiError(400, "VALIDATION_ERROR", "Invalid input data", fieldErrors);
 * throw new ApiError(404, "NOT_FOUND", "Subscription not found");
 * throw new ApiError(401, "UNAUTHORIZED", "Authentication required");
 * ```
 */
export class ApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: FieldErrorDTO[]
  ) {
    super(message);
    this.name = "ApiError";
    // Maintains proper stack trace for where error was thrown (only in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }

  /**
   * Converts error to JSON response format
   */
  toResponse(): ErrorResponseDTO {
    const response: ErrorResponseDTO = {
      error: {
        code: this.code,
        message: this.message,
      },
    };

    if (this.details && this.details.length > 0) {
      response.error.details = this.details;
    }

    return response;
  }
}

// ============================================================================
// Error Factory Functions
// ============================================================================

/**
 * Creates a validation error (HTTP 400)
 */
export function validationError(message: string, details?: FieldErrorDTO[]): ApiError {
  return new ApiError(400, "VALIDATION_ERROR", message, details);
}

/**
 * Creates an invalid UUID error (HTTP 400)
 */
export function invalidUuidError(paramName = "id"): ApiError {
  return new ApiError(400, "INVALID_UUID", `Invalid UUID format for parameter: ${paramName}`);
}

/**
 * Creates an unauthorized error (HTTP 401)
 */
export function unauthorizedError(message = "Authentication required"): ApiError {
  return new ApiError(401, "UNAUTHORIZED", message);
}

/**
 * Creates a not found error (HTTP 404)
 */
export function notFoundError(resource = "Resource"): ApiError {
  return new ApiError(404, "NOT_FOUND", `${resource} not found`);
}

/**
 * Creates an AI service unavailable error (HTTP 503)
 */
export function aiServiceUnavailableError(): ApiError {
  return new ApiError(503, "AI_SERVICE_UNAVAILABLE", "AI service is temporarily unavailable");
}

/**
 * Creates an internal server error (HTTP 500)
 */
export function internalError(message = "An unexpected error occurred"): ApiError {
  return new ApiError(500, "INTERNAL_ERROR", message);
}

// ============================================================================
// Zod Error Mapping
// ============================================================================

/**
 * Maps Zod validation errors to FieldErrorDTO array
 *
 * @param error - Zod error object
 * @returns Array of field-level validation errors
 */
export function mapZodErrors(error: ZodError): FieldErrorDTO[] {
  return error.errors.map((err) => ({
    field: err.path.join("."),
    message: err.message,
  }));
}

// ============================================================================
// Error Response Handler
// ============================================================================

/**
 * Handles errors and returns appropriate HTTP Response
 *
 * This function provides centralized error handling for all API endpoints.
 * It converts ApiError instances to proper JSON responses and logs unexpected errors.
 *
 * @param error - The error to handle (ApiError or unknown)
 * @returns HTTP Response with appropriate status code and error body
 */
export function handleApiError(error: unknown): Response {
  // Handle known API errors
  if (error instanceof ApiError) {
    return new Response(JSON.stringify(error.toResponse()), {
      status: error.statusCode,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Log unexpected errors for debugging
  console.error("Unexpected error:", error);

  // Return generic internal error for unknown errors
  const internalErr = internalError();
  return new Response(JSON.stringify(internalErr.toResponse()), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

// ============================================================================
// Response Helpers
// ============================================================================

/**
 * Creates a successful JSON response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @returns HTTP Response with JSON body
 */
export function jsonResponse<T>(data: T, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Creates an empty response (for DELETE operations)
 *
 * @returns HTTP Response with 204 No Content status
 */
export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}
