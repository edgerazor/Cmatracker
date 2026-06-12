import { useState } from "react";

function DevButton({ label, body }: { label: string; body: object }) {
  return (
    <button
      onClick={() =>
        fetch("/api/auth/dev-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }).then(() => location.assign("/dashboard"))
      }
      className="text-[10px] font-semibold py-2 px-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors shadow-sm"
    >
      {label}
    </button>
  );
}

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-[#f5f7fb] to-indigo-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-3xl bg-gradient-to-br from-blue-600 to-blue-400 text-white text-2xl shadow-lg shadow-blue-600/20 mb-4">
            🏠
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome to your Home Portal</h1>
          <p className="text-slate-500 text-sm mt-2">
            Enter your email and we'll send you a secure sign-in link
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl shadow-slate-200/50">
          {sent ? (
            <div className="text-center py-2">
              <div className="text-4xl mb-4">✉️</div>
              <p className="text-slate-900 font-bold mb-2">Check your inbox</p>
              <p className="text-slate-500 text-sm">
                We sent a sign-in link to <strong className="text-slate-800">{email}</strong>.
                It expires in 30 minutes.
              </p>
              <button
                onClick={() => setSent(false)}
                className="mt-4 text-blue-600 text-sm font-semibold hover:underline"
              >
                Try a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-100 transition-all"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all text-sm disabled:opacity-60 shadow-md shadow-blue-600/20 hover:shadow-lg hover:-translate-y-px"
              >
                {loading ? "Sending…" : "Email Me a Sign-In Link"}
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-slate-400 text-xs mt-6">
          Gillette &amp; Associates · eXp Realty
        </p>

        {import.meta.env.DEV && (
          <div className="mt-6 border-t border-slate-200 pt-4">
            <div className="text-center text-[9px] font-bold uppercase tracking-widest text-slate-300 mb-2">
              Dev personas (local only)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <DevButton label="⚡ Agent · Derek" body={{}} />
              <DevButton label="🏷️ Seller · Carters" body={{ clientEmail: "carters@example.com" }} />
              <DevButton label="📋 Prospect · Susan" body={{ clientEmail: "susan.m@example.com" }} />
              <DevButton label="🔑 Buyer · Chens" body={{ clientEmail: "chens@example.com" }} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
