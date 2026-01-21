/// <reference types="astro/client" />

import type { User } from "@supabase/supabase-js";

import type { TypedSupabaseClient } from "@/db/supabase.client";

declare global {
  namespace App {
    interface Locals {
      supabase: TypedSupabaseClient;
      user: User | null;
    }
  }
}

interface ImportMetaEnv {
  // Server-side only
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // Client-side (exposed to browser)
  readonly PUBLIC_SUPABASE_URL: string;
  readonly PUBLIC_SUPABASE_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
