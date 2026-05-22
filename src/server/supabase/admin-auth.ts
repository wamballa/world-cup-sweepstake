import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

export class AuthorizationError extends Error {
  constructor(message = "Admin authorization is required.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

export async function requireSweepstakeAdmin(
  supabase: SupabaseClient,
  userId: string,
  sweepstakeId: string,
) {
  const { data, error } = await supabase
    .from("sweepstake_admins")
    .select("user_id")
    .eq("sweepstake_id", sweepstakeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw new AuthorizationError();
  }

  return data;
}
