/**
 * Replay the 5 mocked people against Jev and compare with the default order.
 *   pnpm replay                 # needs TYPESAFE_API_KEY in .env.local
 *   SWEEP=1 pnpm replay         # also sweeps minConfidence, calling the model once per case
 */
import { cachingDecider, formatReport, runReplay, type ReplayCase } from "@reflexui-jev/replay";
import { typesafeDecider } from "@reflexui-jev/providers";
import { dashboard, type DashCtx } from "../src/lib/surface";
import { profiles } from "../src/lib/profiles";
import labels from "../data/labels.json";

if (!process.env.TYPESAFE_API_KEY) {
  console.error("TYPESAFE_API_KEY is not set. Copy .env.example to .env.local and add your key.");
  process.exit(1);
}
const decider = cachingDecider(typesafeDecider());

const cases: ReplayCase<DashCtx>[] = profiles.map((p) => ({
  id: p.id,
  subjectId: p.id,
  ctx: { ...p.ctx, areas: p.areas, topics: p.topics, events: p.events },
  expectedTop: (labels as unknown as Record<string, string[]>)[p.id] ?? [],
}));

async function main() {
  console.log(`decider: ${decider.name}\n`);
  console.log(formatReport(await runReplay({ surface: dashboard, decider, cases })));

  if (process.env.SWEEP) {
    console.log("\nminConfidence sweep (model answers are cached):");
    for (const minConfidence of [0.3, 0.45, 0.6, 0.75, 0.9]) {
      const r = await runReplay({ surface: dashboard, decider, cases, policy: { minConfidence } });
      console.log(`  minConfidence ${minConfidence}: hit rate ${Math.round(r.hitRate * 100)}% (default order ${Math.round(r.baselineHitRate * 100)}%)`);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
