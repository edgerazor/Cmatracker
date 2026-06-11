import { useEffect, useRef, useState } from "react";
import { MlsProperty, LiveStats, effectivePrice, psf } from "./types";

interface Props {
  selected: MlsProperty[];
  stats: LiveStats;
  onRemove: (p: MlsProperty) => void;
  onFinalize: () => void;
}

/** Animated number that counts toward its target when it changes */
function AnimatedNumber({ value, format }: { value: number | null; format: (n: number) => string }) {
  const [display, setDisplay] = useState(value);
  const raf = useRef<number>();

  useEffect(() => {
    if (value == null) { setDisplay(null); return; }
    const from = display ?? value;
    const start = performance.now();
    const dur = 500;
    const tick = (t: number) => {
      const k = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - k, 3);
      setDisplay(from + (value - from) * eased);
      if (k < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <span className="tabular-nums">{display == null ? "—" : format(display)}</span>;
}

const STATUS_DOT: Record<string, string> = {
  Active: "#58a6ff",
  Pending: "#f0b429",
  Closed: "#3fb950",
};

export default function SelectionTray({ selected, stats, onRemove, onFinalize }: Props) {
  const open = selected.length > 0;

  return (
    <div
      className={`shrink-0 border-t border-[#21262d] bg-[#0d1117]/95 backdrop-blur-md transition-all duration-300 ease-out overflow-hidden ${
        open ? "max-h-64" : "max-h-12"
      }`}
    >
      {/* Live stats bar */}
      <div className="flex items-center gap-1 px-4 h-12">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#484f58] mr-3">
          Live CMA
        </span>

        <StatPill
          label="Comps"
          color="#e6edf3"
          value={
            <span className="tabular-nums">
              {stats.soldCount + stats.pendingCount + stats.activeCount}
            </span>
          }
          sub={`${stats.soldCount}S · ${stats.pendingCount}P · ${stats.activeCount}A`}
        />
        <StatPill
          label="Avg Sold $/SqFt"
          color="#3fb950"
          value={<AnimatedNumber value={stats.avgSoldPsf} format={(n) => `$${Math.round(n)}`} />}
        />
        <StatPill
          label="Avg Pending $/SqFt"
          color="#58a6ff"
          value={<AnimatedNumber value={stats.avgPendingPsf} format={(n) => `$${Math.round(n)}`} />}
        />
        <StatPill
          label="Avg DOM (Sold)"
          color="#f0b429"
          value={<AnimatedNumber value={stats.avgDomSold} format={(n) => `${Math.round(n)}d`} />}
        />
        <StatPill
          label="Months of Inventory"
          color={stats.monthsOfInventory != null && stats.monthsOfInventory > 6 ? "#f85149" : "#3fb950"}
          value={<AnimatedNumber value={stats.monthsOfInventory} format={(n) => n.toFixed(1)} />}
        />

        <div className="flex-1" />

        {open && (
          <button
            onClick={onFinalize}
            className="bg-gradient-to-r from-[#388bfd] to-[#58a6ff] hover:from-[#58a6ff] hover:to-[#79b8ff] text-white text-xs font-bold px-5 py-2 rounded-lg transition-all duration-200 shadow-lg shadow-[#388bfd]/20 hover:shadow-[#388bfd]/40 hover:-translate-y-px"
          >
            Build CMA Report →
          </button>
        )}
      </div>

      {/* Selected comp cards */}
      {open && (
        <div className="flex gap-2 px-4 pb-3 overflow-x-auto">
          {selected.map((p) => {
            const price = effectivePrice(p);
            const pPsf = psf(p);
            return (
              <div
                key={p.listingKey}
                className="group relative shrink-0 w-44 bg-[#161b22] border border-[#30363d] rounded-lg overflow-hidden hover:border-[#484f58] transition-all duration-200 animate-[slideUp_.25s_ease-out]"
              >
                <div className="relative h-16">
                  {p.mainPhotoUrl ? (
                    <img src={p.mainPhotoUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#21262d] flex items-center justify-center text-[#30363d]">🏠</div>
                  )}
                  <div
                    className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full ring-2 ring-black/40"
                    style={{ background: STATUS_DOT[p.status] ?? "#8b949e" }}
                  />
                  <button
                    onClick={() => onRemove(p)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-md bg-black/60 text-white/70 hover:bg-[#da3633] hover:text-white text-[10px] opacity-0 group-hover:opacity-100 transition-all"
                  >
                    ✕
                  </button>
                </div>
                <div className="p-2">
                  <div className="text-[10px] font-semibold text-white truncate">{p.address}</div>
                  <div className="flex items-baseline justify-between mt-0.5">
                    <span className="text-[11px] font-bold text-[#e6edf3] tabular-nums">
                      {price ? `$${(price / 1000).toFixed(0)}K` : "—"}
                    </span>
                    <span className="text-[9px] text-[#484f58] tabular-nums">
                      {pPsf ? `$${Math.round(pPsf)}/sf` : ""}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(12px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

function StatPill({
  label, value, color, sub,
}: { label: string; value: React.ReactNode; color: string; sub?: string }) {
  return (
    <div className="flex items-center gap-2 bg-[#161b22] border border-[#21262d] rounded-lg px-3 py-1.5 mr-1">
      <div>
        <div className="text-[8px] font-bold uppercase tracking-wider text-[#484f58] leading-none">{label}</div>
        <div className="text-[13px] font-extrabold leading-tight" style={{ color }}>
          {value}
          {sub && <span className="ml-1.5 text-[8px] font-medium text-[#484f58]">{sub}</span>}
        </div>
      </div>
    </div>
  );
}
