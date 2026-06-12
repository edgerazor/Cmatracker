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
        <p className="text-sm text-slate-400">No evaluation on file yet.</p>
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
      <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm flex-wrap">
        <span className="text-xl">🔒</span>
        <div className="flex-1 min-w-[200px]">
          <div className="text-sm font-extrabold text-slate-800">Evaluation locked {evalDate}</div>
          <div className="text-[11px] text-slate-400">
            This snapshot reflects market conditions on the day of your evaluation — it never changes.
          </div>
        </div>
        {showRequestButton && (
          <button
            onClick={onRequestUpdate}
            className="shrink-0 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md hover:-translate-y-px"
          >
            Get an Updated Evaluation
          </button>
        )}
      </div>

      {/* Market warning */}
      {report.marketWarning && (
        <div className="flex gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
          <span className="text-lg">⚠️</span>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-1">
              Market Conditions at Evaluation
            </div>
            <p className="text-xs text-amber-800 leading-relaxed">{report.marketWarning}</p>
          </div>
        </div>
      )}

      {/* Price options */}
      <div className="grid md:grid-cols-2 gap-4">
        {report.priceOptionA && (
          <PriceCard
            label={report.priceOptionALabel ?? "Option A"}
            price={report.priceOptionA}
            cls="border-blue-300 bg-gradient-to-br from-blue-50 to-white"
            chip="bg-blue-600"
          />
        )}
        {report.priceOptionB && (
          <PriceCard
            label={report.priceOptionBLabel ?? "Option B"}
            price={report.priceOptionB}
            cls="border-amber-300 bg-gradient-to-br from-amber-50 to-white"
            chip="bg-amber-500"
          />
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Months of Inventory" value={report.monthsOfInventory?.toFixed(1) ?? "—"}
          color={(report.monthsOfInventory ?? 0) > 6 ? "text-red-500" : "text-green-600"} />
        <Stat label="Active Listings" value={report.activeListingsCount ?? "—"} color="text-amber-600" />
        <Stat label="Avg Sold $/SqFt" value={report.avgSoldPsf ? `$${Math.round(report.avgSoldPsf)}` : "—"} color="text-green-600" />
        <Stat label="Avg Pending $/SqFt" value={report.avgPendingPsf ? `$${Math.round(report.avgPendingPsf)}` : "—"} color="text-blue-600" />
      </div>

      {/* Comps */}
      {solds.length > 0 && <CompTable title="Comparable Sales" comps={solds} priceKey="soldPrice" badge="SOLD" badgeCls="bg-green-100 text-green-700 border-green-200" />}
      {pendings.length > 0 && <CompTable title="Pending Sales" comps={pendings} priceKey="listPrice" badge="PENDING" badgeCls="bg-blue-100 text-blue-700 border-blue-200" />}
    </div>
  );
}

function PriceCard({ label, price, cls, chip }: { label: string; price: number; cls: string; chip: string }) {
  return (
    <div className={`rounded-2xl p-6 text-center border-2 shadow-sm ${cls}`}>
      <div className={`inline-block text-[9px] font-bold uppercase tracking-widest text-white px-3 py-1 rounded-full mb-3 ${chip}`}>
        {label}
      </div>
      <div className="text-3xl font-extrabold text-slate-900 tabular-nums">{formatCurrency(price)}</div>
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-extrabold tabular-nums ${color}`}>{value}</div>
    </div>
  );
}

function CompTable({
  title, comps, priceKey, badge, badgeCls,
}: { title: string; comps: Comp[]; priceKey: "soldPrice" | "listPrice"; badge: string; badgeCls: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm overflow-x-auto">
      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">{title}</h3>
      <table className="w-full text-xs min-w-[480px]">
        <thead>
          <tr className="text-slate-400">
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
            <tr key={c.id} className="border-t border-slate-100">
              <td className="py-2.5 font-bold text-slate-800">{c.address}</td>
              <td className="py-2.5">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${badgeCls}`}>{badge}</span>
              </td>
              <td className="py-2.5 text-right text-slate-900 font-extrabold tabular-nums">
                {formatCurrency(c[priceKey])}
              </td>
              <td className="py-2.5 text-right text-slate-500 tabular-nums">{c.sqft?.toLocaleString() ?? "—"}</td>
              <td className="py-2.5 text-right text-slate-500 tabular-nums">{c.psf ? `$${Math.round(c.psf)}` : "—"}</td>
              <td className="py-2.5 text-right text-slate-500 tabular-nums">{c.daysOnMarket ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
