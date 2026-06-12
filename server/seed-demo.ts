/**
 * Demo seed: creates three persona clients for Derek
 *  - SELLER  James & Linda Carter — 2566 Steve Ellis Rd (Derek's real active listing)
 *  - PROSPECT Susan Mitchell — Hammond Bay home, CMA done, not listed
 *  - BUYER   David & Emma Chen — recently purchased in Departure Bay
 *
 * Run: npx tsx server/seed-demo.ts
 */
import "dotenv/config";
import { db } from "./db.js";
import {
  agents, clients, properties, cmaReports, comparables, showings,
  showingFeedback, probabilityConfig, homeComponents, documents,
} from "@shared/schema";
import { eq } from "drizzle-orm";

const MLS_API = process.env.MLS_API_URL!;
const MLS_KEY = process.env.MLS_API_KEY!;

async function mls(params: Record<string, string>) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${MLS_API}/api/v1/properties?${qs}`, {
    headers: { "X-API-Key": MLS_KEY },
  });
  const json = await res.json();
  return (json.data ?? []) as any[];
}

async function main() {
  // ── Agent ──────────────────────────────────────────────────────────────────
  let [derek] = await db.select().from(agents).where(eq(agents.email, "derekgillette1@gmail.com"));
  if (!derek) {
    [derek] = await db.insert(agents).values({
      name: "Derek Gillette",
      email: "derekgillette1@gmail.com",
      title: "REALTOR® · eXp Realty",
      brokerage: "eXp Realty",
      websiteUrl: "https://derekgillette.com",
      isAdmin: true,
    }).returning();
  }
  console.log("Agent:", derek.name);

  // Wipe previous demo data (idempotent re-seed)
  const demoEmails = ["carters@example.com", "susan.m@example.com", "chens@example.com"];
  for (const email of demoEmails) {
    const [c] = await db.select().from(clients).where(eq(clients.email, email));
    if (!c) continue;
    const props = await db.select().from(properties).where(eq(properties.clientId, c.id));
    for (const p of props) {
      const reports = await db.select().from(cmaReports).where(eq(cmaReports.propertyId, p.id));
      for (const r of reports) await db.delete(comparables).where(eq(comparables.cmaReportId, r.id));
      await db.delete(cmaReports).where(eq(cmaReports.propertyId, p.id));
      const shows = await db.select().from(showings).where(eq(showings.propertyId, p.id));
      for (const s of shows) await db.delete(showingFeedback).where(eq(showingFeedback.showingId, s.id));
      await db.delete(showings).where(eq(showings.propertyId, p.id));
      await db.delete(probabilityConfig).where(eq(probabilityConfig.propertyId, p.id));
      await db.delete(homeComponents).where(eq(homeComponents.propertyId, p.id));
      await db.delete(documents).where(eq(documents.propertyId, p.id));
      await db.delete(properties).where(eq(properties.id, p.id));
    }
    await db.delete(clients).where(eq(clients.id, c.id));
  }

  // ── Pull Derek's REAL Steve Ellis listing from MLS ─────────────────────────
  const actives = await mls({ city: "Nanaimo", status: "Active", limit: "500" });
  const steveEllis = actives.find((p) => (p.address ?? "").toLowerCase().includes("steve ellis"));
  if (!steveEllis) throw new Error("Steve Ellis listing not found in MLS data");
  console.log("Found real listing:", steveEllis.address, "$" + Number(steveEllis.listPrice).toLocaleString());

  // ── 1. SELLER — James & Linda Carter @ 2566 Steve Ellis Rd ─────────────────
  const [carter] = await db.insert(clients).values({
    agentId: derek.id,
    firstName: "James",
    lastName: "Carter",
    email: "carters@example.com",
    phone: "250-555-0142",
    notes: "Demo seller persona — real listing data",
  }).returning();

  const listDate = new Date(Date.now() - (steveEllis.daysOnMarket ?? 19) * 86400_000);
  const [sellerProp] = await db.insert(properties).values({
    clientId: carter.id,
    agentId: derek.id,
    address: "2566 Steve Ellis Rd",
    city: "Nanaimo",
    postalCode: "V9R 0J7",
    latitude: Number(steveEllis.latitude),
    longitude: Number(steveEllis.longitude),
    subArea: steveEllis.subArea,
    propertyType: "Single Family",
    yearBuilt: steveEllis.yearBuilt,
    bedrooms: steveEllis.bedrooms,
    bathroomsFull: Math.floor(steveEllis.bathrooms ?? 4),
    sqft: Number(steveEllis.squareFeet),
    lotSizeAcres: 2.0,
    description: "Stunning 2020-built family home on 2 private acres in North Jingle Pot.",
    photoUrl: steveEllis.mainPhotoUrl,
    status: "active",
    mlsNumber: steveEllis.mlsNumber,
    listPrice: Number(steveEllis.listPrice),
    listDate,
    marketConfig: {
      subAreas: ["Na North Jingle Pot", "Na South Jingle Pot", "Na Uplands", "Na Hammond Bay"],
      daysBack: 180,
      minPrice: 1_700_000,
      maxPrice: 2_500_000,
      propertySubTypes: ["Single Family Residence"],
    },
  }).returning();

  await db.insert(probabilityConfig).values({
    propertyId: sellerProp.id,
    baselinePct: 65,
    moiAtListing: 18.4,
  });

  // CMA report (locked snapshot — from Derek's actual May 2026 evaluation)
  const [sellerCma] = await db.insert(cmaReports).values({
    propertyId: sellerProp.id,
    agentId: derek.id,
    title: "2566 Steve Ellis Road — Comparative Market Analysis",
    priceOptionA: 2_000_000,
    priceOptionALabel: "Recommended Pricing in Today's Market",
    priceOptionB: 2_250_000,
    priceOptionBLabel: "Premium Positioning",
    monthsOfInventory: 46.8,
    activeListingsCount: 40,
    avgSoldPsf: 416,
    avgPendingPsf: 486,
    avgDomSold: 95,
    marketWarning:
      "This segment carries 46.8 months of inventory — nearly 4 years of supply at current absorption. Pricing strategy must reflect these conditions to attract qualified offers against 40 competing active listings.",
    probabilityPct: 65,
    compFilters: {
      statuses: ["Active", "Pending", "Closed"],
      minPrice: 1_700_000, maxPrice: 2_500_000,
      subAreas: [], propertySubTypes: ["Single Family Residence"], daysBack: 180,
    },
    sentToClientAt: new Date("2026-05-21"),
    createdAt: new Date("2026-05-21"),
  }).returning();

  const cmaComps = [
    { address: "2687 Jingle Pot Rd", status: "Sold", soldPrice: 1_690_000, sqft: 3464, psf: 488, daysOnMarket: 130 },
    { address: "4954 Fillinger Cres", status: "Sold", soldPrice: 1_840_000, sqft: 4179, psf: 440, daysOnMarket: 22 },
    { address: "104 Whitefish Pl SE", status: "Sold", soldPrice: 1_888_888, sqft: 5350, psf: 353, daysOnMarket: 175 },
    { address: "1390 Kurtis Cres", status: "Sold", soldPrice: 2_000_000, sqft: 5080, psf: 394, daysOnMarket: 13 },
    { address: "2233 Ashlee Rd", status: "Sold", soldPrice: 2_325_000, sqft: 5750, psf: 404, daysOnMarket: 133 },
    { address: "2700 Ritten Rd", status: "Pending", listPrice: 1_600_000, sqft: 3070, psf: 521, daysOnMarket: 50 },
    { address: "7046 Leland Rd", status: "Pending", listPrice: 1_750_000, sqft: 3278, psf: 534, daysOnMarket: 23 },
    { address: "3281 McGuire Way", status: "Pending", listPrice: 1_950_000, sqft: 6115, psf: 319, daysOnMarket: 173 },
    { address: "7490 Copley Ridge Dr", status: "Pending", listPrice: 2_149_000, sqft: 3792, psf: 567, daysOnMarket: 53 },
    { address: "7255 Aulds Rd", status: "Pending", listPrice: 2_410_000, sqft: 4906, psf: 491, daysOnMarket: 25 },
  ];
  await db.insert(comparables).values(
    cmaComps.map((c, i) => ({ cmaReportId: sellerCma.id, sortOrder: i, ...c }))
  );

  // Showings + feedback over the 19 days on market
  const showingData = [
    { d: 2, agent: "Patricia Wong", brok: "RE/MAX of Nanaimo", rating: 4, op: "fair", liked: "Loved the acreage and the modern kitchen", concerns: "Wanted a triple garage", offer: false },
    { d: 4, agent: "Mike Sorensen", brok: "Royal LePage", rating: 3, op: "too_high", liked: "Quality of the 2020 build", concerns: "Felt priced above recent solds in the area", offer: false },
    { d: 7, agent: "Jenna Phillips", brok: "460 Realty", rating: 5, op: "fair", liked: "Privacy, layout, and the view from the deck", concerns: "None — clients are comparing with one other property", offer: true },
    { d: 11, agent: "Carlos Ruiz", brok: "eXp Realty", rating: 4, op: "fair", liked: "The 2-acre lot — rare at this price point", concerns: "Commute distance for one spouse", offer: false },
    { d: 15, agent: "Aman Gill", brok: "Sutton Group", rating: 3, op: "too_high", liked: "Finishings and natural light", concerns: "Budget tops out at $2.1M", offer: false },
    { d: 18, agent: "Patricia Wong", brok: "RE/MAX of Nanaimo", rating: 5, op: "good_value", liked: "Second showing — clients measuring for furniture", concerns: "Possession timing", offer: true },
  ];
  for (const s of showingData) {
    const [show] = await db.insert(showings).values({
      propertyId: sellerProp.id,
      showingDate: new Date(listDate.getTime() + s.d * 86400_000),
      agentName: s.agent,
      agentBrokerage: s.brok,
      duration: 45,
    }).returning();
    await db.insert(showingFeedback).values({
      showingId: show.id,
      rating: s.rating,
      priceOpinion: s.op,
      likedFeatures: s.liked,
      concerns: s.concerns,
      likelyToOffer: s.offer,
      enteredBy: "leon",
    });
  }

  // Documents
  await db.insert(documents).values([
    { propertyId: sellerProp.id, title: "Listing Agreement", category: "contract", fileName: "listing-agreement.pdf", fileUrl: "#", uploadedBy: "agent" },
    { propertyId: sellerProp.id, title: "Property Disclosure Statement", category: "disclosure", fileName: "pds.pdf", fileUrl: "#", uploadedBy: "agent" },
    { propertyId: sellerProp.id, title: "Floor Plan & Measurements", category: "other", fileName: "floorplan.pdf", fileUrl: "#", uploadedBy: "agent" },
  ]);

  console.log("Seller seeded:", sellerProp.address);

  // ── 2. PROSPECT — Susan Mitchell @ Hammond Bay ──────────────────────────────
  const [susan] = await db.insert(clients).values({
    agentId: derek.id,
    firstName: "Susan",
    lastName: "Mitchell",
    email: "susan.m@example.com",
    phone: "250-555-0177",
    notes: "Demo prospect persona — CMA done March 2026, waiting to list",
  }).returning();

  const [prospectProp] = await db.insert(properties).values({
    clientId: susan.id,
    agentId: derek.id,
    address: "5417 Kenwill Dr",
    city: "Nanaimo",
    latitude: 49.2355,
    longitude: -123.9698,
    subArea: "Na Hammond Bay",
    propertyType: "Single Family",
    yearBuilt: 1998,
    bedrooms: 4,
    bathroomsFull: 3,
    sqft: 2450,
    lotSizeAcres: 0.21,
    description: "Ocean-glimpse family home near Linley Valley trails.",
    status: "cma",
    marketConfig: {
      subAreas: ["Na Hammond Bay"],
      daysBack: 60,
      minPrice: 800_000,
      maxPrice: 1_400_000,
      propertySubTypes: ["Single Family Residence"],
    },
  }).returning();

  const [prospectCma] = await db.insert(cmaReports).values({
    propertyId: prospectProp.id,
    agentId: derek.id,
    title: "5417 Kenwill Drive — Home Evaluation",
    priceOptionA: 1_095_000,
    priceOptionALabel: "Recommended Pricing",
    priceOptionB: 1_175_000,
    priceOptionBLabel: "Premium Positioning",
    monthsOfInventory: 5.2,
    activeListingsCount: 27,
    avgSoldPsf: 442,
    avgPendingPsf: 451,
    avgDomSold: 31,
    marketWarning: null,
    probabilityPct: 82,
    compFilters: { statuses: ["Active", "Pending", "Closed"], minPrice: 800_000, maxPrice: 1_400_000, subAreas: ["Na Hammond Bay"], propertySubTypes: ["Single Family Residence"], daysBack: 60 },
    sentToClientAt: new Date("2026-03-14"),
    createdAt: new Date("2026-03-14"),
  }).returning();

  await db.insert(comparables).values([
    { cmaReportId: prospectCma.id, address: "5340 Georgiaview Cres", status: "Sold", soldPrice: 1_052_000, sqft: 2380, psf: 442, daysOnMarket: 24, sortOrder: 0 },
    { cmaReportId: prospectCma.id, address: "5685 Malibu Terr", status: "Sold", soldPrice: 1_149_000, sqft: 2610, psf: 440, daysOnMarket: 38, sortOrder: 1 },
    { cmaReportId: prospectCma.id, address: "5142 Fillinger Cres", status: "Pending", listPrice: 1_199_900, sqft: 2705, psf: 444, daysOnMarket: 19, sortOrder: 2 },
  ]);

  console.log("Prospect seeded:", prospectProp.address);

  // ── 3. BUYER — David & Emma Chen, recently purchased ────────────────────────
  // Use a REAL sold Departure Bay listing so coords + photos are genuine
  const solds = await mls({ city: "Nanaimo", status: "Closed", limit: "500" });
  const purchase = solds.find(
    (p) => p.subArea === "Na Departure Bay" && p.latitude && p.mainPhotoUrl &&
           p.propertySubType === "Single Family Residence"
  );
  if (!purchase) throw new Error("No sold Departure Bay listing found");
  console.log("Buyer purchase (real sold listing):", purchase.address);

  const [chen] = await db.insert(clients).values({
    agentId: derek.id,
    firstName: "David",
    lastName: "Chen",
    email: "chens@example.com",
    phone: "250-555-0123",
    notes: "Demo buyer persona — real sold listing data",
  }).returning();

  const [buyerProp] = await db.insert(properties).values({
    clientId: chen.id,
    agentId: derek.id,
    address: purchase.address?.split(",")[0] ?? "3120 Robin Hood Dr",
    city: "Nanaimo",
    latitude: Number(purchase.latitude),
    longitude: Number(purchase.longitude),
    subArea: "Na Departure Bay",
    propertyType: "Single Family",
    yearBuilt: purchase.yearBuilt,
    bedrooms: purchase.bedrooms,
    bathroomsFull: Math.floor(purchase.bathrooms ?? 2),
    sqft: Math.round(Number(purchase.squareFeet) || 1900),
    description: "The Chens' family home in Departure Bay.",
    photoUrl: purchase.mainPhotoUrl,
    status: "purchased",
    soldPrice: Number(purchase.closePrice),
    soldDate: purchase.closeDate ? new Date(purchase.closeDate) : new Date("2026-02-27"),
    marketConfig: {
      subAreas: ["Na Departure Bay"],
      daysBack: 60,
      propertySubTypes: ["Single Family Residence"],
    },
  }).returning();

  await db.insert(homeComponents).values([
    { propertyId: buyerProp.id, componentType: "roof", label: "Asphalt shingle roof", installedYear: 2012, expectedLifespanYears: 22, notes: "South face shows moderate moss — inspection report p.4" },
    { propertyId: buyerProp.id, componentType: "furnace", label: "Lennox gas furnace", installedYear: 2016, expectedLifespanYears: 18, serviceIntervalMonths: 12, lastServicedAt: new Date("2025-10-15") },
    { propertyId: buyerProp.id, componentType: "hot_water_tank", label: "Rheem 50gal hot water tank", installedYear: 2019, expectedLifespanYears: 11 },
    { propertyId: buyerProp.id, componentType: "appliance", label: "Heat pump (ductless mini-split)", installedYear: 2022, expectedLifespanYears: 16, serviceIntervalMonths: 12, lastServicedAt: new Date("2025-06-20") },
  ]);

  await db.insert(documents).values([
    { propertyId: buyerProp.id, title: "Purchase Contract", category: "contract", fileName: "cps.pdf", fileUrl: "#", uploadedBy: "agent" },
    { propertyId: buyerProp.id, title: "Home Inspection Report", category: "inspection", fileName: "inspection-feb2026.pdf", fileUrl: "#", uploadedBy: "agent" },
    { propertyId: buyerProp.id, title: "Title Insurance", category: "other", fileName: "title.pdf", fileUrl: "#", uploadedBy: "agent" },
  ]);

  console.log("Buyer seeded:", buyerProp.address);
  console.log("\nDemo personas ready:");
  console.log("  Seller   carters@example.com  → 2566 Steve Ellis Rd (real listing)");
  console.log("  Prospect susan.m@example.com  → 5417 Kenwill Dr (Hammond Bay, 60-day lens)");
  console.log("  Buyer    chens@example.com    → 3719 Departure Bay Rd");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
