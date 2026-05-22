import Link from "next/link";
import { Trophy } from "lucide-react";
import { redirect } from "next/navigation";

import { signup } from "@/app/signup/actions";
import { PasswordInput } from "@/components/password-input";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getSafeRedirectPath } from "@/lib/auth/redirects";
import { createSupabaseServerClient } from "@/lib/supabase/server";

type SignupPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SignupPage({ searchParams }: SignupPageProps) {
  const params = (await searchParams) ?? {};
  const next = getSafeRedirectPath(getSearchParam(params.next));
  const hasSignupError = getSearchParam(params.error) === "signup";

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(next);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Trophy className="size-5" aria-hidden="true" />
          </div>
          <div>
            <p className="font-semibold">Drawdeck</p>
            <p className="text-sm text-muted-foreground">
              World Cup sweepstakes
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create admin account</CardTitle>
            <CardDescription>
              Create an account to manage World Cup sweepstakes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action={signup} className="space-y-4">
              <input name="next" type="hidden" value={next} />
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <PasswordInput
                  id="password"
                  name="password"
                  autoComplete="new-password"
                  minLength={6}
                  required
                />
              </div>
              {hasSignupError ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  Could not create that account. Check the email and password,
                  then try again.
                </p>
              ) : null}
              <Button className="w-full" type="submit">
                Create account
              </Button>
            </form>
            <div className="flex items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
              <span>Already have an account?</span>
              <Button asChild variant="link">
                <Link href={`/login?next=${encodeURIComponent(next)}`}>
                  Log in
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function getSearchParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
