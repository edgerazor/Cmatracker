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
    avgDomActive: number | null;
    listToSellPct: number | null;
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
        <div className="w-7 h-7 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const { stats, listings, config } = data;
  const areaNames = config.subAreas?.map((a) => a.replace(/^Na /, "")).join(", ") ?? "your area";
  const recentSolds = listings
    .filter((l) => l.status === "Closed")
    .sort((a, b) => ((b as any).closeDate ?? "").localeCompare((a as any).closeDate ?? ""))
    .slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Context line */}
      <p className="text-sm text-slate-500">
        Showing <strong className="text-slate-800">{areaNames}</strong> activity from the last{" "}
        <strong className="text-slate-800">{config.daysBack} days</strong> — updated automatically.
      </p>

      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <StatCard label="Active Listings" value={stats.activeCount} color="text-blue-600"
          sub={stats.avgDomActive != null ? `${Math.round(stats.avgDomActive)} days on market avg` : undefined} />
        <StatCard label="Sold" value={stats.soldCount} color="text-green-600"
          sub={stats.avgDomSold != null ? `Sold in ${Math.round(stats.avgDomSold)} days avg` : undefined} />
        <StatCard
          label="Avg Sold $/SqFt"
          value={stats.avgSoldPsf ? `$${Math.round(stats.avgSoldPsf)}` : "—"}
          color="text-green-600"
        />
        <StatCard
          label="Avg Days on Market"
          value={stats.avgDomActive != null ? `${Math.round(stats.avgDomActive)}d` : "—"}
          color="text-amber-600"
          sub={stats.avgDomSold != null ? `vs ${Math.round(stats.avgDomSold)}d for homes that sold` : "Current active listings"}
        />
        <StatCard
          label="List-to-Sell Ratio"
          value={stats.listToSellPct != null ? `${stats.listToSellPct.toFixed(1)}%` : "—"}
          color={stats.listToSellPct != null && stats.listToSellPct >= 100 ? "text-green-600" : "text-blue-600"}
          sub={
            stats.listToSellPct == null ? "Sold price vs. asking price"
            : stats.listToSellPct >= 100 ? "Homes selling at or above asking"
            : `Sellers accepting ~${(100 - stats.listToSellPct).toFixed(1)}% below asking`
          }
        />
        <StatCard
          label="Months of Inventory"
          value={stats.monthsOfInventory != null ? stats.monthsOfInventory.toFixed(1) : "—"}
          color={stats.monthsOfInventory != null && stats.monthsOfInventory > 6 ? "text-red-500" : "text-green-600"}
          sub={
            stats.monthsOfInventory == null ? undefined
            : stats.monthsOfInventory < 4 ? "Seller's market"
            : stats.monthsOfInventory <= 6 ? "Balanced market"
            : "Buyer's market"
          }
        />
      </div>

      {/* The map */}
      <MarketMap listings={listings} subject={subject} height="440px" />

      {/* Recent sales */}
      {recentSolds.length > 0 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Recent Sales Near You
          </h3>
          <div className="divide-y divide-slate-100">
            {recentSolds.map((l) => (
              <div key={l.listingKey} className="flex items-center gap-3 py-2.5">
                {l.photo ? (
                  <img src={l.photo} alt="" className="w-14 h-11 object-cover rounded-xl border border-slate-100" />
                ) : (
                  <div className="w-14 h-11 rounded-xl bg-slate-100" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-slate-800 truncate">{l.address}</div>
                  <div className="text-[11px] text-slate-400">
                    {l.beds} bed · {l.baths} bath{l.sqft ? ` · ${l.sqft.toLocaleString()} sqft` : ""}
                  </div>
                </div>
                <div className="text-sm font-extrabold text-green-600 tabular-nums">
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
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1.5">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-1 font-medium">{sub}</div>}
    </div>
  );
}
