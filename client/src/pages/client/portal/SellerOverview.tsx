import ProbabilityGauge from "./ProbabilityGauge";

interface Feedback {
  rating: number | null;
  priceOpinion: string | null;
  likedFeatures: string | null;
  concerns: string | null;
  likelyToOffer: boolean | null;
}

interface Showing {
  id: number;
  showingDate: string;
  agentName: string | null;
  agentBrokerage: string | null;
  feedback: Feedback | null;
}

const PRICE_OPINION: Record<string, { label: string; cls: string }> = {
  too_high: { label: "Priced too high", cls: "bg-red-50 text-red-600 border-red-200" },
  fair: { label: "Priced fairly", cls: "bg-amber-50 text-amber-600 border-amber-200" },
  good_value: { label: "Good value", cls: "bg-green-50 text-green-600 border-green-200" },
};

export default function SellerOverview({
  probabilityPct,
  listPrice,
  daysOnMarket,
  showings,
}: {
  probabilityPct: number;
  listPrice: number | null;
  daysOnMarket: number;
  showings: Showing[];
}) {
  const withFeedback = showings.filter((s) => s.feedback);
  const interested = withFeedback.filter((s) => s.feedback?.likelyToOffer).length;
  const avgRating = withFeedback.length
    ? withFeedback.reduce((a, s) => a + (s.feedback?.rating ?? 0), 0) / withFeedback.length
    : null;

  return (
    <div className="space-y-5">
      {/* Top row: gauge + key numbers */}
      <div className="grid md:grid-cols-[auto_1fr] gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 flex items-center justify-center shadow-sm">
          <ProbabilityGauge pct={probabilityPct} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Big label="List Price" value={listPrice ? `$${listPrice.toLocaleString()}` : "—"} color="text-slate-900" />
          <Big label="Days on Market" value={daysOnMarket} color="text-amber-600" />
          <Big label="Total Showings" value={showings.length} color="text-blue-600" />
          <Big
            label="Buyers Interested"
            value={interested}
            color="text-green-600"
            sub={avgRating ? `${avgRating.toFixed(1)} ★ avg rating` : undefined}
          />
        </div>
      </div>

      {/* Showings timeline */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 md:p-6 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
          Showing Activity & Feedback
        </h3>
        <div className="space-y-0">
          {showings.length === 0 && (
            <p className="text-sm text-slate-400 py-4">No showings yet — your agent will keep this updated.</p>
          )}
          {showings.map((s, i) => {
            const fb = s.feedback;
            const op = fb?.priceOpinion ? PRICE_OPINION[fb.priceOpinion] : null;
            return (
              <div key={s.id} className="relative flex gap-4 pb-5">
                {/* Timeline spine */}
                {i < showings.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-slate-100" />
                )}
                <div
                  className={`shrink-0 w-[15px] h-[15px] rounded-full border-[3px] mt-0.5 ${
                    fb?.likelyToOffer
                      ? "bg-green-100 border-green-500"
                      : "bg-white border-slate-300"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="text-sm font-bold text-slate-800">
                      {s.agentName ?? "Buyer's agent"}
                      <span className="font-normal text-slate-400"> · {s.agentBrokerage}</span>
                    </div>
                    <div className="text-[11px] text-slate-400 tabular-nums">
                      {new Date(s.showingDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  {fb ? (
                    <div className="mt-2 bg-slate-50 border border-slate-100 rounded-2xl p-3.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fb.rating != null && (
                          <span className="text-[11px] text-amber-500">
                            {"★".repeat(fb.rating)}<span className="text-slate-300">{"★".repeat(5 - fb.rating)}</span>
                          </span>
                        )}
                        {op && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${op.cls}`}>
                            {op.label}
                          </span>
                        )}
                        {fb.likelyToOffer && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 border border-green-200">
                            POTENTIAL OFFER
                          </span>
                        )}
                      </div>
                      {fb.likedFeatures && (
                        <p className="text-xs text-slate-600 mt-2">
                          <span className="font-bold text-green-600">Liked:</span> {fb.likedFeatures}
                        </p>
                      )}
                      {fb.concerns && (
                        <p className="text-xs text-slate-600 mt-1">
                          <span className="font-bold text-amber-600">Concerns:</span> {fb.concerns}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-400 mt-1">Awaiting feedback…</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Big({ label, value, color, sub }: { label: string; value: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-center shadow-sm">
      <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{label}</div>
      <div className={`text-2xl font-extrabold tabular-nums ${color}`}>{value}</div>
      {sub && <div className="text-[11px] text-slate-500 mt-0.5 font-medium">{sub}</div>}
    </div>
  );
}
