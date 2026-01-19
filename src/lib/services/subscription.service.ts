import type { TypedSupabaseClient } from "@/db/supabase.client";
import type {
  SubscriptionDTO,
  SubscriptionEntity,
  SubscriptionListResponseDTO,
  SubscriptionResponseDTO,
  PaginationDTO,
  CreateSubscriptionCommand,
  UpdateSubscriptionCommand,
  PatchSubscriptionCommand,
  SubscriptionQueryParams,
} from "@/types";

import { notFoundError, internalError, validationError } from "@/lib/errors";

// ============================================================================
// DTO Mapping
// ============================================================================

/**
 * Maps SubscriptionEntity to SubscriptionDTO
 * Removes user_id from the response for security
 *
 * @param entity - Database subscription entity
 * @returns Subscription DTO without user_id
 */
function toDTO(entity: SubscriptionEntity): SubscriptionDTO {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { user_id, ...dto } = entity;
  return dto;
}

// ============================================================================
// Subscription Service
// ============================================================================

/**
 * Service for managing subscription CRUD operations
 *
 * All methods require a Supabase client and userId for authorization.
 * RLS policies in Supabase provide additional security layer.
 */
export const SubscriptionService = {
  /**
   * List subscriptions with pagination and optional filtering
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param params - Query parameters (page, limit, status)
   * @returns Paginated list of subscriptions
   * @throws ApiError on database errors
   */
  async list(
    supabase: TypedSupabaseClient,
    userId: string,
    params: SubscriptionQueryParams
  ): Promise<SubscriptionListResponseDTO> {
    const { page = 1, limit = 10, status } = params;
    const offset = (page - 1) * limit;

    // Build query with user filter
    let query = supabase.from("subscriptions").select("*", { count: "exact" }).eq("user_id", userId);

    // Apply status filter if provided
    if (status) {
      query = query.eq("status", status);
    }

    // Apply pagination and ordering
    const { data, error, count } = await query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching subscriptions:", error);
      throw internalError("Failed to fetch subscriptions");
    }

    const total = count ?? 0;
    const totalPages = Math.ceil(total / limit);

    const pagination: PaginationDTO = {
      page,
      limit,
      total,
      total_pages: totalPages,
    };

    return {
      data: (data ?? []).map(toDTO),
      pagination,
    };
  },

  /**
   * Get a single subscription by ID
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param id - Subscription UUID
   * @returns Single subscription wrapped in response DTO
   * @throws ApiError if not found or on database errors
   */
  async getById(supabase: TypedSupabaseClient, userId: string, id: string): Promise<SubscriptionResponseDTO> {
    const { data, error } = await supabase.from("subscriptions").select("*").eq("id", id).eq("user_id", userId).single();

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned
        throw notFoundError("Subscription");
      }
      console.error("Error fetching subscription:", error);
      throw internalError("Failed to fetch subscription");
    }

    return { data: toDTO(data) };
  },

  /**
   * Create a new subscription
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param command - Subscription creation data
   * @returns Created subscription wrapped in response DTO
   * @throws ApiError on database errors
   */
  async create(
    supabase: TypedSupabaseClient,
    userId: string,
    command: CreateSubscriptionCommand
  ): Promise<SubscriptionResponseDTO> {
    const insertData = {
      user_id: userId,
      name: command.name,
      cost: command.cost,
      currency: command.currency ?? "PLN",
      billing_cycle: command.billing_cycle,
      status: command.status ?? "active",
      start_date: command.start_date,
      next_billing_date: command.next_billing_date ?? null,
      description: command.description ?? null,
    };

    const { data, error } = await supabase.from("subscriptions").insert(insertData).select().single();

    if (error) {
      console.error("Error creating subscription:", error);
      throw internalError("Failed to create subscription");
    }

    return { data: toDTO(data) };
  },

  /**
   * Full update of a subscription (PUT)
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param id - Subscription UUID
   * @param command - Complete subscription update data
   * @returns Updated subscription wrapped in response DTO
   * @throws ApiError if not found or on database errors
   */
  async update(
    supabase: TypedSupabaseClient,
    userId: string,
    id: string,
    command: UpdateSubscriptionCommand
  ): Promise<SubscriptionResponseDTO> {
    // First verify the subscription exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw notFoundError("Subscription");
    }

    const updateData = {
      name: command.name,
      cost: command.cost,
      currency: command.currency,
      billing_cycle: command.billing_cycle,
      status: command.status,
      start_date: command.start_date,
      next_billing_date: command.next_billing_date,
      description: command.description,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating subscription:", error);
      throw internalError("Failed to update subscription");
    }

    return { data: toDTO(data) };
  },

  /**
   * Partial update of a subscription (PATCH)
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param id - Subscription UUID
   * @param command - Partial subscription update data
   * @returns Updated subscription wrapped in response DTO
   * @throws ApiError if not found or on database errors
   */
  async patch(
    supabase: TypedSupabaseClient,
    userId: string,
    id: string,
    command: PatchSubscriptionCommand
  ): Promise<SubscriptionResponseDTO> {
    // First fetch existing subscription to validate and merge data
    const { data: existing, error: fetchError } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw notFoundError("Subscription");
    }

    // Validate date relationship when either date field is being updated
    if (command.start_date !== undefined || command.next_billing_date !== undefined) {
      const effectiveStartDate = command.start_date ?? existing.start_date;
      const effectiveNextBilling =
        command.next_billing_date !== undefined ? command.next_billing_date : existing.next_billing_date;

      if (effectiveNextBilling && effectiveNextBilling < effectiveStartDate) {
        throw validationError("Invalid date relationship", [
          { field: "next_billing_date", message: "Next billing date must be on or after start date" },
        ]);
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (command.name !== undefined) updateData.name = command.name;
    if (command.cost !== undefined) updateData.cost = command.cost;
    if (command.currency !== undefined) updateData.currency = command.currency;
    if (command.billing_cycle !== undefined) updateData.billing_cycle = command.billing_cycle;
    if (command.status !== undefined) updateData.status = command.status;
    if (command.start_date !== undefined) updateData.start_date = command.start_date;
    if (command.next_billing_date !== undefined) updateData.next_billing_date = command.next_billing_date;
    if (command.description !== undefined) updateData.description = command.description;

    const { data, error } = await supabase
      .from("subscriptions")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error patching subscription:", error);
      throw internalError("Failed to update subscription");
    }

    return { data: toDTO(data) };
  },

  /**
   * Delete a subscription
   *
   * @param supabase - Typed Supabase client from context.locals
   * @param userId - Authenticated user ID
   * @param id - Subscription UUID
   * @throws ApiError if not found or on database errors
   */
  async delete(supabase: TypedSupabaseClient, userId: string, id: string): Promise<void> {
    // First verify the subscription exists and belongs to user
    const { data: existing, error: fetchError } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !existing) {
      throw notFoundError("Subscription");
    }

    const { error } = await supabase.from("subscriptions").delete().eq("id", id).eq("user_id", userId);

    if (error) {
      console.error("Error deleting subscription:", error);
      throw internalError("Failed to delete subscription");
    }
  },
};
