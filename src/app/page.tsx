"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { defaultDecision, type Decision, type PlacedItem } from "@reflexui-jev/core";
import { DebugPanel, useAdaptiveSurface } from "@reflexui-jev/react";
import { dashboard } from "@/lib/surface";
import { profiles, profileById } from "@/lib/profiles";
import { areaLabel, itemById } from "@/lib/catalog";
import { widgets } from "@/components/Widgets";

type View = "adaptive" | "immediate" | "static";
const VIEWS: { id: View; label: string; hint: string }[] = [
  { id: "adaptive", label: "Adaptive (reflexui)", hint: "Fresh decision after the model answered" },
  { id: "immediate", label: "Immediate", hint: "What renders before the model answers: cache, or default order on the first visit" },
  { id: "static", label: "Static default", hint: "The same screen for everyone" },
];

export default function Page() {
  const [profileId, setProfileId] = useState(profiles[0]!.id);
  // null until the server says whether TYPESAFE_API_KEY is set.
  const [jevAvailable, setJevAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    fetch("/api/config").then((r) => r.json()).then((c: { jev: boolean }) => setJevAvailable(c.jev)).catch(() => setJevAvailable(false));
  }, []);
  const [view, setView] = useState<View>("adaptive");
  const [strict, setStrict] = useState(false);
  const [debug, setDebug] = useState(false);

  // Deep link from the Users page: /?profile=<id>
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("profile");
    if (id && profileById[id]) setProfileId(id);
  }, []);

  const profile = profileById[profileId]!;
  const ctx = useMemo(
    () => ({ ...profile.ctx, areas: profile.areas, topics: profile.topics, events: profile.events }),
    [profile],
  );

  // The reflexui hook: renders the immediate decision at once, applies the fresh one if it lands in the window.
  const { decision: live, immediate, trace, deferred, freshAfterMs, status, error, feedback, refresh, applyDeferred } =
    useAdaptiveSurface({
      surfaceId: dashboard.id,
      subjectId: profileId,
      endpoint: "/api/surface",
      enabled: jevAvailable === true,
      // Jev takes ~300 ms, so the policy window (300 ms) often defers the fresh decision to the next visit.
      // Unchecked ("Strict window"), this playground applies it anyway so you can see the result.
      applyWithinMs: strict ? dashboard.policy.applyWithinMs : 15_000,
    });
  const staticDecision = useMemo(() => defaultDecision(dashboard, ctx, profileId, 0), [ctx, profileId]);
  const decision = view === "adaptive" ? live : view === "immediate" ? immediate : staticDecision;
  const notUseful = async (itemId: string) => {
    await feedback(itemId, false);
    refresh();
  };

  if (jevAvailable === false) return <SetupNotice />;

  return (
    <>
      <header className="top">
        <div className="brand"><b>reflexui</b> <span className="muted">full example</span></div>
        <Link href="/components" className="ghost">Components</Link>
        <Link href="/users" className="ghost">Users</Link>
        <nav className="people" aria-label="Choose a person">
          {profiles.map((p) => (
            <button key={p.id} className={p.id === profileId ? "person active" : "person"} onClick={() => setProfileId(p.id)}>
              <span className="avatar">{p.avatar}</span>
              <span><b>{p.name}</b><small>{p.role}</small></span>
            </button>
          ))}
        </nav>
      </header>

      <main>
        <section className="story">
          <div>
            <h1>{profile.name}</h1>
            <p>{profile.story}</p>
            <p className="muted">
              {profile.ctx.plan} plan · {profile.ctx.seats} seats · SSO {profile.ctx.hasSso ? "on" : "off"}
            </p>
          </div>
          <div className="controls">
            <div className="tabs" role="tablist">
              {VIEWS.map((v) => (
                <button key={v.id} role="tab" aria-selected={view === v.id} title={v.hint} className={view === v.id ? "tab on" : "tab"} onClick={() => setView(v.id)}>
                  {v.label}
                </button>
              ))}
            </div>
            <label className="muted" title="Apply the fresh decision only within policy.applyWithinMs (300 ms)">
              <input type="checkbox" checked={strict} onChange={(e) => setStrict(e.target.checked)} /> Strict 300 ms window
            </label>
            <button className="ghost" onClick={refresh}>Next visit</button>
            <button className="ghost" onClick={async () => {
              await fetch("/api/surface/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ reset: true }) });
              refresh();
            }}>Reset memory</button>
            <button className="ghost" onClick={() => setDebug((d) => !d)}>{debug ? "Hide" : "Show"} debug</button>
          </div>
        </section>

        {error && <div className="banner bad">Error: {error}</div>}
        {status !== "error" && (
          <p className="status muted">
            Source: <b>{decision?.source ?? "…"}</b> · decider: Jev
            {freshAfterMs !== undefined && <> · fresh decision after {freshAfterMs} ms</>}
            {decision?.focus && <> · focus: <b>{areaLabel[decision.focus as keyof typeof areaLabel] ?? decision.focus}</b></>}
            {trace?.swaps !== undefined && view === "adaptive" && <> · {trace.swaps} change(s) this visit (limit {dashboard.policy.maxSwapsPerVisit})</>}
            {status === "loading" && " · loading…"}
            {trace?.error && <> · <b className="bad-text">fallback: {trace.error}</b></>}
          </p>
        )}
        {deferred && view === "adaptive" && (
          <div className="banner">
            <span>The fresh decision arrived after {freshAfterMs} ms, outside the {dashboard.policy.applyWithinMs} ms window: it is used on the next visit.</span>
            <button className="ghost" onClick={applyDeferred}>Apply now</button>
          </div>
        )}

        {decision && <Dashboard decision={decision} data={profile.w} onNotUseful={view === "adaptive" ? notUseful : undefined} />}
        {decision && view === "adaptive" && <SeeAll decision={decision} />}
        {debug && trace && <><h2>Debug</h2><DebugPanel trace={trace} policy={dashboard.policy} className="debug" /></>}
      </main>
    </>
  );
}

function Dashboard({ decision, data, onNotUseful }: { decision: Decision; data: Record<string, any>; onNotUseful?: (id: string) => void }) {
  return (
    <>
      {decision.alert && <AlertBanner placed={decision.alert} data={data} />}
      <section className="grid kpis" aria-label="Fixed zone">
        {decision.fixed.map((id) => <Card key={id} id={id} data={data} compact />)}
      </section>
      <h2>Adaptive zone</h2>
      <section className="grid cards" aria-label="Adaptive zone">
        {decision.adaptive.map((p, i) => <Card key={p.id} id={p.id} data={data} placed={p} rank={i + 1} onNotUseful={onNotUseful} />)}
      </section>
      {decision.suggestions.length > 0 && (
        <>
          <h2>Suggestions</h2>
          <section className="grid suggestions">
            {decision.suggestions.map((p) => <Card key={p.id} id={p.id} data={data} placed={p} suggestion />)}
          </section>
        </>
      )}
    </>
  );
}

function SeeAll({ decision }: { decision: Decision }) {
  const more = decision.more ?? [];
  const demoted = decision.demoted ?? [];
  if (!more.length && !demoted.length) return null;
  return (
    <details className="seeall">
      <summary>See all ({more.length} more{demoted.length ? `, ${demoted.length} hidden by feedback` : ""})</summary>
      <ul>
        {more.map((id) => <li key={id}>{itemById[id]?.title} <span className="muted">· {areaLabel[itemById[id]!.area]}</span></li>)}
        {demoted.map((id) => <li key={id}>{itemById[id]?.title} <span className="muted">· hidden for 7 days (not useful)</span></li>)}
      </ul>
    </details>
  );
}

function AlertBanner({ placed, data }: { placed: PlacedItem; data: Record<string, any> }) {
  const item = itemById[placed.id]!;
  return (
    <div className="banner alert" role="alert">
      <b>⚠ {item.title}</b>
      <span>{data[placed.id]?.detail}</span>
      <small>{[`${Math.round((placed.probability ?? 0) * 100)}% likely`, ...placed.reasons].join(" · ")}</small>
    </div>
  );
}

function Card({ id, data, placed, rank, compact, suggestion, onNotUseful }: {
  id: string; data: Record<string, any>; placed?: PlacedItem; rank?: number; compact?: boolean; suggestion?: boolean; onNotUseful?: (id: string) => void;
}) {
  const item = itemById[id]!;
  const render = widgets[id];
  return (
    <article className={`card ${compact ? "compact" : ""} ${suggestion ? "suggestion" : ""}`}>
      <header>
        <h3>{item.title}</h3>
        <span className="chips">
          {rank && <span className="chip rank">#{rank}</span>}
          <span className="chip">{areaLabel[item.area]}</span>
          {placed?.score !== undefined && placed.reasons.length > 0 && <span className="chip hot">score {placed.score.toFixed(1)}</span>}
          {onNotUseful && <button className="chip thumb" title="Not useful: hide for 7 days" onClick={() => onNotUseful(id)}>👎</button>}
        </span>
      </header>
      {render ? render(data[id]) : null}
      {placed && placed.reasons.length > 0 && (
        <ul className="reasons">{placed.reasons.map((r) => <li key={r}>{r}</li>)}</ul>
      )}
    </article>
  );
}

/** Shown when there is no key: this playground only makes sense with the real model. */
function SetupNotice() {
  return (
    <main>
      <h1>reflexui · full example</h1>
      <div className="banner alert" style={{ display: "block" }}>
        <b>This playground needs a Jev API key.</b>
        <ol>
          <li>Create a key in the <a href="https://console.typesafe.ai/">TypeSafe console</a>.</li>
          <li>Copy <code>.env.example</code> to <code>.env.local</code> and set <code>TYPESAFE_API_KEY=...</code></li>
          <li>Restart <code>pnpm dev</code> and reload this page.</li>
        </ol>
        <small>Every ranking, alert and suggestion here is the model&apos;s answer, so there is nothing to show without it.</small>
      </div>
    </main>
  );
}
