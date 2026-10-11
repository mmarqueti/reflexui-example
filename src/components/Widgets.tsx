import type { ReactNode } from "react";

/* Small SVG/HTML building blocks */
const fmt = (n: number) => n.toLocaleString("en-US");
const money = (n: number) => `$${n.toLocaleString("en-US")}`;

function Delta({ pct, invert = false }: { pct: number; invert?: boolean }) {
  const good = invert ? pct <= 0 : pct >= 0;
  return <span className={`delta ${good ? "good" : "bad"}`}>{pct > 0 ? "▲" : pct < 0 ? "▼" : "•"} {Math.abs(pct)}%</span>;
}

function Spark({ data, color = "var(--accent)" }: { data: number[]; color?: string }) {
  if (!data?.length) return null;
  const w = 220, h = 48, min = Math.min(...data), max = Math.max(...data);
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 4 - ((v - min) / (max - min || 1)) * (h - 8)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="spark" preserveAspectRatio="none" aria-hidden>
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Bars({ items, unit = "%" }: { items: { label: string; value: number }[]; unit?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className="bars">
      {items.map((i) => (
        <div key={i.label} className="bar-row">
          <span>{i.label}</span>
          <div className="bar"><i style={{ width: `${unit === "%" ? i.value : (i.value / max) * 100}%` }} /></div>
          <b>{fmt(i.value)}{unit === "%" ? "%" : ""}</b>
        </div>
      ))}
    </div>
  );
}

function Big({ value, sub, children }: { value: ReactNode; sub?: ReactNode; children?: ReactNode }) {
  return (
    <div>
      <div className="big">{value} {sub}</div>
      {children}
    </div>
  );
}

function Message({ detail }: { detail: string }) {
  return <p className="msg">{detail}</p>;
}

/* The 20 components, keyed by catalog id. `d` is the mocked JSON for the active profile. */
export const widgets: Record<string, (d: any) => ReactNode> = {
  "active-users": (d) => <Big value={fmt(d.value)} sub={<Delta pct={d.deltaPct} />}><Spark data={d.series} /></Big>,
  "seats-used": (d) => (
    <Big value={`${d.used}/${d.total}`} sub={<span className="muted">{Math.round((d.used / d.total) * 100)}%</span>}>
      <div className="bar"><i style={{ width: `${(d.used / d.total) * 100}%` }} /></div>
    </Big>
  ),
  "open-tickets": (d) => <Big value={d.value} sub={<Delta pct={d.deltaPct} invert />} />,
  uptime: (d) => <Big value={`${d.value}%`} sub={<span className="muted">{d.incidents} incidents</span>} />,
  "usage-trend": (d) => <Big value="Events / day" sub={<Delta pct={d.deltaPct} />}><Spark data={d.series} /></Big>,
  "feature-adoption": (d) => <Bars items={d.items} />,
  billing: (d) => (
    <div>
      <div className="big">{money(d.mrr)} <span className="muted">MRR · {d.plan}</span></div>
      {d.status === "overdue" && <div className="pill bad">Payment overdue</div>}
      <ul className="list">
        {d.invoices.map((inv: any) => (
          <li key={inv.label}><span>{inv.label}</span><span>{money(inv.amount)} <em className={`tag ${inv.status}`}>{inv.status}</em></span></li>
        ))}
        {!d.invoices.length && <li><span className="muted">No invoices yet</span></li>}
      </ul>
    </div>
  ),
  "seat-growth": (d) => <Big value={`${d.added30d > 0 ? "+" : ""}${d.added30d}`} sub={<span className="muted">seats in 30 days</span>}><Spark data={d.series} /></Big>,
  "security-events": (d) => (
    <div>
      <div className="big">{fmt(d.total)} <span className="muted">events (24h)</span></div>
      <Bars unit="" items={d.items.length ? d.items : [{ label: "Nothing unusual", value: 0 }]} />
    </div>
  ),
  "api-errors": (d) => <Big value={`${d.ratePct}%`} sub={<span className="muted">5xx rate</span>}><Spark data={d.series} color="var(--bad)" /></Big>,
  "response-time": (d) => <Big value={`${fmt(d.p95Ms)} ms`} sub={<span className="muted">p95</span>}><Spark data={d.series} color="var(--warn)" /></Big>,
  "ticket-backlog": (d) => (
    <div>
      <div className="muted">Oldest open: {d.oldestDays} day(s)</div>
      <Bars unit="" items={d.items} />
    </div>
  ),
  "nps-score": (d) => (
    <Big value={d.value} sub={<span className={`delta ${d.deltaPts >= 0 ? "good" : "bad"}`}>{d.deltaPts >= 0 ? "▲" : "▼"} {Math.abs(d.deltaPts)} pts</span>}>
      <div className="muted">{d.promoters} promoters · {d.detractors} detractors</div>
    </Big>
  ),
  "onboarding-progress": (d) => (
    <div>
      <div className="big">{d.done}/{d.total} <span className="muted">steps</span></div>
      <div className="bar"><i style={{ width: `${(d.done / d.total) * 100}%` }} /></div>
      <ul className="list">{d.steps.map((s: any) => <li key={s.label}><span>{s.done ? "✓" : "○"} {s.label}</span></li>)}</ul>
    </div>
  ),
  "alert-churn-risk": (d) => <Message detail={d.detail} />,
  "alert-security-breach": (d) => <Message detail={d.detail} />,
  "alert-payment-failed": (d) => <Message detail={d.detail} />,
  "suggest-upgrade": (d) => <Message detail={d.detail} />,
  "suggest-enable-sso": (d) => <Message detail={d.detail} />,
  "suggest-invite-team": (d) => <Message detail={d.detail} />,
};
