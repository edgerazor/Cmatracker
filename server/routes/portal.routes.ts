import { Router } from "express";
import { db } from "../db.js";
import {
  agents, clients, properties, cmaReports, comparables, showings,
  showingFeedback, probabilityConfig, homeComponents, documents,
} from "@shared/schema";
import { eq, desc, inArray } from "drizzle-orm";

const router = Router();

const MLS_API = process.env.MLS_API_URL!;
const MLS_KEY = process.env.MLS_API_KEY;

function requirePortalUser(req: any, res: any, next: any) {
  if (!req.session?.clientId && !req.session?.agentId) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

// GET /api/portal/me — full bundle for the logged-in client
router.get("/me", requirePortalUser, async (req, res) => {
  const clientId = req.session.clientId;
  if (!clientId) return res.status(403).json({ error: "Client session required" });

  const [client] = await db.select().from(clients).where(eq(clients.id, clientId));
  if (!client) return res.status(404).json({ error: "Client not found" });

  const [agent] = await db.select().from(agents).where(eq(agents.id, client.agentId));
  const props = await db.select().from(properties).where(eq(properties.clientId, clientId));

  const bundles = await Promise.all(
    props.map(async (p) => {
      const reports = await db
        .select()
        .from(cmaReports)
        .where(eq(cmaReports.propertyId, p.id))
        .orderBy(desc(cmaReports.createdAt));
      const latestReport = reports[0] ?? null;
      const comps = latestReport
        ? await db.select().from(comparables).where(eq(comparables.cmaReportId, latestReport.id))
        : [];
      const shows = await db
        .select()
        .from(showings)
        .where(eq(showings.propertyId, p.id))
        .orderBy(desc(showings.showingDate));
      const feedback = shows.length
        ? await db.select().from(showingFeedback).where(
            inArray(showingFeedback.showingId, shows.map((s) => s.id))
          )
        : [];
      const [probConfig] = await db
        .select()
        .from(probabilityConfig)
        .where(eq(probabilityConfig.propertyId, p.id));
      const components = await db
        .select()
        .from(homeComponents)
        .where(eq(homeComponents.propertyId, p.id));
      const docs = await db
        .select()
        .from(documents)
        .where(eq(documents.propertyId, p.id));

      return {
        property: p,
        cmaReport: latestReport,
        comparables: comps,
        showings: shows.map((s) => ({
          ...s,
          feedback: feedback.find((f) => f.showingId === s.id) ?? null,
        })),
        probabilityConfig: probConfig ?? null,
        homeComponents: components,
        documents: docs.filter((d) => d.visibleToClient),
      };
    })
  );

  res.json({
    client: { id: client.id, firstName: client.firstName, lastName: client.lastName, email: client.email },
    agent: agent
      ? { name: agent.name, title: agent.title, photoUrl: agent.photoUrl, brokerage: agent.brokerage, websiteUrl: agent.websiteUrl, phone: agent.phone, email: agent.email }
      : null,
    properties: bundles,
  });
});

// GET /api/portal/market/:propertyId — live market data through the client's lens
router.get("/market/:propertyId", requirePortalUser, async (req, res) => {
  const propertyId = Number(req.params.propertyId);
  const [prop] = await db.select().from(properties).where(eq(properties.id, propertyId));
  if (!prop) return res.status(404).json({ error: "Property not found" });

  // Authorization: client owns it, or any agent session
  if (req.session.clientId && prop.clientId !== req.session.clientId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  const cfg = (prop.marketConfig ?? {}) as {
    subAreas?: string[]; daysBack?: number; minPrice?: number; maxPrice?: number; propertySubTypes?: string[];
  };
  const daysBack = cfg.daysBack ?? 60;
  const since = new Date(Date.now() - daysBack * 86400_000).toISOString().slice(0, 10);

  const headers: Record<string, string> = MLS_KEY ? { "X-API-Key": MLS_KEY } : {};
  const statuses = ["Active", "Pending", "Closed"];

  const fetched = await Promise.all(
    statuses.map(async (status) => {
      const params = new URLSearchParams({ city: prop.city ?? "Nanaimo", status, limit: "500" });
      if (cfg.minPrice) params.set("minPrice", String(cfg.minPrice));
      if (cfg.maxPrice) params.set("maxPrice", String(cfg.maxPrice));
      if (status === "Closed") params.set("startDate", since);
      const r = await fetch(`${MLS_API}/api/v1/properties?${params}`, { headers });
      const j = await r.json();
      return (j.data ?? []) as any[];
    })
  );

  let listings = fetched.flat();
  if (cfg.subAreas?.length) {
    listings = listings.filter((l) => cfg.subAreas!.includes(l.subArea));
  }
  if (cfg.propertySubTypes?.length) {
    listings = listings.filter((l) => cfg.propertySubTypes!.includes(l.propertySubType));
  }
  // Listed-within-window filter for actives/pendings happens implicitly via DOM for now

  const num = (v: any) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };

  const mapped = listings
    .filter((l) => l.latitude && l.longitude)
    .map((l) => ({
      listingKey: l.listingKey,
      address: l.address,
      status: l.status,
      price: l.status === "Closed" ? num(l.closePrice) ?? num(l.listPrice) : num(l.listPrice),
      sqft: num(l.squareFeet),
      beds: l.bedrooms,
      baths: l.bathrooms,
      dom: l.daysOnMarket,
      lat: num(l.latitude),
      lng: num(l.longitude),
      photo: l.mainPhotoUrl,
      subArea: l.subArea,
      closeDate: l.closeDate,
    }));

  const sold = mapped.filter((l) => l.status === "Closed");
  const active = mapped.filter((l) => l.status === "Active");
  const pending = mapped.filter((l) => l.status === "Pending");
  const psfs = (list: typeof mapped) =>
    list.map((l) => (l.price && l.sqft ? l.price / l.sqft : null)).filter((v): v is number => v != null);
  const avg = (vals: number[]) => (vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null);
  const windowMonths = daysBack / 30.44;
  const moi = sold.length ? active.length / (sold.length / windowMonths) : null;

  res.json({
    config: { ...cfg, daysBack },
    listings: mapped,
    stats: {
      activeCount: active.length,
      pendingCount: pending.length,
      soldCount: sold.length,
      avgSoldPsf: avg(psfs(sold)),
      avgActivePsf: avg(psfs(active)),
      monthsOfInventory: moi,
      avgDomSold: avg(sold.map((l) => l.dom).filter((v): v is number => v != null)),
    },
  });
});

// POST /api/portal/request-evaluation — "Get an Updated Evaluation" button
router.post("/request-evaluation", requirePortalUser, async (req, res) => {
  // For now just acknowledge; later: notify agent via email/Slack
  console.log(`[LEAD] Client ${req.session.clientId} requested an updated evaluation for property ${req.body?.propertyId}`);
  res.json({ ok: true });
});

export default router;
