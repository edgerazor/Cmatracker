import { useLocation } from "wouter";
import { useAuth } from "../../hooks/useAuth";
import { getGreeting } from "../../lib/utils";

export default function AgentDashboard() {
  const { user } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#0d1117]">
      {/* Top nav */}
      <header className="border-b border-[#30363d] bg-[#161b22] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#1f3a5f] border border-[#388bfd] text-[#58a6ff] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
            CMA Tracker
          </div>
          <span className="text-[#484f58] text-sm">Admin</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#8b949e] text-sm">{user?.name}</span>
          <button
            onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}
            className="text-[#8b949e] hover:text-white text-sm transition-colors"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            {getGreeting(user?.name?.split(" ")[0] ?? "there")}
          </h1>
          <p className="text-[#8b949e] text-sm mt-1">
            Manage your clients, CMAs, and active listings.
          </p>
        </div>

        {/* Quick action cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <ActionCard
            label="New Client + CMA"
            description="Start a new evaluation"
            icon="＋"
            color="blue"
            onClick={() => navigate("/cma/new")}
          />
          <ActionCard
            label="Active Listings"
            description="View seller portals"
            icon="🏠"
            color="green"
            onClick={() => {}}
          />
          <ActionCard
            label="Market Reports"
            description="Browse area reports"
            icon="📊"
            color="amber"
            onClick={() => {}}
          />
        </div>

        {/* Placeholder — clients list will go here */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <p className="text-[#484f58] text-sm">
            No clients yet. Click <strong className="text-[#8b949e]">New Client + CMA</strong> to get started.
          </p>
        </div>
      </main>
    </div>
  );
}

function ActionCard({
  label, description, icon, color, onClick,
}: {
  label: string;
  description: string;
  icon: string;
  color: "blue" | "green" | "amber";
  onClick: () => void;
}) {
  const borderColor = { blue: "#388bfd", green: "#3fb950", amber: "#f0b429" }[color];
  const bgColor = { blue: "#1f3a5f", green: "#1e3a1e", amber: "#3d2e00" }[color];

  return (
    <button
      onClick={onClick}
      className="text-left bg-[#161b22] border border-[#30363d] hover:border-current rounded-xl p-5 transition-colors group"
      style={{ "--hover-color": borderColor } as React.CSSProperties}
    >
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
        style={{ background: bgColor }}
      >
        {icon}
      </div>
      <div className="font-semibold text-white text-sm">{label}</div>
      <div className="text-[#8b949e] text-xs mt-1">{description}</div>
    </button>
  );
}
