/** Plain, serializable description of the 20 components (safe to import on the client). */
export type Kind = "card" | "alert" | "suggestion";
export type Area = "usage" | "billing" | "security" | "reliability" | "support" | "feedback" | "onboarding";

export interface CatalogItem {
  id: string;
  kind: Kind;
  area: Area;
  title: string;
  /** Alerts only: the yes/no question sent to the model. */
  question?: string;
  /** Fixed-zone items are chosen by code, never ranked by the model. */
  fixed?: boolean;
}

export const catalog: CatalogItem[] = [
  // Fixed zone (4)
  { id: "active-users", kind: "card", area: "usage", title: "Active users", fixed: true },
  { id: "seats-used", kind: "card", area: "billing", title: "Seats used", fixed: true },
  { id: "open-tickets", kind: "card", area: "support", title: "Open tickets", fixed: true },
  { id: "uptime", kind: "card", area: "reliability", title: "Uptime (30d)", fixed: true },
  // Adaptive cards (10)
  { id: "usage-trend", kind: "card", area: "usage", title: "Usage trend" },
  { id: "feature-adoption", kind: "card", area: "usage", title: "Feature adoption" },
  { id: "billing", kind: "card", area: "billing", title: "Billing and invoices" },
  { id: "seat-growth", kind: "card", area: "billing", title: "Seat growth" },
  { id: "security-events", kind: "card", area: "security", title: "Security events" },
  { id: "api-errors", kind: "card", area: "reliability", title: "API error rate" },
  { id: "response-time", kind: "card", area: "reliability", title: "Response time (p95)" },
  { id: "ticket-backlog", kind: "card", area: "support", title: "Ticket backlog" },
  { id: "nps-score", kind: "card", area: "feedback", title: "NPS score" },
  { id: "onboarding-progress", kind: "card", area: "onboarding", title: "Onboarding progress" },
  // Alerts (3): at most one is shown
  { id: "alert-churn-risk", kind: "alert", area: "usage", title: "Churn risk", question: "Do recent usage and tickets suggest this workspace may churn?" },
  { id: "alert-security-breach", kind: "alert", area: "security", title: "Suspicious access", question: "Do recent security events suggest an ongoing intrusion attempt?" },
  { id: "alert-payment-failed", kind: "alert", area: "billing", title: "Payment failed", question: "Is there a failed or overdue payment that needs action now?" },
  // Suggestions (3)
  { id: "suggest-upgrade", kind: "suggestion", area: "billing", title: "Upgrade your plan" },
  { id: "suggest-enable-sso", kind: "suggestion", area: "security", title: "Enable single sign-on" },
  { id: "suggest-invite-team", kind: "suggestion", area: "onboarding", title: "Invite your team" },
];

export const itemById = Object.fromEntries(catalog.map((i) => [i.id, i])) as Record<string, CatalogItem>;

export const areaLabel: Record<Area, string> = {
  usage: "Usage",
  billing: "Billing",
  security: "Security",
  reliability: "Reliability",
  support: "Support",
  feedback: "Feedback",
  onboarding: "Onboarding",
};
