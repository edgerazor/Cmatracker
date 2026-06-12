import {
  pgTable,
  text,
  integer,
  real,
  boolean,
  timestamp,
  jsonb,
  uuid,
  serial,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── AGENTS (realtors using the system) ──────────────────────────────────────
export const agents = pgTable("agents", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  title: text("title"),           // e.g. "REALTOR® | eXp Realty"
  photoUrl: text("photo_url"),
  brokerage: text("brokerage"),
  // White-label brand
  primaryColor: text("primary_color").default("#388bfd"),
  accentColor: text("accent_color").default("#f0b429"),
  logoUrl: text("logo_url"),
  websiteUrl: text("website_url"),
  // Auth
  passwordHash: text("password_hash"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── CLIENTS ─────────────────────────────────────────────────────────────────
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PROPERTIES (client homes being evaluated or listed) ─────────────────────
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").notNull().references(() => clients.id),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  // Address
  address: text("address").notNull(),
  city: text("city").notNull().default("Nanaimo"),
  province: text("province").notNull().default("BC"),
  postalCode: text("postal_code"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  subArea: text("sub_area"),      // MLS sub-area code
  // Property details
  propertyType: text("property_type").default("Single Family"),
  yearBuilt: integer("year_built"),
  bedrooms: integer("bedrooms"),
  bathroomsFull: integer("bathrooms_full"),
  bathroomsHalf: integer("bathrooms_half"),
  sqft: integer("sqft"),
  lotSizeAcres: real("lot_size_acres"),
  stories: integer("stories"),
  layout: text("layout"),
  parkingSpaces: integer("parking_spaces"),
  garageSpaces: integer("garage_spaces"),
  waterfrontYn: boolean("waterfront_yn").default(false),
  description: text("description"),
  photoUrl: text("photo_url"),    // Main photo of subject property
  // Status
  status: text("status").notNull().default("cma"),  // cma | active | sold | expired
  mlsNumber: text("mls_number"),
  listPrice: integer("list_price"),
  soldPrice: integer("sold_price"),
  listDate: timestamp("list_date"),
  soldDate: timestamp("sold_date"),
  // Map boundary for pulling comps (GeoJSON)
  compBoundary: jsonb("comp_boundary"),
  // Per-client market lens: what this client's live tracker shows
  // { subAreas: string[], daysBack: number, minPrice?: number, maxPrice?: number, propertySubTypes?: string[] }
  marketConfig: jsonb("market_config"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── CMA REPORTS ─────────────────────────────────────────────────────────────
export const cmaReports = pgTable("cma_reports", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  agentId: integer("agent_id").notNull().references(() => agents.id),
  title: text("title"),
  // Agent's recommended price points
  priceOptionA: integer("price_option_a"),
  priceOptionALabel: text("price_option_a_label").default("Recommended Pricing"),
  priceOptionB: integer("price_option_b"),
  priceOptionBLabel: text("price_option_b_label").default("Premium Positioning"),
  // Market context (auto-calculated + manual override)
  monthsOfInventory: real("months_of_inventory"),
  activeListingsCount: integer("active_listings_count"),
  avgSoldPsf: real("avg_sold_psf"),
  avgPendingPsf: real("avg_pending_psf"),
  avgDomSold: integer("avg_dom_sold"),
  // Market warning text (editable by agent)
  marketWarning: text("market_warning"),
  // Context notes (global headwinds, etc.)
  contextNotes: jsonb("context_notes"),  // array of {title, text, type: 'danger'|'warn'|'info'}
  // Probability of selling (initial set by agent)
  probabilityPct: integer("probability_pct"),
  // Filters used to pull comps
  compFilters: jsonb("comp_filters"),  // {priceMin, priceMax, subArea, propertyType, daysBack}
  version: integer("version").default(1),
  sentToClientAt: timestamp("sent_to_client_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── COMPARABLES (comps selected for a CMA report) ───────────────────────────
export const comparables = pgTable("comparables", {
  id: serial("id").primaryKey(),
  cmaReportId: integer("cma_report_id").notNull().references(() => cmaReports.id),
  // MLS data (snapshotted at time of CMA)
  mlsListingKey: text("mls_listing_key"),
  address: text("address").notNull(),
  status: text("status").notNull(),  // Sold | Pending | Active
  listPrice: integer("list_price"),
  soldPrice: integer("sold_price"),
  sqft: integer("sqft"),
  psf: real("psf"),
  daysOnMarket: integer("days_on_market"),
  bedrooms: integer("bedrooms"),
  bathroomsFull: integer("bathrooms_full"),
  yearBuilt: integer("year_built"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  notes: text("notes"),              // Agent annotation
  isOutlier: boolean("is_outlier").default(false),
  sortOrder: integer("sort_order").default(0),
});

// ─── SHOWINGS ────────────────────────────────────────────────────────────────
export const showings = pgTable("showings", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  showingDate: timestamp("showing_date").notNull(),
  agentName: text("agent_name"),
  agentBrokerage: text("agent_brokerage"),
  agentPhone: text("agent_phone"),
  agentEmail: text("agent_email"),
  duration: integer("duration"),   // minutes
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SHOWING FEEDBACK ────────────────────────────────────────────────────────
export const showingFeedback = pgTable("showing_feedback", {
  id: serial("id").primaryKey(),
  showingId: integer("showing_id").notNull().references(() => showings.id),
  rating: integer("rating"),        // 1–5
  priceOpinion: text("price_opinion"),  // too_high | fair | good_value
  likedFeatures: text("liked_features"),
  concerns: text("concerns"),
  likelyToOffer: boolean("likely_to_offer"),
  rawText: text("raw_text"),        // original email/text from showing agent
  enteredBy: text("entered_by"),   // "leon" or "system"
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── PROBABILITY CONFIG (per property, agent-managed weights) ────────────────
export const probabilityConfig = pgTable("probability_config", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id).unique(),
  baselinePct: integer("baseline_pct").notNull().default(75),
  // Weight rules — how much to subtract per condition
  penaltyPerWeekNoShowings: real("penalty_per_week_no_showings").default(1.5),
  noShowingWeeksThreshold: integer("no_showing_weeks_threshold").default(3),
  penaltyPer10Showings: real("penalty_per_10_showings").default(5.0),
  penaltyPerMonthOverdue: real("penalty_per_month_overdue").default(2.0),
  moiImpactWeight: real("moi_impact_weight").default(1.0),
  // Snapshot of MOI at listing start (for delta calculation)
  moiAtListing: real("moi_at_listing"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// ─── MARKET SNAPSHOTS (live tracker stats recorded over time) ────────────────
export const marketSnapshots = pgTable("market_snapshots", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  snapshotDate: timestamp("snapshot_date").defaultNow(),
  monthsOfInventory: real("months_of_inventory"),
  activeCount: integer("active_count"),
  pendingCount: integer("pending_count"),
  soldCount: integer("sold_count"),       // within the filter window
  avgSoldPsf: real("avg_sold_psf"),
  avgPendingPsf: real("avg_pending_psf"),
  avgActivePsf: real("avg_active_psf"),
  avgDomSold: integer("avg_dom_sold"),
  newListings: jsonb("new_listings"),     // listings that appeared since last snapshot
  newSales: jsonb("new_sales"),           // sales that closed since last snapshot
});

// ─── DOCUMENTS VAULT (per property: contracts, inspections, warranties) ──────
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  title: text("title").notNull(),
  category: text("category").notNull().default("other"), // contract | inspection | disclosure | warranty | other
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(),
  fileSize: integer("file_size"),         // bytes
  mimeType: text("mime_type"),
  uploadedBy: text("uploaded_by"),        // agent | client
  visibleToClient: boolean("visible_to_client").default(true),
  expiryDate: timestamp("expiry_date"),   // for warranties — drives alerts
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── HOME COMPONENTS (maintenance tracker: roof, furnace, hot water…) ────────
export const homeComponents = pgTable("home_components", {
  id: serial("id").primaryKey(),
  propertyId: integer("property_id").notNull().references(() => properties.id),
  componentType: text("component_type").notNull(), // roof | furnace | heat_pump | hot_water_tank | hot_water_tankless | appliance | other
  label: text("label").notNull(),                  // "Asphalt shingle roof", "Rheem 50gal tank"
  installedYear: integer("installed_year"),
  expectedLifespanYears: integer("expected_lifespan_years"),
  lastServicedAt: timestamp("last_serviced_at"),
  serviceIntervalMonths: integer("service_interval_months"), // seasonal reminders
  notes: text("notes"),                            // model #, contractor contact, paint color
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── MAGIC LINK TOKENS ───────────────────────────────────────────────────────
export const magicTokens = pgTable("magic_tokens", {
  id: serial("id").primaryKey(),
  token: uuid("token").notNull().unique().defaultRandom(),
  email: text("email").notNull(),
  userType: text("user_type").notNull(),  // agent | client
  userId: integer("user_id").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// ─── SESSION STORE (express-session) ─────────────────────────────────────────
export const sessions = pgTable("session", {
  sid: text("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// ─── RELATIONS ───────────────────────────────────────────────────────────────
export const agentsRelations = relations(agents, ({ many }) => ({
  clients: many(clients),
  properties: many(properties),
  cmaReports: many(cmaReports),
}));

export const clientsRelations = relations(clients, ({ one, many }) => ({
  agent: one(agents, { fields: [clients.agentId], references: [agents.id] }),
  properties: many(properties),
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  client: one(clients, { fields: [properties.clientId], references: [clients.id] }),
  agent: one(agents, { fields: [properties.agentId], references: [agents.id] }),
  cmaReports: many(cmaReports),
  showings: many(showings),
  probabilityConfig: one(probabilityConfig),
}));

export const cmaReportsRelations = relations(cmaReports, ({ one, many }) => ({
  property: one(properties, { fields: [cmaReports.propertyId], references: [properties.id] }),
  agent: one(agents, { fields: [cmaReports.agentId], references: [agents.id] }),
  comparables: many(comparables),
}));

export const showingsRelations = relations(showings, ({ one, many }) => ({
  property: one(properties, { fields: [showings.propertyId], references: [properties.id] }),
  feedback: many(showingFeedback),
}));

// ─── TYPES ───────────────────────────────────────────────────────────────────
export type Agent = typeof agents.$inferSelect;
export type InsertAgent = typeof agents.$inferInsert;
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;
export type Property = typeof properties.$inferSelect;
export type InsertProperty = typeof properties.$inferInsert;
export type CmaReport = typeof cmaReports.$inferSelect;
export type InsertCmaReport = typeof cmaReports.$inferInsert;
export type Comparable = typeof comparables.$inferSelect;
export type InsertComparable = typeof comparables.$inferInsert;
export type Showing = typeof showings.$inferSelect;
export type InsertShowing = typeof showings.$inferInsert;
export type ShowingFeedback = typeof showingFeedback.$inferSelect;
export type InsertShowingFeedback = typeof showingFeedback.$inferInsert;
export type ProbabilityConfig = typeof probabilityConfig.$inferSelect;
export type MarketSnapshot = typeof marketSnapshots.$inferSelect;
export type InsertMarketSnapshot = typeof marketSnapshots.$inferInsert;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = typeof documents.$inferInsert;
export type HomeComponent = typeof homeComponents.$inferSelect;
export type InsertHomeComponent = typeof homeComponents.$inferInsert;
