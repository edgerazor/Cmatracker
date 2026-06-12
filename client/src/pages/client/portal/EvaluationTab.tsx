import { formatCurrency } from "../../../lib/utils";

interface Comp {
  id: number;
  address: string;
  status: string;
  listPrice: number | null;
  soldPrice: number | null;
  sqft: number | null;
  psf: number | null;
  daysOnMarket: number | null;
}

interface Report {
  id: number;
  title: string | null;
  priceOptionA: number | null;
  priceOptionALabel: string | null;
  priceOptionB: number | null;
  priceOptionBLabel: string | null;
  monthsOfInventory: number | null;
  activeListingsCount: number | null;
  avgSoldPsf: number | null;
  avgPendingPsf: number | null;
  avgDomSold: number | null;
  marketWarning: string | null;
  probabilityPct: number | null;
  createdAt: string;
}

export default function EvaluationTab({
  report,
  comparables,
  onRequestUpdate,
  showRequestButton,
}: {
  report: Report | null;
  comparables: Comp[];
  onRequestUpdate: () => void;
  showRequestButton: boolean;
}) {
  if (!report) {
    return (
      <div className="text-center py-16">
        <p className="text-sm text-[#8b949e]">No evaluation on file yet.</p>
      </div>
    );
  }

  const evalDate = new Date(report.createdAt).toLocaleDateString("en-CA", {
    year: "numeric", month: "long", day: "numeric",
  });
  const solds = comparables.filter((c) => c.status === "Sold");
  const pendings = comparables.filter((c) => c.status === "Pending");

  return (
    <div className="space-y-5">
      {/* Locked banner */}
      <div className="flex items-center gap-3 bg-[#161b22] border border-[#30363d] rounded-xl px-4 py-3">
        <span className="text-lg">🔒</span>
        <div>
          <div className="text-xs font-bold text-white">Evaluation locked {evalDate}</div>
          <div className="text-[10px] text-[#484f58]">
            This snapshot reflects market conditions on the day of your evaluation — it never changes.
          </div>
        </div>
        {showRequestButton && (
          <button
            onClick={onRequestUpdate}
            className="ml-auto shrink-0 bg-gradient-to-r from-[#388bfd] to-[#58a6ff] text-white text-xs font-bold px-4 py-2 rounded-lg hover:shadow-lg hover:shadow-[#388bfd]/30 transition-all hover:-translate-y-px"
          >
            Get an Updated Evaluation
          </button>
        )}
      </div>

      {/* Market warning */}
      {report.marketWarning && (
        <div className="flex gap-3 bg-gradient-to-br from-[#3d1f00] to-[#2d1500] border border-[#d29922] rounded-xl px-5 py-4">
          <span className="text-lg">⚠</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-[#f0b429] mb-1">
              Market Conditions at Evaluation
            </div>
            <p className="text-xs text-[#d4aa4e] leading-relaxed">{report.marketWarning}</p>
          </div>
        </div>
      )}

      {/* Price options */}
      <div className="grid md:grid-cols-2 gap-4">
        {report.priceOptionA && (
          <PriceCard
            label={report.priceOptionALabel ?? "Option A"}
            price={report.priceOptionA}
            accent="#388bfd"
          />
        )}
        {report.priceOptionB && (
          <PriceCard
            label={report.priceOptionBLabel ?? "Option B"}
            price={report.priceOptionB}
            accent="#f0b429"
          />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Months of Inventory" value={report.monthsOfInventory?.toFixed(1) ?? "—"}
          color={(report.monthsOfInventory ?? 0) > 6 ? "#f85149" : "#3fb950"} />
        <Stat label="Active Listings" value={report.activeListingsCount ?? "—"} color="#f0b429" />
        <Stat label="Avg Sold $/SqFt" value={report.avgSoldPsf ? `$${Math.round(report.avgSoldPsf)}` : "—"} color="#3fb950" />
        <Stat label="Avg Pending $/SqFt" value={report.avgPendingPsf ? `$${Math.round(report.avgPendingPsf)}` : "—"} color="#58a6ff" />
      </div>

      {/* Comps */}
      {solds.length > 0 && <CompTable title="Comparable Sales" comps={solds} priceKey="soldPrice" badge="SOLD" badgeCls="bg-[#1e3a1e] text-[#3fb950] border-[#3fb950]" />}
      {pendings.length > 0 && <CompTable title="Pending Sales" comps={pendings} priceKey="listPrice" badge="PENDING" badgeCls="bg-[#1f3a5f] text-[#58a6ff] border-[#388bfd]" />}
    </div>
  );
}

function PriceCard({ label, price, accent }: { label: string; price: number; accent: string }) {
  return (
    <div
      className="rounded-xl p-6 text-center border-2"
      style={{ borderColor: accent, background: `linear-gradient(135deg, ${accent}14, #1c2333)` }}
    >
      <div className="text-[10px] font-bold uppercase tracking-widest text-[#8b949e] mb-2">{label}</div>
      <div className="text-3xl font-extrabold text-white tabular-nums">{formatCurrency(price)}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[#484f58] mb-1">{label}</div>
      <div className="text-xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function CompTable({
  title, comps, priceKey, badge, badgeCls,
}: { title: string; comps: Comp[]; priceKey: "soldPrice" | "listPrice"; badge: string; badgeCls: string }) {
  return (
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
      <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-3">{title}</h3>
      <table className="w-full text-xs">
        <thead>
          <tr className="text-[#484f58]">
            <th className="text-left font-semibold pb-2">Address</th>
            <th className="text-left font-semibold pb-2"></th>
            <th className="text-right font-semibold pb-2">Price</th>
            <th className="text-right font-semibold pb-2">SqFt</th>
            <th className="text-right font-semibold pb-2">$/SqFt</th>
            <th className="text-right font-semibold pb-2">DOM</th>
          </tr>
        </thead>
        <tbody>
          {comps.map((c) => (
            <tr key={c.id} className="border-t border-[#21262d]">
              <td className="py-2 font-semibold text-white">{c.address}</td>
              <td className="py-2">
                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${badgeCls}`}>{badge}</span>
              </td>
              <td className="py-2 text-right text-white font-bold tabular-nums">
                {formatCurrency(c[priceKey])}
              </td>
              <td className="py-2 text-right text-[#8b949e] tabular-nums">{c.sqft?.toLocaleString() ?? "—"}</td>
              <td className="py-2 text-right text-[#8b949e] tabular-nums">{c.psf ? `$${Math.round(c.psf)}` : "—"}</td>
              <td className="py-2 text-right text-[#8b949e] tabular-nums">{c.daysOnMarket ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
