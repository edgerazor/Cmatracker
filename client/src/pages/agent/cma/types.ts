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
  daysBack: number; // comp window, default 180
}

export const DEFAULT_FILTERS: CmaFilters = {
  statuses: ["Active", "Pending", "Closed"],
  minPrice: null,
  maxPrice: null,
  subAreas: [],
  propertySubTypes: ["Single Family Residence"],
  minBeds: null,
  minBaths: null,
  minSqft: null,
  maxSqft: null,
  minYearBuilt: null,
  maxYearBuilt: null,
  layouts: [],
  waterfront: null,
  daysBack: 180,
};

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

  return {
    soldCount: sold.length,
    pendingCount: pending.length,
    activeCount: active.length,
    avgSoldPsf: avg(psfs(sold)),
    avgPendingPsf: avg(psfs(pending)),
    avgActivePsf: avg(psfs(active)),
    avgDomSold: avg(sold.map((p) => p.daysOnMarket).filter((v): v is number => v != null)),
    monthsOfInventory: moi,
  };
}
