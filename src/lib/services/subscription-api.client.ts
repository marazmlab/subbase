import type {
  SubscriptionListResponseDTO,
  SubscriptionResponseDTO,
  SubscriptionSummaryResponseDTO,
  AIInsightsResponseDTO,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  SubscriptionQueryParams,
  AIInsightsCommand,
  ErrorResponseDTO,
  ErrorCode,
} from "@/types";

const API_BASE = "/api";

// ============================================================================
// Custom Error Class
// ============================================================================

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly status: number,
    public readonly details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ============================================================================
// Auth Headers Helper
// ============================================================================

async function getAuthHeaders(): Promise<HeadersInit> {
  const { createSupabaseBrowserClient } = await import("@/db/supabase.browser");
  const supabase = createSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return {
    "Content-Type": "application/json",
    ...(session?.access_token && { Authorization: `Bearer ${session.access_token}` }),
  };
}

// ============================================================================
// Error Handler
// ============================================================================

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    let errorData: ErrorResponseDTO;

    try {
      errorData = await response.json();
    } catch {
      throw new ApiError("Wystąpił nieoczekiwany błąd", "INTERNAL_ERROR", response.status);
    }

    throw new ApiError(
      errorData.error.message,
      errorData.error.code,
      response.status,
      errorData.error.details
    );
  }

  return response.json();
}

// ============================================================================
// Subscriptions API
// ============================================================================

/**
 * Pobiera listę subskrypcji z paginacją
 */
export async function fetchSubscriptions(
  params?: SubscriptionQueryParams
): Promise<SubscriptionListResponseDTO> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", params.page.toString());
  if (params?.limit) query.set("limit", params.limit.toString());
  if (params?.status) query.set("status", params.status);

  const url = `${API_BASE}/subscriptions${query.toString() ? `?${query}` : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  return handleResponse<SubscriptionListResponseDTO>(response);
}

/**
 * Pobiera podsumowanie subskrypcji
 */
export async function fetchSummary(): Promise<SubscriptionSummaryResponseDTO> {
  const response = await fetch(`${API_BASE}/subscriptions/summary`, {
    method: "GET",
    headers: await getAuthHeaders(),
  });

  return handleResponse<SubscriptionSummaryResponseDTO>(response);
}

/**
 * Tworzy nową subskrypcję
 */
export async function createSubscription(
  data: CreateSubscriptionCommand
): Promise<SubscriptionResponseDTO> {
  const response = await fetch(`${API_BASE}/subscriptions`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<SubscriptionResponseDTO>(response);
}

/**
 * Aktualizuje subskrypcję (pełna aktualizacja)
 */
export async function updateSubscription(
  id: string,
  data: UpdateSubscriptionCommand
): Promise<SubscriptionResponseDTO> {
  const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
    method: "PUT",
    headers: await getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse<SubscriptionResponseDTO>(response);
}

/**
 * Usuwa subskrypcję
 */
export async function deleteSubscription(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/subscriptions/${id}`, {
    method: "DELETE",
    headers: await getAuthHeaders(),
  });

  return handleResponse<void>(response);
}

// ============================================================================
// AI Insights API
// ============================================================================

/**
 * Generuje wglądy AI dla subskrypcji
 */
export async function generateInsights(
  command?: AIInsightsCommand
): Promise<AIInsightsResponseDTO> {
  const response = await fetch(`${API_BASE}/ai/insights`, {
    method: "POST",
    headers: await getAuthHeaders(),
    body: JSON.stringify(command ?? {}),
  });

  return handleResponse<AIInsightsResponseDTO>(response);
}
