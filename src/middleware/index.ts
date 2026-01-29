import { createServerClient } from "@supabase/ssr";
import { defineMiddleware } from "astro:middleware";

import type { Database } from "@/db/database.types";
import type { TypedSupabaseClient } from "@/db/supabase.client";

/**
 * Public paths that don't require authentication.
 * Includes auth pages and static assets.
 */
const PUBLIC_PATHS = ["/login", "/signup"];

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
 * - Enforces authentication redirects:
 *   - Unauthenticated users accessing protected pages → redirect to /login
 *   - Authenticated users accessing /login → redirect to / (dashboard)
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
    const supabase: TypedSupabaseClient = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        cookies: {
          getAll: () => [],
          setAll: () => {
            // No-op for API routes - we don't manage cookies here
          },
        },
      }
    );

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
    const supabase: TypedSupabaseClient = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            // Astro cookies API doesn't have getAll(), iterate through headers
            const cookieHeader = context.request.headers.get("cookie");
            if (!cookieHeader) return [];

            // Parse cookie header manually
            return cookieHeader.split(";").map((cookie) => {
              const [name, ...rest] = cookie.trim().split("=");
              return {
                name: name.trim(),
                value: rest.join("=").trim(),
              };
            });
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              context.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    context.locals.supabase = supabase;

    // Try to get user from session (now correctly reads from cookies)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    context.locals.user = user;

    // Authentication redirects
    const isPublicPath = PUBLIC_PATHS.includes(context.url.pathname);

    if (!user && !isPublicPath) {
      // Unauthenticated user trying to access protected page → redirect to login
      return context.redirect("/login");
    }

    if (user && (context.url.pathname === "/login" || context.url.pathname === "/signup")) {
      // Authenticated user trying to access auth pages → redirect to dashboard
      return context.redirect("/");
    }
  }

  return next();
});
