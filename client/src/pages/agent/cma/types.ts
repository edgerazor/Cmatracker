// MLS property as returned by the BridgeSyncEngine API (via our /api/mls proxy).
// Numeric fields arrive as strings from the API — normalize with num().
export interface MlsProperty {
  id: string;
  listingKey: string;
  mlsNumber: string | null;
  status: string; // Active | Pending | Closed | Expired | Canceled
  address: string | null;
  subArea: string | null;
  city: string;
  propertyType: string | null;
  propertySubType: string | null;
  listPrice: string | number | null;
  closePrice: string | number | null;
  originalListPrice: string | number | null;
  closeDate: string | null;
  listDate: string | null;
  daysOnMarket: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  squareFeet: number | null;
  lotSize: string | number | null;
  yearBuilt: number | null;
  layout: string | null;
  view: string[] | string | null;
  waterfrontYN: boolean | null;
  garageSpaces: number | null;
  basementYN: boolean | null;
  mainPhotoUrl: string | null;
  photoUrls: string[] | null;
  photosCount: number | null;
  publicRemarks: string | null;
  latitude: number | null;
  longitude: number | null;
  taxAssessedValue: string | number | null;
  strataFee: string | number | null;
  architecturalStyle: string | null;
}

export const num = (v: string | number | null | undefined): number | null => {
  if (v == null) return null;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : null;
};

/** Effective price: sold price for closed, list price otherwise */
export const effectivePrice = (p: MlsProperty): number | null =>
  p.status === "Closed" ? num(p.closePrice) ?? num(p.listPrice) : num(p.listPrice);

export const psf = (p: MlsProperty): number | null => {
  const price = effectivePrice(p);
  const sqft = p.squareFeet;
  if (!price || !sqft || sqft <= 0) return null;
  return price / sqft;
};

/** Per-status date window: either a rolling "last N days" preset or custom calendar dates */
export interface StatusWindow {
  daysBack: number | null;    // e.g. 60 = last 60 days; null = no rolling window
  from: string | null;        // custom range start (YYYY-MM-DD), overrides daysBack
  to: string | null;          // custom range end
}

export const ALL_TIME: StatusWindow = { daysBack: null, from: null, to: null };

export interface CmaFilters {
  statuses: string[];
  minPrice: number | null;
  maxPrice: number | null;
  subAreas: string[];
  propertySubTypes: string[];
  minBeds: number | null;
  minBaths: number | null;
  minSqft: number | null;
  maxSqft: number | null;
  minYearBuilt: number | null;
  maxYearBuilt: number | null;
  layouts: string[];
  waterfront: boolean | null;
  // Per-status date ranges, like Matrix (Active/Pending = list date, Sold = sale date)
  statusWindows: Record<string, StatusWindow>;
}

// Starts empty: the builder shows 0 matches until the agent picks criteria.
// Sold defaults to last 180 days (Matrix convention); Active/Pending unrestricted.
export const DEFAULT_FILTERS: CmaFilters = {
  statuses: [],
  minPrice: null,
  maxPrice: null,
  subAreas: [],
  propertySubTypes: [],
  minBeds: null,
  minBaths: null,
  minSqft: null,
  maxSqft: null,
  minYearBuilt: null,
  maxYearBuilt: null,
  layouts: [],
  waterfront: null,
  statusWindows: {
    Active: { ...ALL_TIME },
    Pending: { ...ALL_TIME },
    Closed: { daysBack: 180, from: null, to: null },
  },
};

/** Effective window length in days (for MOI math). Defaults to 180. */
export function windowDays(w: StatusWindow | undefined): number {
  if (!w) return 180;
  if (w.from && w.to) {
    const d = (new Date(w.to).getTime() - new Date(w.from).getTime()) / 86400_000;
    return d > 0 ? d : 180;
  }
  return w.daysBack ?? 180;
}

/** Does a property fall inside its status window? */
export function inWindow(p: MlsProperty, w: StatusWindow | undefined): boolean {
  if (!w || (w.daysBack == null && !w.from && !w.to)) return true;
  // Sold uses the sale date; Active/Pending use the list date
  const dateStr = p.status === "Closed" ? p.closeDate ?? p.listDate : p.listDate;
  if (w.from || w.to) {
    if (!dateStr) return true; // don't drop records missing dates on custom ranges
    const t = new Date(dateStr).getTime();
    if (w.from && t < new Date(w.from).getTime()) return false;
    if (w.to && t > new Date(w.to).getTime() + 86400_000) return false;
    return true;
  }
  if (w.daysBack != null) {
    if (dateStr) {
      return new Date(dateStr).getTime() >= Date.now() - w.daysBack * 86400_000;
    }
    // Fall back to days-on-market for actives/pendings missing a list date
    if (p.status !== "Closed" && p.daysOnMarket != null) {
      return p.daysOnMarket <= w.daysBack;
    }
  }
  return true;
}

export const NANAIMO_SUB_AREAS = [
  "Na Brechin Hill", "Na Cedar", "Na Central Nanaimo", "Na Chase River",
  "Na Departure Bay", "Na Diver Lake", "Na Extension", "Na Hammond Bay",
  "Na Lower Lantzville", "Na North Jingle Pot", "Na North Nanaimo", "Na Old City",
  "Na Pleasant Valley", "Na South Jingle Pot", "Na South Nanaimo",
  "Na University District", "Na Uplands", "Na Upper Lantzville",
] as const;

export const PROPERTY_SUB_TYPES = [
  "Single Family Residence", "Condo Apartment", "Townhouse", "Half Duplex",
  "Manufactured Home", "Land", "Multi Family", "Recreational", "Other",
] as const;

export const LAYOUTS = [
  "Rancher", "Main Level Entry with Lower Level(s)", "Main Level Entry with Upper Level(s)",
  "Main Level Entry with Lower/Upper Lvl(s)", "Ground Level Entry With Main Up",
  "Split Entry", "Condo", "Other",
] as const;

/** Live CMA stats computed from the currently selected comps */
export interface LiveStats {
  soldCount: number;
  pendingCount: number;
  activeCount: number;
  avgSoldPsf: number | null;
  avgPendingPsf: number | null;
  avgActivePsf: number | null;
  avgDomSold: number | null;
  avgDomActive: number | null;
  listToSellPct: number | null; // avg sold÷list price across sold comps, as %
  monthsOfInventory: number | null; // activeCount / (soldCount / windowMonths)
}

export function computeLiveStats(
  selected: MlsProperty[],
  totalActiveInMarket: number,
  daysBack: number
): LiveStats {
  const sold = selected.filter((p) => p.status === "Closed");
  const pending = selected.filter((p) => p.status === "Pending");
  const active = selected.filter((p) => p.status === "Active");

  const avg = (vals: number[]): number | null =>
    vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;

  const psfs = (list: MlsProperty[]) =>
    list.map(psf).filter((v): v is number => v != null);

  const windowMonths = daysBack / 30.44;
  const moi =
    sold.length > 0 && totalActiveInMarket > 0
      ? totalActiveInMarket / (sold.length / windowMonths)
      : null;

  const ratios = sold
    .map((p) => {
      const sp = num(p.closePrice), lp = num(p.listPrice);
      return sp && lp ? sp / lp : null;
    })
    .filter((v): v is number => v != null);

  return {
    soldCount: sold.length,
    pendingCount: pending.length,
    activeCount: active.length,
    avgSoldPsf: avg(psfs(sold)),
    avgPendingPsf: avg(psfs(pending)),
    avgActivePsf: avg(psfs(active)),
    avgDomSold: avg(sold.map((p) => p.daysOnMarket).filter((v): v is number => v != null)),
    avgDomActive: avg(active.map((p) => p.daysOnMarket).filter((v): v is number => v != null)),
    listToSellPct: ratios.length ? avg(ratios)! * 100 : null,
    monthsOfInventory: moi,
  };
}
