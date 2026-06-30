import { NextResponse } from "next/server";

// Hit weekly by a Vercel Cron Job to keep the Supabase free-tier project from
// auto-pausing after 7 days of inactivity (PRD §10.2, §14 step 6).
export async function GET() {
  return NextResponse.json({ status: "ok", timestamp: new Date().toISOString() });
}
