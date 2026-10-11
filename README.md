# reflexui · full example

A small Next.js playground to validate [reflexui](https://github.com/mmarqueti/reflexui) end to end.
Everything is mocked: 5 people (one JSON each in `data/profiles/`), one page, 20 dashboard components.

## Run

Requires Node.js 20+, [pnpm](https://pnpm.io) (npm works too) and a **Jev API key** from the [TypeSafe console](https://console.typesafe.ai/).
Every ranking, alert and suggestion on the page is the model's answer, so without a key the page only shows setup instructions.

```sh
pnpm install
cp .env.example .env.local   # then set TYPESAFE_API_KEY=...
pnpm dev                     # http://localhost:3000
```

The packages come from npm (`@reflexui-jev/core`, `providers`, `react`, `replay`).

## What you see

Pick a person at the top. The page calls `/api/surface`, which runs one reflexui "visit"
and renders the result. Three views let you compare:

- **Adaptive (reflexui)**: the fresh decision (fixed zone, ranked adaptive zone, at most one alert, suggestions, reasons).
- **Immediate**: what would render before the model answers (cache, or default order on the first visit).
- **Static default**: the same screen for everyone.

Buttons: **Next visit** (re-run; the cache and swap limits apply), **Reset memory**, **Show debug** (scoreboard, alert probabilities, model requests, facts, policy).

## The 20 components

| Zone | Components |
| --- | --- |
| Fixed (4, chosen by code) | active-users, seats-used, open-tickets, uptime |
| Adaptive cards (10, ranked by the model) | usage-trend, feature-adoption, billing, seat-growth, security-events, api-errors, response-time, ticket-backlog, nps-score, onboarding-progress |
| Alerts (3, at most one shown) | alert-churn-risk, alert-security-breach, alert-payment-failed |
| Suggestions (3, top 2 shown) | suggest-upgrade, suggest-enable-sso, suggest-invite-team |

Some are gated by deterministic rules (e.g. `billing` needs a paid plan, `suggest-enable-sso` only when SSO is off).

## The 5 people

| Person | Story | Expected focus |
| --- | --- | --- |
| Ana Souza | New free workspace, still onboarding | onboarding |
| Bruno Lima | Failed invoice, billing keeps coming up | billing + payment alert |
| Carla Mendes | Failed logins 4x from a new region | security + intrusion alert |
| Diego Alves | API errors and ticket backlog, NPS falling | reliability / support, no alert |
| Elisa Prado | Weekly active users down 41%, renewal soon | usage + churn alert |

## Using the real Jev API

1. Put your key in `.env.local` (copy `.env.example`): `TYPESAFE_API_KEY=...`
2. Restart `pnpm dev` and reload the page.

Each visit makes two parallel calls to `POST https://api.typesafe.ai/v1/systemone` (relevance for cards and suggestions, plus one yes/no per alert), around 300 to 500 ms in total. If the call fails or exceeds `policy.timeoutMs`, the screen falls back to the cached or default order and the page shows the reason.

Never commit `.env.local`.

## Implement it in your own app

The four files that matter, in the order you would write them:

| File | What it does |
| --- | --- |
| `src/lib/surface.ts` | `defineSurface()`: the items, the eligibility rules, the signals (plain-language summaries of your data), the reason templates and the rubric |
| `src/app/api/surface/route.ts` | Server route: `decide()` + `decisionStream(result, { trace: true })`. Turn `trace` off for real users |
| `src/app/api/surface/feedback/route.ts` | Stores the "not useful" feedback the hook posts |
| `src/app/page.tsx` | `useAdaptiveSurface()` renders the immediate decision, applies the fresh one inside the window, and `<DebugPanel>` shows why |

`src/lib/state.ts` keeps the cache and the feedback in memory. In production use `@reflexui-jev/redis` instead
(`redisStore`, `redisFeedbackStore`), because memory does not survive serverless or several instances.

`pnpm replay` runs the surface over 5 hand-labeled cases (`data/labels.json`) and compares it with the default order.

## What this validates

Everything comes from the reflexui packages: `defineSurface`, `decide()` (signals, requests, timeout, `compose` with thresholds, swap limit, hysteresis, pins, fallback), `decisionStream`, `MemoryStore`, `MemoryFeedbackStore`, `typesafeDecider`, and on the client `useAdaptiveSurface` and `<DebugPanel>`. The example only adds the surface definition, the mocked data and the UI.

- `src/app/api/surface/route.ts`: `decide()` + `decisionStream(result, { trace: true })`.
- `src/app/page.tsx`: `useAdaptiveSurface` renders the immediate decision at once and applies the fresh one if it lands inside the window (tick "Strict 300 ms window" to see Jev's ~300+ ms answers get deferred to the next visit, with an "Apply now" button). 👎 on a card calls the hook's `feedback()`, which demotes the item for 7 days. "Show debug" renders `<DebugPanel>`.

Signals are plain-language summaries computed by code (ratios vs the 28-day average, visits, tickets and a short list of recent events). Giving Jev the concrete events, not just ratios, noticeably raised alert probabilities in testing.

## Layout

```
data/profiles/*.json     5 mocked people: context, signals and widget data
src/lib/catalog.ts       the 20 components (plain data)
src/lib/surface.ts       defineSurface: signals, eligibility rules, reasons, rubric
src/app/api/surface      server route: one visit per request
src/app/page.tsx         the page
src/components/Widgets.tsx
```
