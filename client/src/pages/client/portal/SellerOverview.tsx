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

const PRICE_OPINION: Record<string, { label: string; color: string }> = {
  too_high: { label: "Priced too high", color: "#f85149" },
  fair: { label: "Priced fairly", color: "#f0b429" },
  good_value: { label: "Good value", color: "#3fb950" },
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
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6 flex items-center justify-center">
          <ProbabilityGauge pct={probabilityPct} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Big label="List Price" value={listPrice ? `$${listPrice.toLocaleString()}` : "—"} color="#fff" />
          <Big label="Days on Market" value={daysOnMarket} color="#f0b429" />
          <Big label="Total Showings" value={showings.length} color="#58a6ff" />
          <Big
            label="Buyers Interested"
            value={interested}
            color="#3fb950"
            sub={avgRating ? `${avgRating.toFixed(1)} ★ avg rating` : undefined}
          />
        </div>
      </div>

      {/* Showings timeline */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
        <h3 className="text-xs font-bold uppercase tracking-widest text-[#8b949e] mb-4">
          Showing Activity & Feedback
        </h3>
        <div className="space-y-0">
          {showings.length === 0 && (
            <p className="text-xs text-[#484f58] py-4">No showings yet — your agent will keep this updated.</p>
          )}
          {showings.map((s, i) => {
            const fb = s.feedback;
            const op = fb?.priceOpinion ? PRICE_OPINION[fb.priceOpinion] : null;
            return (
              <div key={s.id} className="relative flex gap-4 pb-5">
                {/* Timeline spine */}
                {i < showings.length - 1 && (
                  <div className="absolute left-[7px] top-5 bottom-0 w-px bg-[#21262d]" />
                )}
                <div
                  className={`shrink-0 w-[15px] h-[15px] rounded-full border-2 mt-0.5 ${
                    fb?.likelyToOffer
                      ? "bg-[#1e3a1e] border-[#3fb950]"
                      : "bg-[#161b22] border-[#30363d]"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 flex-wrap">
                    <div className="text-xs font-bold text-white">
                      {s.agentName ?? "Buyer's agent"}
                      <span className="font-normal text-[#484f58]"> · {s.agentBrokerage}</span>
                    </div>
                    <div className="text-[10px] text-[#484f58] tabular-nums">
                      {new Date(s.showingDate).toLocaleDateString("en-CA", { month: "short", day: "numeric" })}
                    </div>
                  </div>
                  {fb ? (
                    <div className="mt-1.5 bg-[#0d1117] border border-[#21262d] rounded-lg p-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        {fb.rating != null && (
                          <span className="text-[10px] text-[#f0b429]">
                            {"★".repeat(fb.rating)}{"☆".repeat(5 - fb.rating)}
                          </span>
                        )}
                        {op && (
                          <span
                            className="text-[9px] font-bold px-1.5 py-0.5 rounded-md border"
                            style={{ color: op.color, borderColor: op.color, background: `${op.color}14` }}
                          >
                            {op.label}
                          </span>
                        )}
                        {fb.likelyToOffer && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-[#1e3a1e] text-[#3fb950] border border-[#3fb950]">
                            POTENTIAL OFFER
                          </span>
                        )}
                      </div>
                      {fb.likedFeatures && (
                        <p className="text-[11px] text-[#8b949e] mt-1.5">
                          <span className="text-[#3fb950]">Liked:</span> {fb.likedFeatures}
                        </p>
                      )}
                      {fb.concerns && (
                        <p className="text-[11px] text-[#8b949e] mt-0.5">
                          <span className="text-[#f0b429]">Concerns:</span> {fb.concerns}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] text-[#484f58] mt-1">Awaiting feedback…</p>
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
    <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-4 flex flex-col justify-center">
      <div className="text-[9px] font-bold uppercase tracking-widest text-[#484f58] mb-1">{label}</div>
      <div className="text-2xl font-extrabold tabular-nums" style={{ color }}>{value}</div>
      {sub && <div className="text-[10px] text-[#8b949e] mt-0.5">{sub}</div>}
    </div>
  );
}
