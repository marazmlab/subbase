import { createClient, SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/db/database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export type TypedSupabaseClient = SupabaseClient<Database>;

export const supabaseClient: TypedSupabaseClient = createClient<Database>(supabaseUrl, supabaseAnonKey);
