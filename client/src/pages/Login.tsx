import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/magic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-block bg-[#1f3a5f] border border-[#388bfd] text-[#58a6ff] text-xs font-semibold px-3 py-1 rounded-full uppercase tracking-wider mb-4">
            CMA Tracker
          </div>
          <h1 className="text-2xl font-bold text-white">Sign in</h1>
          <p className="text-[#8b949e] text-sm mt-2">
            Enter your email and we'll send you a magic link
          </p>
        </div>

        <div className="bg-[#161b22] border border-[#30363d] rounded-xl p-6">
          {sent ? (
            <div className="text-center">
              <div className="text-4xl mb-4">✉️</div>
              <p className="text-white font-semibold mb-2">Check your inbox</p>
              <p className="text-[#8b949e] text-sm">
                We sent a sign-in link to <strong className="text-white">{email}</strong>.
                It expires in 30 minutes.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-[#58a6ff] text-sm hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#8b949e] uppercase tracking-wider mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-[#0d1117] border border-[#30363d] rounded-lg px-3 py-2.5 text-white placeholder-[#484f58] text-sm focus:outline-none focus:border-[#388bfd] transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#388bfd] hover:bg-[#58a6ff] text-white font-semibold py-2.5 rounded-lg transition-colors text-sm disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Magic Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-[#484f58] text-xs mt-6">
          Gillette &amp; Associates · eXp Realty
        </p>

        {import.meta.env.DEV && (
          <button
            onClick={() =>
              fetch("/api/auth/dev-login", { method: "POST" }).then(() => location.assign("/dashboard"))
            }
            className="block mx-auto mt-4 text-xs text-[#484f58] hover:text-[#58a6ff] transition-colors"
          >
            ⚡ Dev sign-in (local only)
          </button>
        )}
      </div>
    </div>
  );
}
