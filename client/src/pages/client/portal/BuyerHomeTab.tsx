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
      <p className="text-sm text-slate-500">
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
            usedPct == null ? "#94a3b8"
            : usedPct >= 85 ? "#dc2626"
            : usedPct >= 65 ? "#d97706"
            : "#16a34a";

          let serviceDue = false;
          if (c.lastServicedAt && c.serviceIntervalMonths) {
            const next = new Date(c.lastServicedAt);
            next.setMonth(next.getMonth() + c.serviceIntervalMonths);
            serviceDue = next <= now;
          }

          return (
            <div key={c.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-lg">
                  {TYPE_ICON[c.componentType] ?? "🔧"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-extrabold text-slate-800">{c.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {c.installedYear ? `Installed ${c.installedYear}` : "Install year unknown"}
                    {age != null && ` · ${age} yrs old`}
                  </div>
                </div>
                {serviceDue && (
                  <span className="shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                    SERVICE DUE
                  </span>
                )}
              </div>

              {usedPct != null && (
                <div className="mt-4">
                  <div className="flex justify-between text-[11px] mb-1.5">
                    <span className="text-slate-400 font-semibold">Lifespan used</span>
                    <span className="font-bold tabular-nums" style={{ color: barColor }}>
                      {remaining != null && remaining > 0
                        ? `~${remaining} yrs remaining`
                        : "At expected end-of-life"}
                    </span>
                  </div>
                  <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: `${usedPct}%`, background: barColor }}
                    />
                  </div>
                </div>
              )}

              {c.notes && (
                <p className="text-[11px] text-slate-500 mt-3 leading-relaxed bg-slate-50 rounded-xl px-3 py-2">
                  {c.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {components.length === 0 && (
        <div className="text-center py-12 text-sm text-slate-400">
          No components tracked yet — your agent can add them from your inspection report.
        </div>
      )}
    </div>
  );
}
