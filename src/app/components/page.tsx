"use client";

import Link from "next/link";
import { areaLabel, catalog, type CatalogItem } from "@/lib/catalog";
import { profileById } from "@/lib/profiles";
import { widgets } from "@/components/Widgets";

/** Human-readable mirror of the `eligibility` rules in `lib/surface.ts`. */
const requires: Record<string, string> = {
  billing: "plan is not free",
  "seat-growth": "10 or more seats",
  "security-events": "SSO on, or plan is not free",
  "alert-payment-failed": "plan is not free",
  "suggest-upgrade": "plan is not enterprise",
  "suggest-enable-sso": "SSO is off",
  "suggest-invite-team": "at least 1 seat",
};

/**
 * Which mocked person each component is previewed with: the one where it looks most complete
 * (an overdue invoice, a security spike, a ticket backlog...). Nothing here is filtered by profile.
 */
const showcase: Record<string, string> = {
  "active-users": "globex",
  "seats-used": "initech",
  "open-tickets": "umbrella",
  uptime: "umbrella",
  "usage-trend": "hooli",
  "feature-adoption": "initech",
  billing: "globex",
  "seat-growth": "globex",
  "security-events": "initech",
  "api-errors": "umbrella",
  "response-time": "umbrella",
  "ticket-backlog": "umbrella",
  "nps-score": "umbrella",
  "onboarding-progress": "acme",
  "alert-churn-risk": "hooli",
  "alert-security-breach": "initech",
  "alert-payment-failed": "globex",
  "suggest-upgrade": "globex",
  "suggest-enable-sso": "globex",
  "suggest-invite-team": "acme",
};

const groups: { title: string; hint: string; match: (i: CatalogItem) => boolean }[] = [
  { title: "Fixed zone", hint: "Chosen by code, never ranked by the model.", match: (i) => !!i.fixed },
  { title: "Adaptive cards", hint: "Ranked by the model; the top ones are shown.", match: (i) => i.kind === "card" && !i.fixed },
  { title: "Alerts", hint: "At most one is shown, when the model's probability passes the threshold.", match: (i) => i.kind === "alert" },
  { title: "Suggestions", hint: "Assistant prompts shown below the cards.", match: (i) => i.kind === "suggestion" },
];

export default function ComponentsPage() {
  return (
    <>
      <header className="top">
        <div className="brand"><b>reflexui</b> <span className="muted">full example</span></div>
        <nav className="people" aria-label="Pages">
          <Link href="/" className="ghost">Dashboard</Link>
          <Link href="/components" className="ghost">Components</Link>
          <Link href="/users" className="ghost">Users</Link>
        </nav>
      </header>

      <main>
        <section className="story">
          <div>
            <h1>Components</h1>
            <p className="muted">
              All {catalog.length} building blocks, with no filter. Each preview uses the mocked person where it looks most complete;
              the "shown when" line is the rule that decides if a person is even eligible for it.
            </p>
          </div>
        </section>

        {groups.map((g) => {
          const items = catalog.filter(g.match);
          return (
            <section key={g.title}>
              <h2>{g.title} ({items.length})</h2>
              <p className="muted">{g.hint}</p>
              <div className="grid cards">
                {items.map((item) => {
                  const render = widgets[item.id] as ((d: unknown) => React.ReactNode) | undefined;
                  const owner = profileById[showcase[item.id] ?? ""];
                  const data = owner?.w[item.id];
                  return (
                    <article key={item.id} className={`card ${item.kind === "suggestion" ? "suggestion" : ""}`}>
                      <header>
                        <h3>{item.title}</h3>
                        <span className="chips">
                          <span className="chip">{areaLabel[item.area]}</span>
                          <span className="chip">{item.kind}</span>
                        </span>
                      </header>
                      {render && data !== undefined ? render(data) : <p className="muted">No mocked data.</p>}
                      <ul className="reasons">
                        <li>id: <code>{item.id}</code> · sample data: {owner?.name ?? "none"}</li>
                        <li>shown when: {requires[item.id] ?? "always"}</li>
                        {item.question && <li>question: “{item.question}”</li>}
                      </ul>
                    </article>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>
    </>
  );
}
