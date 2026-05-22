"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function signup(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = getSafeRedirectPath(formData.get("next"));
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    const params = new URLSearchParams({
      error: "signup",
      next,
    });

    redirect(`/signup?${params.toString()}`);
  }

  if (data.session) {
    redirect(next);
  }

  const params = new URLSearchParams({
    message: "check-email",
    next,
  });

  redirect(`/login?${params.toString()}`);
}
