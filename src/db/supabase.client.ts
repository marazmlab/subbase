import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_KEY } from "astro:env/server";

import type { Database } from "@/db/database.types";

export type TypedSupabaseClient = SupabaseClient<Database>;

export const supabaseClient: TypedSupabaseClient = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_KEY
);
