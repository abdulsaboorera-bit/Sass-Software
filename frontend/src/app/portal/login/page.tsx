"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dumbbell, QrCode } from "lucide-react";

export default function MemberPortalLogin() {
  const router = useRouter();
  const [memberNo, setMemberNo] = useState("");
  const [phone, setPhone] = useState("");
  const [tenantSlug, setTenantSlug] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/gym/portal/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ memberNo, phone, tenantSlug: tenantSlug || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("member_token", data.token);
      localStorage.setItem("member_name", data.member?.name || "");
      router.push("/portal");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fbf9f2] dark:bg-slate-950 px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
            <Dumbbell size={20} />
          </div>
          <span className="text-xl font-extrabold text-slate-900 dark:text-white">Member Portal</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8">
          <h1 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Sign in</h1>
          <p className="text-slate-500 text-sm mb-5">Use your member number and registered phone.</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wide">Member Number</label>
              <div className="relative">
                <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={memberNo} onChange={(e) => setMemberNo(e.target.value)} placeholder="M-0001"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
              </div>
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wide">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xxxxxxxxx"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold mb-1.5 uppercase tracking-wide">Gym code (optional)</label>
              <input value={tenantSlug} onChange={(e) => setTenantSlug(e.target.value)} placeholder="iron-pulse-gym"
                className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500" />
            </div>

            {error && <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}

            <button type="submit" disabled={loading || !memberNo || !phone}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 border-none cursor-pointer text-sm">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
        <p className="text-center text-slate-400 text-xs mt-4">Ask the front desk if you don&apos;t know your member number.</p>
      </div>
    </div>
  );
}
