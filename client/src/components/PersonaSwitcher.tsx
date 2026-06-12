import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

/**
 * Dev-only floating switcher to cycle through the four portal personas
 * from any screen. Not rendered in production builds.
 */
const PERSONAS = [
  { key: "agent", label: "Realtor", icon: "⚡", body: {} },
  { key: "seller", label: "Seller", icon: "🏷️", body: { clientEmail: "carters@example.com" } },
  { key: "prospect", label: "CMA Client", icon: "📋", body: { clientEmail: "susan.m@example.com" } },
  { key: "buyer", label: "Buyer", icon: "🔑", body: { clientEmail: "chens@example.com" } },
] as const;

export default function PersonaSwitcher() {
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState<string | null>(null);

  const { data: me } = useQuery({
    queryKey: ["auth-me-persona"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 30_000,
  });

  const currentKey =
    me?.type === "agent" ? "agent"
    : me?.user?.email === "carters@example.com" ? "seller"
    : me?.user?.email === "susan.m@example.com" ? "prospect"
    : me?.user?.email === "chens@example.com" ? "buyer"
    : null;

  const current = PERSONAS.find((p) => p.key === currentKey);

  const switchTo = async (p: (typeof PERSONAS)[number]) => {
    setSwitching(p.key);
    await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(p.body),
    });
    location.assign("/dashboard");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[2000] flex flex-col items-end gap-2 font-sans">
      {/* Expanded persona list */}
      <div
        className={`flex flex-col gap-1.5 transition-all duration-200 origin-bottom-right ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-90 pointer-events-none"
        }`}
      >
        {PERSONAS.map((p) => (
          <button
            key={p.key}
            onClick={() => switchTo(p)}
            disabled={switching != null}
            className={`flex items-center gap-2.5 pl-3 pr-4 py-2.5 rounded-2xl border text-xs font-bold shadow-lg backdrop-blur-md transition-all hover:-translate-x-0.5 ${
              p.key === currentKey
                ? "bg-blue-600 border-blue-500 text-white"
                : "bg-slate-900/90 border-slate-700 text-slate-300 hover:border-blue-500 hover:text-white"
            }`}
          >
            <span className="text-sm">{p.icon}</span>
            {switching === p.key ? "Switching…" : p.label}
            {p.key === currentKey && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-white" />}
          </button>
        ))}
      </div>

      {/* Toggle pill */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-2xl bg-slate-900/90 border border-slate-700 text-white text-xs font-bold shadow-xl backdrop-blur-md hover:border-blue-500 transition-all"
        title="Switch persona (dev only)"
      >
        <span className="text-sm">{current?.icon ?? "👤"}</span>
        {open ? "Close" : `Viewing: ${current?.label ?? "Signed out"}`}
        <span className={`text-[9px] text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}>▲</span>
      </button>
    </div>
  );
}
