interface Component {
  id: number;
  componentType: string;
  label: string;
  installedYear: number | null;
  expectedLifespanYears: number | null;
  lastServicedAt: string | null;
  serviceIntervalMonths: number | null;
  notes: string | null;
}

const TYPE_ICON: Record<string, string> = {
  roof: "🏠",
  furnace: "🔥",
  heat_pump: "❄️",
  hot_water_tank: "🚿",
  hot_water_tankless: "🚿",
  appliance: "⚙️",
  other: "🔧",
};

export default function BuyerHomeTab({ components }: { components: Component[] }) {
  const now = new Date();
  const year = now.getFullYear();

  return (
    <div className="space-y-5">
      <p className="text-xs text-[#8b949e]">
        Your home's key systems, tracked from your inspection report. We'll flag anything
        approaching end-of-life so there are no surprises.
      </p>

      <div className="grid md:grid-cols-2 gap-4">
        {components.map((c) => {
          const age = c.installedYear ? year - c.installedYear : null;
          const life = c.expectedLifespanYears;
          const usedPct = age != null && life ? Math.min((age / life) * 100, 100) : null;
          const remaining = age != null && life ? life - age : null;

          const barColor =
            usedPct == null ? "#484f58"
            : usedPct >= 85 ? "#f85149"
            : usedPct >= 65 ? "#f0b429"
            : "#3fb950";

          // Service due?
          let serviceDue = false;
          if (c.lastServicedAt && c.serviceIntervalMonths) {
            const next = new Date(c.lastServicedAt);
            next.setMonth(next.getMonth() + c.serviceIntervalMonths);
            serviceDue = next <= now;
          }

          return (
            <div key={c.id} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5 hover:border-[#484f58] transition-colors">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-[#0d1117] border border-[#21262d] flex items-center justify-center text-base">
                  {TYPE_ICON[c.componentType] ?? "🔧"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white">{c.label}</div>
                  <div className="text-[10px] text-[#484f58] mt-0.5">
                    {c.installedYear ? `Installed ${c.installedYear}` : "Install year unknown"}
                    {age != null && ` · ${age} yrs old`}
                  </div>
                </div>
                {serviceDue && (
                  <span className="shrink-0 text-[9px] font-bold px-2 py-1 rounded-md bg-[#3d2e00] text-[#f0b429] border border-[#d29922]">
                    SERVICE DUE
                  </span>
                )}
              </div>

              {usedPct != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-[10px] mb-1.5">
                    <span className="text-[#484f58] font-semibold">Lifespan used</span>
                    <span className="font-bold tabular-nums" style={{ color: barColor }}>
                      {remaining != null && remaining > 0
                        ? `~${remaining} yrs remaining`
                        : "At expected end-of-life"}
                    </span>
                  </div>
                  <div className="h-2 bg-[#0d1117] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${usedPct}%`, background: barColor }}
                    />
                  </div>
                </div>
              )}

              {c.notes && (
                <p className="text-[10px] text-[#8b949e] mt-3 leading-relaxed">{c.notes}</p>
              )}
            </div>
          );
        })}
      </div>

      {components.length === 0 && (
        <div className="text-center py-12 text-xs text-[#484f58]">
          No components tracked yet — your agent can add them from your inspection report.
        </div>
      )}
    </div>
  );
}
