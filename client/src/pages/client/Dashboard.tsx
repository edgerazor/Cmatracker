import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getGreeting } from "../../lib/utils";
import PropertyPortal, { PropertyBundle } from "./portal/PropertyPortal";

interface PortalData {
  client: { id: number; firstName: string; lastName: string };
  agent: {
    name: string; title: string | null; photoUrl: string | null;
    brokerage: string | null; websiteUrl: string | null; phone: string | null; email: string | null;
  } | null;
  properties: PropertyBundle[];
}

export default function ClientDashboard() {
  const { data, isLoading } = useQuery<PortalData>({
    queryKey: ["portal-me"],
    queryFn: async () => {
      const res = await fetch("/api/portal/me");
      if (!res.ok) throw new Error("Failed to load portal");
      return res.json();
    },
  });

  const [activeIdx, setActiveIdx] = useState(0);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const bundle = data.properties[activeIdx];

  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white text-sm shadow-sm">
              🏠
            </div>
            <span className="text-sm font-extrabold text-slate-900 tracking-tight">Home Portal</span>
          </div>
          <div className="flex items-center gap-4">
            {data.agent && (
              <div className="hidden md:flex items-center gap-2.5">
                {data.agent.photoUrl ? (
                  <img src={data.agent.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover border border-slate-200" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-600">
                    {data.agent.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-[12px] font-bold text-slate-900">{data.agent.name}</div>
                  <div className="text-[10px] text-slate-500">{data.agent.title}</div>
                </div>
              </div>
            )}
            <button
              onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.assign("/login"))}
              className="text-slate-400 hover:text-slate-700 text-xs font-medium transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">
            {getGreeting(data.client.firstName)} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Here's the latest on your {data.properties.length === 1 ? "home" : "properties"}.
          </p>
        </div>

        {/* Property switcher (multi-property clients) */}
        {data.properties.length > 1 && (
          <div className="flex gap-2 mb-6 overflow-x-auto">
            {data.properties.map((b, i) => (
              <button
                key={b.property.id}
                onClick={() => setActiveIdx(i)}
                className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all ${
                  i === activeIdx
                    ? "bg-blue-50 border-blue-300 shadow-sm"
                    : "bg-white border-slate-200 hover:border-slate-300"
                }`}
              >
                {b.property.photoUrl ? (
                  <img src={b.property.photoUrl} alt="" className="w-8 h-8 rounded-xl object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs">🏠</div>
                )}
                <span className={`text-xs font-bold ${i === activeIdx ? "text-blue-700" : "text-slate-600"}`}>
                  {b.property.address}
                </span>
              </button>
            ))}
          </div>
        )}

        {bundle ? (
          <PropertyPortal key={bundle.property.id} bundle={bundle} />
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center shadow-sm">
            <p className="text-sm text-slate-500">
              Your agent will set up your property dashboard shortly.
            </p>
          </div>
        )}

        {/* Agent footer card */}
        {data.agent && (
          <div className="mt-10 bg-white border border-slate-200 rounded-3xl p-6 flex items-center gap-5 flex-wrap shadow-sm">
            {data.agent.photoUrl ? (
              <img src={data.agent.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-blue-200" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center text-lg font-bold text-blue-600">
                {data.agent.name.split(" ").map((w) => w[0]).join("")}
              </div>
            )}
            <div className="flex-1 min-w-[180px]">
              <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                Questions? I'm here to help
              </div>
              <div className="text-sm font-extrabold text-slate-900">{data.agent.name}</div>
              <div className="text-xs text-slate-500">{data.agent.title} · {data.agent.brokerage}</div>
            </div>
            <div className="flex gap-2">
              {data.agent.phone && (
                <a href={`tel:${data.agent.phone}`} className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                  Call
                </a>
              )}
              {data.agent.email && (
                <a href={`mailto:${data.agent.email}`} className="bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold px-5 py-2.5 rounded-xl transition-colors border border-slate-200">
                  Email
                </a>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
