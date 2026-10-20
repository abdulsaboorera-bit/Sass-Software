"use client";

import { useEffect, useState } from "react";
import { ScanLine, QrCode, Loader2, Search, CheckCircle2, Download, UserCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/currentUser";
import { usePermissions } from "@/lib/permissions";

interface LookupResult {
  type: string;
  label: string;
  title: string;
  value: string;
  item: Record<string, unknown>;
}

const HIDDEN_KEYS = new Set(["_id", "id", "__v", "tenantId", "createdAt", "updatedAt"]);

export default function ScannerPage() {
  const [industry, setIndustry] = useState("");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<LookupResult | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrText, setQrText] = useState("");
  const [qr, setQr] = useState("");
  const [qrLoading, setQrLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");
  const { can } = usePermissions();

  useEffect(() => {
    getCurrentUser()
      .then((d) => setIndustry(d.user?.tenant?.industry || ""))
      .catch(() => {});
  }, []);

  const doLookup = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError("");
    setResult(null);
    setActionMsg("");
    try {
      const res = await fetch(`/api/lookup?code=${encodeURIComponent(code.trim())}`, { credentials: "include" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No matching record");
      setResult(data.result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  };

  const makeQr = async () => {
    if (!qrText.trim()) return;
    setQrLoading(true);
    try {
      const res = await fetch(`/api/lookup/qr?data=${encodeURIComponent(qrText.trim())}`, { credentials: "include" });
      const data = await res.json();
      if (res.ok) setQr(data.qr || "");
    } finally {
      setQrLoading(false);
    }
  };

  const quickAction = async () => {
    if (industry === "GYM" && !(can("attendance.mark") || can("attendance.create"))) {
      setError("You don't have permission to check in members");
      return;
    }
    setActionMsg("");
    try {
      if (industry === "SCHOOL") {
        const res = await fetch("/api/school/attendance/scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ admissionNo: code.trim() }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed");
        setActionMsg(`Attendance marked: ${d.student?.name || ""} (${d.attendance?.status})`);
      } else if (industry === "GYM") {
        const res = await fetch("/api/gym/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ memberNo: code.trim() }),
        });
        const d = await res.json();
        if (!res.ok) throw new Error(d.error || "Failed");
        setActionMsg("Check-in recorded.");
      }
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "Action failed");
    }
  };

  const canQuickAction =
    (industry === "SCHOOL" || industry === "GYM") &&
    Boolean(result) &&
    (industry !== "GYM" || can("attendance.mark") || can("attendance.create"));

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-1">
        <ScanLine size={22} className="text-blue-600" />
        <h2 className="text-2xl font-extrabold text-slate-900">Scanner &amp; QR Tools</h2>
      </div>
      <p className="text-slate-500 text-sm mb-6">Look up any record by scanning/typing its code, mark attendance or check-ins, and generate QR codes for labels.</p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Lookup */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><Search size={16} className="text-blue-600" /> Look up a code</h3>
          <div className="flex gap-2">
            <input
              autoFocus
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && doLookup()}
              placeholder="Scan or type a code…"
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
            <button onClick={doLookup} disabled={loading || !code.trim()} className="bg-blue-600 text-white font-semibold px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm border-none cursor-pointer disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin" /> : "Find"}
            </button>
          </div>

          {error && <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

          {result && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-200">{result.label}</span>
                <p className="text-sm font-bold text-slate-900">{result.title}</p>
              </div>
              <div className="rounded-xl border border-slate-200 divide-y divide-slate-100 text-xs overflow-hidden">
                {Object.entries(result.item)
                  .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && v !== undefined && typeof v !== "object")
                  .slice(0, 10)
                  .map(([k, v]) => (
                    <div key={k} className="flex justify-between px-3 py-2">
                      <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, " $1")}</span>
                      <span className="text-slate-700 font-medium text-right">{String(v)}</span>
                    </div>
                  ))}
              </div>
              {canQuickAction && (
                <button onClick={quickAction} className="mt-3 inline-flex items-center gap-1.5 bg-green-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-green-700 text-sm border-none cursor-pointer">
                  <UserCheck size={15} /> {industry === "SCHOOL" ? "Mark present today" : "Check in member"}
                </button>
              )}
              {actionMsg && <p className="mt-2 text-sm text-green-700 inline-flex items-center gap-1"><CheckCircle2 size={14} /> {actionMsg}</p>}
            </div>
          )}
        </div>

        {/* QR generator */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h3 className="text-slate-900 font-bold text-sm mb-4 flex items-center gap-2"><QrCode size={16} className="text-blue-600" /> Generate a QR code</h3>
          <textarea
            rows={2}
            value={qrText}
            onChange={(e) => setQrText(e.target.value)}
            placeholder="Text, URL, or a code to encode…"
            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
          />
          <button onClick={makeQr} disabled={qrLoading || !qrText.trim()} className="mt-2 bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl hover:bg-blue-700 text-sm border-none cursor-pointer disabled:opacity-50">
            {qrLoading ? "Generating…" : "Generate"}
          </button>
          {qr && (
            <div className="mt-4 flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qr} alt="QR code" width={180} height={180} className="rounded-lg border border-slate-200" />
              <a href={qr} download="qr-code.png" className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 no-underline">
                <Download size={14} /> Download
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
