import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Magic link redirect target: exchanges the auth code for a session and sets cookies.
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const rawNext = searchParams.get("next") ?? "/boards";

  // Only allow same-origin relative paths to prevent open redirect.
  const next =
    rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/boards";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/?error=auth`);
    }
  }

  return NextResponse.redirect(`${origin}${next}`);
}
