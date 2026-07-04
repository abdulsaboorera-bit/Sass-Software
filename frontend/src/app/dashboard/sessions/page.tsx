"use client";

import { useState } from "react";
import { QrCode, CheckCircle, XCircle } from "lucide-react";

export default function CheckInsPage() {
  const [memberNo, setMemberNo] = useState("");
  const [result, setResult] = useState<{ action?: string; member?: { name: string }; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/gym/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ memberNo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error });
      } else {
        setResult({ action: data.action, member: data.member });
        setMemberNo("");
      }
    } catch {
      setResult({ error: "Something went wrong" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900">Check-In</h2>
        <p className="text-slate-500 text-sm">Scan or enter member number to check in/out.</p>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8">
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label className="block text-slate-700 text-xs font-bold mb-1.5 uppercase tracking-wide">Member Number</label>
            <div className="relative">
              <QrCode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                autoFocus
                type="text"
                value={memberNo}
                onChange={e => setMemberNo(e.target.value)}
                placeholder="Enter member number"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>
          <button type="submit" disabled={loading || !memberNo} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 border-none cursor-pointer text-sm">
            {loading ? "Processing..." : "Check In / Out"}
          </button>
        </form>

        {result && (
          <div className={`mt-4 p-4 rounded-xl ${result.error ? "bg-red-50 border border-red-200" : "bg-green-50 border border-green-200"}`}>
            {result.error ? (
              <div className="flex items-center gap-2 text-red-700 text-sm"><XCircle size={16} /> {result.error}</div>
            ) : (
              <div className="flex items-center gap-2 text-green-700 text-sm">
                <CheckCircle size={16} />
                <span><strong>{result.member?.name}</strong> — {result.action === "checkin" ? "Checked In" : "Checked Out"} successfully</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
