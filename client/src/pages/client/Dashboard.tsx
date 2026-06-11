import { useAuth } from "../../hooks/useAuth";
import { getGreeting } from "../../lib/utils";

export default function ClientDashboard() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#0d1117]">
      <header className="border-b border-[#30363d] bg-[#161b22] px-6 py-4 flex items-center justify-between">
        <div className="bg-[#1f3a5f] border border-[#388bfd] text-[#58a6ff] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
          CMA Tracker
        </div>
        <button
          onClick={() => fetch("/api/auth/logout", { method: "POST" }).then(() => location.reload())}
          className="text-[#8b949e] hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            {getGreeting(user?.firstName ?? "there")}
          </h1>
          <p className="text-[#8b949e] text-sm mt-1">
            Your property dashboard is ready.
          </p>
        </div>

        {/* Placeholder — property cards will go here */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-8 text-center">
          <p className="text-[#484f58] text-sm">
            Your agent will set up your property dashboard shortly.
          </p>
        </div>
      </main>
    </div>
  );
}
