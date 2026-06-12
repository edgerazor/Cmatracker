import { useState } from "react";
import { MlsProperty, effectivePrice, psf, num } from "./types";

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  Active: { label: "ACTIVE", cls: "bg-[#1f3a5f] text-[#58a6ff] border-[#388bfd]" },
  Pending: { label: "PENDING", cls: "bg-[#3d2e00] text-[#f0b429] border-[#d29922]" },
  Closed: { label: "SOLD", cls: "bg-[#1e3a1e] text-[#3fb950] border-[#3fb950]" },
  Expired: { label: "EXPIRED", cls: "bg-[#21262d] text-[#8b949e] border-[#30363d]" },
  Canceled: { label: "CANCELLED", cls: "bg-[#21262d] text-[#8b949e] border-[#30363d]" },
};

type SortKey = "price" | "psf" | "sqft" | "dom" | "yearBuilt" | "address";

interface Props {
  properties: MlsProperty[];
  selectedKeys: Set<string>;
  onToggle: (p: MlsProperty) => void;
  onInspect: (p: MlsProperty) => void;
  loading: boolean;
}

export default function ResultsTable({ properties, selectedKeys, onToggle, onInspect, loading }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("price");
  const [sortDir, setSortDir] = useState<1 | -1>(1);

  const sorted = [...properties].sort((a, b) => {
    const get = (p: MlsProperty): number | string => {
      switch (sortKey) {
        case "price": return effectivePrice(p) ?? 0;
        case "psf": return psf(p) ?? 0;
        case "sqft": return p.squareFeet ?? 0;
        case "dom": return p.daysOnMarket ?? 0;
        case "yearBuilt": return p.yearBuilt ?? 0;
        case "address": return p.address ?? "";
      }
    };
    const av = get(a), bv = get(b);
    return (av < bv ? -1 : av > bv ? 1 : 0) * sortDir;
  });

  const header = (key: SortKey, label: string, align = "text-right") => (
    <th
      onClick={() => {
        if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
        else { setSortKey(key); setSortDir(1); }
      }}
      className={`${align} px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58] cursor-pointer hover:text-[#8b949e] transition-colors select-none whitespace-nowrap`}
    >
      {label}
      {sortKey === key && <span className="ml-1 text-[#58a6ff]">{sortDir === 1 ? "↑" : "↓"}</span>}
    </th>
  );

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#21262d] border-t-[#388bfd] rounded-full animate-spin" />
          <span className="text-xs text-[#484f58]">Searching MLS…</span>
        </div>
      </div>
    );
  }

  if (!properties.length) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-xs">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm text-[#8b949e] font-medium">No matches</p>
          <p className="text-xs text-[#484f58] mt-1">Widen the price range or add more sub-areas.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 bg-[#0d1117] z-10 shadow-[0_1px_0_#21262d]">
          <tr>
            <th className="w-10" />
            <th className="w-14" />
            {header("address", "Address", "text-left")}
            <th className="text-left px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Status</th>
            {header("price", "Price")}
            {header("sqft", "Fin SqFt")}
            {header("psf", "$/SqFt")}
            {header("dom", "DOM")}
            <th className="text-right px-3 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#484f58]">Bd/Ba</th>
            {header("yearBuilt", "Built")}
            <th className="w-12" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => {
            const selected = selectedKeys.has(p.listingKey);
            const badge = STATUS_BADGE[p.status] ?? STATUS_BADGE.Expired;
            const price = effectivePrice(p);
            const pPsf = psf(p);
            return (
              <tr
                key={p.listingKey}
                onClick={() => onToggle(p)}
                className={`group cursor-pointer transition-all duration-150 border-b border-[#161b22] ${
                  selected
                    ? "bg-[#388bfd]/[0.08] hover:bg-[#388bfd]/[0.12]"
                    : "hover:bg-white/[0.025]"
                }`}
              >
                {/* Selection indicator */}
                <td className="pl-3">
                  <div
                    className={`w-4.5 h-4.5 w-[18px] h-[18px] rounded-md border flex items-center justify-center text-[10px] font-bold transition-all duration-200 ${
                      selected
                        ? "bg-[#388bfd] border-[#388bfd] text-white scale-100"
                        : "border-[#30363d] text-transparent group-hover:border-[#484f58]"
                    }`}
                  >
                    ✓
                  </div>
                </td>
                {/* Thumbnail */}
                <td className="py-2.5 pr-2">
                  {p.mainPhotoUrl ? (
                    <img
                      src={p.mainPhotoUrl}
                      alt=""
                      loading="lazy"
                      className="w-24 h-16 max-w-none object-cover rounded-lg border border-[#21262d] group-hover:scale-[1.03] transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-24 h-16 rounded-lg bg-[#161b22] border border-[#21262d] flex items-center justify-center text-[#30363d] text-lg">
                      🏠
                    </div>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="text-[13px] font-semibold text-white leading-tight whitespace-nowrap">
                    {(p.address ?? "—").replace(/, Nanaimo BC.*$/, "")}
                  </div>
                  <div className="text-[10px] text-[#484f58] mt-1 whitespace-nowrap">
                    {p.subArea?.replace(/^Na /, "")} {p.layout ? `· ${p.layout.replace("Main Level Entry with", "Main +")}` : ""}
                  </div>
                </td>
                <td className="px-3">
                  <span className={`inline-block text-[9px] font-bold px-1.5 py-0.5 rounded border ${badge.cls}`}>
                    {badge.label}
                  </span>
                </td>
                <td className="px-3 text-right">
                  <span className="text-[13px] font-bold text-white tabular-nums">
                    {price ? `$${price.toLocaleString()}` : "—"}
                  </span>
                  {p.status === "Closed" && num(p.listPrice) && num(p.closePrice) && num(p.listPrice) !== num(p.closePrice) && (
                    <div className="text-[9px] text-[#484f58] tabular-nums">
                      list ${num(p.listPrice)!.toLocaleString()}
                    </div>
                  )}
                </td>
                <td className="px-3 text-right text-xs text-[#8b949e] tabular-nums">
                  {p.squareFeet ? p.squareFeet.toLocaleString() : "—"}
                </td>
                <td className="px-3 text-right">
                  <span className="text-xs font-semibold text-[#e6edf3] tabular-nums">
                    {pPsf ? `$${Math.round(pPsf)}` : "—"}
                  </span>
                </td>
                <td className="px-3 text-right text-xs text-[#8b949e] tabular-nums">{p.daysOnMarket ?? "—"}</td>
                <td className="px-3 text-right text-xs text-[#8b949e] tabular-nums">
                  {p.bedrooms ?? "—"}/{p.bathrooms ?? "—"}
                </td>
                <td className="px-3 text-right text-xs text-[#8b949e] tabular-nums">{p.yearBuilt ?? "—"}</td>
                {/* Inspect */}
                <td className="pr-3 text-right">
                  <button
                    onClick={(e) => { e.stopPropagation(); onInspect(p); }}
                    className="opacity-0 group-hover:opacity-100 text-[#484f58] hover:text-[#58a6ff] transition-all text-sm p-1"
                    title="View details"
                  >
                    ⊕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
