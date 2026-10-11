import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Tells the page whether a Jev key is configured, so it can pick a sensible default decider.
export function GET() {
  return NextResponse.json({ jev: Boolean(process.env.TYPESAFE_API_KEY) });
}
