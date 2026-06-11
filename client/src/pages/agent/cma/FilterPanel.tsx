import { CmaFilters, NANAIMO_SUB_AREAS, PROPERTY_SUB_TYPES, LAYOUTS } from "./types";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  Active: { label: "Active", color: "#58a6ff", bg: "#1f3a5f" },
  Pending: { label: "Pending", color: "#f0b429", bg: "#3d2e00" },
  Closed: { label: "Sold", color: "#3fb950", bg: "#1e3a1e" },
};

interface Props {
  filters: CmaFilters;
  onChange: (f: CmaFilters) => void;
  resultCount: number;
  loading: boolean;
}

export default function FilterPanel({ filters, onChange, resultCount, loading }: Props) {
  const set = <K extends keyof CmaFilters>(key: K, value: CmaFilters[K]) =>
    onChange({ ...filters, [key]: value });

  const toggleIn = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  return (
    <aside className="w-72 shrink-0 border-r border-[#21262d] bg-[#0d1117] overflow-y-auto">
      <div className="p-4 space-y-6">
        {/* Live result count */}
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#8b949e] uppercase tracking-widest">Filters</h2>
          <span
            className={`text-xs font-bold px-2.5 py-1 rounded-full transition-all duration-300 ${
              loading ? "bg-[#21262d] text-[#484f58]" : "bg-[#1f3a5f] text-[#58a6ff]"
            }`}
          >
            {loading ? "…" : `${resultCount} matches`}
          </span>
        </div>

        {/* Status pills */}
        <Section label="Status">
          <div className="flex gap-2">
            {Object.entries(STATUS_META).map(([key, meta]) => {
              const on = filters.statuses.includes(key);
              return (
                <button
                  key={key}
                  onClick={() => set("statuses", toggleIn(filters.statuses, key))}
                  className="flex-1 text-xs font-semibold py-2 rounded-lg border transition-all duration-200"
                  style={{
                    background: on ? meta.bg : "transparent",
                    borderColor: on ? meta.color : "#30363d",
                    color: on ? meta.color : "#484f58",
                  }}
                >
                  {meta.label}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Price range */}
        <Section label="Price range">
          <div className="flex items-center gap-2">
            <PriceInput
              placeholder="Min"
              value={filters.minPrice}
              onChange={(v) => set("minPrice", v)}
            />
            <span className="text-[#484f58]">–</span>
            <PriceInput
              placeholder="Max"
              value={filters.maxPrice}
              onChange={(v) => set("maxPrice", v)}
            />
          </div>
          {/* Quick presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              ["< $700K", null, 700000],
              ["$700K–1M", 700000, 1000000],
              ["$1M–1.5M", 1000000, 1500000],
              ["$1.5M+", 1500000, null],
            ].map(([label, min, max]) => (
              <button
                key={label as string}
                onClick={() => onChange({ ...filters, minPrice: min as number | null, maxPrice: max as number | null })}
                className="text-[10px] font-medium px-2 py-1 rounded-md bg-[#161b22] border border-[#30363d] text-[#8b949e] hover:border-[#388bfd] hover:text-[#58a6ff] transition-colors"
              >
                {label as string}
              </button>
            ))}
          </div>
        </Section>

        {/* Sub areas */}
        <Section label="Sub area">
          <div className="flex flex-wrap gap-1.5">
            {NANAIMO_SUB_AREAS.map((area) => {
              const on = filters.subAreas.includes(area);
              return (
                <button
                  key={area}
                  onClick={() => set("subAreas", toggleIn(filters.subAreas, area))}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all duration-150 ${
                    on
                      ? "bg-[#1f3a5f] border-[#388bfd] text-[#58a6ff]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#484f58]"
                  }`}
                >
                  {area.replace(/^Na /, "")}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Property type */}
        <Section label="Property type">
          <div className="flex flex-wrap gap-1.5">
            {PROPERTY_SUB_TYPES.map((t) => {
              const on = filters.propertySubTypes.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => set("propertySubTypes", toggleIn(filters.propertySubTypes, t))}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all duration-150 ${
                    on
                      ? "bg-[#1f3a5f] border-[#388bfd] text-[#58a6ff]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#484f58]"
                  }`}
                >
                  {t === "Single Family Residence" ? "Single Family" : t}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Beds / Baths */}
        <Section label="Minimum beds / baths">
          <div className="grid grid-cols-2 gap-2">
            <Stepper label="Beds" value={filters.minBeds} onChange={(v) => set("minBeds", v)} />
            <Stepper label="Baths" value={filters.minBaths} onChange={(v) => set("minBaths", v)} />
          </div>
        </Section>

        {/* SqFt */}
        <Section label="Finished sq ft">
          <div className="flex items-center gap-2">
            <NumInput placeholder="Min" value={filters.minSqft} onChange={(v) => set("minSqft", v)} />
            <span className="text-[#484f58]">–</span>
            <NumInput placeholder="Max" value={filters.maxSqft} onChange={(v) => set("maxSqft", v)} />
          </div>
        </Section>

        {/* Year built */}
        <Section label="Year built">
          <div className="flex items-center gap-2">
            <NumInput placeholder="From" value={filters.minYearBuilt} onChange={(v) => set("minYearBuilt", v)} />
            <span className="text-[#484f58]">–</span>
            <NumInput placeholder="To" value={filters.maxYearBuilt} onChange={(v) => set("maxYearBuilt", v)} />
          </div>
        </Section>

        {/* Layout */}
        <Section label="Layout">
          <div className="flex flex-wrap gap-1.5">
            {LAYOUTS.map((l) => {
              const on = filters.layouts.includes(l);
              return (
                <button
                  key={l}
                  onClick={() => set("layouts", toggleIn(filters.layouts, l))}
                  className={`text-[10px] font-medium px-2 py-1 rounded-md border transition-all duration-150 ${
                    on
                      ? "bg-[#1f3a5f] border-[#388bfd] text-[#58a6ff]"
                      : "bg-[#161b22] border-[#30363d] text-[#8b949e] hover:border-[#484f58]"
                  }`}
                >
                  {l.replace("Main Level Entry with", "Main +")}
                </button>
              );
            })}
          </div>
        </Section>

        {/* Comp window */}
        <Section label="Comp window">
          <div className="flex gap-2">
            {[90, 180, 365].map((d) => (
              <button
                key={d}
                onClick={() => set("daysBack", d)}
                className={`flex-1 text-xs font-semibold py-2 rounded-lg border transition-all ${
                  filters.daysBack === d
                    ? "bg-[#1f3a5f] border-[#388bfd] text-[#58a6ff]"
                    : "border-[#30363d] text-[#484f58] hover:text-[#8b949e]"
                }`}
              >
                {d === 365 ? "1 yr" : `${d} days`}
              </button>
            ))}
          </div>
        </Section>
      </div>
    </aside>
  );
}

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#484f58] uppercase tracking-widest mb-2">{label}</div>
      {children}
    </div>
  );
}

function PriceInput({
  placeholder, value, onChange,
}: { placeholder: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="relative flex-1">
      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#484f58] text-xs">$</span>
      <input
        type="text"
        inputMode="numeric"
        placeholder={placeholder}
        value={value != null ? value.toLocaleString() : ""}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^0-9]/g, "");
          onChange(raw ? parseInt(raw, 10) : null);
        }}
        className="w-full bg-[#161b22] border border-[#30363d] rounded-lg pl-6 pr-2 py-2 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
      />
    </div>
  );
}

function NumInput({
  placeholder, value, onChange,
}: { placeholder: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={value ?? ""}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9]/g, "");
        onChange(raw ? parseInt(raw, 10) : null);
      }}
      className="flex-1 w-full bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-2 text-xs text-white placeholder-[#484f58] focus:outline-none focus:border-[#388bfd] transition-colors"
    />
  );
}

function Stepper({
  label, value, onChange,
}: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  return (
    <div className="flex items-center justify-between bg-[#161b22] border border-[#30363d] rounded-lg px-2.5 py-1.5">
      <span className="text-[10px] text-[#8b949e] font-medium">{label}</span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onChange(value && value > 1 ? value - 1 : null)}
          className="w-5 h-5 rounded text-[#8b949e] hover:bg-[#21262d] text-xs"
        >
          −
        </button>
        <span className="text-xs font-bold text-white w-5 text-center">{value ?? "—"}</span>
        <button
          onClick={() => onChange((value ?? 0) + 1)}
          className="w-5 h-5 rounded text-[#8b949e] hover:bg-[#21262d] text-xs"
        >
          +
        </button>
      </div>
    </div>
  );
}
