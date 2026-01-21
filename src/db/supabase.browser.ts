import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/db/database.types";

/**
 * Creates a Supabase client for browser/React components.
 * Uses @supabase/ssr for proper cookie handling in the browser.
 *
 * Note: Requires PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_KEY
 * environment variables for client-side access.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_KEY
  );
}
