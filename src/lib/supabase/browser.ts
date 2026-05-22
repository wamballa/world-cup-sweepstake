"use client";

import { createBrowserClient } from "@supabase/ssr";

import type { Database } from "@/server/supabase/database.types";

export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    requireBrowserEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireBrowserEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

function requireBrowserEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
