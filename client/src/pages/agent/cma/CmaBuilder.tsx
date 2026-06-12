import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import FilterPanel from "./FilterPanel";
import ResultsTable from "./ResultsTable";
import SelectionTray from "./SelectionTray";
import PropertyDetail from "./PropertyDetail";
import MarketMap from "../../../components/MarketMap";
import {
  MlsProperty, CmaFilters, DEFAULT_FILTERS, computeLiveStats, num, effectivePrice,
  inWindow, windowDays,
} from "./types";

/** Debounce filters so we don't refetch on every keystroke */
function useDebounced<T>(value: T, ms: number): T {
  const [debounced, setDebounced] = useState(value);
  useMemo(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

async function fetchMls(filters: CmaFilters): Promise<MlsProperty[]> {
  // One request per status (API filters one status at a time), merged client-side
  const requests = filters.statuses.map(async (status) => {
    const params = new URLSearchParams({ city: "Nanaimo", status, limit: "500" });
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    // Server-side date narrowing for solds (fine-grained filtering happens client-side)
    if (status === "Closed") {
      const w = filters.statusWindows[status];
      const start =
        w?.from ??
        (w?.daysBack != null
          ? new Date(Date.now() - w.daysBack * 86400_000).toISOString().slice(0, 10)
          : null);
      if (start) params.set("startDate", start);
      if (w?.to) params.set("endDate", w.to);
    }
    const res = await fetch(`/api/mls/properties?${params}`);
    if (!res.ok) throw new Error(`MLS API error ${res.status}`);
    const json = await res.json();
    return (json.data ?? []) as MlsProperty[];
  });

  const merged = (await Promise.all(requests)).flat();
  // Dedupe on listingKey
  return [...new Map(merged.map((p) => [p.listingKey, p])).values()];
}

/** Filters the API can't do server-side, applied locally */
function applyLocalFilters(props: MlsProperty[], f: CmaFilters): MlsProperty[] {
  return props.filter((p) => {
    if (!inWindow(p, f.statusWindows[p.status])) return false;
    if (f.subAreas.length && !f.subAreas.includes(p.subArea ?? "")) return false;
    if (f.propertySubTypes.length && !f.propertySubTypes.includes(p.propertySubType ?? "")) return false;
    if (f.minBeds != null && (p.bedrooms ?? 0) < f.minBeds) return false;
    if (f.minBaths != null && (p.bathrooms ?? 0) < f.minBaths) return false;
    if (f.minSqft != null && (p.squareFeet ?? 0) < f.minSqft) return false;
    if (f.maxSqft != null && (p.squareFeet ?? Infinity) > f.maxSqft) return false;
    if (f.minYearBuilt != null && (p.yearBuilt ?? 0) < f.minYearBuilt) return false;
    if (f.maxYearBuilt != null && (p.yearBuilt ?? Infinity) > f.maxYearBuilt) return false;
    if (f.layouts.length && !f.layouts.includes(p.layout ?? "")) return false;
    if (f.waterfront != null && Boolean(p.waterfrontYN) !== f.waterfront) return false;
    // Re-check price locally too (sold price vs list price nuance)
    const price = p.status === "Closed" ? num(p.closePrice) ?? num(p.listPrice) : num(p.listPrice);
    if (f.minPrice != null && (price ?? 0) < f.minPrice) return false;
    if (f.maxPrice != null && (price ?? Infinity) > f.maxPrice) return false;
    return true;
  });
}

/** Pre-results staging screen: agent builds criteria, watches the live count, then reveals */
function CriteriaStaging({
  count, loading, hasCriteria, onReveal,
}: { count: number; loading: boolean; hasCriteria: boolean; onReveal: () => void }) {
  return (
    <div className="flex-1 flex items-center justify-center">
      <div className="text-center max-w-sm px-6">
        <div
          className={`text-7xl font-extrabold tabular-nums transition-colors duration-300 ${
            count > 0 ? "text-white" : "text-[#21262d]"
          }`}
        >
          {loading ? <span className="text-[#30363d]">…</span> : count.toLocaleString()}
        </div>
        <div className="text-[11px] font-bold uppercase tracking-widest text-[#484f58] mt-2">
          Matching listings
        </div>

        {!hasCriteria ? (
          <p className="text-sm text-[#8b949e] mt-6 leading-relaxed">
            Start building your search on the left —<br />
            pick a <strong className="text-white">status</strong> and{" "}
            <strong className="text-white">property type</strong>, then narrow it down.
          </p>
        ) : (
          <p className="text-sm text-[#8b949e] mt-6">
            Keep narrowing, or reveal the results when the set looks right.
          </p>
        )}

        <button
          onClick={onReveal}
          disabled={count === 0}
          className={`mt-8 px-8 py-3 rounded-xl text-sm font-bold transition-all duration-200 ${
            count > 0
              ? "bg-gradient-to-r from-[#388bfd] to-[#58a6ff] text-white shadow-lg shadow-[#388bfd]/25 hover:shadow-[#388bfd]/40 hover:-translate-y-0.5"
              : "bg-[#161b22] text-[#484f58] border border-[#21262d] cursor-not-allowed"
          }`}
        >
          {count > 0 ? `Show ${count.toLocaleString()} matches →` : "Select criteria to begin"}
        </button>
      </div>
    </div>
  );
}

export default function CmaBuilder() {
  const [filters, setFilters] = useState<CmaFilters>(DEFAULT_FILTERS);
  const debouncedFilters = useDebounced(filters, 350);

  const [selected, setSelected] = useState<Map<string, MlsProperty>>(new Map());
  const [inspecting, setInspecting] = useState<MlsProperty | null>(null);
  const [view, setView] = useState<"list" | "map">("list");
  // Staged flow: build criteria first (live count only), then reveal results
  const [revealed, setRevealed] = useState(false);

  const { data: rawResults = [], isFetching } = useQuery({
    queryKey: [
      "mls-search",
      debouncedFilters.statuses,
      debouncedFilters.minPrice,
      debouncedFilters.maxPrice,
      debouncedFilters.statusWindows,
    ],
    queryFn: () => fetchMls(debouncedFilters),
    staleTime: 60_000,
  });

  const results = useMemo(
    () => applyLocalFilters(rawResults, debouncedFilters),
    [rawResults, debouncedFilters]
  );

  const selectedList = [...selected.values()];
  const selectedKeys = new Set(selected.keys());

  const stats = useMemo(() => {
    const totalActive = results.filter((p) => p.status === "Active").length;
    // MOI window = the sold comp window (how long the sales sample spans)
    return computeLiveStats(selectedList, totalActive, windowDays(filters.statusWindows.Closed));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, results, filters.statusWindows]);

  const toggle = (p: MlsProperty) => {
    setSelected((prev) => {
      const next = new Map(prev);
      if (next.has(p.listingKey)) next.delete(p.listingKey);
      else next.set(p.listingKey, p);
      return next;
    });
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d1117]">
      {/* Header */}
      <header className="shrink-0 border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur-md px-4 h-14 flex items-center gap-4 z-20">
        <Link
          href="/dashboard"
          className="text-[#484f58] hover:text-white transition-colors text-sm"
        >
          ←
        </Link>
        <div className="bg-[#1f3a5f] border border-[#388bfd] text-[#58a6ff] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
          CMA Builder
        </div>
        <div className="text-sm text-[#8b949e]">
          Select comparables → watch the CMA assemble live
        </div>

        {/* List / Map toggle */}
        <div className={`flex bg-[#161b22] border border-[#30363d] rounded-lg p-0.5 ml-2 transition-opacity ${revealed ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
          {(["list", "map"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-[11px] font-bold px-3.5 py-1.5 rounded-md transition-all ${
                view === v ? "bg-[#1f3a5f] text-[#58a6ff]" : "text-[#484f58] hover:text-[#8b949e]"
              }`}
            >
              {v === "list" ? "☰ List" : "◉ Map"}
            </button>
          ))}
        </div>

        <div className="flex-1" />
        <span className="text-[10px] text-[#484f58] uppercase tracking-widest font-semibold">
          {selected.size} selected
        </span>
      </header>

      {/* Workspace */}
      <div className="flex-1 flex min-h-0">
        <FilterPanel
          filters={filters}
          onChange={setFilters}
          resultCount={results.length}
          loading={isFetching}
        />
        <main className="flex-1 flex flex-col min-w-0">
          {!revealed ? (
            <CriteriaStaging
              count={results.length}
              loading={isFetching}
              hasCriteria={filters.statuses.length > 0}
              onReveal={() => setRevealed(true)}
            />
          ) : view === "list" ? (
            <ResultsTable
              properties={results}
              selectedKeys={selectedKeys}
              onToggle={toggle}
              onInspect={setInspecting}
              loading={isFetching && !rawResults.length}
            />
          ) : (
            <div className="flex-1 p-3">
              <MarketMap
                height="100%"
                selectedKeys={selectedKeys}
                listings={results
                  .filter((p) => p.latitude && p.longitude)
                  .map((p) => ({
                    listingKey: p.listingKey,
                    address: p.address,
                    status: p.status,
                    price: effectivePrice(p),
                    sqft: p.squareFeet,
                    beds: p.bedrooms,
                    baths: p.bathrooms,
                    dom: p.daysOnMarket,
                    lat: num(p.latitude as any),
                    lng: num(p.longitude as any),
                    photo: p.mainPhotoUrl,
                  }))}
                onSelect={(key) => {
                  const prop = results.find((r) => r.listingKey === key);
                  if (prop) setInspecting(prop);
                }}
              />
            </div>
          )}
        </main>
      </div>

      {/* Docked live-stats tray */}
      <SelectionTray
        selected={selectedList}
        stats={stats}
        onRemove={toggle}
        onFinalize={() => {
          // Next build step: snapshot comps + open report composer
          alert("Report composer is the next build step — comps are ready to snapshot.");
        }}
      />

      {/* Detail slide-over */}
      <PropertyDetail
        property={inspecting}
        isSelected={inspecting ? selectedKeys.has(inspecting.listingKey) : false}
        onClose={() => setInspecting(null)}
        onToggle={toggle}
      />
    </div>
  );
}
