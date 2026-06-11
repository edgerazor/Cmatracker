import { useMemo, useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import FilterPanel from "./FilterPanel";
import ResultsTable from "./ResultsTable";
import SelectionTray from "./SelectionTray";
import PropertyDetail from "./PropertyDetail";
import {
  MlsProperty, CmaFilters, DEFAULT_FILTERS, computeLiveStats, num,
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
  const since = new Date(Date.now() - filters.daysBack * 86400_000).toISOString().slice(0, 10);

  // One request per status (API filters one status at a time), merged client-side
  const requests = filters.statuses.map(async (status) => {
    const params = new URLSearchParams({ city: "Nanaimo", status, limit: "500" });
    if (filters.minPrice) params.set("minPrice", String(filters.minPrice));
    if (filters.maxPrice) params.set("maxPrice", String(filters.maxPrice));
    if (status === "Closed") params.set("startDate", since);
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

export default function CmaBuilder() {
  const [filters, setFilters] = useState<CmaFilters>(DEFAULT_FILTERS);
  const debouncedFilters = useDebounced(filters, 350);

  const [selected, setSelected] = useState<Map<string, MlsProperty>>(new Map());
  const [inspecting, setInspecting] = useState<MlsProperty | null>(null);

  const { data: rawResults = [], isFetching } = useQuery({
    queryKey: ["mls-search", debouncedFilters.statuses, debouncedFilters.minPrice, debouncedFilters.maxPrice, debouncedFilters.daysBack],
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
    return computeLiveStats(selectedList, totalActive, filters.daysBack);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, results, filters.daysBack]);

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
          <ResultsTable
            properties={results}
            selectedKeys={selectedKeys}
            onToggle={toggle}
            onInspect={setInspecting}
            loading={isFetching && !rawResults.length}
          />
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
