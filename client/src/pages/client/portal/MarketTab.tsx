import { useQuery } from "@tanstack/react-query";
import MarketMap, { MapListing } from "../../../components/MarketMap";

interface MarketData {
  config: { subAreas?: string[]; daysBack: number };
  listings: MapListing[];
  stats: {
    activeCount: number;
    pendingCount: number;
    soldCount: number;
    avgSoldPsf: number | null;
    avgActivePsf: number | null;
    monthsOfInventory: number | null;
    avgDomSold: number | null;
  };
}

export default function MarketTab({
  propertyId,
  subject,
}: {
  propertyId: number;
  subject: { lat: number; lng: number; address: string } | null;
}) {
  const { data, isLoading } = useQuery<MarketData>({
    queryKey: ["portal-market", propertyId],
    queryFn: async () => {
      const res = await fetch(`/api/portal/market/${propertyId}`);
      if (!res.ok) throw new Error("Failed to load market data");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-7 h-7 border-2 border-[#21262d] border-t-[#388bfd] rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { stats, listings, config } = data;
  const areaNames = config.subAreas?.map((a) => a.replace(/^Na /, "")).join(", ") ?? "your area";
  const recentSolds = listings
    .filter((l) => l.status === "Closed")
    .sort((a, b) => (b as any).closeDate?.localeCompare((a as any).closeDate ?? "") ?? 0)
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Context line */}
      <p className="text-xs text-[#8b949e]">
        Showing <strong className="text-white">{areaNames}</strong> activity from the last{" "}
        <strong className="text-white">{config.daysBack} days</strong> — updated automatically.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Active Listings" value={stats.activeCount} color="#58a6ff" />
        <StatCard label="Sold" value={stats.soldCount} color="#3fb950" />
        <StatCard
          label="Avg Sold $/SqFt"
          value={stats.avgSoldPsf ? `$${Math.round(stats.avgSoldPsf)}` : "—"}
          color="#3fb950"
        />
        <StatCard
          label="Months of Inventory"
          value={stats.monthsOfInventory != null ? stats.monthsOfInventory.toFixed(1) : "—"}
          color={stats.monthsOfInventory != null && stats.monthsOfInventory > 6 ? "#f85149" : "#3fb950"}
          sub={
            stats.monthsOfInventory == null ? undefined
            : stats.monthsOfInventory < 4 ? "Seller's market"
            : stats.monthsOfInventory <= 6 ? "Balanced market"
            : "Buyer's market"
          }
        />
      </div>

      {/* The map */}
      <MarketMap listings={listings} subject={subject} height="420px" />

      {/* Recent sales */}
      {recentSolds.length > 0 && (
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">
            Recent Sales Near You
          </h3>
          <div className="space-y-2">
            {recentSolds.map((l) => (
              <div key={l.listingKey} className="flex items-center gap-3 py-1.5">
                {l.photo ? (
                  <img src={l.photo} alt="" className="w-12 h-9 object-cover rounded-md border border-[#21262d]" />
                ) : (
                  <div className="w-12 h-9 rounded-md bg-[#21262d]" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-white truncate">{l.address}</div>
                  <div className="text-[10px] text-[#484f58]">
                    {l.beds} bed · {l.baths} bath{l.sqft ? ` · ${l.sqft.toLocaleString()} sqft` : ""}
                  </div>
                </div>
                <div className="text-sm font-bold text-[#3fb950] tabular-nums">
                  ${l.price?.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, color, sub,
}: { label: string; value: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[#484f58] mb-1.5">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-[#8b949e] mt-1">{sub}</div>}
    </div>
  );
}
