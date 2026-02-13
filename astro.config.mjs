// @ts-check
import { defineConfig, envField } from "astro/config";

import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import cloudflare from "@astrojs/cloudflare";

// https://astro.build/config
export default defineConfig({
  output: "server",
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
  adapter: cloudflare({
    platformProxy: {
      enabled: true,
    },
  }),
  env: {
    schema: {
      // Server-side Supabase credentials
      SUPABASE_URL: envField.string({
        context: "server",
        access: "public",
      }),
      SUPABASE_KEY: envField.string({
        context: "server",
        access: "public", // ANON key is safe to expose
      }),
      // Client-side Supabase credentials (same values, PUBLIC_ prefix for browser)
      PUBLIC_SUPABASE_URL: envField.string({
        context: "client",
        access: "public",
      }),
      PUBLIC_SUPABASE_KEY: envField.string({
        context: "client",
        access: "public",
      }),
      // OpenRouter API (server-only, secret)
      OPENROUTER_API_KEY: envField.string({
        context: "server",
        access: "secret",
      }),
      OPENROUTER_MODEL: envField.string({
        context: "server",
        access: "public",
        default: "gpt-4o-mini",
      }),
    },
  },
});
