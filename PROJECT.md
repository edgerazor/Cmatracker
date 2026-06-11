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

## Design language

Dark theme matching Derek's existing HTML reports: bg `#0d1117`, surface `#161b22`,
border `#30363d`, Inter font, Chart.js. Accent blue `#388bfd`/`#58a6ff`, green
`#3fb950`, amber `#f0b429`, red `#f85149`. Per-agent white-label overrides
(colors, logo, photo) for commercialization.

## Build order

1. Search → Results → Include/Exclude (the core agent comp-selection flow) ← current
2. Snapshot + report data assembly (lock comps, compute MOI/PSF/DOM)
3. Client portal shell with the 4 lifecycle states
4. Maintenance tracker + documents vault

## Schema

See `shared/schema.ts`. Tables: agents, clients, properties, cma_reports,
comparables, showings, showing_feedback, probability_config, magic_tokens, session.
Planned additions: market_snapshots, home_components, documents.
