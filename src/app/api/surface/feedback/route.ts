import { NextResponse } from "next/server";
import { feedbackStore, resetState } from "@/lib/state";

export const dynamic = "force-dynamic";

// POST { surfaceId, subjectId, itemId, useful } (what useAdaptiveSurface().feedback sends),
// or POST { reset: true } to clear the decision cache and the feedback.
export async function POST(req: Request) {
  const { surfaceId, subjectId, itemId, useful, reset } = (await req.json()) as {
    surfaceId?: string; subjectId?: string; itemId?: string; useful?: boolean; reset?: boolean;
  };
  if (reset) resetState();
  else if (surfaceId && subjectId && itemId && typeof useful === "boolean") {
    await feedbackStore().record({ surfaceId, subjectId, itemId, useful, at: Date.now() });
  }
  return NextResponse.json({ ok: true });
}
