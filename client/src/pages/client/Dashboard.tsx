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
      <div className="min-h-screen bg-[#0d1117] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#21262d] border-t-[#388bfd] rounded-full animate-spin" />
      </div>
    );
  }
  if (!data) return null;

  const bundle = data.properties[activeIdx];

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top bar */}
      <header className="border-b border-[#21262d] bg-[#0d1117]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="bg-[#1f3a5f] border border-[#388bfd] text-[#58a6ff] text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-widest">
            Your Home Portal
          </div>
          <div className="flex items-center gap-4">
            {data.agent && (
              <div className="hidden md:flex items-center gap-2.5">
                {data.agent.photoUrl ? (
                  <img src={data.agent.photoUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-[#30363d]" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-[#1f3a5f] border border-[#388bfd] flex items-center justify-center text-[10px] font-bold text-[#58a6ff]">
                    {data.agent.name.split(" ").map((w) => w[0]).join("")}
                  </div>
                )}
                <div className="leading-tight">
                  <div className="text-[11px] font-bold text-white">{data.agent.name}</div>
                  <div className="text-[9px] text-[#484f58]">{data.agent.title}</div>
                </div>
              </div>
            )}
            <button
              onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.assign("/login"))}
              className="text-[#484f58] hover:text-white text-xs transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-8">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-extrabold text-white">
            {getGreeting(data.client.firstName)}
          </h1>
          <p className="text-sm text-[#8b949e] mt-1">
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
                className={`shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-xl border transition-all ${
                  i === activeIdx
                    ? "bg-[#1f3a5f]/40 border-[#388bfd]"
                    : "bg-[#161b22] border-[#30363d] hover:border-[#484f58]"
                }`}
              >
                {b.property.photoUrl ? (
                  <img src={b.property.photoUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-[#21262d] flex items-center justify-center text-xs">🏠</div>
                )}
                <span className={`text-xs font-bold ${i === activeIdx ? "text-white" : "text-[#8b949e]"}`}>
                  {b.property.address}
                </span>
              </button>
            ))}
          </div>
        )}

        {bundle ? (
          <PropertyPortal key={bundle.property.id} bundle={bundle} />
        ) : (
          <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-10 text-center">
            <p className="text-sm text-[#8b949e]">
              Your agent will set up your property dashboard shortly.
            </p>
          </div>
        )}

        {/* Agent footer card */}
        {data.agent && (
          <div className="mt-10 bg-gradient-to-br from-[#161b22] to-[#1c2333] border border-[#30363d] rounded-2xl p-6 flex items-center gap-5 flex-wrap">
            {data.agent.photoUrl ? (
              <img src={data.agent.photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-[#388bfd]" />
            ) : (
              <div className="w-14 h-14 rounded-full bg-[#1f3a5f] border-2 border-[#388bfd] flex items-center justify-center text-lg font-bold text-[#58a6ff]">
                {data.agent.name.split(" ").map((w) => w[0]).join("")}
              </div>
            )}
            <div className="flex-1 min-w-[180px]">
              <div className="text-sm font-extrabold text-white">{data.agent.name}</div>
              <div className="text-xs text-[#8b949e]">{data.agent.title} · {data.agent.brokerage}</div>
            </div>
            <div className="flex gap-2">
              {data.agent.phone && (
                <a href={`tel:${data.agent.phone}`} className="bg-[#388bfd] hover:bg-[#58a6ff] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors">
                  Call
                </a>
              )}
              {data.agent.email && (
                <a href={`mailto:${data.agent.email}`} className="bg-[#21262d] hover:bg-[#30363d] text-white text-xs font-bold px-4 py-2 rounded-lg transition-colors border border-[#30363d]">
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
