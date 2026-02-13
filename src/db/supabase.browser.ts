import { createBrowserClient } from "@supabase/ssr";
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from "astro:env/client";

import type { Database } from "@/db/database.types";

/**
 * Creates a Supabase client for browser/React components.
 * Uses @supabase/ssr for proper cookie handling in the browser.
 *
 * Configuration:
 * - autoRefreshToken: true - automatically refreshes tokens before expiration
 * - persistSession: true - persists session in localStorage for persistence across tabs
 * - detectSessionInUrl: true - handles OAuth callbacks and magic links (future use)
 *
 * Note: Requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY
 * environment variables for client-side access.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
}
