import Link from "next/link";
import { areaLabel, itemById, type Area } from "@/lib/catalog";
import { profiles } from "@/lib/profiles";
import labels from "../../../data/labels.json";

const expected = labels as unknown as Record<string, string[]>;
const areas = Object.keys(areaLabel) as Area[];
const num = (n: number) => n.toLocaleString("en-US");

export const metadata = { title: "reflexui · users" };

export default function UsersPage() {
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
            <h1>Users</h1>
            <p className="muted">
              {profiles.length} mocked people. This is the raw input behind each dashboard: who they are, what changed in each area, what they asked support, and what the demo expects to rank first.
            </p>
          </div>
        </section>

        <div className="grid users">
          {profiles.map((p) => {
            const w = p.w as Record<string, any>;
            return (
              <article key={p.id} className="card user">
                <header>
                  <div className="who">
                    <span className="avatar">{p.avatar}</span>
                    <div>
                      <h3 className="name">{p.name}</h3>
                      <small className="muted">{p.role}</small>
                    </div>
                  </div>
                  <Link href={`/?profile=${p.id}`} className="chip">open dashboard</Link>
                </header>

                <p>{p.story}</p>

                <dl className="facts">
                  <div><dt>Plan</dt><dd>{p.ctx.plan}</dd></div>
                  <div><dt>Seats</dt><dd>{p.ctx.seats}{w["seats-used"] ? ` (${w["seats-used"].used} used)` : ""}</dd></div>
                  <div><dt>SSO</dt><dd>{p.ctx.hasSso ? "on" : "off"}</dd></div>
                  <div><dt>Workspace</dt><dd><code>{p.ctx.workspaceId}</code></dd></div>
                  {w["active-users"] && <div><dt>Active users</dt><dd>{num(w["active-users"].value)}</dd></div>}
                  {w["open-tickets"] && <div><dt>Open tickets</dt><dd>{w["open-tickets"].value}</dd></div>}
                  {w.billing && <div><dt>MRR</dt><dd>${num(w.billing.mrr)}</dd></div>}
                  {w.uptime && <div><dt>Uptime</dt><dd>{w.uptime.value}%</dd></div>}
                </dl>

                <h4>Activity by area</h4>
                <table>
                  <thead>
                    <tr><th>Area</th><th>Vs 28d avg</th><th>Visits (7d)</th><th>Tickets</th></tr>
                  </thead>
                  <tbody>
                    {areas.map((a) => {
                      const s = p.areas[a];
                      if (!s) return null;
                      const hot = s.anomaly >= 1.4;
                      return (
                        <tr key={a}>
                          <td>{areaLabel[a]}</td>
                          <td className={hot ? "bad-text" : undefined}>{hot ? "▲ " : ""}{s.anomaly}×</td>
                          <td>{s.visits}</td>
                          <td>{s.tickets}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                <h4>What they asked support</h4>
                {p.topics.length ? <ul className="plain">{p.topics.map((t) => <li key={t}>“{t}”</li>)}</ul> : <p className="muted">Nothing recently.</p>}

                <h4>Recent events</h4>
                {p.events.length ? <ul className="plain">{p.events.map((e) => <li key={e}>{e}</li>)}</ul> : <p className="muted">Nothing recent.</p>}

                <h4>Expected on top</h4>
                <div className="chips left">
                  {(expected[p.id] ?? []).map((id, i) => (
                    <span key={id} className="chip rank">#{i + 1} {itemById[id]?.title ?? id}</span>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </main>
    </>
  );
}
