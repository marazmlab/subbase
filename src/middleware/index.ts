import { createClient } from "@supabase/supabase-js";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "@/db/database.types";
import type { TypedSupabaseClient } from "@/db/supabase.client";

/**
 * Middleware for handling Supabase client and authentication
 *
 * For API routes (/api/*):
 * - Creates a Supabase client with the user's JWT token from Authorization header
 * - Extracts and validates user session
 * - Sets context.locals.user with authenticated user or null
 *
 * For other routes:
 * - Creates a Supabase client with cookies for SSR session handling
 */
export const onRequest = defineMiddleware(async (context, next) => {
  const supabaseUrl = import.meta.env.SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

  // Check if this is an API route
  const isApiRoute = context.url.pathname.startsWith("/api/");

  if (isApiRoute) {
    // For API routes, use Authorization header
    const authHeader = context.request.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");

    // Create Supabase client with custom auth header
    const supabase: TypedSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    context.locals.supabase = supabase;

    // Try to get user from token
    if (token) {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser(token);

      if (error) {
        console.error("Auth error:", error.message);
        context.locals.user = null;
      } else {
        context.locals.user = user;
      }
    } else {
      context.locals.user = null;
    }
  } else {
    // For non-API routes, use cookie-based session
    const supabase: TypedSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });

    context.locals.supabase = supabase;

    // Try to get user from session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    context.locals.user = user;
  }

  return next();
});
