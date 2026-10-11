import { NextResponse } from "next/server";
import { decide, decisionStream } from "@reflexui-jev/core";
import { typesafeDecider } from "@reflexui-jev/providers";
import { dashboard } from "@/lib/surface";
import { profileById } from "@/lib/profiles";
import { decisionStore, feedbackStore } from "@/lib/state";

export const dynamic = "force-dynamic";

// Called by useAdaptiveSurface: POST { surfaceId, subjectId, ...body } -> NDJSON stream.
export async function POST(req: Request) {
  const { subjectId } = (await req.json()) as { subjectId: string };
  const profile = profileById[subjectId];
  if (!profile) return NextResponse.json({ error: "unknown profile" }, { status: 404 });
  if (!process.env.TYPESAFE_API_KEY) {
    return NextResponse.json({ error: "TYPESAFE_API_KEY is not set in .env.local (restart pnpm dev after editing)" }, { status: 400 });
  }
  const ctx = { ...profile.ctx, areas: profile.areas, topics: profile.topics, events: profile.events };
  const result = await decide({
    surface: dashboard, ctx, subjectId: profile.id, decider: typesafeDecider(), // reads TYPESAFE_API_KEY from .env.local
    store: decisionStore(), feedback: feedbackStore(),
  });
  // trace: true streams the model I/O for <DebugPanel>. It contains the signals sent to the model:
  // fine in this playground, but keep it off (or behind an admin check) for real users.
  return new Response(decisionStream(result, { trace: true }), {
    headers: { "content-type": "application/x-ndjson", "cache-control": "no-store" },
  });
}
