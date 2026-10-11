import { defineSurface, type ReasonTemplate, type SignalFact, type SignalProvider } from "@reflexui-jev/core";
import { catalog, areaLabel, type Area } from "./catalog";
import type { AreaSignal, Plan } from "./profiles";

export interface DashCtx {
  workspaceId: string;
  plan: Plan;
  seats: number;
  hasSso: boolean;
  areas: Record<string, AreaSignal>;
  topics: string[];
  events: string[];
}

const areas = Object.keys(areaLabel) as Area[];
const num = (n: number) => Math.round(n * 10) / 10;

// Signals: code summarizes raw data into short, model-ready snapshots + structured facts.
const metricsSignal: SignalProvider<DashCtx> = {
  id: "metrics",
  feeds: ["relevance", "alerts"],
  async collect(ctx) {
    const value: Record<string, number> = {};
    const facts: SignalFact[] = [];
    for (const a of areas) {
      const r = ctx.areas[a]?.anomaly ?? 1;
      value[a] = num(r);
      if (r >= 1.4) facts.push({ area: a, kind: "anomaly", values: { area: areaLabel[a], ratio: num(r) } });
    }
    return { key: "metrics_vs_28d_average", value, facts };
  },
};

const navigationSignal: SignalProvider<DashCtx> = {
  id: "navigation",
  feeds: ["relevance", "alerts"],
  async collect(ctx) {
    const value: Record<string, number> = {};
    const facts: SignalFact[] = [];
    for (const a of areas) {
      const v = ctx.areas[a]?.visits ?? 0;
      value[a] = v;
      if (v >= 3) facts.push({ area: a, kind: "navigation", values: { area: areaLabel[a], visits: v } });
    }
    return { key: "admin_page_visits_last_7d", value, facts };
  },
};

const ticketsSignal: SignalProvider<DashCtx> = {
  id: "tickets",
  feeds: ["relevance", "alerts"],
  async collect(ctx) {
    const value: Record<string, number> = {};
    const facts: SignalFact[] = [];
    for (const a of areas) {
      const t = ctx.areas[a]?.tickets ?? 0;
      value[a] = t;
      if (t >= 2) facts.push({ area: a, kind: "conversation", values: { area: areaLabel[a], tickets: t } });
    }
    return { key: "support_tickets_last_7d", value: { per_area: value, recent_topics: ctx.topics.slice(0, 4) }, facts };
  },
};

/** Plain-language events computed by your code; the strongest evidence for alerts. */
const eventsSignal: SignalProvider<DashCtx> = {
  id: "events",
  feeds: ["relevance", "alerts"],
  async collect(ctx) {
    return { key: "recent_events", value: ctx.events };
  },
};

// Reason templates: fixed sentences filled from facts. The model never writes these words.
const reasons: ReasonTemplate[] = [
  { when: "anomaly", text: "{area} metrics are {ratio}x the 28-day average" },
  { when: "navigation", text: "You opened {area} {visits} times this week" },
  { when: "conversation", text: "{tickets} recent tickets mention {area}" },
];

// Deterministic eligibility: ineligible items are never sent to the model.
const eligibility: Record<string, (c: DashCtx) => boolean> = {
  billing: (c) => c.plan !== "free",
  "seat-growth": (c) => c.seats >= 10,
  "security-events": (c) => c.hasSso || c.plan !== "free",
  "alert-payment-failed": (c) => c.plan !== "free",
  "suggest-upgrade": (c) => c.plan !== "enterprise",
  "suggest-enable-sso": (c) => !c.hasSso,
  "suggest-invite-team": (c) => c.seats > 0,
};

const defaultOrder = [
  "usage-trend", "feature-adoption", "billing", "seat-growth", "security-events",
  "api-errors", "response-time", "ticket-backlog", "nps-score", "onboarding-progress",
];

export const dashboard = defineSurface<DashCtx>({
  id: "saas-dashboard-full",
  fixed: () => catalog.filter((i) => i.fixed).map((i) => i.id),
  defaultOrder: () => defaultOrder,
  items: catalog
    .filter((i) => !i.fixed)
    .map((i) => ({
      ...(i.kind === "alert" ? { question: i.question! } : {}),
      id: i.id,
      kind: i.kind,
      area: i.area,
      title: i.title,
      eligible: eligibility[i.id],
      reasons,
    })) as never,
  signals: [metricsSignal, navigationSignal, ticketsSignal, eventsSignal],
  relevanceLevels: [
    "Nothing changed in this area and the admin showed no recent interest in it.",
    "The admin looked at this area recently, but the numbers are normal.",
    "Numbers moved out of the normal range, or the area keeps coming up in tickets.",
    "There is an active problem in this area that needs action today.",
  ],
  relevancePrompt: 'How important is it for the admin to see the "{title}" card (area: {area}) today? Metrics are ratios vs the 28-day average per area; visits and tickets are counts per area.',
  focus: {
    prompt: "Which area is the admin most likely focused on today?",
    options: Object.fromEntries(areas.map((a) => [a, areaLabel[a]])),
  },
  // minRefreshMs: 0 so every "Next visit" click calls the model in this playground.
  policy: { adaptiveSlots: 6, suggestionSlots: 2, minRefreshMs: 0 },
});
