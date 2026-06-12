# CMA Tracker — Project Context

> This file is the project's memory. It travels with the code via GitHub so any
> machine (or any Claude Code session) can pick up where we left off. Read this first.

## What this is

A standalone real estate **client portal + comparative market analysis (CMA) tool**
built for Derek Gillette (Gillette & Associates / eXp Realty, Nanaimo BC). Designed
to be white-labeled and sold to other realtors later, but built for Derek first.

Replaces the current manual workflow (Matrix search → spreadsheet → hand-built HTML
report) with an integrated tool, and turns a one-time CMA into a **lifetime client
relationship platform**.

## Tech stack

TypeScript · React 18 · Vite · Tailwind · Express · PostgreSQL (DigitalOcean) ·
Drizzle ORM · TanStack React Query · Leaflet + Geoman (maps) · Chart.js ·
magic-link auth (nodemailer)

## Related projects (read-only reference, not part of this repo)

- **BridgeSyncEngine** — Derek's MLS data pipeline. Syncs Vancouver Island MLS
  (Bridge/VIVA dataset) into Postgres, exposes a REST API.
  - API base: `https://mls-app-pj4lz.ondigitalocean.app`
  - Auth: `X-API-Key` header (key stored in `.env` as `MLS_API_KEY`)
  - Main endpoint: `GET /api/v1/properties` — returns `{ data: [...] }`
  - Filters: `city`, `status` (Active/Pending/Sold/Expired/Cancelled), `minPrice`,
    `maxPrice`, `subArea`, `propertySubType`, `minBeds`, etc.
  - We pull MLS data via this API only — we never touch its database directly.
- **Nanaimowebsite** — Derek's site. Has reusable Leaflet boundary-draw map
  components (`AdminBoundaryDrawMap.tsx`, `AreaStatsMapView.tsx`) we can adapt.

## Database

DigitalOcean managed Postgres cluster `db-postgresql-tor1-90657` (TOR1), shared with
BridgeSyncEngine but a **separate database** named `cmatracker` (BridgeSyncEngine uses
`defaultdb`). Connection string lives in `.env` (gitignored).

**On a new machine you must recreate `.env`** from `.env.example` — it holds the DB
URL, MLS API key, and SMTP creds, which are not in git. Then `npm install` and
`npm run db:push`. Note: DO requires `&uselibpqcompat=true` on the DATABASE_URL for
drizzle-kit to connect, and your IP must be added to the cluster's Trusted Sources.

## Core mental model — the property lifecycle (4 states)

1. **Prospect** (evaluated, not listed): live area map of listings/sales +
   "Previous Home Evaluation" tab (the locked infographic) + "Get an Updated
   Evaluation" button. That button is a re-engagement signal — it pings the agent,
   it does NOT auto-generate a new CMA.
2. **Active Seller** (listed): nicer display of their home, showings, feedback,
   probability-of-selling gauge, live market tracker.
3. **Sold Seller**: archived sale + documents.
4. **Buyer** (just purchased): enter MLS# → home details + area map of nearby
   listings/solds. **Deliberately NO CMA** (avoids buyer's remorse). Documents +
   home maintenance tracker.

## Two-layer data model (key architecture)

- **Layer 1 — Locked CMA snapshot:** when the agent finalizes comps, each comp is
  frozen into the `comparables` table. Never changes. The clickable HTML infographic
  is this deliverable and is the most polished/valuable asset.
- **Layer 2 — Live tracker:** the filter criteria used for the CMA are saved in
  `cma_reports.compFilters`. We re-run them against fresh MLS data when the client
  logs in → live MOI, new listings/sales. A `market_snapshots` table records live
  stats over time to draw trend lines (e.g. "MOI climbed 46.8 → 51.2 over 6 weeks").

## Comp selection workflow (mirrors the Matrix MLS program)

Search filter panel → sortable summary results table → click a property for details +
photos → manually include/exclude → finalize → snapshot + AI builds the infographic.
The locked CMA is **hand-curated** (agent picks the comps that tell the right story);
the live tracker is **unfiltered** (the market is the market).

## Probability of selling

Realtor sets a baseline % at listing (knows the price vs. value gap). Auto-adjusts
on weighted factors: days on market over time, number of showings without offer,
no-showing streaks, and months-of-inventory delta vs. listing day. Weights are
agent-tunable per property (`probability_config` table).

## Documents vault (sellers + buyers)

Contracts, inspections, disclosures, warranties — stored per property.

## Home maintenance tracker (buyer stickiness feature)

Component + install date → lifespan alerts. Roof ~20–25yr, furnace/heat pump
~15–20yr, hot water tank ~10–12yr (tankless ~20yr). Planned extensions: seasonal
service reminders, warranty-expiry alerts, a quiet home-value pulse, and a "My Home"
profile (paint colors, appliance models, contractor contacts).

## Design language — TWO THEMES (Derek's explicit direction)

- **Client-facing surfaces (login + client portal): light, friendly, modern.**
  Body `#f5f7fb`, white cards, `border-slate-200`, soft shadows, `rounded-2xl`,
  slate text, accents blue `#2563eb` / green `#16a34a` / amber `#d97706` /
  red `#dc2626`. Approachable "Airbnb-like" feel. Derek asked for this after
  finding the dark portal unfriendly.
- **Realtor workspace (CMA Builder, agent dashboard): dark pro theme** matching
  Derek's HTML reports: bg `#0d1117`, surface `#161b22`, border `#30363d`,
  accents `#388bfd`/`#58a6ff`, `#3fb950`, `#f0b429`, `#f85149`. These pages set
  their own dark bg on their root div. (Derek may later ask to lighten this too.)
- Inter font everywhere. Chart.js for report charts. Per-agent white-label
  overrides (colors, logo, photo) planned for commercialization.
- **Maps:** Leaflet + CARTO **Voyager** tiles (Google-style: blue water, labeled
  roads) in `client/src/components/MarketMap.tsx`. Status pins blue/orange/green
  with white ring; subject home = pulsing red marker. Derek explicitly rejected
  dark map tiles.

## Session log — June 12 2026 (most recent work, read this first)

Everything below is built, verified in the browser, and pushed:

1. **Live stats expanded**: avg DOM for actives AND solds + list-to-sell ratio
   (sold÷list %) in both the portal market tab (6 stat cards with plain-English
   subtexts) and the CMA Builder tray (DOM Sold/Active dual pill, List→Sell
   pill, green ≥100% / blue below).
2. **Dev persona switcher** (`client/src/components/PersonaSwitcher.tsx`):
   floating pill bottom-right on every screen, one click cycles
   Realtor/Seller/CMA Client/Buyer. DEV-only (import.meta.env.DEV).
3. **Builder list polish**: 96x64 photo thumbnails (gotcha: Tailwind preflight
   `img{max-width:100%}` collapses imgs in auto-layout tables — fixed with
   `max-w-none`), trimmed addresses, selection tray "Show all N" expands to a
   scrollable grid of every selected comp.
4. **Map selection indicators**: selected comps get dashed halo ring in status
   color + bigger pin; unselected dim to 45% once a selection exists; legend
   gains "Selected".
5. **Staged criteria flow**: builder starts at 0 with empty filters; big live
   counter climbs as criteria are picked; "Show N matches →" reveals list/map
   (Matrix mental model: define search → run). List/Map toggle hidden until
   reveal.
6. **Per-status date ranges**: each enabled status gets its own window —
   presets 30/60/90/180d/1yr/All or 📅 Custom calendar from–to. Active/Pending
   filter by list date, Sold by sale date. Sold defaults 180d. MOI window
   derives from sold window (`windowDays()` in types.ts).
7. **BridgeSyncEngine field exposure** (separate repo, deployed): see below.
   Local BridgeSyncEngine repo was 2 commits behind origin — synced before
   changing (ALWAYS git fetch/compare in that repo before pushing; it
   auto-deploys to production on push to main).
8. **Adding more MLS fields later (e.g. Heating) is one line** in the
   /api/v1/properties select in BridgeSyncEngine server/routes.ts — payload
   has 379 fields (Heating, Cooling, Appliances, Roof, Flooring...). No
   migration/backfill ever needed for read-only exposure. Pattern:
   `heating: sql\`${properties.payload}->'Heating'\`.as('heating'),`

**Where we left off / what's next**: Derek's priorities are (a) the report
composer (Build CMA Report → snapshot + infographic), (b) the new buyer
search/cart/alerts section (questions for Derek below), (c) Matrix-parity
filter UI using the newly exposed fields. Demo data is seeded; dev personas
work; all systems verified.

## Status — what is BUILT and working (as of June 2026)

1. ✅ Scaffold, schema (all 13 tables pushed to DO), Express server, React shell
2. ✅ **CMA Builder** (`/cma/new`, realtor-only): filter rail (status pills, price
   presets, sub-area/type/layout chips, beds/baths steppers, 90/180/365-day comp
   window), instant search (no submit button), sortable results table with photo
   thumbs, List/Map toggle, property detail slide-over with photo carousel, and
   the **selection tray** — docked photo cards + live CMA stats (avg sold/pending
   PSF, DOM, MOI) with animated counting numbers. "Build CMA Report →" button is
   a stub → the report composer is the next big build.
3. ✅ **Client portal** with the 4 lifecycle views (status-driven, same login):
   seller (overview/gauge/showings timeline + feedback chips, market, locked
   evaluation, documents), prospect (market + evaluation + "Get an Updated
   Evaluation" lead button → logs lead, POST /api/portal/request-evaluation),
   buyer (maintenance tracker with lifespan bars + service-due alerts, area map,
   documents — NO CMA by design).
4. ✅ **Per-client market lens**: `properties.marketConfig` jsonb
   `{subAreas, daysBack, minPrice, maxPrice, propertySubTypes}` drives
   GET /api/portal/market/:propertyId (live MLS fetch, stats + map pins).
5. ✅ Magic-link auth scaffolding (SMTP not configured yet) + **dev persona
   logins** on the login page (dev-only route /api/auth/dev-login).

## Demo personas (seeded via `npx tsx server/seed-demo.ts`, idempotent)

- **Agent**: Derek (auto-seeded on first dev-login)
- **Seller** carters@example.com → 2566 Steve Ellis Rd — Derek's REAL active
  listing, pulled live from MLS API by the seed (photo, $2.39M, MLS 1037349);
  6 showings w/ feedback, prob baseline 65%, locked CMA from Derek's actual
  May 2026 evaluation (comps from his HTML report)
- **Prospect** susan.m@example.com → 5417 Kenwill Dr (Hammond Bay, 60-day lens)
- **Buyer** chens@example.com → a REAL sold Departure Bay listing (seed picks
  the most recent one with photo+coords, e.g. 3120 Robin Hood Dr) + 4 home
  components + documents

## Gotchas / environment notes

- Express reads **API_PORT** (3001), NOT PORT — dev tooling injects PORT for
  Vite. Vite proxies /api → localhost:3001.
- DO Postgres needs `&uselibpqcompat=true` on DATABASE_URL for drizzle-kit,
  and your IP added to the cluster's Trusted Sources (Network Access tab).
- MLS API numeric fields arrive as STRINGS — normalize with `num()` helper in
  `client/src/pages/agent/cma/types.ts`.
- MLS API filters one status per request → fetch per-status in parallel, merge,
  dedupe on listingKey. "Closed" = sold. Sub-area/beds/sqft/year/layout filters
  applied client-side.
- `.claude/launch.json` exists for the preview tool (name: cma-tracker).

## NEW SECTION PLANNED — Buyer search + shopping cart (Derek, June 12 2026)

Derek's direction, captured verbatim in spirit — not yet built:

- **Buyer listing search**: buyers get a search experience reusing the CMA
  Builder format (filter rail → results → map), but **Active listings only**
  (no solds — same no-buyer's-remorse principle as the buyer portal).
- **Shopping cart**: buyers add listings they like to a cart/favourites list.
  Agent can see the cart (great signal for what they want). Likely tables:
  `buyer_searches` (saved criteria per client, reuse CmaFilters/marketConfig
  shape) and `buyer_cart_items` (clientId, listingKey, snapshot of key fields,
  note, addedAt, status: saved/dismissed/toured).
- **Saved search + email alerts**: agent (or buyer) saves a search with the
  buyer's email; a scheduled job (node-cron, reuse BridgeSyncEngine pattern)
  re-runs each saved search, diffs against previously-seen listingKeys, and
  emails new matches. Needs: `seen_listings` tracking per search, SMTP setup
  (not yet configured), unsubscribe link, frequency setting (instant/daily).
- Open questions for Derek:
  1. Do buyers self-serve sign up for searches, or always agent-created?
  2. Should the cart sync into showing requests ("book a viewing" button)?
  3. Email alert frequency: instant per listing, or daily digest?
  4. Does the buyer search live in the existing buyer portal tab set, or as
     its own "Find a Home" section for ALL client types?

### BridgeSyncEngine API additions (deployed June 12 2026, commit 32cb34b)

/api/v1/properties now also returns: `kitchensTotal`, `bedsOrDensTotal`,
`fireplacesTotal`, `buildingAreaTotal`, `storiesTotal`, `parkingTotal`,
`lotSizeAcres`. All payload-derived (no schema change, full-archive coverage).
Rollback tag in that repo: `pre-cma-fields`.
**Suite detection**: VIVA has no structured suite field (verified) — use
kitchensTotal >= 2 as the proxy, optionally + remarks keyword ("suite").

### Filter UI still to build in CMA Builder (Matrix parity)

- View multi-select (City/Mountain/Valley/Lake/Ocean/River/Other) with
  And/Or/Not modes — `view` array + `viewYN` already in API
- Full layout list (add Duplex Front/Back, Side/Side, Up/Down, Split Level)
- Separate List Price AND Sold Price range filters
- Kitchens / Fireplaces / Storeys / Parking N+ steppers, Beds-or-Dens
- Lot SqFt + Lot Acres ranges, SqFt Total (buildingAreaTotal) vs Fin SqFt
- Strata fee range; "Has suite" toggle (kitchens >= 2)
- Keep the rail clean: consider collapsible "More filters" section

## Next build steps (in priority order)

1. **Report composer** — "Build CMA Report →" flow: pick/create client+property,
   snapshot comps to `comparables`, set price options + warning text, render the
   infographic (price cards, PSF/DOM/MOI charts via Chart.js, comp tables —
   visual target = Derek's steve-ellis-cma HTML in repo history/downloads),
   export PDF, mark sentToClientAt.
2. **Admin client management** — create/edit clients + properties, set
   marketConfig lens (sub-area picker + daysBack + price band), draw map
   boundary (adapt AdminBoundaryDrawMap.tsx from Nanaimowebsite), flip property
   status (cma→active→sold), enter showings/feedback (Leon's form).
3. `market_snapshots` recording job + trend lines in portal.
4. Probability engine: weighted auto-adjust (DOM, showings, MOI delta) — see
   probability_config table; currently shows baseline only.
5. SMTP for real magic links; production deploy to DO App Platform.

## Schema

See `shared/schema.ts`. Tables: agents, clients, properties (has marketConfig +
compBoundary jsonb), cma_reports (compFilters jsonb), comparables, showings,
showing_feedback, probability_config, market_snapshots, documents,
home_components, magic_tokens, session.
